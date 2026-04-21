import { useRef, useEffect, forwardRef } from "react";
import { MemoVideoCard } from "@/components/VideoCard";

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
}, ref) {
  const loaderRef = useRef<HTMLDivElement>(null);

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
        {videos.map((video: any) => (
          <MemoVideoCard
            key={video.id}
            video={video}
            playingId={playingId}
            onPlay={onPlay}
            isFavorite={userFavorites.includes(video.id)}
            onToggleFav={onToggleFav}
            onAnalyze={onAnalyze}
            onScript={onScript}
            showTier={true}
            showAuthor={true}
            showScriptButton={!!onScript}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={loaderRef} className="flex justify-center py-8">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </>
  );
});
