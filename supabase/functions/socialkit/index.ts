import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENSEMBLE_BASE = "https://ensembledata.com/apis";

// Sanitize user-controlled text before passing to AI prompts
const cleanForPrompt = (s: string, max = 200) =>
  String(s || '')
    .replace(/system:|assistant:|user:/gi, '')
    .replace(/ignore.*(previous|above|all)/gi, '')
    .slice(0, max);

function validateTikTokUrl(url: string): boolean {
  try {
    if (url.length > 500) return false;
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const allowedHosts = ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "m.tiktok.com", "vt.tiktok.com", "lite.tiktok.com"];
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

function normalizeTikTokUsername(username: string): string {
  const cleaned = String(username || "").trim().replace(/^@/, "");
  return validateTikTokUsername(cleaned) ? cleaned : "";
}

function buildFallbackVideoUrl(videoId: string, username?: string): string | null {
  if (!/^\d{8,}$/.test(String(videoId || ""))) return null;
  const safeUsername = normalizeTikTokUsername(username || "") || "user";
  return `https://www.tiktok.com/@${safeUsername}/video/${videoId}`;
}

/** Resolve short TikTok URLs (vm.tiktok.com, vt.tiktok.com) to full URLs */
async function resolveShortUrl(url: string): Promise<string> {
  try {
    const parsed = new URL(url);
    if (["vm.tiktok.com", "vt.tiktok.com", "lite.tiktok.com", "m.tiktok.com"].includes(parsed.hostname)) {
      const res = await fetch(url, { method: "HEAD", redirect: "follow" });
      return res.url || url;
    }
  } catch { /* ignore */ }
  return url;
}

/** Extract aweme_id (video ID) from a TikTok URL */
function extractAwemeId(url: string): string | null {
  // https://www.tiktok.com/@user/video/1234567890
  const videoMatch = url.match(/\/video\/(\d+)/);
  if (videoMatch) return videoMatch[1];
  // https://www.tiktok.com/@user/photo/1234567890
  const photoMatch = url.match(/\/photo\/(\d+)/);
  if (photoMatch) return photoMatch[1];
  // Fallback: any long digit sequence in the URL (aweme_id is typically 19 digits)
  const digitMatch = url.match(/(\d{15,})/);
  return digitMatch ? digitMatch[1] : null;
}

/** Extract username from a TikTok profile URL */
function extractUsername(url: string): string {
  const match = url.match(/@([a-zA-Z0-9_.]+)/);
  return match ? match[1] : url.split("@").pop()?.split("?")[0]?.split("/")[0] || "";
}

const normalizeTextLine = (value: string) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();

const sanitizeTranscriptLine = (value: string) =>
  normalizeTextLine(value)
    .replace(/<\/?h[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{[^{}]*\}/g, " ")
    .replace(/\[[^\[\]]*\]/g, " ")
    .replace(/#\S+/g, " ")
    .replace(/\b(?:true|false|null|nan|undefined)\b/gi, " ")
    .replace(/["':]/g, " ")
    .replace(/\b(?:x|y|w|h|s|r|start_time|end_time|isRatioCoord)\b/gi, " ")
    .replace(/\b\d+(?:\.\d+)?\b/g, " ")
    .replace(/[\/|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getTranscriptQuality = (transcript: string): "high" | "low" => {
  const text = normalizeTextLine(transcript);
  if (!text) return "low";

  const words = text.split(" ").filter(Boolean);
  const hashtagCount = (text.match(/#/g) || []).length;
  const tagLikeCount = (text.match(/<[^>]+>/g) || []).length;
  const jsonArtifactCount = (text.match(/[\[\]{}]{2,}|"\w+"\s*:/g) || []).length;

  if (words.length < 35) return "low";
  if (hashtagCount > Math.max(2, Math.floor(words.length * 0.12))) return "low";
  if (tagLikeCount > 0) return "low";
  if (jsonArtifactCount > 0) return "low";

  return "high";
};

const joinUniqueLines = (lines: string[], maxChars = 7000): string => {
  const out: string[] = [];
  const seen = new Set<string>();
  let total = 0;

  for (const rawLine of lines) {
    const line = normalizeTextLine(rawLine);
    if (!line || line.length < 2) continue;
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    if (total + line.length + 1 > maxChars) break;
    seen.add(key);
    out.push(line);
    total += line.length + 1;
  }

  return out.join("\n");
};

const collectTextValues = (value: any, maxDepth = 6, depth = 0): string[] => {
  if (depth > maxDepth || value == null) return [];
  if (typeof value === "string") return [value];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectTextValues(item, maxDepth, depth + 1));
  }

  if (typeof value === "object") {
    const preferredKeys = [
      "text", "value", "content", "sentence", "transcript", "caption", "utterance", "words", "line",
    ];
    const preferred: string[] = [];
    for (const key of preferredKeys) {
      if (key in value) preferred.push(...collectTextValues(value[key], maxDepth, depth + 1));
    }
    if (preferred.length > 0) return preferred;

    return Object.values(value).flatMap((item) => collectTextValues(item, maxDepth, depth + 1));
  }

  return [];
};

const parseCaptionPayload = (raw: string): string => {
  const text = String(raw || "").trim();
  if (!text) return "";

  // JSON caption payloads
  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      const jsonLines = collectTextValues(parsed)
        .map((line) => sanitizeTranscriptLine(line))
        .filter((line) => line.length >= 3);
      return joinUniqueLines(jsonLines, 6000);
    } catch {
      // fall through
    }
  }

  // WEBVTT payloads
  if (/^WEBVTT/i.test(text) || text.includes("-->")) {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) =>
        line &&
        !/^WEBVTT/i.test(line) &&
        !/^NOTE\b/i.test(line) &&
        !/^\d+$/.test(line) &&
        !line.includes("-->")
      )
      .map((line) => sanitizeTranscriptLine(line))
      .filter((line) => line.length >= 3);
    const parsedVtt = joinUniqueLines(lines, 6000);
    if (parsedVtt) return parsedVtt;
  }

  // XML/TTML payloads
  if (text.includes("<") && text.includes(">")) {
    const xmlLines = Array.from(text.matchAll(/<(?:p|span|text)[^>]*>([\s\S]*?)<\/(?:p|span|text)>/gi))
      .map((m) =>
        m[1]
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;|&#160;/gi, " ")
          .replace(/&amp;/gi, "&")
          .replace(/&lt;/gi, "<")
          .replace(/&gt;/gi, ">")
      )
      .map((line) => sanitizeTranscriptLine(line))
      .filter((line) => line.length >= 3);
    const parsedXml = joinUniqueLines(xmlLines, 6000);
    if (parsedXml) return parsedXml;
  }

  const fallbackLines = text
    .split(/\r?\n/)
    .map((line) => sanitizeTranscriptLine(line))
    .filter((line) => line.length >= 3);

  return joinUniqueLines(fallbackLines, 6000);
};

const extractCaptionUrlsFromPostInfo = (video: any): string[] => {
  const containers = [
    video?.video?.cla_info?.caption_infos,
    video?.video?.caption_infos,
    video?.cla_info?.caption_infos,
    video?.caption_infos,
    video?.video?.subtitle_infos,
    video?.subtitle_infos,
  ];

  const urls = new Set<string>();
  for (const container of containers) {
    if (!container) continue;
    const items = Array.isArray(container) ? container : [container];
    for (const item of items) {
      if (!item) continue;
      if (typeof item === "string") {
        if (/^https?:\/\//i.test(item)) urls.add(item);
        continue;
      }

      const candidates = [
        item.url,
        item.caption_url,
        item.captionUrl,
        item.sub_url,
        item.subtitle_url,
        item.subtitleUrl,
        item.vtt_url,
        ...(Array.isArray(item.url_list) ? item.url_list : []),
      ].filter((v) => typeof v === "string" && /^https?:\/\//i.test(v));

      for (const candidate of candidates) urls.add(candidate);
    }
  }

  return Array.from(urls);
};

const extractTranscriptFromPostInfo = (video: any): string => {
  // Only speech/subtitle-related fields. Do NOT use desc/original_client_text (they are caption metadata, not spoken transcript).
  const transcriptSources = [
    video?.video_text,
    video?.video?.text,
    video?.video?.subtitle_infos,
    video?.video?.cla_info?.caption_infos,
    video?.video?.caption_infos,
    video?.interaction_stickers,
  ];

  const lines = transcriptSources
    .flatMap((source) => collectTextValues(source))
    .map((line) => sanitizeTranscriptLine(line))
    .filter((line) => line.length >= 3);

  return joinUniqueLines(lines, 6000);
};

const fetchCaptionTranscript = async (urls: string[]): Promise<string> => {
  for (const url of urls.slice(0, 3)) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const payload = await response.text();
      const parsed = parseCaptionPayload(payload);
      if (parsed && parsed.length > 20) return parsed;
    } catch (e) {
      console.error("Caption fetch failed:", url, e);
    }
  }
  return "";
};

/** Fetch transcript from SocialKit Transcript API */
async function fetchSocialKitTranscript(videoUrl: string): Promise<string> {
  const accessKey = Deno.env.get("SOCIALKIT_ACCESS_KEY");
  if (!accessKey) {
    console.warn("SOCIALKIT_ACCESS_KEY not configured, skipping transcript fallback");
    return "";
  }
  try {
    const apiUrl = `https://api.socialkit.dev/tiktok/transcript?access_key=${encodeURIComponent(accessKey)}&url=${encodeURIComponent(videoUrl)}`;
    console.log("SocialKit Transcript API call for:", videoUrl);
    const res = await fetch(apiUrl);
    if (!res.ok) {
      const errText = await res.text();
      console.error(`SocialKit Transcript API error ${res.status}:`, errText);
      return "";
    }
    const data = await res.json();
    if (data?.success && data?.data?.transcript) {
      const transcript = String(data.data.transcript).trim();
      console.log("SocialKit Transcript API returned", transcript.length, "chars");
      return transcript;
    }
    console.log("SocialKit Transcript API: no transcript in response");
    return "";
  } catch (e) {
    console.error("SocialKit Transcript API failed:", e);
    return "";
  }
}

async function buildTranscriptText(video: any, videoUrl?: string): Promise<string> {
  if (!video) return "";

  const metadataTranscript = extractTranscriptFromPostInfo(video);
  const captionUrls = extractCaptionUrlsFromPostInfo(video);
  const captionTranscript = captionUrls.length > 0 ? await fetchCaptionTranscript(captionUrls) : "";

  let finalTranscript = joinUniqueLines([captionTranscript, metadataTranscript], 7000);
  console.log("Transcript extraction (EnsembleData):", {
    hasCaptionUrls: captionUrls.length > 0,
    captionUrlsCount: captionUrls.length,
    metadataChars: metadataTranscript.length,
    captionChars: captionTranscript.length,
    finalChars: finalTranscript.length,
  });

  // Fallback: if EnsembleData returned no useful transcript, try SocialKit Transcript API
  if (finalTranscript.length < 50 && videoUrl) {
    console.log("EnsembleData transcript too short, trying SocialKit Transcript API fallback...");
    const skTranscript = await fetchSocialKitTranscript(videoUrl);
    if (skTranscript.length > finalTranscript.length) {
      finalTranscript = skTranscript;
      console.log("Using SocialKit transcript:", finalTranscript.length, "chars");
    }
  }

  return finalTranscript;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;
    const json = (data: any, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ensembleToken = Deno.env.get("ENSEMBLE_DATA_TOKEN")!;

    const authHeader = req.headers.get("authorization") || "";
    if (!ensembleToken) {
      return json({ error: "ENSEMBLE_DATA_TOKEN not configured" }, 500);
    }

    // Try to verify user (optional — native mobile may not have auth)
    let userId: string | null = null;
    let userClient: any = null;
    if (authHeader?.startsWith("Bearer ")) {
      userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      try {
        const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
        if (!claimsError && claimsData?.claims) {
          userId = claimsData.claims.sub as string;
        }
      } catch (e) {
        console.warn("Auth token is invalid/expired, continuing without user context");
      }
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // API usage logging
    const logApiUsage = async (act: string, credits: number, metadata: Record<string, any> = {}) => {
      try {
        await adminClient.from("api_usage_log").insert({
          function_name: "socialkit",
          action: act,
          credits_used: credits,
          metadata,
        });
      } catch (e) {
        console.error("Failed to log API usage:", e);
      }
    };

    /** Call EnsembleData API */
    const callEnsemble = async (path: string, params: Record<string, string>) => {
      const url = new URL(`${ENSEMBLE_BASE}${path}`);
      params.token = ensembleToken;
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      console.log(`EnsembleData call: ${path}`, Object.keys(params).filter(k => k !== 'token').map(k => `${k}=${params[k]}`).join(', '));
      const res = await fetch(url.toString());
      if (!res.ok) {
        const text = await res.text();
        console.error(`EnsembleData error ${res.status} for ${path}:`, text);
        throw new Error(`EnsembleData error ${res.status}: ${text}`);
      }
      const data = await res.json();
      console.log(`EnsembleData ${path} response keys:`, JSON.stringify(Object.keys(data)));
      return data;
    };

    const getPublishedAt = (video: any): string => {
      const ct = video.create_time || video.createTime || video.create_time;
      if (ct) {
        const ms = typeof ct === "number" ? (ct > 1e12 ? ct : ct * 1000) : 0;
        if (ms > 0) return new Date(ms).toISOString();
      }
      if (video.created_at) return new Date(video.created_at).toISOString();
      return new Date().toISOString();
    };

    const computeTrend = (video: any) => {
      const stats = video.statistics || video.stats || {};
      const publishedAt = new Date(getPublishedAt(video));
      const hoursSince = Math.max(1, (Date.now() - publishedAt.getTime()) / 3600000);
      const views = stats.play_count ?? stats.views ?? video.views ?? video.playCount ?? 0;
      const likes = stats.digg_count ?? stats.likes ?? video.likes ?? video.diggCount ?? 0;
      const comments = stats.comment_count ?? stats.comments ?? video.comments ?? video.commentCount ?? 0;
      const vViews = views / hoursSince;
      const vLikes = likes / hoursSince;
      const vComments = comments / hoursSince;
      return {
        velocity_views: vViews,
        velocity_likes: vLikes,
        velocity_comments: vComments,
        trend_score: 0.6 * vViews + 0.3 * vLikes + 0.1 * vComments,
        published_at: publishedAt.toISOString(),
      };
    };

    /** Extract videos from EnsembleData response structures */
    const extractVideos = (data: any): any[] => {
      if (Array.isArray(data)) return data;
      // Keyword search: data.data is array of { type, aweme_info }
      if (data?.data?.data && Array.isArray(data.data.data)) return data.data.data;
      if (Array.isArray(data?.data)) return data.data;
      // Hashtag search: data.data.posts
      if (data?.data?.posts && Array.isArray(data.data.posts)) return data.data.posts;
      if (Array.isArray(data?.data?.aweme_list)) return data.data.aweme_list;
      if (Array.isArray(data?.data?.videos)) return data.data.videos;
      if (Array.isArray(data?.items)) return data.items;
      if (Array.isArray(data?.videos)) return data.videos;
      console.log("EnsembleData unexpected response:", JSON.stringify(data).slice(0, 500));
      return [];
    };

    /** Unwrap aweme_info wrapper from EnsembleData keyword search results */
    const unwrapVideo = (item: any): any => {
      if (!item) return null;
      return item.aweme_info || item.itemInfos || item;
    };

    /** Normalize a video object from EnsembleData to our standard format */
    const normalizeVideo = (raw: any) => {
      const v = unwrapVideo(raw);
      const stats = v.statistics || v.stats || {};
      const author = v.author || {};
      const videoInfo = v.video || {};

      const awemeId = v.aweme_id || v.id || "";
      const uniqueId = author.unique_id || author.uniqueId || author.search_user_name || "";
      const avatarUrl = author.avatar_thumb?.url_list?.[0] || author.avatar_larger?.url_list?.[0] || "";
      const coverUrl = videoInfo.cover?.url_list?.[0] || videoInfo.origin_cover?.url_list?.[0] || "";
      const desc = v.desc || v.caption || v.title || "";

      return {
        id: awemeId,
        aweme_id: awemeId,
        platform_video_id: String(awemeId),
        desc,
        caption: desc,
        createTime: v.create_time || v.createTime || 0,
        views: stats.play_count ?? stats.views ?? v.views ?? v.playCount ?? 0,
        likes: stats.digg_count ?? stats.likes ?? v.likes ?? v.diggCount ?? 0,
        comments: stats.comment_count ?? stats.comments ?? v.comments ?? v.commentCount ?? 0,
        shares: stats.share_count ?? stats.shares ?? v.shares ?? v.shareCount ?? 0,
        stats: {
          views: stats.play_count ?? stats.views ?? v.views ?? v.playCount ?? 0,
          likes: stats.digg_count ?? stats.likes ?? v.likes ?? v.diggCount ?? 0,
          comments: stats.comment_count ?? stats.comments ?? v.comments ?? v.commentCount ?? 0,
          shares: stats.share_count ?? stats.shares ?? v.shares ?? v.shareCount ?? 0,
        },
        author: {
          uniqueId,
          unique_id: uniqueId,
          nickname: author.nickname || "",
          avatar: avatarUrl,
          avatarThumb: avatarUrl,
        },
        author_username: uniqueId,
        author_display_name: author.nickname || "",
        author_avatar_url: avatarUrl,
        video: {
          cover: coverUrl,
          duration: videoInfo.duration ? Math.round(videoInfo.duration / 1000) : 0,
        },
        cover_url: coverUrl,
        duration: videoInfo.duration ? Math.round(videoInfo.duration / 1000) : 0,
        url: `https://www.tiktok.com/@${uniqueId || "user"}/video/${awemeId}`,
      };
    };

    /** Generate hashtags + related keywords from query using AI */
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
                content: `Дан поисковый запрос для TikTok. Сгенерируй:
1. "hashtags": 3-5 хэштегов TikTok (без #) ТОЛЬКО на русском и казахском языках. НЕ добавляй английские слова.
2. "related_keywords": 8-12 связанных поисковых слов ТОЛЬКО на русском и казахском языках. НЕ переводи на английский. Это должны быть синонимы, бренды, действия, связанные с запросом.

Верни ТОЛЬКО валидный JSON: {"hashtags":["..."],"related_keywords":["..."]}
Пример для "пылесос": {"hashtags":["пылесос","уборка","чистота","клининг","пылесосим"],"related_keywords":["моющий","дайсон","сяоми","робот","уборка","обзор","лайфхак","квартира","порядок","чистка","генуборка","быт"]}`
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

        // 1. Keyword search + AI hashtag generation in parallel
        const PAGES = 5;
        const [aiResult, ...pageResults] = await Promise.allSettled([
          generateHashtagsAndKeywords(query),
          ...Array.from({ length: PAGES }, (_, page) =>
            callEnsemble("/tt/keyword/search", {
              name: query,
              cursor: String(page * 20),
              period: "7",
              sorting: "0",
              country: "",
              match_exactly: "false",
              get_author_stats: "false",
            })
          ),
        ]);

        const { hashtags = [], relatedKeywords = [] } = (aiResult as any).status === "fulfilled" ? (aiResult as any).value : {};

        let allRawVideos: any[] = [];
        for (const r of pageResults) {
          if (r.status === "fulfilled") {
            allRawVideos.push(...extractVideos(r.value));
          }
        }
        console.log(`Keyword search returned ${allRawVideos.length} videos`);

        // 2. Search by hashtags in parallel
        if (hashtags.length > 0) {
          const hashtagResults = await Promise.allSettled(
            hashtags.map((tag: string) =>
              callEnsemble("/tt/hashtag/posts", { name: tag, cursor: "0" })
            )
          );
          for (const result of hashtagResults) {
            if (result.status === "fulfilled") {
              const vids = extractVideos(result.value);
              console.log(`Hashtag search returned ${vids.length} videos`);
              allRawVideos.push(...vids);
            }
          }
        }

        // 3. Normalize + Deduplicate
        const seen = new Set<string>();
        const uniqueVideos: any[] = [];
        for (const raw of allRawVideos) {
          const v = normalizeVideo(raw);
          if (!v.aweme_id || seen.has(v.aweme_id)) continue;
          seen.add(v.aweme_id);
          uniqueVideos.push(v);
        }
        console.log(`Total unique videos after dedup: ${uniqueVideos.length}`);

        // 4. Prepare video rows for DB
        const now = new Date().toISOString();
        const videoRows = uniqueVideos.map(v => {
          if (!v.aweme_id) return null;
          const trends = computeTrend(v);
          return {
            platform: "tiktok",
            platform_video_id: String(v.aweme_id),
            url: v.url,
            caption: v.caption || "",
            cover_url: v.cover_url || "",
            author_username: v.author_username || "",
            author_display_name: v.author_display_name || "",
            author_avatar_url: v.author_avatar_url || "",
            views: v.views || 0,
            likes: v.likes || 0,
            comments: v.comments || 0,
            shares: v.shares || 0,
            duration_sec: v.duration || null,
            fetched_at: now,
            source_query_id: null,
            region: region || "world",
            ...trends,
          };
        }).filter(Boolean);

        // 5. Batch upsert + save query in parallel
        const upsertPromise = adminClient.from("videos").upsert(videoRows, { onConflict: "platform,platform_video_id" }).select();
        const dbPromises: Promise<any>[] = [upsertPromise];
        if (userId && userClient) {
          dbPromises.push(userClient.from("search_queries").upsert(
            { user_id: userId, query_text: query, last_run_at: now, total_results_saved: videoRows.length },
            { onConflict: "user_id,query_text", ignoreDuplicates: false }
          ).select().single());
        }
        const [upsertResult] = await Promise.all(dbPromises);

        const upsertedVideos = upsertResult.data || [];

        // 6. Fire-and-forget: AI categorize uncategorized videos
        const uncategorized = upsertedVideos.filter((v: any) => !v.niche);
        if (uncategorized.length > 0) {
          const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
          if (LOVABLE_API_KEY) {
            (async () => {
              try {
                const NICHE_KEYS = ["finance","marketing","business","psychology","therapy","education","mama","beauty","fitness","fashion","law","realestate","esoteric","food","home","travel","lifestyle","animals","gaming","music","tattoo","career","auto","diy","kids","ai_news","ai_art","ai_avatar","humor","other"];
                for (let i = 0; i < uncategorized.length; i += 30) {
                  const batch = uncategorized.slice(i, i + 30);
                  const videoCaptions = batch.map((v: any, idx: number) => `${idx}: ${cleanForPrompt(v.caption, 150)}`).join("\n");
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

        // activity_log is handled client-side via checkAndLog
        const successfulPages = pageResults.filter(r => r.status === "fulfilled").length;
        const successfulHashtags = hashtags.length;
        await logApiUsage("search", successfulPages + successfulHashtags, { query, pages: successfulPages, hashtags: successfulHashtags, results: upsertedVideos?.length || 0 });

        return json({ videos: upsertedVideos, query: queryRow, hashtags, relatedKeywords });
      }

      case "video_stats": {
        let video_url = body.video_url;
        if (!video_url) return json({ error: "video_url is required" }, 400);
        if (!validateTikTokUrl(video_url)) return json({ error: "Invalid TikTok URL" }, 400);
        video_url = await resolveShortUrl(video_url);

        const awemeId = extractAwemeId(video_url);
        console.log("video_stats: resolved URL =", video_url, "awemeId =", awemeId);

        const data = await callEnsemble("/tt/post/info", { url: video_url });
        await logApiUsage("video_stats", 1, { video_url });
        // EnsembleData may return { "0": { ... } } or { data: { "0": { ... } } }
        const rawData = data?.data || data;
        const innerData = rawData?.["0"] || rawData;
        const videoData = unwrapVideo(innerData);

        if (videoData) {
          const stats = videoData.statistics || videoData.stats || {};
          const views = stats.play_count ?? stats.views ?? videoData.playCount ?? videoData.views ?? 0;
          const likes = stats.digg_count ?? stats.likes ?? videoData.diggCount ?? videoData.likes ?? 0;
          const comments = stats.comment_count ?? stats.comments ?? videoData.commentCount ?? videoData.comments ?? 0;
          const shares = stats.share_count ?? stats.shares ?? videoData.shareCount ?? videoData.shares ?? 0;

          const videoId = videoData.aweme_id || videoData.id || awemeId;
          const author = videoData.author || {};
          const videoInfo = videoData.video || {};
          const coverUrl = videoInfo.cover?.url_list?.[0] || videoInfo.origin_cover?.url_list?.[0] || "";
          const authorUsername = author.unique_id || author.uniqueId || "";
          const authorAvatar = author.avatar_thumb?.url_list?.[0] || author.avatar_larger?.url_list?.[0] || "";
          const caption = videoData.desc || videoData.caption || "";

          const trends = computeTrend(videoData);
          await adminClient
            .from("videos")
            .update({
              views, likes, comments, shares,
              fetched_at: new Date().toISOString(),
              ...trends,
            })
            .eq("platform_video_id", String(videoId));

          return json({
            views, likes, comments, shares,
            playCount: views, diggCount: likes, commentCount: comments, shareCount: shares,
            id: videoId, videoId,
            thumbnailUrl: coverUrl, cover_url: coverUrl, cover: coverUrl,
            channelName: authorUsername, author_username: authorUsername,
            author_avatar_url: authorAvatar,
            caption, desc: caption,
            author: { uniqueId: authorUsername, avatarThumb: authorAvatar, nickname: author.nickname || "" },
            video: { cover: coverUrl, duration: videoInfo.duration ? Math.round(videoInfo.duration / 1000) : 0 },
            duration: videoInfo.duration ? Math.round(videoInfo.duration / 1000) : 0,
          });
        }

        return json(videoData || {});
      }

      case "analyze_video": {
        let video_url = typeof body.video_url === "string" ? body.video_url.trim() : "";
        const fallbackVideoId = String(body.platform_video_id || "").trim();
        const fallbackUsername = normalizeTikTokUsername(body.author_username || "");

        if ((!video_url || !validateTikTokUrl(video_url)) && fallbackVideoId) {
          const builtUrl = buildFallbackVideoUrl(fallbackVideoId, fallbackUsername);
          if (builtUrl) video_url = builtUrl;
        }

        const isValidVideoUrl = !!video_url && validateTikTokUrl(video_url);
        if (isValidVideoUrl) {
          video_url = await resolveShortUrl(video_url);
        } else {
          console.warn("analyze_video: invalid or missing TikTok URL, using caption-only fallback");
        }

        const awemeId = (isValidVideoUrl ? extractAwemeId(video_url) : null) || fallbackVideoId || null;
        console.log("analyze_video: resolved URL =", video_url || "[missing]", "awemeId =", awemeId);

        const socialKitKey = Deno.env.get("SOCIALKIT_ACCESS_KEY") || "";

        // 1. Fetch transcript, stats, and comments from SocialKit in parallel
        const skBase = "https://api.socialkit.dev";
        const skHeaders: Record<string, string> = { "x-access-key": socialKitKey };

        const transcriptFetch = isValidVideoUrl && socialKitKey
          ? fetch(`${skBase}/tiktok/transcript?url=${encodeURIComponent(video_url)}`, { headers: skHeaders })
              .then(r => r.json()).catch(e => { console.error("SK transcript error:", e); return null; })
          : Promise.resolve(null);

        const statsFetch = isValidVideoUrl && socialKitKey
          ? fetch(`${skBase}/tiktok/stats?url=${encodeURIComponent(video_url)}`, { headers: skHeaders })
              .then(r => r.json()).catch(e => { console.error("SK stats error:", e); return null; })
          : Promise.resolve(null);

        const commentsFetch = isValidVideoUrl && socialKitKey
          ? fetch(`${skBase}/tiktok/comments?url=${encodeURIComponent(video_url)}&limit=15`, { headers: skHeaders })
              .then(r => r.json()).catch(e => { console.error("SK comments error:", e); return null; })
          : Promise.resolve(null);

        const [skTranscript, skStats, skComments] = await Promise.all([
          transcriptFetch,
          statsFetch,
          commentsFetch,
        ]);

        console.log("SocialKit results:", {
          transcript: skTranscript?.success ? `${skTranscript.data?.wordCount || 0} words` : "failed",
          stats: skStats?.success ? "ok" : "failed",
          comments: skComments?.success ? `${skComments.data?.comments?.length || 0} comments` : "failed",
        });

        // Extract transcript
        let transcriptText = "";
        if (skTranscript?.success && skTranscript?.data?.transcript) {
          transcriptText = String(skTranscript.data.transcript).trim();
        }

        // Extract stats
        let videoStats: any = {};
        let statsCaption = "";
        if (skStats?.success && skStats?.data) {
          const sd = skStats.data;
          videoStats = {
            views: sd.views || 0,
            likes: sd.likes || 0,
            comments: sd.comments || 0,
            shares: sd.shares || 0,
          };
          statsCaption = sd.title || sd.description || "";
        }

        // Extract comments
        let commentsData: any = null;
        let topCommentsText = "";
        if (skComments?.success && Array.isArray(skComments?.data?.comments)) {
          commentsData = skComments.data.comments;
          topCommentsText = commentsData
            .slice(0, 10)
            .map((c: any) => c.text || "")
            .filter(Boolean)
            .join("\n");
          console.log("SK Comments fetched, top comments length:", topCommentsText.length);
        }

        // 2. Use Lovable AI to generate structured analysis
        let aiAnalysis: any = null;
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        const caption = cleanForPrompt(body.caption || statsCaption || "", 500);
        const analysisLang = body.language === "kk" ? "kk" : "ru";

        const videoTitle = cleanForPrompt(statsCaption || body.caption || "", 500);
        const videoDuration = skStats?.data?.duration || "";

        // Build context for AI from all available data
        const contextParts: string[] = [];
        if (videoTitle) contextParts.push(`Название/описание: ${videoTitle}`);
        if (videoDuration) contextParts.push(`Длительность: ${videoDuration}`);
        if (videoStats.views) {
          contextParts.push(`Статистика: ${videoStats.views} просмотров, ${videoStats.likes} лайков, ${videoStats.comments} комментариев, ${videoStats.shares} репостов`);
        }
        if (topCommentsText) contextParts.push(`Топ комментарии:\n${topCommentsText.slice(0, 2000)}`);
        if (transcriptText) contextParts.push(`Транскрипт (речь из видео):\n${transcriptText.slice(0, 5000)}`);
        contextParts.push(`Надежность источника речи: ${transcriptText.length >= 120 ? "высокая" : "низкая"}`);

        const hasContent = contextParts.length > 0;

        if (LOVABLE_API_KEY && hasContent) {
          try {
            const systemPromptKk = `Сен — TikTok бейнелерін терең талдау бойынша сарапшысың. Барлық қолжетімді ақпарат негізінде (сипаттама, транскрипт, статистика, пікірлер) толық талдау жаса.

БАСТЫ ЕРЕЖЕ — МӘНДІ 1:1 САҚТА:
- Видеода нақты бар ақпаратты ғана жаз. Ойдан ештеңе қоспа.
- Егер транскрипт бар болса, соған басымдық бер: сөздер мен ойды өзгертпе.
- "structure" ішінде әрекеттерді уақыт ретімен толық бер (өткізіп алма).
- Дәлел жоқ өрістерге тек "белгісіз" деп жаз.
- hook_phrase, visual_hook, text_hook — тек видеода нақты бар болса ғана толтыр, әйтпесе "белгісіз".
- why_viral — бұл видео НЕГЕ атты (немесе неге аттырмас) деген сұраққа толық жауап бер.
- target_audience — мақсатты аудиторияны нақты сипатта.
- emotions — видеодағы эмоциялар мен триггерлерді анықта.
- recommendations — осындай контент жасау үшін нақты ұсыныстар бер.

ТІЛ: Барлық жауаптарды ҚАЗАҚ тілінде бер. Тек video_analysis функциясын шақыр.`;

            const systemPromptRu = `Ты — эксперт по глубокому анализу TikTok-контента. Проанализируй видео строго по данным из источников (описание, транскрипт, статистика, комментарии).

ГЛАВНОЕ ПРАВИЛО — СОХРАНИ СМЫСЛ 1:1:
- Пиши только то, что реально подтверждается входными данными. Никаких догадок.
- Если есть транскрипт — опирайся в первую очередь на него, не перефразируй ключевые смыслы.
- В поле "structure" перечисли действия по порядку (хронология), не пропускай значимые шаги.
- Если факт не подтвержден, пиши только "неизвестно".
- hook_phrase, visual_hook, text_hook заполняй только при явном подтверждении, иначе "неизвестно".
- why_viral — подробно объясни ПОЧЕМУ это видео выстрелило (или не выстрелило) на основе данных.
- target_audience — определи точную целевую аудиторию.
- emotions — определи эмоциональные триггеры и тональность видео.
- recommendations — дай конкретные рекомендации для создания похожего контента.

ЯЗЫК: Все ответы давай на РУССКОМ языке. Вызови только функцию video_analysis.`;

            const userPromptKk = `Осы TikTok бейнесін талда. Видеоның айтылған мәтінін және іс-әрекеттерін 100% дәл жеткіз: ештеңе қоспа, ештеңе алып тастама, ретін бұзба.

URL: ${video_url || "N/A"}

${contextParts.join("\n\n")}`;
            const userPromptRu = `Проанализируй это TikTok-видео. Передай полный сказанный текст и действия из видео максимально точно, без добавлений и без потери смысла.

URL: ${video_url || "N/A"}

${contextParts.join("\n\n")}`;

            const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                temperature: 0,
                messages: [
                  {
                    role: "system",
                    content: analysisLang === "kk" ? systemPromptKk : systemPromptRu
                  },
                  {
                    role: "user",
                    content: analysisLang === "kk" ? userPromptKk : userPromptRu
                  }
                ],
                tools: [
                  {
                    type: "function",
                    function: {
                      name: "video_analysis",
                      description: analysisLang === "kk" 
                        ? "TikTok бейнесінің құрылымдалған талдауы — мазмұнды дәл сақтап жаз" 
                        : "Структурированный анализ TikTok видео — точно сохрани оригинальный смысл",
                      parameters: {
                        type: "object",
                        properties: {
                          topic: { type: "string", description: analysisLang === "kk" ? "Видео тақырыбы — 5-15 сөзден тұратын дәл тақырып, видеодағы нақты мазмұнға негізделген" : "Тема видео — точный заголовок 5-15 слов, основанный на реальном содержании видео" },
                          language: { type: "string", description: "Язык видео (Русский, Қазақша, English, etc.)" },
                          tags: {
                            type: "array",
                            items: { type: "string" },
                            description: analysisLang === "kk" ? "2-4 контент форматы/түрі" : "2-4 формата/типа контента"
                          },
                          niches: {
                            type: "array",
                            items: { type: "string" },
                            description: analysisLang === "kk" ? "2-4 ниша эмодзимен" : "2-4 ниши с эмодзи"
                          },
                          summary: { type: "string", description: analysisLang === "kk" ? "Видео мазмұны — 4-8 сөйлем, айтылған мәтін мен іс-әрекеттерді хронологиямен дәл бер, ештеңе қоспа" : "Суть видео — 4-8 предложений, точно передай сказанный текст и действия по хронологии, без добавлений" },
                          structure: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                time: { type: "string" },
                                title: { type: "string" },
                                description: { type: "string" }
                              },
                              required: ["time", "title", "description"]
                            },
                            description: analysisLang === "kk" ? "Кемінде 5 сегмент (бар болса 5-12): әрекеттердің толық хронологиясы таймкодпен" : "Минимум 5 сегментов (если доступно 5-12): полная хронология действий с таймкодами"
                          },
                          hook_phrase: { type: "string", description: analysisLang === "kk" ? "Видеодағы бірінші фраза-хук — ДӘЛМЕ-ДӘЛ видеодан ал" : "Первая фраза-хук — бери ДОСЛОВНО из видео" },
                          visual_hook: { type: "string", description: analysisLang === "kk" ? "Визуалды хуктің сипаттамасы — нақты көрінетін нәрсені жаз" : "Описание визуального хука — опиши что реально видно" },
                          text_hook: { type: "string", description: analysisLang === "kk" ? "Алғашқы секундтардағы экрандағы мәтін — ДӘЛМЕ-ДӘЛ видеодан ал" : "Текст на экране в первые секунды — бери ДОСЛОВНО" },
                          why_viral: { type: "string", description: analysisLang === "kk" ? "Бұл видео НЕГЕ атты (немесе неге аттырмас): статистика, контент сапасы, тренд, хук, аудитория реакциясы негізінде 3-5 сөйлеммен түсіндір" : "ПОЧЕМУ это видео выстрелило (или не выстрелило): объясни в 3-5 предложениях на основе статистики, качества контента, тренда, хука, реакции аудитории" },
                          target_audience: { type: "string", description: analysisLang === "kk" ? "Мақсатты аудитория: жасы, жынысы, қызығушылықтары, бұл видео кімге арналған" : "Целевая аудитория: возраст, пол, интересы, для кого это видео" },
                          emotions: {
                            type: "array",
                            items: { type: "string" },
                            description: analysisLang === "kk" ? "Видеодағы эмоциялық триггерлер (мыс: қызығушылық, таңқалу, күлкі, FOMO, шабыт)" : "Эмоциональные триггеры видео (напр: любопытство, удивление, юмор, FOMO, вдохновение)"
                          },
                          content_format: { type: "string", description: analysisLang === "kk" ? "Контент форматы: talking head, voiceover, монтаж, POV, сториталлинг, т.б." : "Формат контента: talking head, voiceover, монтаж, POV, сторителлинг и т.д." },
                          cta_analysis: { type: "string", description: analysisLang === "kk" ? "CTA (іс-әрекетке шақыру) талдауы: видеода қандай CTA бар, оның тиімділігі" : "Анализ CTA (призыв к действию): какой CTA есть, насколько эффективен" },
                          strengths: {
                            type: "array",
                            items: { type: "string" },
                            description: analysisLang === "kk" ? "Видеоның күшті жақтары (3-5 пункт)" : "Сильные стороны видео (3-5 пунктов)"
                          },
                          weaknesses: {
                            type: "array",
                            items: { type: "string" },
                            description: analysisLang === "kk" ? "Видеоның әлсіз жақтары немесе жақсарту нүктелері (2-4 пункт)" : "Слабые стороны или точки роста (2-4 пункта)"
                          },
                          recommendations: {
                            type: "array",
                            items: { type: "string" },
                            description: analysisLang === "kk" ? "Осындай контент жасау үшін нақты ұсыныстар (3-5 пункт)" : "Конкретные рекомендации для создания похожего контента (3-5 пунктов)"
                          },
                          virality_score: { type: "number", description: analysisLang === "kk" ? "Вирустық әлеует бағасы 1-ден 10-ға дейін (статистика мен контент сапасы негізінде)" : "Оценка вирусного потенциала от 1 до 10 (на основе статистики и качества контента)" },
                          funnel: {
                            type: "object",
                            properties: {
                              direction: { type: "string" },
                              goal: { type: "string" }
                            },
                            required: ["direction", "goal"]
                          }
                        },
                        required: ["topic", "language", "tags", "niches", "summary", "structure", "hook_phrase", "visual_hook", "text_hook", "why_viral", "target_audience", "emotions", "content_format", "cta_analysis", "strengths", "weaknesses", "recommendations", "virality_score", "funnel"]
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
              }
            } else {
              const errText = await aiResponse.text();
              console.error("AI gateway error:", aiResponse.status, errText);
            }
          } catch (e) {
            console.error("AI analysis error:", e);
          }
        }

        // 3. Combine everything
        const unknownText = analysisLang === "kk" ? "белгісіз" : "неизвестно";
        const transcriptQuality = getTranscriptQuality(transcriptText);
        const hasStrongSpeechSource = transcriptQuality === "high";

        if (aiAnalysis && !hasStrongSpeechSource) {
          if (!aiAnalysis.hook_phrase || !String(aiAnalysis.hook_phrase).trim()) {
            aiAnalysis.hook_phrase = unknownText;
          }
          if (!aiAnalysis.text_hook || !String(aiAnalysis.text_hook).trim()) {
            aiAnalysis.text_hook = unknownText;
          }
          if (!aiAnalysis.visual_hook || !String(aiAnalysis.visual_hook).trim()) {
            aiAnalysis.visual_hook = unknownText;
          }
        }

        const summaryJson = {
          ...(aiAnalysis || {}),
          source_quality: transcriptQuality,
          stats: videoStats.views ? videoStats : null,
        };

        const result = {
          summary_json: summaryJson,
          transcript_text: transcriptText || null,
          comments_json: commentsData,
        };

        const normalizedVideoUrl = video_url || buildFallbackVideoUrl(fallbackVideoId, fallbackUsername) || "";

        // Save analysis (only if authenticated and URL is available)
        let analysis = { ...result, video_url: normalizedVideoUrl || null };
        if (userId && normalizedVideoUrl) {
          const saveClient = userClient || adminClient;
          const { data: saved } = await saveClient
            .from("video_analysis")
            .insert({
              user_id: userId,
              video_url: normalizedVideoUrl,
              ...result,
              analyzed_at: new Date().toISOString(),
            })
            .select()
            .single();
          if (saved) analysis = saved;
        }

        // Log API usage (3 SocialKit calls: transcript + stats + comments)
        const skCredits = (skTranscript?.success ? 1 : 0) + (skStats?.success ? 1 : 0) + (skComments?.success ? 1 : 0);
        await logApiUsage("analyze_video", skCredits, {
          video_url: normalizedVideoUrl || null,
          provider: "socialkit",
        });

        return json(analysis);
      }

      case "account_stats": {
        let profile_url = typeof body.profile_url === "string" ? body.profile_url.trim() : "";
        if (!profile_url) return json({ error: "profile_url is required" }, 400);

        if (!/^https?:\/\//i.test(profile_url)) {
          const normalizedUsername = normalizeTikTokUsername(profile_url);
          if (normalizedUsername) {
            profile_url = `https://www.tiktok.com/@${normalizedUsername}`;
          }
        }

        if (!validateTikTokUrl(profile_url)) return json({ error: "Invalid TikTok URL" }, 400);

        const usernameFromUrl = extractUsername(profile_url);
        if (!usernameFromUrl) return json({ error: "Could not extract username from URL" }, 400);

        // Fetch user info and user posts in parallel via EnsembleData
        const [userInfoRes, userPostsRes] = await Promise.allSettled([
          callEnsemble("/tt/user/info", { username: usernameFromUrl }),
          callEnsemble("/tt/user/posts", { username: usernameFromUrl, depth: "3", alternative_method: "false" }),
        ]);

        // Parse user info
        let accountData: any = {};
        let externalStats: any = {};
        if (userInfoRes.status === "fulfilled") {
          const raw = userInfoRes.value?.data || userInfoRes.value;
          accountData = raw?.user || raw || {};
          // EnsembleData returns stats separately at data.stats level
          externalStats = raw?.stats || {};
          console.log("User info keys:", JSON.stringify(Object.keys(accountData)));
          console.log("External stats keys:", JSON.stringify(Object.keys(externalStats)));
        } else {
          console.error("User info fetch failed:", userInfoRes.reason);
        }

        // Parse user posts
        let topVideos: any[] = [];
        if (userPostsRes.status === "fulfilled") {
          const postsRaw = userPostsRes.value?.data || userPostsRes.value;
          const rawPosts = Array.isArray(postsRaw) ? postsRaw : postsRaw?.aweme_list || postsRaw?.posts || [];
          console.log("User posts returned", rawPosts.length, "posts");

          topVideos = rawPosts.map((raw: any) => {
            const v = unwrapVideo(raw);
            const stats = v.statistics || v.stats || {};
            return {
              id: v.aweme_id || v.id,
              desc: v.desc || "",
              cover: v.video?.cover?.url_list?.[0] || "",
              url: `https://www.tiktok.com/@${usernameFromUrl}/video/${v.aweme_id || v.id}`,
              views: stats.play_count ?? stats.views ?? v.playCount ?? 0,
              likes: stats.digg_count ?? stats.likes ?? v.diggCount ?? 0,
              comments: stats.comment_count ?? stats.comments ?? v.commentCount ?? 0,
              shares: stats.share_count ?? stats.shares ?? v.shareCount ?? 0,
              duration: v.video?.duration ? Math.round(v.video.duration / 1000) : 0,
              createTime: v.create_time || v.createTime || 0,
            };
          });
          topVideos.sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
        } else {
          console.error("User posts fetch failed:", userPostsRes.reason);
        }

        // Extract user stats
        const username = accountData.unique_id || accountData.uniqueId || usernameFromUrl;
        const userStats = externalStats || accountData.stats || {};
        const followers = userStats.followerCount ?? userStats.follower_count ?? accountData.follower_count ?? accountData.followers ?? 0;
        const following = userStats.followingCount ?? userStats.following_count ?? accountData.following_count ?? accountData.following ?? 0;
        const totalLikes = userStats.heartCount ?? userStats.heart_count ?? userStats.total_favorited ?? accountData.total_favorited ?? accountData.totalLikes ?? 0;
        const totalVideos = userStats.videoCount ?? userStats.aweme_count ?? accountData.aweme_count ?? accountData.totalVideos ?? 0;
        const avatarUrl = accountData.avatar_thumb?.url_list?.[0] || accountData.avatar_larger?.url_list?.[0] || "";

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

        let account = null;
        if (userId) {
          const saveClient = userClient || adminClient;
          const { data: saved } = await saveClient
            .from("accounts_tracked")
            .upsert(
              {
                user_id: userId,
                profile_url,
                username,
                avatar_url: avatarUrl,
                followers,
                following,
                total_likes: totalLikes,
                total_videos: totalVideos,
                verified: accountData.verification_type === 1 || accountData.verified || false,
                bio: accountData.signature || accountData.bio || "",
                bio_link: accountData.bio_link?.link || accountData.bioLink || null,
                fetched_at: new Date().toISOString(),
                analysis_json: analysisPayload,
              },
              { onConflict: "user_id,username" }
            )
            .select()
            .single();
          if (saved) account = saved;
        }

        // activity_log is handled client-side via checkAndLog
        const accountCredits = (userInfoRes.status === "fulfilled" ? 1 : 0) + (userPostsRes.status === "fulfilled" ? 1 : 0);
        await logApiUsage("account_stats", accountCredits, { profile_url, username });

        return json({
          ...(account || {}),
          ...analysisPayload,
          username, avatar_url: avatarUrl, followers, following, total_likes: totalLikes, total_videos: totalVideos,
        });
      }

      case "bulk_categorize": {
        const NICHE_KEYS = ["finance","marketing","business","psychology","therapy","education","mama","beauty","fitness","fashion","law","realestate","esoteric","food","home","travel","lifestyle","animals","gaming","music","tattoo","career","auto","diy","kids","ai_news","ai_art","ai_avatar","humor","other"];
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 500);

        const batchSize = 30;
        const maxBatches = 10;
        let totalCategorized = 0;

        for (let b = 0; b < maxBatches; b++) {
          const { data: uncategorized } = await adminClient
            .from("videos")
            .select("id, caption")
            .is("niche", null)
            .limit(batchSize);

          if (!uncategorized || uncategorized.length === 0) break;

          const videoCaptions = uncategorized.map((v: any, idx: number) => `${idx}: ${cleanForPrompt(v.caption, 150)}`).join("\n");

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
        // Admin-only: EnsembleData search with filters
        if (!userId) return json({ error: "Auth required for admin actions" }, 401);
        const { data: roleCheck } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (!roleCheck) return json({ error: "Admin access required" }, 403);

        const { query: searchQuery, publish_time = "7", sort_type = "3" } = body;
        if (!searchQuery) return json({ error: "query is required" }, 400);

        // Map sort_type: "3" = by date (sorting=2), "1" = by likes (sorting=1), "0" = relevance (sorting=0)
        let edSorting = "0";
        if (sort_type === "3" || sort_type === "2") edSorting = "2";
        else if (sort_type === "1") edSorting = "1";

        // Map publish_time to EnsembleData period
        let edPeriod = publish_time;
        if (!["0", "1", "7", "30", "90", "180"].includes(edPeriod)) edPeriod = "7";

        // 1. Keyword search (paginated) + AI hashtag generation in parallel
        const PAGES = 15;
        const [aiResult, ...pageResults] = await Promise.allSettled([
          generateHashtagsAndKeywords(searchQuery),
          ...Array.from({ length: PAGES }, (_, page) =>
            callEnsemble("/tt/keyword/search", {
              name: searchQuery,
              cursor: String(page * 20),
              period: edPeriod,
              sorting: edSorting,
              country: "",
              match_exactly: "false",
              get_author_stats: "false",
            })
          ),
        ]);

        let allRawVideos: any[] = [];
        for (const r of pageResults) {
          if (r.status === "fulfilled") {
            allRawVideos.push(...extractVideos(r.value));
          }
        }
        console.log(`Admin keyword search: ${allRawVideos.length} videos`);

        // 2. Hashtag search in parallel
        const { hashtags = [] } = (aiResult as any).status === "fulfilled" ? (aiResult as any).value : {};
        if (hashtags.length > 0) {
          const hashtagResults = await Promise.allSettled(
            hashtags.map((tag: string) =>
              callEnsemble("/tt/hashtag/posts", { name: tag, cursor: "0" })
            )
          );
          for (const r of hashtagResults) {
            if (r.status === "fulfilled") {
              allRawVideos.push(...extractVideos(r.value));
            }
          }
        }

        // 3. Normalize + Deduplicate
        const seen = new Set<string>();
        const unique: any[] = [];
        for (const raw of allRawVideos) {
          const v = normalizeVideo(raw);
          if (!v.aweme_id || seen.has(v.aweme_id)) continue;
          seen.add(v.aweme_id);
          unique.push(v);
        }

        // 4. Sort
        unique.sort((a: any, b: any) => {
          if (sort_type === "1") {
            return (b.likes || 0) - (a.likes || 0);
          }
          // by date
          const aTime = a.createTime || 0;
          const bTime = b.createTime || 0;
          return (typeof bTime === "number" ? bTime : 0) - (typeof aTime === "number" ? aTime : 0);
        });

        console.log(`Admin search "${searchQuery}": ${unique.length} unique videos`);
        const adminSearchCredits = pageResults.filter(r => r.status === "fulfilled").length + hashtags.length;
        await logApiUsage("admin_search", adminSearchCredits, { query: searchQuery, results: unique.length });
        return json({ videos: unique });
      }

      case "get_play_url": {
        let video_url = body.video_url;
        if (!video_url) return json({ error: "video_url is required" }, 400);
        if (!validateTikTokUrl(video_url)) return json({ error: "Invalid TikTok URL" }, 400);
        video_url = await resolveShortUrl(video_url);

        // 1. Check DB cache first — play_url valid for 2 hours
        const awemeIdForPlay = extractAwemeId(video_url);
        if (awemeIdForPlay) {
          const { data: cached } = await adminClient
            .from("videos")
            .select("play_url, play_url_fetched_at")
            .eq("platform_video_id", String(awemeIdForPlay))
            .maybeSingle();
          
          if (cached?.play_url && cached?.play_url_fetched_at) {
            const age = Date.now() - new Date(cached.play_url_fetched_at).getTime();
            if (age < 2 * 60 * 60 * 1000) { // 2 hours
              console.log("get_play_url: DB cache hit for", awemeIdForPlay);
              return json({ play_url: cached.play_url, cached: true });
            }
          }
        }

        // 2. Fetch from EnsembleData
        let playUrl: string | null = null;
        try {
          const data = await callEnsemble("/tt/post/info", { url: video_url });
          await logApiUsage("get_play_url", 1, { video_url });

          const rawData = data?.data || data;
          const innerData = rawData?.aweme_detail || rawData?.aweme_details?.[0] || rawData?.["0"] || rawData;
          const videoData = unwrapVideo(innerData);

          if (videoData) {
            const videoInfo = videoData.video || {};
            const playUrls = videoInfo.play_addr?.url_list || [];
            const downloadUrls = videoInfo.download_addr?.url_list || [];
            const h264Urls = videoInfo.play_addr_h264?.url_list || [];
            playUrl = playUrls[0] || downloadUrls[0] || h264Urls[0] || null;

            // 3. Save to DB for future requests
            if (playUrl && awemeIdForPlay) {
              adminClient
                .from("videos")
                .update({ play_url: playUrl, play_url_fetched_at: new Date().toISOString() })
                .eq("platform_video_id", String(awemeIdForPlay))
                .then(() => {})
                .catch(() => {});
            }
          }
        } catch (e) {
          console.error("get_play_url error:", (e as Error).message);
        }

        return json({ play_url: playUrl });
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
