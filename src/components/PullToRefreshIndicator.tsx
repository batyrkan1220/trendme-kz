import { RefreshCw } from "lucide-react";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
}

export function PullToRefreshIndicator({ pullDistance, isRefreshing, progress }: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
      style={{ height: pullDistance > 0 ? `${pullDistance}px` : isRefreshing ? "48px" : "0px" }}
    >
      <div
        className={`flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 ${isRefreshing ? "animate-spin" : ""}`}
        style={{
          transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
          opacity: Math.max(progress, isRefreshing ? 1 : 0),
          transition: isRefreshing ? undefined : "transform 0.1s",
        }}
      >
        <RefreshCw className="h-4 w-4 text-primary" />
      </div>
    </div>
  );
}
