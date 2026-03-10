import { useRef } from "react";
import { MemoVideoCard } from "@/components/VideoCard";
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
  

  // Auto-scroll hint removed — was causing unwanted card shifting on mobile

  if (videos.length === 0) return null;

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div
        className="flex items-center justify-between sticky z-20 -mx-4 px-4 py-2.5"
        style={{
          top: "0px",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)",
          background: "rgba(10,10,10,0.55)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <h2 className={`text-[15px] font-extrabold tracking-tight ${darkMode ? "text-white" : "text-foreground"}`}>
          {group.label} {group.emoji}
        </h2>
        <button
          onClick={() => onViewAll(group.key)}
          className="flex items-center gap-0.5 text-[13px] font-bold text-neon hover:text-neon/80 transition-colors active:scale-95"
        >
          Все
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {videos.slice(0, 6).map((video) => (
          <div
            key={video.id}
            className="shrink-0"
            style={{ width: "40vw", maxWidth: "200px" }}
          >
            <MemoVideoCard
              video={video}
              playingId={playingId}
              onPlay={onPlay}
              isFavorite={userFavorites.includes(video.id)}
              onToggleFav={onToggleFav}
              onAnalyze={onAnalyze}
              showTier={true}
              showAuthor={false}
              showAnalyzeButton={true}
              darkMode={darkMode}
              isMobileOverride={true}
              enableCoverRefresh={true}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
