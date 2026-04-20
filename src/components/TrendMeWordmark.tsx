import { cn } from "@/lib/utils";

interface TrendMeWordmarkProps {
  className?: string;
  /** Show the animated viral-lime dot (landing-style) */
  withDot?: boolean;
  /** Animate a ping pulse on the dot */
  animated?: boolean;
  /** "sm" 14px • "md" 16px • "lg" 17–20px • "xl" 24px */
  size?: "sm" | "md" | "lg" | "xl";
}

const TEXT_SIZE = {
  sm: "text-sm",
  md: "text-[15px]",
  lg: "text-[17px]",
  xl: "text-2xl",
};

const TILE_SIZE = {
  sm: "w-6 h-6 rounded-md",
  md: "w-7 h-7 rounded-md",
  lg: "w-8 h-8 rounded-lg",
  xl: "w-10 h-10 rounded-xl",
};

const DOT_SIZE = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-3.5 h-3.5",
};

const PING_SIZE = {
  sm: "w-1.5 h-1.5",
  md: "w-1.5 h-1.5",
  lg: "w-2 h-2",
  xl: "w-2.5 h-2.5",
};

export function TrendMeWordmark({
  className = "",
  withDot = true,
  animated = true,
  size = "md",
}: TrendMeWordmarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 select-none", className)}>
      {withDot && (
        <span className={cn("relative bg-foreground flex items-center justify-center", TILE_SIZE[size])}>
          <span className={cn("rounded-full bg-viral", DOT_SIZE[size])} />
          {animated && (
            <span className={cn("absolute -top-0.5 -right-0.5 rounded-full bg-viral animate-ping", PING_SIZE[size])} />
          )}
        </span>
      )}
      <span
        className={cn("font-bold tracking-tight text-foreground", TEXT_SIZE[size])}
        style={{ letterSpacing: "-0.025em" }}
      >
        trendme
      </span>
    </span>
  );
}
