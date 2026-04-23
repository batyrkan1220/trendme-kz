import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScriptGenerationPanel } from "./ScriptGenerationPanel";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import type { VideoDialogProps } from "@/lib/types/dialogVideo";

// Standardized prop contract — see src/lib/types/dialogVideo.ts
type Props = VideoDialogProps;

/**
 * Бейне карточкасынан "Сценарий" батырмасын басқанда ашылатын диалог.
 * Видео анализ бетіне өтпей, осы жерде:
 *  1) тіл таңдау (RU / KK)
 *  2) бірден Gemini арқылы сценарий генерациясы + AI ассистент чат
 */
export function ScriptOnlyDialog({ video, open, onOpenChange }: Props) {
  const [language, setLanguage] = useState<"ru" | "kk" | null>(null);

  // Reset state on close
  useEffect(() => {
    if (!open) setLanguage(null);
  }, [open]);

  const startScript = (lang: "ru" | "kk") => {
    if (!video) return;
    // Списание токенов + лимит ScriptGenerationPanel ішінде жүреді (қос есептен сақтау)
    setLanguage(lang);
  };

  if (!video) return null;

  const isKk = language === "kk";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl p-0 gap-0 border-l border-border/50 overflow-hidden [&>button]:hidden"
        aria-describedby={undefined}
        style={{ zIndex: 99998 }}
      >
        <SheetTitle className="sr-only">AI Сценарий</SheetTitle>

        {language ? (
          <ScriptGenerationPanel
            transcript=""
            summary={{
              topic: video.caption || "",
              summary: video.caption || "",
              duration_sec: Number(video.duration_sec || video.duration || 30),
            }}
            caption={video.caption || ""}
            language={language}
            videoUrl={video.url}
            coverUrl={video.cover_url}
            onBack={() => onOpenChange(false)}
          />
        ) : (
          <div className="flex flex-col h-full bg-background md:[background-image:var(--gradient-mesh)]">
            {/* Glass header — matches /trends */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0"
              style={{
                paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
                background: "hsl(var(--background) / 0.85)",
                backdropFilter: "blur(20px) saturate(1.2)",
                WebkitBackdropFilter: "blur(20px) saturate(1.2)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-viral/15 ring-1 ring-viral/30 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground leading-none mb-0.5">
                    AI Сценарист
                  </p>
                  <h2 className="text-[15px] font-semibold text-foreground leading-none tracking-tight">
                    Создать сценарий
                  </h2>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="h-9 w-9 rounded-full border border-border bg-background hover:bg-foreground/[0.04] flex items-center justify-center transition-colors active:scale-95"
                aria-label="Закрыть"
              >
                <span className="text-foreground/70 text-lg leading-none">×</span>
              </button>
            </div>

            {/* Language picker */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 animate-fade-in">
              <div className="w-full max-w-sm flex flex-col items-center gap-5">
                {/* Cover preview */}
                {video.cover_url && (
                  <div className="w-24 h-32 rounded-2xl overflow-hidden shadow-card border border-border/60">
                    <img src={video.cover_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="text-center space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Шаг 1 / 2
                  </p>
                  <h3 className="text-[22px] font-semibold text-foreground tracking-tight">
                    Выберите язык сценария
                  </h3>
                  <p className="text-[12.5px] text-muted-foreground">
                    Тілді таңдаңыз — AI бірден сценарий жазып бастайды
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <button
                    onClick={() => startScript("ru")}
                    className="w-full h-12 bg-viral text-viral-foreground hover:brightness-105 rounded-xl font-semibold text-sm shadow-glow-viral transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
                  >
                    🇷🇺 Русский
                  </button>
                  <button
                    onClick={() => startScript("kk")}
                    className="w-full h-12 bg-card border border-border hover:border-border-strong hover:bg-foreground/[0.03] text-foreground rounded-xl font-semibold text-sm shadow-soft transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
                  >
                    🇰🇿 Қазақша
                  </button>
                </div>

                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                  После выбора языка AI-ассистент сразу начнёт писать сценарий и поможет улучшить его в чате
                </p>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
