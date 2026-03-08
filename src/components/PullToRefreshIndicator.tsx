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
      className="fixed left-0 right-0 flex items-center justify-center pointer-events-none"
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 12px)",
        zIndex: 100,
        opacity: Math.max(progress, isRefreshing ? 1 : 0),
        transition: "opacity 0.2s",
      }}
    >
      <div
        className={`flex items-center justify-center h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm ${isRefreshing ? "animate-spin" : ""}`}
        style={{
          transform: isRefreshing ? undefined : `rotate(${progress * 360}deg) scale(${Math.min(progress, 1)})`,
          transition: isRefreshing ? undefined : "transform 0.1s",
        }}
      >
        <RefreshCw className="h-4 w-4 text-primary" />
      </div>
    </div>
  );
}
