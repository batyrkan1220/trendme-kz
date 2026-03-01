import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOCIALKIT_BASE = "https://api.socialkit.dev";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const socialKitKey = Deno.env.get("SOCIALKIT_ACCESS_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action } = body;

    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const callSocialKit = async (path: string, params: Record<string, string>) => {
      const url = new URL(`${SOCIALKIT_BASE}${path}`);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      console.log(`SocialKit call: ${path}`, url.toString());
      const res = await fetch(url.toString(), {
        headers: { "x-access-key": socialKitKey },
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`SocialKit error ${res.status} for ${path}:`, text);
        throw new Error(`SocialKit error ${res.status}: ${text}`);
      }
      const data = await res.json();
      console.log(`SocialKit ${path} response keys:`, JSON.stringify(Object.keys(data)));
      return data;
    };

    const getPublishedAt = (video: any): string => {
      if (video.createTime) return new Date(video.createTime * 1000).toISOString();
      if (video.created_at) return new Date(video.created_at).toISOString();
      if (video.create_time) return new Date(video.create_time * 1000).toISOString();
      return new Date().toISOString();
    };

    const computeTrend = (video: any) => {
      const stats = video.stats || {};
      const publishedAt = new Date(getPublishedAt(video));
      const hoursSince = Math.max(1, (Date.now() - publishedAt.getTime()) / 3600000);
      const vViews = (stats.views || video.views || video.playCount || 0) / hoursSince;
      const vLikes = (stats.likes || video.likes || video.diggCount || 0) / hoursSince;
      const vComments = (stats.comments || video.comments || video.commentCount || 0) / hoursSince;
      return {
        velocity_views: vViews,
        velocity_likes: vLikes,
        velocity_comments: vComments,
        trend_score: 0.6 * vViews + 0.3 * vLikes + 0.1 * vComments,
        published_at: publishedAt.toISOString(),
      };
    };

    switch (action) {
      case "search": {
        const { query, limit = 20, region = "world" } = body;
        if (!query) return json({ error: "query is required" }, 400);

        const data = await callSocialKit("/tiktok/search", {
          query,
          count: String(limit),
        });

        let videos: any[] = [];
        if (Array.isArray(data)) videos = data;
        else if (Array.isArray(data?.data?.results)) videos = data.data.results;
        else if (Array.isArray(data?.data)) videos = data.data;
        else if (Array.isArray(data?.items)) videos = data.items;
        else if (Array.isArray(data?.videos)) videos = data.videos;
        else if (Array.isArray(data?.result)) videos = data.result;
        else {
          console.log("SocialKit unexpected response:", JSON.stringify(data).slice(0, 500));
          videos = [];
        }

        const { data: queryRow } = await userClient
          .from("search_queries")
          .upsert(
            {
              user_id: userId,
              query_text: query,
              last_run_at: new Date().toISOString(),
              total_results_saved: videos.length,
            },
            { onConflict: "user_id,query_text", ignoreDuplicates: false }
          )
          .select()
          .single();

        const upsertedVideos = [];
        for (const v of videos) {
          const videoId = v.id || v.video_id || v.aweme_id;
          if (!videoId) continue;

          const trends = computeTrend(v);
          const stats = v.stats || {};
          const videoRow = {
            platform: "tiktok",
            platform_video_id: String(videoId),
            url: v.url || `https://www.tiktok.com/@${v.author?.uniqueId || "user"}/video/${videoId}`,
            caption: v.desc || v.caption || v.title || "",
            cover_url: v.video?.cover || v.cover_url || v.cover || v.originCover || "",
            author_username: v.author?.uniqueId || v.author?.unique_id || v.author_username || "",
            author_display_name: v.author?.nickname || v.author_display_name || "",
            author_avatar_url: v.author?.avatar || v.author?.avatarThumb || v.author_avatar_url || "",
            views: stats.views || v.views || v.playCount || 0,
            likes: stats.likes || v.likes || v.diggCount || 0,
            comments: stats.comments || v.comments || v.commentCount || 0,
            shares: stats.shares || v.shares || v.shareCount || 0,
            duration_sec: v.video?.duration || v.duration_sec || v.duration || null,
            fetched_at: new Date().toISOString(),
            source_query_id: queryRow?.id || null,
            region: region || "world",
            ...trends,
          };

          const { data: upserted } = await adminClient
            .from("videos")
            .upsert(videoRow, { onConflict: "platform_video_id" })
            .select()
            .single();

          if (upserted) upsertedVideos.push(upserted);
        }

        await userClient.from("activity_log").insert({
          user_id: userId,
          type: "search_run",
          payload_json: { query, results_count: upsertedVideos.length },
        });

        return json({ videos: upsertedVideos, query: queryRow });
      }

      case "video_stats": {
        const { video_url } = body;
        if (!video_url) return json({ error: "video_url is required" }, 400);

        const data = await callSocialKit("/tiktok/stats", { url: video_url });
        const videoData = data.data || data;

        if (videoData) {
          const videoId = videoData.id || videoData.video_id || videoData.aweme_id;
          if (videoId) {
            const trends = computeTrend(videoData);
            await adminClient
              .from("videos")
              .update({
                views: videoData.playCount || videoData.views || 0,
                likes: videoData.diggCount || videoData.likes || 0,
                comments: videoData.commentCount || videoData.comments || 0,
                shares: videoData.shareCount || videoData.shares || 0,
                fetched_at: new Date().toISOString(),
                ...trends,
              })
              .eq("platform_video_id", String(videoId));
          }
        }

        return json(videoData);
      }

      case "analyze_video": {
        const { video_url } = body;
        if (!video_url) return json({ error: "video_url is required" }, 400);

        // 1. Fetch transcript, summarize, stats, comments from SocialKit in parallel
        const [transcriptRes, summarizeRes, statsRes, commentsRes] = await Promise.allSettled([
          callSocialKit("/tiktok/transcript", { url: video_url }),
          callSocialKit("/tiktok/summarize", { url: video_url }),
          callSocialKit("/tiktok/stats", { url: video_url }),
          callSocialKit("/tiktok/comments", { url: video_url }),
        ]);

        // Extract transcript text
        let transcriptText = "";
        if (transcriptRes.status === "fulfilled") {
          const tData = transcriptRes.value?.data || transcriptRes.value;
          transcriptText = tData?.transcript || tData?.text || "";
          if (!transcriptText && tData?.segments && Array.isArray(tData.segments)) {
            transcriptText = tData.segments.map((s: any) => s.text || s.content || "").join(" ");
          }
          if (!transcriptText && typeof tData === "string") {
            transcriptText = tData;
          }
          console.log("Transcript extracted, length:", transcriptText.length);
        } else {
          console.error("Transcript fetch failed:", transcriptRes.reason);
        }

        // Extract SocialKit AI summary
        let skSummary = "";
        if (summarizeRes.status === "fulfilled") {
          const sData = summarizeRes.value?.data || summarizeRes.value;
          skSummary = sData?.summary || sData?.text || "";
          if (typeof sData === "string") skSummary = sData;
          console.log("SocialKit summary extracted, length:", skSummary.length);
        } else {
          console.error("Summarize fetch failed:", summarizeRes.reason);
        }

        // Extract stats
        let statsData: any = null;
        if (statsRes.status === "fulfilled") {
          statsData = statsRes.value?.data || statsRes.value;
          console.log("Stats keys:", JSON.stringify(Object.keys(statsData || {})));
        }

        // Extract comments (get top comment texts for AI context)
        let commentsData: any = null;
        let topCommentsText = "";
        if (commentsRes.status === "fulfilled") {
          commentsData = commentsRes.value?.data || commentsRes.value;
          // Extract top comments text for AI context
          const commentsList = Array.isArray(commentsData) ? commentsData : commentsData?.comments || [];
          if (Array.isArray(commentsList)) {
            topCommentsText = commentsList.slice(0, 10).map((c: any) => c.text || c.comment || c.content || "").filter(Boolean).join("\n");
          }
          console.log("Comments fetched, top comments:", topCommentsText.length);
        }

        // 2. Use Lovable AI to generate structured analysis
        // Run even without transcript — use description, summary, stats, comments
        let aiAnalysis: any = null;
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        const caption = body.caption || "";
        const videoTitle = statsData?.title || statsData?.description || caption || "";
        const videoDescription = statsData?.description || caption || "";
        const videoDuration = statsData?.duration || "";

        // Build context for AI from all available data
        const contextParts: string[] = [];
        if (videoTitle) contextParts.push(`Название/описание: ${videoTitle}`);
        if (videoDuration) contextParts.push(`Длительность: ${videoDuration} сек`);
        if (statsData) {
          contextParts.push(`Статистика: ${statsData.views || 0} просмотров, ${statsData.likes || 0} лайков, ${statsData.comments || 0} комментариев, ${statsData.shares || 0} репостов`);
        }
        if (skSummary) contextParts.push(`AI-резюме от SocialKit: ${skSummary}`);
        if (transcriptText) contextParts.push(`Транскрипт:\n${transcriptText.slice(0, 8000)}`);
        if (topCommentsText) contextParts.push(`Топ комментарии:\n${topCommentsText.slice(0, 2000)}`);

        const hasContent = contextParts.length > 1; // At least URL + something

        if (LOVABLE_API_KEY && hasContent) {
          try {
            const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  {
                    role: "system",
                    content: `Ты — эксперт по анализу вирусного контента в TikTok. Проанализируй видео на основе всей доступной информации (описание, статистика, транскрипт если есть, комментарии) и верни структурированный анализ.

ВАЖНО: Отвечай ТОЛЬКО вызовом функции video_analysis, без лишнего текста. Если транскрипт недоступен, анализируй по описанию, статистике и комментариям.`
                  },
                  {
                    role: "user",
                    content: `Проанализируй это TikTok видео.\n\nURL: ${video_url}\n\n${contextParts.join("\n\n")}`
                  }
                ],
                tools: [
                  {
                    type: "function",
                    function: {
                      name: "video_analysis",
                      description: "Структурированный анализ TikTok видео",
                      parameters: {
                        type: "object",
                        properties: {
                          topic: { type: "string", description: "Тема видео — краткий заголовок 5-15 слов" },
                          language: { type: "string", description: "Язык видео (Русский, English, etc.)" },
                          tags: {
                            type: "array",
                            items: { type: "string" },
                            description: "2-4 формата/типа контента, например: Говорящая голова 🗣, Обзор товара / Распаковка 📦, Сравнение (Versus) 🆚, Сторителлинг 📖, Лайфхак 💡, Юмор 😂, Туториал 📚"
                          },
                          niches: {
                            type: "array",
                            items: { type: "string" },
                            description: "2-4 ниши с эмодзи, например: 💼 Лайфстайл, 🏠 Дом, Уют и Ремонт, 🧠 Новости нейросетей"
                          },
                          summary: { type: "string", description: "Суть видео — подробное описание в 2-4 предложениях" },
                          structure: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                time: { type: "string", description: "Временной диапазон, например: 0-3 сек, 3-152 сек, Конец видео" },
                                title: { type: "string", description: "Название сегмента" },
                                description: { type: "string", description: "Описание что происходит в этом сегменте" }
                              },
                              required: ["time", "title", "description"]
                            },
                            description: "3-5 сегментов структуры видео с таймкодами"
                          },
                          hook_phrase: { type: "string", description: "Первая фраза-хук которая цепляет внимание" },
                          visual_hook: { type: "string", description: "Описание визуального хука — что видит зритель в первые секунды" },
                          text_hook: { type: "string", description: "Текст на экране в первые секунды (если есть)" },
                          funnel: {
                            type: "object",
                            properties: {
                              direction: { type: "string", description: "Куда ведет видео — например: 🔴 Без призыва (Работа на охват), В профиль, На ссылку в био, В комментарии" },
                              goal: { type: "string", description: "Цель видео — охват, продажи, подписки и т.д." }
                            },
                            required: ["direction", "goal"]
                          }
                        },
                        required: ["topic", "language", "tags", "niches", "summary", "structure", "hook_phrase", "visual_hook", "text_hook", "funnel"]
                      }
                    }
                  }
                ],
                tool_choice: { type: "function", function: { name: "video_analysis" } },
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
              if (toolCall?.function?.arguments) {
                try {
                  aiAnalysis = JSON.parse(toolCall.function.arguments);
                  console.log("AI analysis generated successfully, keys:", Object.keys(aiAnalysis));
                } catch (e) {
                  console.error("Failed to parse AI response:", e);
                }
              } else {
                console.error("No tool call in AI response:", JSON.stringify(aiData).slice(0, 500));
              }
            } else {
              const errText = await aiResponse.text();
              console.error("AI gateway error:", aiResponse.status, errText);
            }
          } catch (e) {
            console.error("AI analysis error:", e);
          }
        } else {
          console.log("Skipping AI analysis: LOVABLE_API_KEY:", !!LOVABLE_API_KEY, "hasContent:", hasContent);
        }

        // 3. Combine everything into summary_json
        const summaryJson = {
          ...(aiAnalysis || {}),
          stats: statsData ? {
            views: statsData.playCount || statsData.views || 0,
            likes: statsData.diggCount || statsData.likes || 0,
            comments: statsData.commentCount || statsData.comments || 0,
            shares: statsData.shareCount || statsData.shares || 0,
          } : null,
        };

        const result = {
          summary_json: summaryJson,
          transcript_text: transcriptText || null,
          comments_json: commentsData,
        };

        // Save analysis
        const { data: analysis } = await userClient
          .from("video_analysis")
          .insert({
            user_id: userId,
            video_url,
            ...result,
            analyzed_at: new Date().toISOString(),
          })
          .select()
          .single();

        await userClient.from("activity_log").insert({
          user_id: userId,
          type: "video_analysis",
          payload_json: { video_url },
        });

        return json(analysis);
      }

      case "account_stats": {
        const { profile_url } = body;
        if (!profile_url) return json({ error: "profile_url is required" }, 400);

        const data = await callSocialKit("/tiktok/channel-stats", { url: profile_url });
        const accountData = data.data || data;

        const username =
          accountData.uniqueId || accountData.unique_id || accountData.username ||
          profile_url.split("@").pop()?.split("?")[0] || "";

        const { data: account } = await userClient
          .from("accounts_tracked")
          .upsert(
            {
              user_id: userId,
              profile_url,
              username,
              avatar_url: accountData.avatarThumb || accountData.avatar_url || "",
              followers: accountData.followerCount || accountData.followers || 0,
              following: accountData.followingCount || accountData.following || 0,
              total_likes: accountData.heartCount || accountData.total_likes || 0,
              total_videos: accountData.videoCount || accountData.total_videos || 0,
              verified: accountData.verified || false,
              bio: accountData.signature || accountData.bio || "",
              bio_link: accountData.bioLink?.link || accountData.bio_link || "",
              fetched_at: new Date().toISOString(),
            },
            { onConflict: "user_id,username" }
          )
          .select()
          .single();

        await userClient.from("activity_log").insert({
          user_id: userId,
          type: "account_analysis",
          payload_json: { profile_url, username },
        });

        return json(account);
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
