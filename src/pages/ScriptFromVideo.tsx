import { AppLayout } from "@/components/layout/AppLayout";
import { Video, Eye, Heart, MessageCircle, Share2, ExternalLink, Target, Play, X, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ScriptGenerationPanel } from "@/components/ScriptGenerationPanel";
import { useSubscription } from "@/hooks/useSubscription";

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
};

const extractVideoId = (url: string): string => {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : "";
};

const isValidTikTokUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url.trim());
    const hosts = ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "m.tiktok.com", "vt.tiktok.com", "lite.tiktok.com"];
    return hosts.some(h => parsed.hostname === h || parsed.hostname.endsWith("." + h));
  } catch {
    return false;
  }
};

export default function ScriptFromVideo() {
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState<"ru" | "kk" | null>(null);
  const { checkAndLog } = useSubscription();
  const { data: analysis, isPending, mutate: analyze, reset } = useMutation({
    mutationFn: async ({ videoUrl, lang }: { videoUrl: string; lang: "ru" | "kk" }) => {
      const [statsRes, analysisRes] = await Promise.allSettled([
        supabase.functions.invoke("socialkit", {
          body: { action: "video_stats", video_url: videoUrl },
        }),
        supabase.functions.invoke("socialkit", {
          body: { action: "analyze_video", video_url: videoUrl, caption: "", language: lang },
        }),
      ]);

      const stats = statsRes.status === "fulfilled" && !statsRes.value.error ? statsRes.value.data : null;
      const analysisData = analysisRes.status === "fulfilled" && !analysisRes.value.error ? analysisRes.value.data : null;

      if (!stats && !analysisData) {
        throw new Error("Не удалось получить данные о видео. Проверьте ссылку.");
      }

      return { stats, ...(analysisData || {}) };
    },
    onError: (err: Error) => {
      toast.error(err.message || "Не удалось проанализировать видео");
    },
  });

  const handleAnalyze = async (lang: "ru" | "kk") => {
    if (!url.trim()) return;
    if (!isValidTikTokUrl(url.trim())) {
      toast.error("Используйте только ссылку на TikTok (например: https://www.tiktok.com/@user/video/...)");
      return;
    }
    const ok = await checkAndLog("ai_script", `AI Сценарий: ${url.trim()}`);
    if (!ok) return;
    setLanguage(lang);
    analyze({ videoUrl: url.trim(), lang });
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
    } catch { /* keep as is */ }
  }

  const coverUrl = stats?.thumbnailUrl || stats?.cover || stats?.cover_url || stats?.originCover || stats?.video?.cover || "";

  // Once analysis is done, go straight to script generation
  if (analysis && !isPending) {
    return (
      <AppLayout>
        <div className="h-[calc(100vh-2rem)] m-4">
          <ScriptGenerationPanel
            transcript={transcript}
            summary={summary}
            caption=""
            language={language || "ru"}
            videoUrl={url}
            coverUrl={coverUrl}
            onBack={() => {
              setUrl("");
              setLanguage(null);
              reset();
            }}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-[calc(100dvh-5rem)] md:min-h-[calc(100dvh-1rem)] flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="w-full max-w-lg flex flex-col items-center gap-6">
          {isPending ? (
            <>
              <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center glow-primary animate-scale-in">
                <Sparkles className="h-9 w-9 text-primary-foreground animate-pulse" />
              </div>
              <p className="text-muted-foreground font-medium text-center text-sm md:text-base animate-fade-in">
                Анализируем видео и готовим сценарий...
              </p>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center">AI Сценарий ✨</h1>
              <p className="text-muted-foreground text-sm text-center">Вставьте ссылку на видео — AI проанализирует и напишет сценарий</p>
            </>
          )}
          <div className="flex flex-col gap-3 w-full">
            <Input
              placeholder="Вставьте ссылку на TikTok видео..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isPending && url.trim() && handleAnalyze("ru")}
              className="flex-1 h-12 bg-card border-border rounded-xl card-shadow text-sm"
            />
            {!isPending && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground text-center font-medium">Тілді таңдаңыз / Выберите язык</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAnalyze("kk")}
                    disabled={!url.trim()}
                    className="flex-1 h-12 gradient-hero text-primary-foreground border-0 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold text-sm"
                  >
                    🇰🇿 Қазақ тілі
                  </Button>
                  <Button
                    onClick={() => handleAnalyze("ru")}
                    disabled={!url.trim()}
                    className="flex-1 h-12 gradient-hero text-primary-foreground border-0 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold text-sm"
                  >
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
    </AppLayout>
  );
}
