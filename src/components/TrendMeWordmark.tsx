import { cn } from "@/lib/utils";

interface TrendMeWordmarkProps {
  className?: string;
  /** Show small accent dot before the wordmark (landing-style) */
  withDot?: boolean;
  /** "sm" 14px • "md" 16px • "lg" 20px • "xl" 24px */
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_MAP = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
};

export function TrendMeWordmark({
  className = "",
  withDot = true,
  size = "md",
}: TrendMeWordmarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 select-none", className)}>
      {withDot && (
        <span
          className="inline-block rounded-full"
          style={{
            width: 8,
            height: 8,
            background: "var(--gradient-brand)",
            boxShadow: "0 0 0 3px hsl(var(--primary) / 0.12)",
          }}
        />
      )}
      <span
        className={cn(
          "font-bold tracking-tight text-foreground",
          SIZE_MAP[size]
        )}
        style={{ letterSpacing: "-0.035em" }}
      >
        trend<span className="gradient-text">me</span>
      </span>
    </span>
  );
}
