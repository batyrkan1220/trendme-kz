import { useRef, useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { VideoCard } from "@/components/VideoCard";
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
}

function useColumns() {
  const getColumns = () => {
    if (typeof window === "undefined") return 2;
    const w = window.innerWidth;
    if (w >= 1280) return 5;
    if (w >= 1024) return 3;
    return 2;
  };
  const [cols, setCols] = useState(getColumns);
  useEffect(() => {
    const handler = () => setCols(getColumns());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return cols;
}

export function VirtualTrendGrid({
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
}: VirtualTrendGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const columns = useColumns();

  const rowCount = Math.ceil(videos.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount + (hasMore ? 1 : 0), // +1 for loader row
    getScrollElement: () => parentRef.current,
    estimateSize: () => 420, // estimated row height in px
    overscan: 3,
    onChange: (instance) => {
      const items = instance.getVirtualItems();
      const lastItem = items[items.length - 1];
      if (lastItem && lastItem.index >= rowCount - 2 && hasMore) {
        onLoadMore();
      }
    },
  });

  return (
    <div
      ref={parentRef}
      className="w-full overflow-y-auto flex-1"
      style={{ height: "calc(100dvh - 180px)" }}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          // Loader row
          if (virtualRow.index >= rowCount) {
            return (
              <div
                key="loader"
                className="absolute left-0 w-full flex justify-center py-8"
                style={{
                  top: `${virtualRow.start}px`,
                  height: `${virtualRow.size}px`,
                }}
              >
                <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            );
          }

          const startIdx = virtualRow.index * columns;
          const rowVideos = videos.slice(startIdx, startIdx + columns);

          return (
            <div
              key={virtualRow.index}
              className="absolute left-0 w-full grid gap-3 md:gap-4"
              style={{
                top: `${virtualRow.start}px`,
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
            >
              {rowVideos.map((video: any, colIdx: number) => {
                const globalIdx = startIdx + colIdx;
                const isLocked = globalIdx >= freeLimit && isFreePlan;

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
                  <VideoCard
                    key={video.id}
                    video={video}
                    playingId={playingId}
                    onPlay={onPlay}
                    isFavorite={userFavorites.includes(video.id)}
                    onToggleFav={onToggleFav}
                    onAnalyze={onAnalyze}
                    showTier={true}
                    showAuthor={true}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LockedCard({ video, freeLimit, onNavigate }: { video: any; freeLimit: number; onNavigate: () => void }) {
  return (
    <div
      className="group bg-card rounded-2xl border border-border/40 overflow-hidden relative flex flex-col cursor-pointer"
      onClick={onNavigate}
    >
      <div className="relative aspect-[9/14] bg-black overflow-hidden rounded-2xl m-2">
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
