import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOCIALKIT_BASE = "https://api.socialkit.dev";

function validateTikTokUrl(url: string): boolean {
  try {
    if (url.length > 500) return false;
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const allowedHosts = ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "m.tiktok.com"];
    return allowedHosts.some(h => parsed.hostname === h || parsed.hostname.endsWith("." + h));
  } catch {
    return false;
  }
}

function validateTikTokUsername(username: string): boolean {
  if (!username || username.length > 100) return false;
  const cleaned = username.startsWith("@") ? username.slice(1) : username;
  return /^[a-zA-Z0-9_.]+$/.test(cleaned);
}


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
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

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

    // Helper: extract videos from various response formats
    const extractVideos = (data: any): any[] => {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data?.results)) return data.data.results;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.items)) return data.items;
      if (Array.isArray(data?.videos)) return data.videos;
      if (Array.isArray(data?.result)) return data.result;
      console.log("SocialKit unexpected response:", JSON.stringify(data).slice(0, 500));
      return [];
    };

    // Helper: generate hashtags + related keywords from query using AI
    const generateHashtagsAndKeywords = async (query: string): Promise<{ hashtags: string[], relatedKeywords: string[] }> => {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) return { hashtags: [], relatedKeywords: [] };
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `Given a TikTok search query, generate:
1. "hashtags": 3-5 TikTok hashtags (without #) in the query language + English equivalents
2. "related_keywords": 8-12 related single-word search terms that users might also search for. These should be associated words, synonyms, brands, actions related to the query. Mix languages (query language + English).

Return ONLY valid JSON: {"hashtags":["..."],"related_keywords":["..."]}
Example for "пылесос": {"hashtags":["пылесос","vacuum","уборка","cleaning","cleantok"],"related_keywords":["моющий","dyson","xiaomi","робот","уборка","clean","обзор","лайфхак","квартира","порядок"]}`
              },
              { role: "user", content: query }
            ],
          }),
        });
        const aiData = await res.json();
        const content = aiData?.choices?.[0]?.message?.content || "";
        const match = content.match(/\{[\s\S]*?\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          console.log("AI generated hashtags:", parsed.hashtags, "keywords:", parsed.related_keywords);
          return {
            hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.filter((t: any) => typeof t === "string" && t.length > 0).slice(0, 5) : [],
            relatedKeywords: Array.isArray(parsed.related_keywords) ? parsed.related_keywords.filter((t: any) => typeof t === "string" && t.length > 0).slice(0, 12) : [],
          };
        }
      } catch (e) {
        console.error("Hashtag/keyword generation failed:", e);
      }
      return { hashtags: [], relatedKeywords: [] };
    };

    switch (action) {
      case "search": {
        const { query, limit = 20, region = "world" } = body;
        if (!query) return json({ error: "query is required" }, 400);

        // 1. Generate hashtags + do keyword search in parallel
        const [keywordData, aiResult] = await Promise.all([
          callSocialKit("/tiktok/search", { query, limit: String(limit), cache: "true" }),
          generateHashtagsAndKeywords(query),
        ]);
        const { hashtags, relatedKeywords } = aiResult;

        let allVideos: any[] = extractVideos(keywordData);
        console.log(`Keyword search returned ${allVideos.length} videos`);

        // 2. Search by hashtags in parallel
        if (hashtags.length > 0) {
          const hashtagLimit = Math.min(30, Math.ceil(Number(limit) / hashtags.length));
          const hashtagResults = await Promise.allSettled(
            hashtags.map(tag =>
              callSocialKit("/tiktok/hashtag-search", { hashtag: tag, limit: String(hashtagLimit), cache: "true" })
            )
          );
          for (const result of hashtagResults) {
            if (result.status === "fulfilled") {
              const vids = extractVideos(result.value);
              console.log(`Hashtag search returned ${vids.length} videos`);
              allVideos.push(...vids);
            }
          }
        }

        // 3. Deduplicate
        const seen = new Set<string>();
        const uniqueVideos: any[] = [];
        for (const v of allVideos) {
          const vid = String(v.id || v.video_id || v.aweme_id || "");
          if (!vid || seen.has(vid)) continue;
          seen.add(vid);
          uniqueVideos.push(v);
        }
        console.log(`Total unique videos after dedup: ${uniqueVideos.length}`);

        // 4. Prepare all video rows at once (no sequential loop)
        const now = new Date().toISOString();
        const videoRows = uniqueVideos.map(v => {
          const videoId = v.id || v.video_id || v.aweme_id;
          if (!videoId) return null;
          const trends = computeTrend(v);
          const stats = v.stats || {};
          return {
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
            fetched_at: now,
            source_query_id: null,
            region: region || "world",
            ...trends,
          };
        }).filter(Boolean);

        // 5. Batch upsert + save query in parallel (1 DB call instead of N)
        const [upsertResult, queryResult] = await Promise.all([
          adminClient.from("videos").upsert(videoRows, { onConflict: "platform,platform_video_id" }).select(),
          userClient.from("search_queries").upsert(
            { user_id: userId, query_text: query, last_run_at: now, total_results_saved: videoRows.length },
            { onConflict: "user_id,query_text", ignoreDuplicates: false }
          ).select().single(),
        ]);

        const upsertedVideos = upsertResult.data || [];
        const queryRow = queryResult.data;

        // 6. Fire-and-forget: AI categorize uncategorized videos
        const uncategorized = upsertedVideos.filter((v: any) => !v.niche);
        if (uncategorized.length > 0) {
          const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
          if (LOVABLE_API_KEY) {
            (async () => {
              try {
                // Batch categorize in chunks of 30
                const NICHE_KEYS = ["finance","marketing","business","psychology","therapy","education","mama","beauty","fitness","fashion","law","realestate","esoteric","food","home","travel","lifestyle","animals","gaming","music","tattoo","career","auto","diy","kids","ai_news","ai_art","ai_avatar","humor","other"];
                for (let i = 0; i < uncategorized.length; i += 30) {
                  const batch = uncategorized.slice(i, i + 30);
                  const videoCaptions = batch.map((v: any, idx: number) => `${idx}: ${(v.caption || "").slice(0, 150)}`).join("\n");
                  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      model: "google/gemini-2.5-flash-lite",
                      messages: [
                        { role: "system", content: `Classify each video into ONE niche from this list: ${NICHE_KEYS.join(", ")}. Return ONLY a JSON object mapping index to niche key. Example: {"0":"food","1":"beauty","2":"fitness"}` },
                        { role: "user", content: videoCaptions }
                      ],
                    }),
                  });
                  const aiData = await res.json();
                  const content = aiData?.choices?.[0]?.message?.content || "";
                  const match = content.match(/\{[\s\S]*?\}/);
                  if (match) {
                    const mapping = JSON.parse(match[0]);
                    for (const [idx, nicheKey] of Object.entries(mapping)) {
                      const video = batch[Number(idx)];
                      if (video && NICHE_KEYS.includes(nicheKey as string)) {
                        adminClient.from("videos").update({ niche: nicheKey as string }).eq("id", video.id).then(() => {}).catch(() => {});
                      }
                    }
                  }
                }
                console.log(`Categorized ${uncategorized.length} videos`);
              } catch (e) {
                console.error("AI categorization failed:", e);
              }
            })();
          }
        }

        // 7. Fire-and-forget activity log
        userClient.from("activity_log").insert({
          user_id: userId, type: "search_run",
          payload_json: { query, hashtags, relatedKeywords, results_count: upsertedVideos.length },
        }).then(() => {}).catch(() => {});

        return json({ videos: upsertedVideos, query: queryRow, hashtags, relatedKeywords });
      }

      case "video_stats": {
        const { video_url } = body;
        if (!video_url) return json({ error: "video_url is required" }, 400);
        if (!validateTikTokUrl(video_url)) return json({ error: "Invalid TikTok URL" }, 400);

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
        if (!validateTikTokUrl(video_url)) return json({ error: "Invalid TikTok URL" }, 400);

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
        const analysisLang = body.language === "kk" ? "kk" : "ru";
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
                    content: analysisLang === "kk"
                      ? `Сен — TikTok вирустық контентін талдау бойынша сарапшысыз. Бейнені барлық қолжетімді ақпарат негізінде (сипаттама, статистика, транскрипт бар болса, пікірлер) талдап, құрылымдалған талдау бер.

МАҢЫЗДЫ: ТІЛДІ ҚАЗАҚША ЖАУАП БЕР. ТІЛЬДІ video_analysis функциясын шақырумен ғана жауап бер, қосымша мәтінсіз. Транскрипт қолжетімсіз болса, сипаттама, статистика және пікірлер бойынша талда.`
                      : `Ты — эксперт по анализу вирусного контента в TikTok. Проанализируй видео на основе всей доступной информации (описание, статистика, транскрипт если есть, комментарии) и верни структурированный анализ.

ВАЖНО: Отвечай ТОЛЬКО вызовом функции video_analysis, без лишнего текста. Если транскрипт недоступен, анализируй по описанию, статистике и комментариям.`
                  },
                  {
                    role: "user",
                    content: analysisLang === "kk"
                      ? `Осы TikTok бейнесін талда.\n\nURL: ${video_url}\n\n${contextParts.join("\n\n")}`
                      : `Проанализируй это TikTok видео.\n\nURL: ${video_url}\n\n${contextParts.join("\n\n")}`
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
        if (!validateTikTokUrl(profile_url)) return json({ error: "Invalid TikTok URL" }, 400);

        // Fetch channel stats and search for user's videos in parallel
        const usernameFromUrl = profile_url.split("@").pop()?.split("?")[0]?.split("/")[0] || "";

        const [channelRes, searchRes] = await Promise.allSettled([
          callSocialKit("/tiktok/channel-stats", { url: profile_url }),
          callSocialKit("/tiktok/search", { query: `@${usernameFromUrl}`, count: "30" }),
        ]);

        const channelData = channelRes.status === "fulfilled" ? channelRes.value : {};
        const accountData = channelData?.data || channelData || {};
        console.log("Channel stats raw data:", JSON.stringify(accountData).slice(0, 1000));

        // Parse top videos from search results
        let topVideos: any[] = [];
        if (searchRes.status === "fulfilled") {
          const sData = searchRes.value;
          const rawVideos = Array.isArray(sData) ? sData
            : Array.isArray(sData?.data?.results) ? sData.data.results
            : Array.isArray(sData?.data) ? sData.data
            : Array.isArray(sData?.items) ? sData.items
            : Array.isArray(sData?.videos) ? sData.videos
            : Array.isArray(sData?.result) ? sData.result
            : [];
          console.log("Search returned", rawVideos.length, "videos");

          // Filter to only this user's videos and map
          topVideos = rawVideos
            .filter((v: any) => {
              const authorId = v.author?.uniqueId || v.author?.unique_id || v.author_username || "";
              return !authorId || authorId.toLowerCase() === usernameFromUrl.toLowerCase();
            })
            .map((v: any) => {
              const stats = v.stats || {};
              return {
                id: v.id || v.video_id || v.aweme_id,
                desc: v.desc || v.caption || v.title || "",
                cover: v.video?.cover || v.cover_url || v.cover || v.originCover || "",
                url: v.url || `https://www.tiktok.com/@${usernameFromUrl}/video/${v.id || v.video_id}`,
                views: stats.views || v.playCount || v.views || 0,
                likes: stats.likes || v.diggCount || v.likes || 0,
                comments: stats.comments || v.commentCount || v.comments || 0,
                shares: stats.shares || v.shareCount || v.shares || 0,
                duration: v.video?.duration || v.duration || 0,
                createTime: v.createTime || v.create_time || 0,
              };
            });
          topVideos.sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
        } else {
          console.error("Search failed:", searchRes.reason);
        }

        // Extract username from response or URL
        const username =
          accountData.username || accountData.uniqueId || accountData.unique_id || usernameFromUrl;

        // Map fields according to SocialKit response format
        const followers = accountData.followers || accountData.followerCount || 0;
        const totalLikes = accountData.totalLikes || accountData.likes || accountData.heartCount || accountData.total_likes || 0;
        const totalVideos = accountData.totalVideos || accountData.videoCount || accountData.total_videos || 0;

        const following = accountData.following || accountData.followingCount || 0;

        // Computed metrics
        const avgLikesPerVideo = totalVideos > 0 ? Math.round(totalLikes / totalVideos) : 0;
        const engagementRate = followers > 0 ? ((totalLikes / Math.max(totalVideos, 1)) / followers * 100) : 0;
        const avgViews = topVideos.length > 0
          ? Math.round(topVideos.reduce((sum: number, v: any) => sum + (v.views || 0), 0) / topVideos.length)
          : 0;

        const analysisPayload = {
          avg_likes_per_video: avgLikesPerVideo,
          engagement_rate: Math.round(engagementRate * 100) / 100,
          avg_views: avgViews,
          top_videos: topVideos.slice(0, 12),
        };

        const { data: account } = await userClient
          .from("accounts_tracked")
          .upsert(
            {
              user_id: userId,
              profile_url,
              username,
              avatar_url: accountData.avatar || accountData.avatarThumb || accountData.avatar_url || "",
              followers,
              following,
              total_likes: totalLikes,
              total_videos: totalVideos,
              verified: accountData.verified || false,
              bio: accountData.signature || accountData.bio || "",
              bio_link: accountData.bioLink || accountData.bio_link || null,
              fetched_at: new Date().toISOString(),
              analysis_json: analysisPayload,
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

        return json({
          ...account,
          ...analysisPayload,
        });
      }

      case "bulk_categorize": {
        const NICHE_KEYS = ["finance","marketing","business","psychology","therapy","education","mama","beauty","fitness","fashion","law","realestate","esoteric","food","home","travel","lifestyle","animals","gaming","music","tattoo","career","auto","diy","kids","ai_news","ai_art","ai_avatar","humor","other"];
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 500);

        // Get uncategorized videos in batches
        const batchSize = 30;
        const maxBatches = 10; // ~300 videos per call, run multiple times
        let totalCategorized = 0;

        for (let b = 0; b < maxBatches; b++) {
          const { data: uncategorized } = await adminClient
            .from("videos")
            .select("id, caption")
            .is("niche", null)
            .limit(batchSize);

          if (!uncategorized || uncategorized.length === 0) break;

          const videoCaptions = uncategorized.map((v: any, idx: number) => `${idx}: ${(v.caption || "").slice(0, 150)}`).join("\n");

          try {
            const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                messages: [
                  { role: "system", content: `Classify each video into ONE niche from this list: ${NICHE_KEYS.join(", ")}. Return ONLY a JSON object mapping index to niche key. Example: {"0":"food","1":"beauty","2":"fitness"}` },
                  { role: "user", content: videoCaptions }
                ],
              }),
            });
            const aiData = await res.json();
            const content = aiData?.choices?.[0]?.message?.content || "";
            const match = content.match(/\{[\s\S]*?\}/);
            if (match) {
              const mapping = JSON.parse(match[0]);
              const updates: Promise<any>[] = [];
              for (const [idx, nicheKey] of Object.entries(mapping)) {
                const video = uncategorized[Number(idx)];
                if (video && NICHE_KEYS.includes(nicheKey as string)) {
                  updates.push(adminClient.from("videos").update({ niche: nicheKey as string }).eq("id", video.id));
                  totalCategorized++;
                }
              }
              await Promise.all(updates);
            }
          } catch (e) {
            console.error("Batch categorization error:", e);
          }
        }

        console.log(`Bulk categorized ${totalCategorized} videos`);
        return json({ categorized: totalCategorized });
      }

      case "admin_search": {
        // Admin-only: raw SocialKit search with filters
        const { data: roleCheck } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (!roleCheck) return json({ error: "Admin access required" }, 403);

        const { query: searchQuery, publish_time = "7", sort_type = "3" } = body;
        if (!searchQuery) return json({ error: "query is required" }, 400);

        // 1. Keyword search (paginated) + AI hashtag generation in parallel
        const PAGES = 15;
        const PAGE_SIZE = 10;

        const [aiResult, ...pageResults] = await Promise.allSettled([
          generateHashtagsAndKeywords(searchQuery),
          ...Array.from({ length: PAGES }, (_, page) =>
            callSocialKit("/tiktok/search", {
              query: searchQuery,
              count: "30",
              offset: String(page * PAGE_SIZE),
            })
          ),
        ]);

        let allVideos: any[] = [];
        for (const r of pageResults) {
          if (r.status === "fulfilled") {
            allVideos.push(...extractVideos(r.value));
          }
        }
        console.log(`Admin keyword search: ${allVideos.length} videos`);

        // 2. Hashtag search in parallel
        const { hashtags = [] } = aiResult.status === "fulfilled" ? aiResult.value as any : { hashtags: [] };
        if (hashtags.length > 0) {
          const hashtagResults = await Promise.allSettled(
            hashtags.map((tag: string) =>
              callSocialKit("/tiktok/hashtag-search", { hashtag: tag, limit: "30", cache: "true" })
            )
          );
          for (const r of hashtagResults) {
            if (r.status === "fulfilled") {
              allVideos.push(...extractVideos(r.value));
            }
          }
        }

        // 3. Deduplicate
        const seen = new Set<string>();
        const unique: any[] = [];
        for (const v of allVideos) {
          const vid = String(v.id || v.video_id || v.aweme_id || "");
          if (!vid || seen.has(vid)) continue;
          seen.add(vid);
          unique.push(v);
        }

        // 4. Filter by publish_time (client-side since SocialKit doesn't support it)
        const maxAgeDays = publish_time === "30" ? 30 : 7;
        const cutoff = Date.now() - maxAgeDays * 24 * 3600 * 1000;
        const filtered = unique.filter(v => {
          const ct = v.createTime ?? v.create_time;
          if (typeof ct === "number") {
            const ms = ct > 1e12 ? ct : ct * 1000;
            return ms >= cutoff;
          }
          return true; // keep if no date info
        });

        // 5. Sort: sort_type "3" = by date, "1" = by likes
        filtered.sort((a: any, b: any) => {
          if (sort_type === "1") {
            const aLikes = a.stats?.likes ?? a.diggCount ?? a.likes ?? 0;
            const bLikes = b.stats?.likes ?? b.diggCount ?? b.likes ?? 0;
            return bLikes - aLikes;
          }
          // by date
          const aTime = a.createTime ?? a.create_time ?? 0;
          const bTime = b.createTime ?? b.create_time ?? 0;
          return (typeof bTime === "number" ? bTime : 0) - (typeof aTime === "number" ? aTime : 0);
        });

        console.log(`Admin search "${searchQuery}": ${filtered.length} filtered (from ${unique.length} unique)`);
        return json({ videos: filtered });
      }

      case "admin_add_video": {
        // Admin-only: add single video to trends DB
        const { data: roleCheck2 } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (!roleCheck2) return json({ error: "Admin access required" }, 403);

        const { video: videoRow } = body;
        if (!videoRow || !videoRow.platform_video_id) return json({ error: "video data required" }, 400);

        const { error: upsertErr } = await adminClient
          .from("videos")
          .upsert(videoRow, { onConflict: "platform,platform_video_id" });

        if (upsertErr) {
          console.error("Admin add video error:", upsertErr);
          return json({ error: upsertErr.message }, 500);
        }

        return json({ success: true });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Unable to process request. Please try again later." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
