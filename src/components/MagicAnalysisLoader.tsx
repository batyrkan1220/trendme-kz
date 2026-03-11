import { useEffect, useRef } from "react";
import { Sparkles, Wand2, Star } from "lucide-react";
import { hapticLight, hapticMedium, hapticSuccess } from "@/lib/haptics";

interface Props {
  /** When analysis completes, fire success haptic */
  isComplete?: boolean;
}

export function MagicAnalysisLoader({ isComplete }: Props) {
  const hapticInterval = useRef<ReturnType<typeof setInterval>>();
  const hasFireSuccess = useRef(false);

  useEffect(() => {
    // Initial medium haptic on mount
    hapticMedium();

    // Periodic light haptics to simulate "magic working"
    hapticInterval.current = setInterval(() => {
      hapticLight();
    }, 1800);

    return () => {
      if (hapticInterval.current) clearInterval(hapticInterval.current);
    };
  }, []);

  useEffect(() => {
    if (isComplete && !hasFireSuccess.current) {
      hasFireSuccess.current = true;
      hapticSuccess();
    }
  }, [isComplete]);

  const particles = Array.from({ length: 12 }, (_, i) => i);
  const orbits = Array.from({ length: 3 }, (_, i) => i);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      {/* Central magic orb with particles */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Glow rings */}
        {orbits.map((i) => (
          <div
            key={`orbit-${i}`}
            className="absolute rounded-full border border-primary/20"
            style={{
              width: `${80 + i * 32}px`,
              height: `${80 + i * 32}px`,
              animation: `magic-orbit ${3 + i * 1.5}s linear infinite${i % 2 ? " reverse" : ""}`,
              opacity: 0.3 - i * 0.08,
            }}
          />
        ))}

        {/* Floating particles */}
        {particles.map((i) => (
          <div
            key={`p-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary"
            style={{
              animation: `magic-particle ${2 + (i % 4) * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.25}s`,
              top: "50%",
              left: "50%",
              transform: `rotate(${i * 30}deg) translateY(-${28 + (i % 3) * 12}px)`,
              opacity: 0.4 + (i % 5) * 0.12,
              boxShadow: "0 0 6px hsl(var(--primary) / 0.6)",
            }}
          />
        ))}

        {/* Central orb */}
        <div
          className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(82 90% 45%))",
            animation: "magic-pulse 2s ease-in-out infinite",
            boxShadow: "0 0 40px hsl(var(--primary) / 0.4), 0 0 80px hsl(var(--primary) / 0.15), inset 0 0 20px hsl(82 90% 60% / 0.3)",
          }}
        >
          <Wand2
            className="h-9 w-9 text-primary-foreground"
            style={{ animation: "magic-wand 3s ease-in-out infinite" }}
          />
        </div>

        {/* Sparkle accents around the orb */}
        {[0, 1, 2, 3].map((i) => (
          <Star
            key={`star-${i}`}
            className="absolute h-3 w-3 text-primary"
            fill="currentColor"
            style={{
              animation: `magic-star ${1.5 + i * 0.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.6}s`,
              top: `${20 + Math.sin(i * 1.57) * 40}%`,
              left: `${20 + Math.cos(i * 1.57) * 40}%`,
            }}
          />
        ))}
      </div>

      {/* Animated text */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <Sparkles
            className="h-4 w-4 text-primary"
            style={{ animation: "magic-star 1.2s ease-in-out infinite" }}
          />
          <p
            className="text-sm font-semibold text-foreground"
            style={{ animation: "magic-text-glow 2s ease-in-out infinite" }}
          >
            Магия анализа...
          </p>
          <Sparkles
            className="h-4 w-4 text-primary"
            style={{ animation: "magic-star 1.2s ease-in-out infinite 0.6s" }}
          />
        </div>
        <p className="text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: "0.5s" }}>
          Транскрибация · AI анализ · Аударма
        </p>

        {/* Progress dots */}
        <div className="flex gap-2 mt-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary/40"
              style={{
                animation: "magic-dot 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
