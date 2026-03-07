import { useState, useEffect } from "react";
import logoIcon from "@/assets/logo-icon-cropped.png";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("visible"), 50);
    const t2 = setTimeout(() => setPhase("exit"), 1600);
    const t3 = setTimeout(onComplete, 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-background"
      style={{
        opacity: phase === "exit" ? 0 : 1,
        transition: "opacity 500ms ease-out",
      }}
    >
      {/* Logo icon */}
      <div
        className="mb-6"
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transform: phase === "enter" ? "scale(0.8)" : "scale(1)",
          transition: "opacity 600ms ease-out, transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <img src={logoIcon} alt="trendme" className="h-20 w-20 rounded-2xl shadow-lg" />
      </div>

      {/* Brand name */}
      <div
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transform: phase === "enter" ? "translateY(12px)" : "translateY(0)",
          transition: "opacity 500ms ease-out 200ms, transform 500ms ease-out 200ms",
        }}
      >
        <h1 className="text-2xl font-bold text-foreground tracking-tight">trendme</h1>
        <p className="text-xs text-muted-foreground text-center mt-1">TikTok Official Partner</p>
      </div>

      {/* Loading dot */}
      <div
        className="mt-8"
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transition: "opacity 400ms ease-out 400ms",
        }}
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary"
              style={{
                animation: "pulse 1.2s ease-in-out infinite",
                animationDelay: `${i * 200}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
