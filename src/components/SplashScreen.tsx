import { useState, useEffect } from "react";
import logoIcon from "@/assets/logo-icon-cropped.png";

const BRAND = "trendme";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("visible"), 80);
    const t2 = setTimeout(() => setPhase("exit"), 2000);
    const t3 = setTimeout(onComplete, 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, hsl(72 60% 8%) 0%, #0a0a0a 70%)",
        opacity: phase === "exit" ? 0 : 1,
        transition: "opacity 600ms ease-out",
      }}
    >
      {/* Pulsing neon glow ring behind logo */}
      <div
        className="absolute"
        style={{
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(72 100% 50% / 0.15) 0%, transparent 70%)",
          animation: phase !== "enter" ? "splash-glow-pulse 2s ease-in-out infinite" : "none",
          opacity: phase === "enter" ? 0 : 1,
          transition: "opacity 600ms ease-out",
        }}
      />

      {/* Logo icon with neon glow */}
      <div
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transform: phase === "enter" ? "scale(0.6)" : "scale(1)",
          transition: "opacity 500ms ease-out 100ms, transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms",
          filter: phase === "visible" ? "drop-shadow(0 0 24px hsl(72 100% 50% / 0.5))" : "none",
        }}
      >
        <img src={logoIcon} alt="trendme" className="h-20 w-20 rounded-2xl" />
      </div>

      {/* Brand name — letter by letter reveal */}
      <div className="mt-6 flex gap-[1px]">
        {BRAND.split("").map((char, i) => (
          <span
            key={i}
            className="text-2xl font-black tracking-tight"
            style={{
              color: "hsl(72 100% 50%)",
              textShadow: "0 0 20px hsl(72 100% 50% / 0.6), 0 0 40px hsl(72 100% 50% / 0.2)",
              opacity: phase === "enter" ? 0 : 1,
              transform: phase === "enter" ? "translateY(8px)" : "translateY(0)",
              transition: `opacity 300ms ease-out ${300 + i * 60}ms, transform 300ms ease-out ${300 + i * 60}ms`,
            }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* Subtitle */}
      <p
        className="text-xs mt-2"
        style={{
          color: "hsl(0 0% 45%)",
          opacity: phase === "enter" ? 0 : 1,
          transition: "opacity 400ms ease-out 700ms",
        }}
      >
        TikTok Official Partner
      </p>

      {/* Loading dots */}
      <div
        className="mt-8 flex gap-1.5"
        style={{
          opacity: phase === "enter" ? 0 : phase === "exit" ? 0 : 1,
          transition: "opacity 300ms ease-out 800ms",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: "hsl(72 100% 50%)",
              animation: "splash-dot-bounce 1s ease-in-out infinite",
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
