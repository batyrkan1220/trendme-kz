import { useState, useEffect } from "react";
import { Search, BarChart3, Sparkles } from "lucide-react";

const BRAND = "TRENDME";

const STEPS = [
  { icon: Search, text: "Найдите вирусный тренд", num: "01" },
  { icon: BarChart3, text: "Проанализируйте видео", num: "02" },
  { icon: Sparkles, text: "Создайте сценарий", num: "03" },
];

function TikTokLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Cyan shadow layer */}
      <path
        d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-2.882 2.783 2.896 2.896 0 01-2.881-2.906 2.896 2.896 0 012.881-2.906c.316 0 .62.052.905.146V9.305a6.329 6.329 0 00-.905-.066 6.34 6.34 0 00-6.34 6.34A6.34 6.34 0 009.492 22a6.34 6.34 0 006.34-6.34V9.208a8.16 8.16 0 004.757 1.533V7.327a4.812 4.812 0 01-1-.641z"
        fill="#25F4EE"
        style={{ transform: "translate(-0.5px, 0.5px)" }}
      />
      {/* Red shadow layer */}
      <path
        d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-2.882 2.783 2.896 2.896 0 01-2.881-2.906 2.896 2.896 0 012.881-2.906c.316 0 .62.052.905.146V9.305a6.329 6.329 0 00-.905-.066 6.34 6.34 0 00-6.34 6.34A6.34 6.34 0 009.492 22a6.34 6.34 0 006.34-6.34V9.208a8.16 8.16 0 004.757 1.533V7.327a4.812 4.812 0 01-1-.641z"
        fill="#FE2C55"
        style={{ transform: "translate(0.5px, -0.5px)" }}
      />
      {/* Main black layer */}
      <path
        d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-2.882 2.783 2.896 2.896 0 01-2.881-2.906 2.896 2.896 0 012.881-2.906c.316 0 .62.052.905.146V9.305a6.329 6.329 0 00-.905-.066 6.34 6.34 0 00-6.34 6.34A6.34 6.34 0 009.492 22a6.34 6.34 0 006.34-6.34V9.208a8.16 8.16 0 004.757 1.533V7.327a4.812 4.812 0 01-1-.641z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0); // 0=enter, 1=bg-flood, 2=logo, 3=steps, 4=exit

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 50),    // green flood
      setTimeout(() => setPhase(2), 900),   // logo appears
      setTimeout(() => setPhase(3), 2200),  // steps
      setTimeout(() => setPhase(4), 5000),  // exit
      setTimeout(onComplete, 5700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const isGreenPhase = phase >= 1 && phase < 4;

  return (
    <div
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: isGreenPhase
          ? "hsl(72 100% 50%)"
          : phase === 4 ? "#050505" : "#050505",
        opacity: phase === 4 ? 0 : 1,
        transform: phase === 4 ? "scale(1.08)" : "scale(1)",
        transition: phase === 1
          ? "background 800ms cubic-bezier(0.16, 1, 0.3, 1)"
          : phase === 4
            ? "opacity 700ms ease-out, transform 700ms ease-out, background 500ms ease-out"
            : "background 600ms ease-out",
      }}
    >
      {/* Texture overlay on green */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, hsl(72 100% 70% / 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 80%, hsl(82 90% 40% / 0.2) 0%, transparent 50%)",
          opacity: isGreenPhase ? 1 : 0,
          transition: "opacity 1s ease-out",
        }}
      />

      {/* Noise grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
          opacity: isGreenPhase ? 0.15 : 0,
          transition: "opacity 1s ease-out",
        }}
      />

      {/* Geometric accent — floating circle */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 300,
          height: 300,
          borderRadius: "50%",
          border: isGreenPhase ? "2px solid hsl(72 100% 30% / 0.2)" : "2px solid hsl(72 100% 50% / 0.05)",
          top: "10%",
          right: "-15%",
          opacity: phase >= 2 ? 0.6 : 0,
          transform: phase >= 2 ? "scale(1)" : "scale(0.5)",
          transition: "all 1.5s cubic-bezier(0.16, 1, 0.3, 1) 200ms",
        }}
      />

      {/* Second floating circle */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 200,
          height: 200,
          borderRadius: "50%",
          border: isGreenPhase ? "1.5px solid hsl(72 100% 30% / 0.15)" : "1.5px solid hsl(72 100% 50% / 0.03)",
          bottom: "8%",
          left: "-10%",
          opacity: phase >= 2 ? 0.5 : 0,
          transform: phase >= 2 ? "scale(1)" : "scale(0.5)",
          transition: "all 1.8s cubic-bezier(0.16, 1, 0.3, 1) 400ms",
        }}
      />

      {/* Main logo section */}
      <div className="relative flex flex-col items-center z-10">
        {/* Glowing ring behind logo */}
        <div
          style={{
            position: "absolute",
            width: 160,
            height: 160,
            top: -30,
            borderRadius: "50%",
            background: isGreenPhase
              ? "radial-gradient(circle, hsl(72 100% 30% / 0.25) 0%, transparent 70%)"
              : "radial-gradient(circle, hsl(72 100% 50% / 0.12) 0%, transparent 70%)",
            opacity: phase >= 2 ? 1 : 0,
            transition: "opacity 1s ease-out 200ms",
            animation: phase >= 2 ? "splash-glow-pulse 3s ease-in-out infinite" : "none",
          }}
        />

        {/* App icon */}
        <div
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0) scale(1)" : "translateY(50px) scale(0.2)",
            transition: "all 900ms cubic-bezier(0.16, 1, 0.3, 1) 100ms",
          }}
        >
          <div
            className="relative flex items-center justify-center"
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              background: isGreenPhase
                ? "hsl(72 100% 30% / 0.2)"
                : "linear-gradient(145deg, hsl(72 100% 50% / 0.18), hsl(72 60% 40% / 0.06))",
              border: isGreenPhase
                ? "2px solid hsl(72 100% 20% / 0.3)"
                : "1px solid hsl(72 100% 50% / 0.25)",
              boxShadow: isGreenPhase
                ? "0 20px 60px hsl(72 100% 20% / 0.3), inset 0 1px 0 hsl(72 100% 80% / 0.2)"
                : "0 0 60px hsl(72 100% 50% / 0.15), 0 20px 40px hsl(0 0% 0% / 0.5)",
              transition: "all 600ms ease-out",
            }}
          >
            <div
              className="absolute inset-0 rounded-[28px]"
              style={{
                background: "radial-gradient(circle at 30% 30%, hsl(72 100% 90% / 0.15), transparent 60%)",
              }}
            />
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isGreenPhase ? "hsl(72 100% 10%)" : "hsl(72 100% 50%)"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: isGreenPhase
                  ? "drop-shadow(0 2px 8px hsl(72 100% 10% / 0.3))"
                  : "drop-shadow(0 0 16px hsl(72 100% 50% / 0.7))",
                position: "relative",
                transition: "all 600ms ease-out",
              }}
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
        </div>

        {/* Brand name */}
        <div className="mt-8 flex items-center gap-[3px]">
          {BRAND.split("").map((char, i) => (
            <span
              key={i}
              className="font-black"
              style={{
                fontSize: 32,
                letterSpacing: "0.2em",
                color: isGreenPhase ? "hsl(72 100% 8%)" : "hsl(0 0% 96%)",
                textShadow: isGreenPhase
                  ? "0 2px 4px hsl(72 100% 20% / 0.3)"
                  : "0 0 30px hsl(72 100% 50% / 0.4)",
                opacity: phase >= 2 ? 1 : 0,
                transform: phase >= 2 ? "translateY(0)" : "translateY(30px)",
                transition: `all 600ms cubic-bezier(0.16, 1, 0.3, 1) ${400 + i * 60}ms`,
              }}
            >
              {char}
            </span>
          ))}
        </div>

        {/* Tagline */}
        <div
          className="mt-3"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0)" : "translateY(16px)",
            transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1) 900ms",
          }}
        >
          <span
            className="text-[13px] font-medium tracking-[0.06em]"
            style={{ color: isGreenPhase ? "hsl(72 100% 15% / 0.7)" : "hsl(0 0% 50%)" }}
          >
            Ловите тренды первыми
          </span>
        </div>

        {/* TikTok badge */}
        <div
          className="mt-5 flex items-center gap-2 px-5 py-2 rounded-full"
          style={{
            background: isGreenPhase ? "hsl(72 100% 30% / 0.15)" : "hsl(0 0% 100% / 0.06)",
            border: isGreenPhase ? "1px solid hsl(72 100% 20% / 0.2)" : "1px solid hsl(0 0% 100% / 0.1)",
            backdropFilter: "blur(12px)",
            color: isGreenPhase ? "hsl(72 100% 5%)" : "hsl(0 0% 90%)",
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0) scale(1)" : "translateY(20px) scale(0.8)",
            transition: "all 700ms cubic-bezier(0.16, 1, 0.3, 1) 1100ms",
          }}
        >
          <TikTokLogo size={14} />
          <span
            className="text-[11px] font-bold tracking-[0.1em] uppercase"
            style={{ color: isGreenPhase ? "hsl(72 100% 5% / 0.7)" : "hsl(0 0% 60%)" }}
          >
            TikTok Official Partner
          </span>
        </div>
      </div>

      {/* Animated steps */}
      <div className="mt-16 flex flex-col gap-3 w-72 z-10">
        {STEPS.map((step, i) => {
          const visible = phase >= 3;
          const Icon = step.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl"
              style={{
                background: visible
                  ? isGreenPhase
                    ? "hsl(72 100% 30% / 0.1)"
                    : "hsl(0 0% 100% / 0.04)"
                  : "transparent",
                border: `1px solid ${visible
                  ? isGreenPhase
                    ? "hsl(72 100% 20% / 0.15)"
                    : "hsl(0 0% 100% / 0.08)"
                  : "transparent"
                }`,
                backdropFilter: visible ? "blur(8px)" : "none",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0) scale(1)" : "translateX(-30px) scale(0.9)",
                transition: `all 700ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 200}ms`,
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: isGreenPhase
                    ? "hsl(72 100% 20% / 0.12)"
                    : "linear-gradient(135deg, hsl(72 100% 50% / 0.12), hsl(72 80% 40% / 0.05))",
                  border: isGreenPhase
                    ? "1px solid hsl(72 100% 15% / 0.2)"
                    : "1px solid hsl(72 100% 50% / 0.15)",
                  boxShadow: visible
                    ? isGreenPhase
                      ? "0 4px 16px hsl(72 100% 20% / 0.15)"
                      : "0 0 20px hsl(72 100% 50% / 0.08)"
                    : "none",
                  transition: "box-shadow 800ms ease-out",
                }}
              >
                <Icon
                  className="h-[18px] w-[18px]"
                  style={{
                    color: isGreenPhase ? "hsl(72 100% 8%)" : "hsl(72 100% 50%)",
                    filter: isGreenPhase
                      ? "none"
                      : "drop-shadow(0 0 8px hsl(72 100% 50% / 0.5))",
                  }}
                  strokeWidth={2}
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-[10px] font-bold tracking-[0.15em] uppercase"
                  style={{ color: isGreenPhase ? "hsl(72 100% 10% / 0.4)" : "hsl(72 100% 50% / 0.5)" }}
                >
                  Шаг {step.num}
                </span>
                <span
                  className="text-[14px] font-semibold leading-tight"
                  style={{ color: isGreenPhase ? "hsl(72 100% 8%)" : "hsl(0 0% 88%)" }}
                >
                  {step.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom progress */}
      <div className="absolute bottom-20 flex flex-col items-center gap-3 z-10">
        <div
          className="w-52 h-[2px] rounded-full overflow-hidden"
          style={{
            background: isGreenPhase ? "hsl(72 100% 30% / 0.2)" : "hsl(0 0% 14%)",
            opacity: phase >= 3 && phase < 4 ? 1 : 0,
            transition: "opacity 400ms ease-out",
          }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: isGreenPhase
                ? "linear-gradient(90deg, hsl(72 100% 15% / 0.8), hsl(72 100% 10% / 0.4))"
                : "linear-gradient(90deg, hsl(72 100% 50% / 0.8), hsl(72 100% 50% / 0.3))",
              animation: phase >= 3 ? "splash-progress 2.5s ease-in-out forwards" : "none",
              width: "0%",
              boxShadow: isGreenPhase
                ? "0 0 8px hsl(72 100% 15% / 0.4)"
                : "0 0 12px hsl(72 100% 50% / 0.5)",
            }}
          />
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{
          background: isGreenPhase
            ? "linear-gradient(90deg, transparent 15%, hsl(72 100% 30% / 0.3) 50%, transparent 85%)"
            : "linear-gradient(90deg, transparent 20%, hsl(72 100% 50% / 0.2) 50%, transparent 80%)",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 1s ease-out 400ms",
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: isGreenPhase
            ? "linear-gradient(90deg, transparent 15%, hsl(72 100% 30% / 0.3) 50%, transparent 85%)"
            : "linear-gradient(90deg, transparent 20%, hsl(72 100% 50% / 0.4) 50%, transparent 80%)",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 1s ease-out 400ms",
        }}
      />
    </div>
  );
}
