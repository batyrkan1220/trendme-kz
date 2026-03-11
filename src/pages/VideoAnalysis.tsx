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

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
};

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

  if (showScript && analysis) {
    return (
      <AppLayout>
        <div className="pb-16 md:pb-8 m-4" style={{ height: "calc(100dvh - 6rem)" }}>
          <ScriptGenerationPanel
            transcript={transcript}
            summary={summary}
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
        <div className="flex flex-col items-center justify-center p-4 animate-fade-in" style={{ minHeight: "calc(100dvh - 8rem)", paddingTop: "max(env(safe-area-inset-top, 0px) + 16px, 16px)" }}>
          <div className="w-full max-w-lg flex flex-col items-center gap-6">
            {isPending ? <MagicAnalysisLoader /> : (
              <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center">
                {language === "kk" ? "Видео талдау" : "Анализ видео"}
              </h1>
            )}
            <div className="flex flex-col gap-3 w-full">
              <Input
                placeholder="Вставьте ссылку на TikTok видео..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isPending && url.trim() && handleAnalyze("ru")}
                className="flex-1 h-12 bg-card border-border rounded-xl card-shadow text-base"
              />
              {!isPending && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground text-center font-medium">Тілді таңдаңыз / Выберите язык</p>
                  <div className="flex gap-2">
                    <Button onClick={() => handleAnalyze("kk")} disabled={!url.trim()} className="flex-1 h-12 gradient-hero text-primary-foreground border-0 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold text-sm">
                      🇰🇿 Қазақ тілі
                    </Button>
                    <Button onClick={() => handleAnalyze("ru")} disabled={!url.trim()} className="flex-1 h-12 gradient-hero text-primary-foreground border-0 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold text-sm">
                      🇷🇺 Русский язык
                    </Button>
                  </div>
                </div>
              )}
              {isPending && (
                <Button disabled className="h-12 gradient-hero text-primary-foreground border-0 rounded-xl font-semibold text-sm">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />Анализируем...
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-magic-reveal pb-16 md:pb-8" style={{ paddingTop: "max(env(safe-area-inset-top, 0px) + 8px, 8px)" }}>
          {/* Top bar with input */}
          <div className="px-3 md:px-4 lg:px-6 pb-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Вставьте ссылку на TikTok видео..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isPending && url.trim() && handleAnalyze(language || "ru")}
                className="flex-1 h-10 md:h-11 bg-card border-border rounded-xl card-shadow text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={() => handleAnalyze("kk")} disabled={isPending} className="h-10 md:h-11 gradient-hero text-primary-foreground border-0 px-3 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold text-xs">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "🇰🇿 Қаз"}
                </Button>
                <Button onClick={() => handleAnalyze("ru")} disabled={isPending} className="h-10 md:h-11 gradient-hero text-primary-foreground border-0 px-3 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold text-xs">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "🇷🇺 Рус"}
                </Button>
              </div>
            </div>
          </div>

          {/* Content: Mobile = vertical, Desktop = horizontal */}
          <div className="flex flex-col md:flex-row gap-3 px-3 md:px-4 lg:px-6 min-h-0 md:h-[calc(100vh-8rem)]">
            {/* Video Card */}
            <div className={`${isMobile ? "w-full flex justify-center" : "w-[min(44vw,200px)]"} flex-shrink-0`}>
              <div className={isMobile ? "w-[140px]" : "w-full"}>
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
            <div className="flex-1 overflow-y-auto p-3 md:p-5 bg-card rounded-xl md:rounded-2xl border border-border/50 card-shadow">
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

              {/* Fallback raw */}