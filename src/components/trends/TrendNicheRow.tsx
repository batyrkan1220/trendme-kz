import { useRef, memo } from "react";
import { MemoVideoCard } from "@/components/VideoCard";
import { ChevronRight } from "lucide-react";
import { NicheGroup } from "@/config/niches";


interface TrendNicheRowProps {
  group: NicheGroup;
  videos: any[];
  userFavorites: string[];
  onToggleFav: (id: string) => void;
  onAnalyze: (v: any) => void;
  onScript?: (v: any) => void;
  playingId: string | null;
  onPlay: (id: string | null) => void;
  onViewAll: (nicheKey: string, subNicheKey?: string) => void;
  darkMode?: boolean;
}

function TrendNicheRowImpl({
  group,
  videos,
  userFavorites,
  onToggleFav,
  onAnalyze,
  onScript,
  playingId,
  onPlay,
  onViewAll,
}: TrendNicheRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (videos.length === 0) return null;

  return (
    <section className="space-y-2">
      <div
        className="sticky z-20 -mx-4 px-4 py-2.5"
        style={{
          top: "0px",
          background: "rgba(10,10,10,0.55)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold tracking-tight text-foreground">
            {group.label} {group.emoji}
          </h2>
          <button
            onClick={() => onViewAll(group.key)}
            className="flex items-center gap-0.5 text-[13px] font-bold text-primary hover:text-primary transition-colors active:scale-95"
          >
            Все
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {group.subNiches.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto scrollbar-hide">
            {group.subNiches.slice(0, 4).map((sub) => (
              <button
                key={sub.key}
                onClick={() => onViewAll(group.key, sub.key)}
                className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-card/70 text-muted-foreground border border-border/60 hover:bg-muted hover:text-foreground active:scale-95 transition-all"
              >
                {sub.label}
              </button>
            ))}
            {group.subNiches.length > 4 && (
              <button
                onClick={() => onViewAll(group.key)}
                className="shrink-0 text-[10px] text-muted-foreground font-medium hover:text-foreground transition-colors"
              >
                +{group.subNiches.length - 4}
              </button>
            )}
          </div>
        )}
      </div>

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
              onScript={onScript}
              showTier={true}
              showAuthor={false}
              showAnalyzeButton={true}
              showScriptButton={!!onScript}
              isMobileOverride={true}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export const TrendNicheRow = memo(TrendNicheRowImpl);
