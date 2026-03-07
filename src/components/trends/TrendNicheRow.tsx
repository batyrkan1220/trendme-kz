import { useRef } from "react";
import { VideoCard } from "@/components/VideoCard";
import { ChevronRight } from "lucide-react";
import { NicheGroup } from "@/config/niches";

interface TrendNicheRowProps {
  group: NicheGroup;
  videos: any[];
  userFavorites: string[];
  onToggleFav: (id: string) => void;
  onAnalyze: (v: any) => void;
  playingId: string | null;
  onPlay: (id: string | null) => void;
  onViewAll: (nicheKey: string) => void;
  darkMode?: boolean;
}

export function TrendNicheRow({
  group,
  videos,
  userFavorites,
  onToggleFav,
  onAnalyze,
  playingId,
  onPlay,
  onViewAll,
  darkMode,
}: TrendNicheRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (videos.length === 0) return null;

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-base font-bold ${darkMode ? "text-white" : "text-foreground"}`}>
          {group.label} {group.emoji}
        </h2>
        <button
          onClick={() => onViewAll(group.key)}
          className="flex items-center gap-0.5 text-sm font-semibold text-neon hover:text-neon/80 transition-colors"
        >
          Все
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {videos.slice(0, 10).map((video) => (
          <div
            key={video.id}
            className="snap-start shrink-0"
            style={{ width: "min(44vw, 200px)" }}
          >
            <VideoCard
              video={video}
              playingId={playingId}
              onPlay={onPlay}
              isFavorite={userFavorites.includes(video.id)}
              onToggleFav={onToggleFav}
              onAnalyze={onAnalyze}
              showTier={true}
              showAuthor={false}
              darkMode={darkMode}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
