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
              className={cn(
                "relative shrink-0 w-[42vw] max-w-[180px] sm:w-[200px] sm:max-w-[200px] lg:w-[220px] lg:max-w-[220px]",
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
                  showAuthor={false}
                  showAnalyzeButton={!isLocked}
                  showScriptButton={!isLocked && !!onScript}
                />
              </div>

              {isLocked && (
                <div
                  className="absolute inset-0 z-10 rounded-2xl overflow-hidden ring-1 ring-transparent transition-all duration-300 ease-out group-hover/lock:ring-viral/70"
                  aria-label="Доступно на платном тарифе"
                >
                  {/* Очень лёгкий blur — на hover ещё немного спадает */}
                  <div className="absolute inset-0 backdrop-blur-[1.5px] bg-foreground/10 transition-all duration-300 ease-out group-hover/lock:backdrop-blur-[0.5px] group-hover/lock:bg-foreground/5" />
                  {/* Тонкий градиент снизу для контраста плашки */}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
                  {/* Viral glow при hover */}
                  <div className="absolute inset-0 opacity-0 group-hover/lock:opacity-100 transition-opacity duration-300 bg-gradient-to-tr from-viral/15 via-transparent to-viral/10" />

                  {/* Контент по центру — мягкое масштабирование */}
                  <div className="relative z-10 h-full w-full flex items-center justify-center p-2.5">
                    <div className="w-full flex flex-col items-center gap-2 px-2.5 py-3 rounded-xl bg-foreground/85 backdrop-blur-md border border-viral/40 shadow-glow-viral transition-all duration-300 ease-out group-hover/lock:scale-[1.04] group-hover/lock:border-viral/80 group-hover/lock:bg-foreground/90">
                      <div className="h-9 w-9 rounded-full bg-viral flex items-center justify-center shadow-md transition-transform duration-300 ease-out group-hover/lock:scale-110 group-hover/lock:rotate-[-6deg]">
                        <Lock className="h-4 w-4 text-foreground" strokeWidth={2.5} />
                      </div>
                      <div className="text-center">
                        <p className="text-[11.5px] font-extrabold text-background leading-tight drop-shadow-sm">
                          Только на платном тарифе
                        </p>
                        <p className="text-[9.5px] text-background/75 leading-tight mt-0.5">
                          Откройте доступ ко всем трендам
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate("/subscription"); }}
                        className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-viral text-foreground text-[11px] font-bold transition-all duration-200 hover:opacity-90 active:scale-95 group-hover/lock:shadow-glow-viral"
                      >
                        Открыть
                        <ChevronRight className="h-3 w-3 transition-transform duration-300 group-hover/lock:translate-x-0.5" strokeWidth={2.5} />
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
