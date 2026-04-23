import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScriptGenerationPanel } from "./ScriptGenerationPanel";
import { useEffect, useState } from "react";
import { Sparkles, X, Zap, MessageCircle, Wand2 } from "lucide-react";
import type { VideoDialogProps } from "@/lib/types/dialogVideo";

type Props = VideoDialogProps;

export function ScriptOnlyDialog({ video, open, onOpenChange }: Props) {
  const [language, setLanguage] = useState<"ru" | "kk" | null>(null);

  useEffect(() => { if (!open) setLanguage(null); }, [open]);

  const startScript = (lang: "ru" | "kk") => {
    if (!video) return;
    setLanguage(lang);
  };

  if (!video) return null;

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
            {/* Header */}
            <header
              className="flex items-center justify-between px-5 py-3 border-b border-border/60 shrink-0"
              style={{
                paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
                background: "hsl(var(--background) / 0.85)",
                backdropFilter: "blur(20px) saturate(1.2)",
                WebkitBackdropFilter: "blur(20px) saturate(1.2)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-viral/15 ring-1 ring-viral/30 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground leading-none mb-0.5">
                    AI Сценарист
                  </p>
                  <h2 className="text-[16px] font-bold text-foreground leading-none tracking-tight">
                    Создать сценарий
                  </h2>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="h-9 w-9 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors active:scale-95"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4 text-foreground/70" />
              </button>
            </header>

            {/* Body */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-6 animate-fade-in">
              <div className="w-full max-w-md flex flex-col items-center gap-6">
                {/* Cover hero with floating badge */}
                {video.cover_url && (
                  <div className="relative">
                    <div className="w-28 h-36 rounded-2xl overflow-hidden shadow-card border border-border/60 rotate-[-4deg]">
                      <img src={video.cover_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -top-2 -right-3 w-10 h-10 rounded-xl bg-viral flex items-center justify-center shadow-glow-viral ring-2 ring-background rotate-[6deg]">
                      <Wand2 className="h-5 w-5 text-viral-foreground" />
                    </div>
                  </div>
                )}

                {/* Title */}
                <div className="text-center space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Шаг 1 / 2 — Выбор языка
                  </p>
                  <h3 className="text-[22px] md:text-[26px] font-bold text-foreground tracking-tight leading-tight">
                    На каком языке писать сценарий?
                  </h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    AI начнёт писать сразу — потом его можно править через чат
                  </p>
                </div>

                {/* Language buttons */}
                <div className="flex flex-col gap-2.5 w-full">
                  <button
                    onClick={() => startScript("ru")}
                    className="w-full h-13 bg-viral text-viral-foreground hover:brightness-105 rounded-xl font-bold text-[15px] shadow-glow-viral transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">🇷🇺</span> Русский язык
                  </button>
                  <button
                    onClick={() => startScript("kk")}
                    className="w-full h-13 bg-card border border-border hover:border-foreground/20 hover:bg-muted/50 text-foreground rounded-xl font-bold text-[15px] shadow-soft transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">🇰🇿</span> Қазақ тілі
                  </button>
                </div>

                {/* Feature bullets */}
                <div className="w-full grid grid-cols-3 gap-2 pt-2">
                  {[
                    { icon: Zap, label: "10–20 сек" },
                    { icon: MessageCircle, label: "AI чат" },
                    { icon: Wand2, label: "Быстрые правки" },
                  ].map((f) => (
                    <div key={f.label} className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-card border border-border/50">
                      <div className="w-7 h-7 rounded-lg bg-viral/10 flex items-center justify-center">
                        <f.icon className="h-3.5 w-3.5 text-foreground" />
                      </div>
                      <span className="text-[10.5px] font-semibold text-foreground/80 text-center leading-tight">
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
