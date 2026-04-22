import { useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { MemoVideoCard } from "@/components/VideoCard";
import { ChevronRight, Lock } from "lucide-react";
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
  isFreePlan?: boolean;
  /** Сколько видео доступно бесплатно (остальные блюрятся, демо-режим) */
  freeVisibleCount?: number;
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
  isFreePlan = false,
  freeVisibleCount = 3,
}: TrendNicheRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  if (videos.length === 0) return null;

  const visibleVideos = videos.slice(0, 6);

  return (
    <section className="space-y-2">
      <div
        className="sticky z-20 -mx-4 px-4 py-2.5 glass border-b border-border/60"
        style={{ top: "0px" }}
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
        {visibleVideos.map((video, idx) => {
          const isLocked = isFreePlan && idx >= freeVisibleCount;
          return (
            <div
              key={video.id}
              className="relative shrink-0 w-[42vw] max-w-[180px] sm:w-[200px] sm:max-w-[200px] lg:w-[220px] lg:max-w-[220px]"
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
                  showAuthor={false}
                  showAnalyzeButton={!isLocked}
                  showScriptButton={!isLocked && !!onScript}
                />
              </div>

              {isLocked && (
                <div
                  className="absolute inset-0 z-10 rounded-2xl overflow-hidden"
                  aria-label="Доступно на платном тарифе"
                >
                  {/* Лёгкий blur — видео сквозь плашку слегка просвечивает */}
                  <div className="absolute inset-0 backdrop-blur-[3px] bg-foreground/25" />

                  {/* Контент по центру */}
                  <div className="relative z-10 h-full w-full flex items-center justify-center p-2.5">
                    <div className="w-full flex flex-col items-center gap-2 px-2.5 py-3 rounded-xl bg-foreground/92 backdrop-blur-sm border border-viral/40 shadow-glow-viral">
                      <div className="h-9 w-9 rounded-full bg-viral flex items-center justify-center shadow-md">
                        <Lock className="h-4 w-4 text-foreground" strokeWidth={2.5} />
                      </div>
                      <div className="text-center">
                        <p className="text-[11.5px] font-extrabold text-background leading-tight">
                          Только на платном тарифе
                        </p>
                        <p className="text-[9.5px] text-background/70 leading-tight mt-0.5">
                          Откройте доступ ко всем трендам
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate("/subscription"); }}
                        className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-viral text-foreground text-[11px] font-bold hover:opacity-90 active:scale-95 transition-all"
                      >
                        Открыть
                        <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export const TrendNicheRow = memo(TrendNicheRowImpl);
