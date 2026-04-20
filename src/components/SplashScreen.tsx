import { useState, useEffect } from "react";
import { Search, BarChart3, Sparkles } from "lucide-react";
import { TrendMeWordmark } from "@/components/TrendMeWordmark";

const STEPS = [
  { icon: Search,     text: "Найдите вирусный тренд",   num: "01" },
  { icon: BarChart3,  text: "Проанализируйте видео",    num: "02" },
  { icon: Sparkles,   text: "Создайте сценарий",        num: "03" },
];

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 50),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 4600),
      setTimeout(onComplete, 5300),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center overflow-hidden bg-background"
      style={{
        opacity: phase === 4 ? 0 : 1,
        transform: phase === 4 ? "scale(1.02)" : "scale(1)",
        filter: phase === 4 ? "blur(6px)" : "blur(0px)",
        transition: phase === 4
          ? "opacity 600ms cubic-bezier(0.4, 0, 1, 1), transform 600ms cubic-bezier(0.4, 0, 1, 1), filter 400ms ease-out"
          : "none",
      }}
    >
      {/* Mesh gradient backdrop */}
      <div className="absolute inset-0 gradient-mesh opacity-90 pointer-events-none" />

      {/* Floating indigo blobs */}
      <div
        className="absolute pointer-events-none rounded-full blur-3xl"
        style={{
          width: 420, height: 420,
          background: "hsl(243 85% 70% / 0.25)",
          top: "-12%", right: "-15%",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 2 ? "scale(1)" : "scale(0.6)",
          transition: "all 1.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      <div
        className="absolute pointer-events-none rounded-full blur-3xl"
        style={{
          width: 320, height: 320,
          background: "hsl(75 95% 65% / 0.22)",
          bottom: "-10%", left: "-12%",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 2 ? "scale(1)" : "scale(0.6)",
          transition: "all 1.8s cubic-bezier(0.16, 1, 0.3, 1) 200ms",
        }}
      />

      {/* Subtle dot grid */}
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />

      {/* Main brand block */}
      <div className="relative flex flex-col items-center z-10 px-6">
        {/* Glow ring */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: 220, height: 220, top: -30,
            background: "radial-gradient(circle, hsl(var(--primary) / 0.18) 0%, transparent 70%)",
            opacity: phase >= 2 ? 1 : 0,
            transition: "opacity 1s ease-out 200ms",
            animation: phase >= 2 ? "splash-glow-pulse 3s ease-in-out infinite" : "none",
          }}
        />

        {/* Logo tile (indigo gradient) */}
        <div
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0) scale(1)" : "translateY(40px) scale(0.4)",
            transition: "all 900ms cubic-bezier(0.16, 1, 0.3, 1) 100ms",
          }}
        >
          <div
            className="relative flex items-center justify-center shadow-glow-primary"
            style={{
              width: 96, height: 96, borderRadius: 28,
              background: "var(--gradient-brand)",
              boxShadow:
                "0 24px 60px -12px hsl(var(--primary) / 0.55), 0 8px 20px -8px hsl(var(--primary) / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.2)",
            }}
          >
            <div
              className="absolute inset-0 rounded-[28px] pointer-events-none"
              style={{ background: "radial-gradient(circle at 30% 25%, hsl(0 0% 100% / 0.28), transparent 60%)" }}
            />
            <svg
              width="46" height="46" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 2px 6px hsl(0 0% 0% / 0.2))", position: "relative" }}
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
        </div>

        {/* Wordmark */}
        <div
          className="mt-7"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0)" : "translateY(20px)",
            transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1) 500ms",
          }}
        >
          <span
            className="text-[34px] font-bold tracking-tight text-foreground"
            style={{ letterSpacing: "-0.04em" }}
          >
            trend<span className="gradient-text">me</span>
          </span>
        </div>

        {/* Tagline */}
        <div
          className="mt-2"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0)" : "translateY(12px)",
            transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1) 800ms",
          }}
        >
          <span className="text-[14px] font-medium text-muted-foreground">
            Ловите тренды первыми
          </span>
        </div>

        {/* Viral badge */}
        <div
          className="mt-5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full"
          style={{
            background: "hsl(var(--viral-soft))",
            border: "1px solid hsl(var(--viral) / 0.4)",
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0) scale(1)" : "translateY(16px) scale(0.85)",
            transition: "all 700ms cubic-bezier(0.16, 1, 0.3, 1) 1000ms",
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-viral animate-viral-pulse"
          />
          <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-foreground/70">
            TikTok Trend Engine
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="mt-14 flex flex-col gap-2.5 w-72 z-10">
        {STEPS.map((step, i) => {
          const visible = phase >= 3;
          const Icon = step.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl glass-strong"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0) scale(1)" : "translateX(-24px) scale(0.92)",
                transition: `all 700ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 180}ms`,
                boxShadow: visible
                  ? "0 4px 16px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)"
                  : "none",
              }}
            >
              <div
                className="flex items-center justify-center shrink-0 rounded-xl bg-primary-soft"
                style={{
                  width: 40, height: 40,
                  border: "1px solid hsl(var(--primary) / 0.15)",
                }}
              >
                <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
                  Шаг {step.num}
                </span>
                <span className="text-[14px] font-semibold leading-tight text-foreground">
                  {step.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="absolute bottom-20 flex flex-col items-center gap-3 z-10">
        <div
          className="w-48 h-[3px] rounded-full overflow-hidden bg-muted"
          style={{
            opacity: phase >= 3 && phase < 4 ? 1 : 0,
            transition: "opacity 400ms ease-out",
          }}
        >
          <div
            className="h-full rounded-full gradient-brand"
            style={{
              animation: phase >= 3 ? "splash-progress 2.5s ease-in-out forwards" : "none",
              width: "0%",
              boxShadow: "0 0 10px hsl(var(--primary) / 0.5)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
