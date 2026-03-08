import { useState, useEffect } from "react";
import { Search, BarChart3, Sparkles } from "lucide-react";

const BRAND = "TRENDME";

const STEPS = [
  { icon: Search, text: "Найдите вирусный тренд", num: "01" },
  { icon: BarChart3, text: "Проанализируйте видео", num: "02" },
  { icon: Sparkles, text: "Создайте сценарий", num: "03" },
];

/* TikTok ♪ icon as inline SVG */
function TikTokLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-2.882 2.783 2.896 2.896 0 01-2.881-2.906 2.896 2.896 0 012.881-2.906c.316 0 .62.052.905.146V9.305a6.329 6.329 0 00-.905-.066 6.34 6.34 0 00-6.34 6.34A6.34 6.34 0 009.492 22a6.34 6.34 0 006.34-6.34V9.208a8.16 8.16 0 004.757 1.533V7.327a4.812 4.812 0 01-1-.641z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0); // 0=enter, 1=logo, 2=steps, 3=exit

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 1400),
      setTimeout(() => setPhase(3), 4200),
      setTimeout(onComplete, 4900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "#050505",
        opacity: phase === 3 ? 0 : 1,
        transform: phase === 3 ? "scale(1.05)" : "scale(1)",
        transition: "opacity 700ms ease-out, transform 700ms ease-out",
      }}
    >
      {/* Premium background — layered radial gradients */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 30%, hsl(72 80% 50% / 0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 60% 70%, hsl(72 100% 50% / 0.03) 0%, transparent 50%)",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 1.5s ease-out",
        }}
      />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100% / 0.015) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.015) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 2s ease-out 300ms",
        }}
      />

      {/* Top glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: "linear-gradient(90deg, transparent 20%, hsl(72 100% 50% / 0.4) 50%, transparent 80%)",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 1s ease-out 500ms",
        }}
      />

      {/* Main logo section */}
      <div className="relative flex flex-col items-center z-10">
        {/* Glowing ring behind logo */}
        <div
          style={{
            position: "absolute",
            width: 140,
            height: 140,
            top: -26,
            borderRadius: "50%",
            background: "radial-gradient(circle, hsl(72 100% 50% / 0.12) 0%, transparent 70%)",
            opacity: phase >= 1 ? 1 : 0,
            transition: "opacity 1s ease-out 300ms",
            animation: phase >= 1 ? "splash-glow-pulse 4s ease-in-out infinite" : "none",
          }}
        />

        {/* App icon */}
        <div
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "translateY(0) scale(1)" : "translateY(40px) scale(0.3)",
            transition: "all 800ms cubic-bezier(0.16, 1, 0.3, 1) 100ms",
          }}
        >
          <div
            className="relative flex items-center justify-center"
            style={{
              width: 88,
              height: 88,
              borderRadius: 26,
              background: "linear-gradient(145deg, hsl(72 100% 50% / 0.18), hsl(72 60% 40% / 0.06))",
              border: "1px solid hsl(72 100% 50% / 0.25)",
              boxShadow:
                "0 0 60px hsl(72 100% 50% / 0.15), 0 20px 40px hsl(0 0% 0% / 0.5), inset 0 1px 0 hsl(72 100% 50% / 0.15)",
            }}
          >
            {/* Animated inner glow */}
            <div
              className="absolute inset-0 rounded-[26px]"
              style={{
                background: "radial-gradient(circle at 30% 30%, hsl(72 100% 80% / 0.12), transparent 60%)",
              }}
            />
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="hsl(72 100% 50%)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 16px hsl(72 100% 50% / 0.7))", position: "relative" }}
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
        </div>

        {/* Brand name — premium letter spacing */}
        <div className="mt-7 flex items-center gap-[2px]">
          {BRAND.split("").map((char, i) => (
            <span
              key={i}
              className="font-black"
              style={{
                fontSize: 28,
                letterSpacing: "0.18em",
                color: "hsl(0 0% 96%)",
                textShadow: "0 0 30px hsl(72 100% 50% / 0.4), 0 0 80px hsl(72 100% 50% / 0.1)",
                opacity: phase >= 1 ? 1 : 0,
                transform: phase >= 1 ? "translateY(0)" : "translateY(24px)",
                transition: `all 500ms cubic-bezier(0.16, 1, 0.3, 1) ${500 + i * 50}ms`,
              }}
            >
              {char}
            </span>
          ))}
        </div>

        {/* TikTok Official Partner badge */}
        <div
          className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{
            background: "hsl(0 0% 100% / 0.06)",
            border: "1px solid hsl(0 0% 100% / 0.1)",
            backdropFilter: "blur(8px)",
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "translateY(0) scale(1)" : "translateY(16px) scale(0.8)",
            transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1) 900ms",
          }}
        >
          <TikTokLogo size={14} />
          <span
            className="text-[11px] font-semibold tracking-[0.08em] uppercase"
            style={{ color: "hsl(0 0% 60%)" }}
          >
            TikTok Official Partner
          </span>
        </div>
      </div>

      {/* Animated steps — minimal cards */}
      <div className="mt-14 flex flex-col gap-3 w-72 z-10">
        {STEPS.map((step, i) => {
          const visible = phase >= 2;
          const Icon = step.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl"
              style={{
                background: visible ? "hsl(0 0% 100% / 0.04)" : "transparent",
                border: `1px solid ${visible ? "hsl(0 0% 100% / 0.08)" : "transparent"}`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
                transition: `all 600ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 250}ms`,
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, hsl(72 100% 50% / 0.12), hsl(72 80% 40% / 0.05))",
                  border: "1px solid hsl(72 100% 50% / 0.15)",
                  boxShadow: visible ? "0 0 20px hsl(72 100% 50% / 0.08)" : "none",
                  transition: "box-shadow 800ms ease-out",
                }}
              >
                <Icon
                  className="h-[18px] w-[18px]"
                  style={{
                    color: "hsl(72 100% 50%)",
                    filter: "drop-shadow(0 0 8px hsl(72 100% 50% / 0.5))",
                  }}
                  strokeWidth={2}
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-[10px] font-bold tracking-[0.15em] uppercase"
                  style={{ color: "hsl(72 100% 50% / 0.5)" }}
                >
                  Шаг {step.num}
                </span>
                <span
                  className="text-[13px] font-semibold leading-tight"
                  style={{ color: "hsl(0 0% 88%)" }}
                >
                  {step.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom — elegant progress */}
      <div className="absolute bottom-20 flex flex-col items-center gap-3 z-10">
        <div
          className="w-48 h-[1.5px] rounded-full overflow-hidden"
          style={{
            background: "hsl(0 0% 14%)",
            opacity: phase >= 2 && phase < 3 ? 1 : 0,
            transition: "opacity 400ms ease-out",
          }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, hsl(72 100% 50% / 0.8), hsl(72 100% 50% / 0.3))",
              animation: phase >= 2 ? "splash-progress 2.7s ease-in-out forwards" : "none",
              width: "0%",
              boxShadow: "0 0 12px hsl(72 100% 50% / 0.5)",
            }}
          />
        </div>
      </div>

      {/* Bottom branding line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{
          background: "linear-gradient(90deg, transparent 20%, hsl(72 100% 50% / 0.2) 50%, transparent 80%)",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 1s ease-out 600ms",
        }}
      />
    </div>
  );
}
