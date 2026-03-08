import { useState, useEffect } from "react";
import { TrendingUp, Search, BarChart3, Sparkles } from "lucide-react";

const BRAND = "TRENDME";

const STEPS = [
  { icon: Search, text: "Найдите вирусный тренд" },
  { icon: BarChart3, text: "Проанализируйте видео" },
  { icon: Sparkles, text: "Создайте сценарий" },
];

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0); // 0=enter, 1=logo, 2=steps, 3=exit

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 3800),
      setTimeout(onComplete, 4400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "#0a0a0a",
        opacity: phase === 3 ? 0 : 1,
        transition: "opacity 600ms ease-out",
      }}
    >
      {/* Animated gradient background orbs */}
      <div
        className="absolute"
        style={{
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(72 100% 50% / 0.08) 0%, transparent 60%)",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "scale(1)" : "scale(0.3)",
          transition: "all 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      <div
        className="absolute"
        style={{
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(72 100% 50% / 0.12) 0%, transparent 50%)",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 1s ease-out 300ms",
          animation: phase >= 1 ? "splash-glow-pulse 3s ease-in-out infinite" : "none",
        }}
      />

      {/* Neon line — top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: "linear-gradient(90deg, transparent 10%, hsl(72 100% 50% / 0.6) 50%, transparent 90%)",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 800ms ease-out 400ms",
          animation: phase >= 1 ? "splash-line-shimmer 2s ease-in-out infinite" : "none",
        }}
      />

      {/* Rising trend icon */}
      <div
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "translateY(0) scale(1)" : "translateY(30px) scale(0.5)",
          transition: "all 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 200ms",
        }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{
            width: 88,
            height: 88,
            borderRadius: 24,
            background: "linear-gradient(135deg, hsl(72 100% 50% / 0.15), hsl(72 100% 50% / 0.05))",
            border: "1.5px solid hsl(72 100% 50% / 0.3)",
            boxShadow: "0 0 40px hsl(72 100% 50% / 0.2), inset 0 1px 0 hsl(72 100% 50% / 0.1)",
          }}
        >
          <TrendingUp
            className="h-10 w-10"
            style={{
              color: "hsl(72 100% 50%)",
              filter: "drop-shadow(0 0 12px hsl(72 100% 50% / 0.6))",
            }}
            strokeWidth={2.5}
          />
        </div>
      </div>

      {/* Brand name — staggered neon letters */}
      <div className="mt-6 flex gap-[3px]">
        {BRAND.split("").map((char, i) => (
          <span
            key={i}
            className="text-[32px] font-black tracking-[0.12em]"
            style={{
              color: "hsl(72 100% 50%)",
              textShadow:
                "0 0 16px hsl(72 100% 50% / 0.8), 0 0 48px hsl(72 100% 50% / 0.3), 0 0 96px hsl(72 100% 50% / 0.1)",
              opacity: phase >= 1 ? 1 : 0,
              transform: phase >= 1 ? "translateY(0) scale(1)" : "translateY(20px) scale(0.6)",
              transition: `all 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${400 + i * 60}ms`,
            }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* Tagline */}
      <p
        className="mt-2 text-[11px] font-semibold tracking-[0.25em] uppercase"
        style={{
          color: "hsl(0 0% 45%)",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 500ms ease-out 900ms",
        }}
      >
        Trend Intelligence
      </p>

      {/* Animated steps */}
      <div className="mt-12 flex flex-col gap-4 w-64">
        {STEPS.map((step, i) => {
          const stepVisible = phase >= 2;
          const Icon = step.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-3"
              style={{
                opacity: stepVisible ? 1 : 0,
                transform: stepVisible ? "translateX(0)" : "translateX(-30px)",
                transition: `all 500ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 300}ms`,
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: `hsl(72 100% 50% / ${0.12 + i * 0.03})`,
                  border: "1px solid hsl(72 100% 50% / 0.2)",
                }}
              >
                <Icon
                  className="h-5 w-5"
                  style={{
                    color: "hsl(72 100% 50%)",
                    filter: "drop-shadow(0 0 6px hsl(72 100% 50% / 0.5))",
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span
                  className="text-[13px] font-bold"
                  style={{ color: "hsl(0 0% 90%)" }}
                >
                  {step.text}
                </span>
                {/* Animated underline */}
                <div
                  className="h-[1.5px] mt-1 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, hsl(72 100% 50% / 0.5), transparent)",
                    width: stepVisible ? "100%" : "0%",
                    transition: `width 600ms ease-out ${i * 300 + 400}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom progress bar */}
      <div
        className="absolute bottom-16 w-40 h-[2px] rounded-full overflow-hidden"
        style={{
          background: "hsl(0 0% 16%)",
          opacity: phase >= 2 && phase < 3 ? 1 : 0,
          transition: "opacity 300ms ease-out",
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, hsl(72 100% 50%), hsl(72 100% 50% / 0.5))",
            animation: phase >= 2 ? "splash-progress 2.5s ease-in-out forwards" : "none",
            width: "0%",
            boxShadow: "0 0 8px hsl(72 100% 50% / 0.6)",
          }}
        />
      </div>
    </div>
  );
}
