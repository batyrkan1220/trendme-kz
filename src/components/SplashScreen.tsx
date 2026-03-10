import { useState, useEffect } from "react";
import { Search, BarChart3, Sparkles } from "lucide-react";

const BRAND = "TRENDME";

const STEPS = [
  { icon: Search, text: "Найдите вирусный тренд", num: "01" },
  { icon: BarChart3, text: "Проанализируйте видео", num: "02" },
  { icon: Sparkles, text: "Создайте сценарий", num: "03" },
];

function TikTokLogo({ size = 18, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-2.882 2.783 2.896 2.896 0 01-2.881-2.906 2.896 2.896 0 012.881-2.906c.316 0 .62.052.905.146V9.305a6.329 6.329 0 00-.905-.066 6.34 6.34 0 00-6.34 6.34A6.34 6.34 0 009.492 22a6.34 6.34 0 006.34-6.34V9.208a8.16 8.16 0 004.757 1.533V7.327a4.812 4.812 0 01-1-.641z"
        fill="#25F4EE"
        style={{ transform: "translate(-0.5px, 0.5px)" }}
      />
      <path
        d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-2.882 2.783 2.896 2.896 0 01-2.881-2.906 2.896 2.896 0 012.881-2.906c.316 0 .62.052.905.146V9.305a6.329 6.329 0 00-.905-.066 6.34 6.34 0 00-6.34 6.34A6.34 6.34 0 009.492 22a6.34 6.34 0 006.34-6.34V9.208a8.16 8.16 0 004.757 1.533V7.327a4.812 4.812 0 01-1-.641z"
        fill="#FE2C55"
        style={{ transform: "translate(0.5px, -0.5px)" }}
      />
      <path
        d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-2.882 2.783 2.896 2.896 0 01-2.881-2.906 2.896 2.896 0 012.881-2.906c.316 0 .62.052.905.146V9.305a6.329 6.329 0 00-.905-.066 6.34 6.34 0 00-6.34 6.34A6.34 6.34 0 009.492 22a6.34 6.34 0 006.34-6.34V9.208a8.16 8.16 0 004.757 1.533V7.327a4.812 4.812 0 01-1-.641z"
        fill={dark ? "hsl(0 0% 0%)" : "hsl(0 0% 95%)"}
      />
    </svg>
  );
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 50),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => setPhase(4), 5000),
      setTimeout(onComplete, 5700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Always bright green — no dark phase
  const c = {
    text: "hsl(0 0% 0%)",
    textSub: "hsl(0 0% 0% / 0.55)",
    textMuted: "hsl(0 0% 0% / 0.35)",
    cardBg: "hsl(0 0% 0% / 0.06)",
    cardBorder: "hsl(0 0% 0% / 0.1)",
    iconBg: "hsl(0 0% 0% / 0.08)",
    iconBorder: "hsl(0 0% 0% / 0.12)",
    iconColor: "hsl(0 0% 0% / 0.85)",
    iconShadow: "0 4px 16px hsl(0 0% 0% / 0.08)",
    logoBg: "hsl(0 0% 0% / 0.08)",
    logoBorder: "2px solid hsl(0 0% 0% / 0.12)",
    logoShadow: "0 20px 60px hsl(0 0% 0% / 0.1), inset 0 1px 0 hsl(0 0% 100% / 0.15)",
    logoStroke: "hsl(0 0% 0%)",
    logoFilter: "drop-shadow(0 2px 8px hsl(0 0% 0% / 0.15))",
    badgeBg: "hsl(0 0% 0% / 0.07)",
    badgeBorder: "1px solid hsl(0 0% 0% / 0.1)",
    badgeText: "hsl(0 0% 0% / 0.6)",
    progressBg: "hsl(0 0% 0% / 0.1)",
    progressFill: "linear-gradient(90deg, hsl(0 0% 0% / 0.5), hsl(0 0% 0% / 0.2))",
    progressShadow: "0 0 8px hsl(0 0% 0% / 0.15)",
    accentLine: "linear-gradient(90deg, transparent 15%, hsl(0 0% 0% / 0.12) 50%, transparent 85%)",
    ringGlow: "radial-gradient(circle, hsl(0 0% 0% / 0.08) 0%, transparent 70%)",
    circleBorder: "2px solid hsl(0 0% 0% / 0.08)",
    circleBorder2: "1.5px solid hsl(0 0% 0% / 0.06)",
    textureDot1: "hsl(72 100% 70% / 0.3)",
    textureDot2: "hsl(82 90% 40% / 0.2)",
  };

  return (
    <div
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: isGreenPhase ? "hsl(72 100% 50%)" : "#050505",
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
          backgroundImage: `radial-gradient(circle at 30% 20%, ${c.textureDot1} 0%, transparent 50%), radial-gradient(circle at 70% 80%, ${c.textureDot2} 0%, transparent 50%)`,
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

      {/* Geometric accent circles */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 300, height: 300, borderRadius: "50%",
          border: c.circleBorder,
          top: "10%", right: "-15%",
          opacity: phase >= 2 ? 0.6 : 0,
          transform: phase >= 2 ? "scale(1)" : "scale(0.5)",
          transition: "all 1.5s cubic-bezier(0.16, 1, 0.3, 1) 200ms",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 200, height: 200, borderRadius: "50%",
          border: c.circleBorder2,
          bottom: "8%", left: "-10%",
          opacity: phase >= 2 ? 0.5 : 0,
          transform: phase >= 2 ? "scale(1)" : "scale(0.5)",
          transition: "all 1.8s cubic-bezier(0.16, 1, 0.3, 1) 400ms",
        }}
      />

      {/* Main logo section */}
      <div className="relative flex flex-col items-center z-10">
        {/* Glowing ring */}
        <div
          style={{
            position: "absolute", width: 160, height: 160, top: -30, borderRadius: "50%",
            background: c.ringGlow,
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
              width: 96, height: 96, borderRadius: 28,
              background: isGreenPhase ? c.logoBg : c.logoBg,
              border: c.logoBorder,
              boxShadow: c.logoShadow,
              transition: "all 600ms ease-out",
            }}
          >
            <div
              className="absolute inset-0 rounded-[28px]"
              style={{ background: "radial-gradient(circle at 30% 30%, hsl(0 0% 100% / 0.12), transparent 60%)" }}
            />
            <svg
              width="44" height="44" viewBox="0 0 24 24" fill="none"
              stroke={c.logoStroke}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: c.logoFilter, position: "relative", transition: "all 600ms ease-out" }}
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
                color: c.text,
                textShadow: isGreenPhase
                  ? "0 1px 2px hsl(0 0% 100% / 0.15)"
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
            style={{ color: c.textSub }}
          >
            Ловите тренды первыми
          </span>
        </div>

        {/* TikTok badge */}
        <div
          className="mt-5 flex items-center gap-2 px-5 py-2 rounded-full"
          style={{
            background: c.badgeBg,
            border: c.badgeBorder,
            backdropFilter: "blur(12px)",
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0) scale(1)" : "translateY(20px) scale(0.8)",
            transition: "all 700ms cubic-bezier(0.16, 1, 0.3, 1) 1100ms",
          }}
        >
          <TikTokLogo size={14} dark={isGreenPhase} />
          <span
            className="text-[11px] font-bold tracking-[0.1em] uppercase"
            style={{ color: c.badgeText }}
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
                background: visible ? c.cardBg : "transparent",
                border: `1px solid ${visible ? c.cardBorder : "transparent"}`,
                backdropFilter: visible ? "blur(8px)" : "none",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0) scale(1)" : "translateX(-30px) scale(0.9)",
                transition: `all 700ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 200}ms`,
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: isGreenPhase ? (c.iconBg as string) : c.iconBg,
                  border: `1px solid ${c.iconBorder}`,
                  boxShadow: visible ? c.iconShadow : "none",
                  transition: "box-shadow 800ms ease-out",
                }}
              >
                <Icon
                  className="h-[18px] w-[18px]"
                  style={{
                    color: c.iconColor,
                    filter: isGreenPhase ? "none" : "drop-shadow(0 0 8px hsl(72 100% 50% / 0.5))",
                  }}
                  strokeWidth={2}
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-[10px] font-bold tracking-[0.15em] uppercase"
                  style={{ color: c.textMuted }}
                >
                  Шаг {step.num}
                </span>
                <span
                  className="text-[14px] font-semibold leading-tight"
                  style={{ color: c.text }}
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
            background: c.progressBg,
            opacity: phase >= 3 && phase < 4 ? 1 : 0,
            transition: "opacity 400ms ease-out",
          }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: c.progressFill,
              animation: phase >= 3 ? "splash-progress 2.5s ease-in-out forwards" : "none",
              width: "0%",
              boxShadow: c.progressShadow,
            }}
          />
        </div>
      </div>

      {/* Accent lines */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: c.accentLine, opacity: phase >= 1 ? 1 : 0, transition: "opacity 1s ease-out 400ms" }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: c.accentLine, opacity: phase >= 1 ? 1 : 0, transition: "opacity 1s ease-out 400ms" }}
      />
    </div>
  );
}
