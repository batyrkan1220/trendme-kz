import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2, Sparkles } from "lucide-react";
import { VideoCard } from "@/components/VideoCard";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ScriptGenerationPanel } from "@/components/ScriptGenerationPanel";
import { useSubscription } from "@/hooks/useSubscription";
import { MagicAnalysisLoader } from "@/components/MagicAnalysisLoader";
import { hapticSuccess } from "@/lib/haptics";
import { VideoAnalysisResults } from "@/components/VideoAnalysisResults";
import { useIsMobile } from "@/hooks/use-mobile";

const extractVideoId = (url: string): string => {
  const patterns = [/\/video\/(\d+)/, /\/photo\/(\d+)/, /(\d{15,})/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return "";
};

const normalizeTikTokUrlInput = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(www\.)?(tiktok\.com|vm\.tiktok\.com|m\.tiktok\.com|vt\.tiktok\.com|lite\.tiktok\.com)\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

const isValidTikTokUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url.trim());
    const hosts = ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "m.tiktok.com", "vt.tiktok.com", "lite.tiktok.com"];
    return hosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith("." + h));
  } catch {
    return false;
  }
};

export default function VideoAnalysis() {
  const [url, setUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [language, setLanguage] = useState<"ru" | "kk" | null>(null);
  const { checkAndLog } = useSubscription();
  const isMobile = useIsMobile();

  const { data: analysis, isPending, mutate: analyze } = useMutation({
    mutationFn: async ({ videoUrl, lang }: { videoUrl: string; lang: "ru" | "kk" }) => {
      const { data, error } = await supabase.functions.invoke("socialkit", {
        body: {
          action: "analyze_video",
          video_url: videoUrl,
          platform_video_id: extractVideoId(videoUrl),
          caption: "",
          language: lang,
        }
      });
      if (error) throw error;
      if (!data) throw new Error("Не удалось получить данные о видео. Проверьте ссылку.");
      const summaryStats = data.summary_json?.stats || null;
      return { stats: summaryStats, ...data };
    },
    onSuccess: () => hapticSuccess(),
    onError: (err: Error) => toast.error(err.message || "Не удалось проанализировать видео"),
  });

  const handleAnalyze = async (lang: "ru" | "kk") => {
    const normalizedUrl = normalizeTikTokUrlInput(url);
    if (!normalizedUrl) return;

    if (!isValidTikTokUrl(normalizedUrl)) {
      toast.error("Используйте только ссылку на TikTok");
      return;
    }

    const hasVideoPath = /\/video\/\d+/.test(normalizedUrl) || /\/photo\/\d+/.test(normalizedUrl) || /\/v\/\d+/.test(normalizedUrl) || /vm\.tiktok\.com/.test(normalizedUrl) || /vt\.tiktok\.com/.test(normalizedUrl);
    const isProfileUrl = /@[\w.]+\/?(\?|$)/.test(normalizedUrl) && !hasVideoPath;
    if (isProfileUrl) {
      toast.error("Это ссылка на профиль 👤\nВставьте ссылку на видео", { duration: 5000 });
      return;
    }

    const ok = await checkAndLog("video_analysis", `Анализ видео: ${normalizedUrl}`);
    if (!ok) return;

    setLanguage(lang);
    setUrl(normalizedUrl);
    setIsPlaying(false);
    setShowScript(false);
    analyze({ videoUrl: normalizedUrl, lang });
  };

  const stats = analysis?.stats;
  const rawSummary = analysis?.summary_json;
  const summary = typeof rawSummary === "string"
    ? (() => { try { return JSON.parse(rawSummary); } catch { return null; } })()
    : rawSummary;

  let transcript = analysis?.transcript_text || "";
  if (typeof transcript !== "string") {
    try { transcript = JSON.stringify(transcript); } catch { transcript = ""; }
  }
  if (transcript.startsWith("{") || transcript.startsWith("[")) {
    try {
      const parsed = JSON.parse(transcript);
      transcript = parsed?.transcript || parsed?.text || parsed?.data?.transcript || transcript;
    } catch { /* keep */ }
  }

  const videoId = extractVideoId(url) || String(stats?.videoId || stats?.id || stats?.video_id || stats?.aweme_id || "");
  const views = Number(stats?.views || stats?.playCount || 0);
  const likes = Number(stats?.likes || stats?.diggCount || 0);
  const commentsCount = Number(stats?.comments || stats?.commentCount || 0);
  const shares = Number(stats?.shares || stats?.shareCount || 0);
  const er = views > 0 ? ((likes + commentsCount + shares) / views * 100).toFixed(2) : "0";
  const coverUrl = stats?.thumbnailUrl || stats?.cover || stats?.cover_url || stats?.originCover || stats?.video?.cover || "";
  const authorUsername = stats?.channelName || stats?.author?.uniqueId || stats?.author_username || "";
  const authorAvatar = stats?.author?.avatarThumb || stats?.author_avatar_url || "";
  const duration = Number(stats?.duration || stats?.duration_sec || stats?.video?.duration || 0);

  if (showScript && analysis) {
    return (
      <AppLayout>
        <div className="pb-16 md:pb-8 mx-2 md:m-4" style={{ height: "calc(100dvh - 6rem)" }}>
          <ScriptGenerationPanel
            transcript={transcript}
            summary={{ ...summary, duration_sec: duration }}
            caption=""
            language={language || "ru"}
            onBack={() => setShowScript(false)}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {!analysis || isPending ? (
        /* Input state — centered, premium */
        <div className="flex flex-col items-center justify-center px-4 animate-fade-in bg-background-subtle" style={{ minHeight: "calc(100dvh - 8rem)", paddingTop: "max(env(safe-area-inset-top, 0px) + 16px, 16px)" }}>
          <div className="w-full max-w-lg flex flex-col items-center gap-6">
            {isPending ? <MagicAnalysisLoader /> : (
              <div className="text-center space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                  AI Анализ
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                  {language === "kk" ? "Видео талдау" : "Анализ видео"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Вставьте ссылку на TikTok видео — получите глубокий разбор
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3 w-full">
              <Input
                placeholder="https://tiktok.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isPending && url.trim() && handleAnalyze("ru")}
                className="flex-1 h-12 bg-card border-border rounded-xl shadow-soft text-base"
              />
              {!isPending && (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] text-muted-foreground text-center font-semibold uppercase tracking-wide">Тілді таңдаңыз / Выберите язык</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAnalyze("kk")}
                      disabled={!url.trim()}
                      className="flex-1 h-11 bg-foreground text-background hover:bg-foreground/90 disabled:bg-foreground/40 disabled:text-background disabled:opacity-100 border-0 transition-all rounded-xl font-semibold text-sm shadow-soft"
                    >
                      🇰🇿 Қазақша
                    </Button>
                    <Button
                      onClick={() => handleAnalyze("ru")}
                      disabled={!url.trim()}
                      className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-primary/40 disabled:text-primary-foreground disabled:opacity-100 border-0 transition-all rounded-xl font-semibold text-sm shadow-glow-primary"
                    >
                      🇷🇺 Русский
                    </Button>
                  </div>
                </div>
              )}
              {isPending && (
                <Button disabled className="h-11 bg-primary text-primary-foreground border-0 rounded-xl font-semibold text-sm disabled:opacity-100">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />Анализируем...
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Results state */
        <div className="animate-magic-reveal pb-20 md:pb-8 bg-background-subtle min-h-full" style={{ paddingTop: "max(env(safe-area-inset-top, 0px) + 4px, 4px)" }}>
          {/* Top bar with input — compact on mobile */}
          <div className="px-2.5 md:px-4 lg:px-6 pb-2">
            <div className="flex gap-1.5">
              <Input
                placeholder="TikTok видео ссылкасы..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isPending && url.trim() && handleAnalyze(language || "ru")}
                className="flex-1 h-9 md:h-11 bg-card border-border rounded-lg md:rounded-xl shadow-soft text-xs md:text-sm"
              />
              <Button onClick={() => handleAnalyze("kk")} disabled={isPending} size="sm" className="h-9 md:h-11 bg-foreground text-background hover:bg-foreground/90 border-0 px-2.5 md:px-3 rounded-lg md:rounded-xl font-semibold text-[11px] md:text-xs">
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "🇰🇿"}
              </Button>
              <Button onClick={() => handleAnalyze("ru")} disabled={isPending} size="sm" className="h-9 md:h-11 bg-primary text-primary-foreground hover:bg-primary-hover border-0 px-2.5 md:px-3 rounded-lg md:rounded-xl font-semibold text-[11px] md:text-xs">
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "🇷🇺"}
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-2.5 px-2.5 md:px-4 lg:px-6 min-h-0 md:h-[calc(100vh-8rem)]`}>
            {/* Video Card — smaller on mobile, side on desktop */}
            <div className={`flex-shrink-0 ${isMobile ? "w-full flex justify-center" : "w-[min(44vw,200px)]"}`}>
              <div className={isMobile ? "w-[120px]" : "w-full"}>
                <VideoCard
                  video={{
                    id: videoId,
                    platform_video_id: videoId,
                    url: url,
                    cover_url: coverUrl,
                    caption: stats?.caption || stats?.desc || "",
                    author_username: authorUsername,
                    author_avatar_url: authorAvatar,
                    views, likes, comments: commentsCount, shares,
                    duration: duration,
                  }}
                  playingId={isPlaying ? videoId : null}
                  onPlay={(id) => setIsPlaying(!!id)}
                  isFavorite={false}
                  onToggleFav={() => {}}
                  showTier={true}
                  showAuthor={true}
                  showAnalyzeButton={false}
                />
              </div>
            </div>

            {/* Analysis Results */}
            <div className="flex-1 overflow-y-auto p-2.5 md:p-5 bg-card rounded-xl md:rounded-2xl border border-border shadow-card">
              <VideoAnalysisResults
                summary={summary}
                transcript={transcript}
                stats={stats}
                views={views}
                likes={likes}
                commentsCount={commentsCount}
                shares={shares}
                er={er}
                language={language}
                onGenerateScript={async () => {
                  const ok = await checkAndLog("ai_script", `AI Сценарий из анализа: ${url.trim()}`);
                  if (!ok) return;
                  setShowScript(true);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
