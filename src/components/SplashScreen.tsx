import { useState, useEffect } from "react";
import logoIcon from "@/assets/logo-icon-cropped.png";

const BRAND = "TRENDME";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("visible"), 100);
    const t2 = setTimeout(() => setPhase("exit"), 2400);
    const t3 = setTimeout(onComplete, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "#0a0a0a",
        opacity: phase === "exit" ? 0 : 1,
        transition: "opacity 600ms ease-out",
      }}
    >
      {/* Animated radial rings */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 300 + i * 120,
            height: 300 + i * 120,
            border: `1px solid hsl(var(--primary) / ${0.12 - i * 0.03})`,
            opacity: phase === "enter" ? 0 : 1,
            transform: phase === "enter" ? "scale(0.5)" : "scale(1)",
            transition: `opacity 800ms ease-out ${200 + i * 150}ms, transform 1000ms cubic-bezier(0.16, 1, 0.3, 1) ${200 + i * 150}ms`,
            animation: phase === "visible" ? `splash-ring-breathe 3s ease-in-out infinite ${i * 400}ms` : "none",
          }}
        />
      ))}

      {/* Primary glow orb */}
      <div
        className="absolute"
        style={{
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(var(--primary) / 0.18) 0%, hsl(var(--primary) / 0.04) 50%, transparent 70%)",
          opacity: phase === "enter" ? 0 : 1,
          transition: "opacity 800ms ease-out 200ms",
          animation: phase === "visible" ? "splash-glow-pulse 2.5s ease-in-out infinite" : "none",
        }}
      />

      {/* Logo with spring entrance */}
      <div
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transform: phase === "enter" ? "scale(0.3) rotate(-10deg)" : "scale(1) rotate(0deg)",
          transition: "opacity 500ms ease-out 150ms, transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 150ms",
          filter: phase === "visible"
            ? "drop-shadow(0 0 32px hsl(var(--primary) / 0.6)) drop-shadow(0 0 64px hsl(var(--primary) / 0.2))"
            : "none",
        }}
      >
        <img
          src={logoIcon}
          alt="trendme"
          className="h-24 w-24 rounded-3xl"
          style={{
            border: "2px solid hsl(var(--primary) / 0.3)",
          }}
        />
      </div>

      {/* Brand name — staggered letter reveal with neon glow */}
      <div className="mt-7 flex gap-[2px]">
        {BRAND.split("").map((char, i) => (
          <span
            key={i}
            className="text-[28px] font-black tracking-[0.08em]"
            style={{
              color: "hsl(var(--primary))",
              textShadow:
                "0 0 12px hsl(var(--primary) / 0.7), 0 0 40px hsl(var(--primary) / 0.25), 0 0 80px hsl(var(--primary) / 0.1)",
              opacity: phase === "enter" ? 0 : 1,
              transform: phase === "enter" ? "translateY(16px) scale(0.7)" : "translateY(0) scale(1)",
              transition: `opacity 350ms ease-out ${350 + i * 50}ms, transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1) ${350 + i * 50}ms`,
            }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* Subtitle with accent line */}
      <div
        className="mt-3 flex flex-col items-center gap-2"
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transition: "opacity 500ms ease-out 900ms",
        }}
      >
        <div
          className="h-[1px] w-12"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)",
          }}
        />
        <p
          className="text-[11px] font-semibold tracking-[0.2em] uppercase"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Trend Intelligence
        </p>
      </div>

      {/* Progress bar instead of dots */}
      <div
        className="mt-10 w-32 h-[2px] rounded-full overflow-hidden"
        style={{
          background: "hsl(var(--border))",
          opacity: phase === "enter" ? 0 : phase === "exit" ? 0 : 1,
          transition: "opacity 300ms ease-out 1000ms",
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))",
            animation: phase === "visible" ? "splash-progress 2s ease-in-out forwards" : "none",
            width: "0%",
          }}
        />
      </div>
    </div>
  );
}
