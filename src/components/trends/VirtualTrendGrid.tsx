import { useRef, useEffect, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { MemoVideoCard } from "@/components/VideoCard";
import { LockedVideoOverlay } from "./LockedVideoOverlay";
import { cn } from "@/lib/utils";

interface VirtualTrendGridProps {
  videos: any[];
  playingId: string | null;
  onPlay: (id: string | null) => void;
  userFavorites: string[];
  onToggleFav: (id: string) => void;
  onAnalyze: (v: any) => void;
  onScript?: (v: any) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  darkMode?: boolean;
  isFreePlan?: boolean;
  /** Сколько видео доступно бесплатно (остальные блюрятся) */
  freeVisibleCount?: number;
}

export const VirtualTrendGrid = forwardRef<HTMLDivElement, VirtualTrendGridProps>(function VirtualTrendGrid({
  videos,
  playingId,
  onPlay,
  userFavorites,
  onToggleFav,
  onAnalyze,
  onScript,
  hasMore,
  onLoadMore,
  isFreePlan = false,
  freeVisibleCount = 3,
}, ref) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMore();
      },
      { threshold: 0.1 }
    );
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, onLoadMore]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 md:gap-4">
        {videos.map((video: any, idx: number) => {
          const isLocked = isFreePlan && idx >= freeVisibleCount;
          return (
            <div
              key={video.id}
              className={cn(
                "relative",
                isLocked && "group/lock cursor-pointer rounded-2xl transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-glow-viral"
              )}
              onClick={isLocked ? () => navigate("/subscription") : undefined}
            >
              <div className={isLocked ? "pointer-events-none select-none" : ""}>
                <MemoVideoCard
                  video={video}
                  playingId={playingId}
                  onPlay={onPlay}
                  isFavorite={userFavorites.includes(video.id)}
                  onToggleFav={onToggleFav}
                  onAnalyze={onAnalyze}
                  onScript={onScript}
                  showTier={true}
                  showAuthor={true}
                  showAnalyzeButton={!isLocked}
                  showScriptButton={!isLocked && !!onScript}
                />
              </div>
              {isLocked && <LockedVideoOverlay />}
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div ref={loaderRef} className="flex justify-center py-8">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </>
  );
});
