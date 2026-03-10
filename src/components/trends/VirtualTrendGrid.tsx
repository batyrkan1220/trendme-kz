import { useRef, useEffect, forwardRef } from "react";
import { MemoVideoCard } from "@/components/VideoCard";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VirtualTrendGridProps {
  videos: any[];
  playingId: string | null;
  onPlay: (id: string | null) => void;
  userFavorites: string[];
  onToggleFav: (id: string) => void;
  onAnalyze: (v: any) => void;
  isFreePlan: boolean;
  freeLimit: number;
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
  isFreePlan,
  freeLimit,
  hasMore,
  onLoadMore,
  darkMode,
}, ref) {
  const navigate = useNavigate();
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
        {videos.map((video: any, i: number) => {
          const isLocked = i >= freeLimit && isFreePlan;

          if (isLocked) {
            return (
              <LockedCard
                key={video.id}
                video={video}
                freeLimit={freeLimit}
                onNavigate={() => navigate("/subscription")}
              />
            );
          }

          return (
            <MemoVideoCard
              key={video.id}
              video={video}
              playingId={playingId}
              onPlay={onPlay}
              isFavorite={userFavorites.includes(video.id)}
              onToggleFav={onToggleFav}
              onAnalyze={onAnalyze}
              showTier={true}
              showAuthor={true}
              darkMode={darkMode}
              enableCoverRefresh={true}
            />
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

function LockedCard({ video, freeLimit, onNavigate }: { video: any; freeLimit: number; onNavigate: () => void }) {
  return (
    <div
      className="group bg-card rounded-2xl border border-border/40 overflow-hidden relative flex flex-col cursor-pointer"
      onClick={onNavigate}
    >
      <div className="relative aspect-[9/16] bg-black overflow-hidden rounded-2xl m-2">
        {video.cover_url ? (
          <img
            src={video.cover_url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover blur-[5px] brightness-[0.65] scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted/60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
          <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <p className="text-white text-[13px] font-semibold leading-snug drop-shadow-md text-center">
            В демо-режиме доступны<br />только первые {freeLimit} видео
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate(); }}
            className="mt-1 px-5 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-primary/30"
          >
            Открыть доступ
          </button>
        </div>
      </div>
    </div>
  );
}
