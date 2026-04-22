import { Search, Video, Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useLocalFavorites } from "@/hooks/useLocalFavorites";

interface Props {
  showUpgradeLink?: boolean;
  className?: string;
}

export function UsageLimitsWidget({ showUpgradeLink = true, className = "" }: Props) {
  const { limits, getRemaining, isFreeTrial, hasActiveSubscription, isLoading } = useSubscription();
  const { favorites } = useLocalFavorites();

  if (!hasActiveSubscription || !isFreeTrial || !limits || isLoading) return null;

  const items = [
    { key: "search" as const, label: "Поиск", limit: limits.search ?? null, icon: Search, iconBg: "bg-blue-500" },
    { key: "video_analysis" as const, label: "Видео анализ", limit: limits.video_analysis ?? null, icon: Video, iconBg: "bg-purple-500" },
    { key: "favorites" as const, label: "Избранное", limit: null as number | null, icon: Heart, iconBg: "bg-pink-500" },
  ];

  return (
    <div className={`rounded-2xl border border-border/50 bg-card p-4 md:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="font-bold text-foreground text-sm md:text-base">Ваши лимиты</p>
          <p className="text-[11px] md:text-xs text-muted-foreground">Тариф: Демо режим</p>
        </div>
        {showUpgradeLink && (
          <Link
            to="/subscription"
            className="inline-flex items-center gap-1 text-[11px] md:text-xs font-semibold text-primary hover:underline bg-primary/10 rounded-lg px-2.5 py-1.5"
          >
            Улучшить <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="border-t border-border/40 my-3" />
      <div className="grid grid-cols-3 gap-2.5 md:gap-3">
        {items.map(item => {
          const isFav = item.key === "favorites";
          const remaining = isFav ? null : getRemaining(item.key as any);
          const total = item.limit;
          const usedFav = favorites.length;
          const pct = isFav ? 100 : (total && total > 0 ? ((remaining ?? 0) / total) * 100 : 0);
          const Icon = item.icon;
          return (
            <div key={item.key} className="rounded-xl bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <div className={`shrink-0 h-5 w-5 rounded-md ${item.iconBg} flex items-center justify-center`}>
                  <Icon className="h-3 w-3 text-white" />
                </div>
                <span className="text-[10px] md:text-xs font-medium text-muted-foreground truncate flex-1">{item.label}</span>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className={`text-sm md:text-base font-bold ${!isFav && remaining === 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {isFav ? usedFav : remaining}
                  {!isFav && total != null && (
                    <span className="text-[10px] md:text-xs font-normal text-muted-foreground">/{total}</span>
                  )}
                </span>
                {isFav && (
                  <span className="text-[10px] text-muted-foreground">∞</span>
                )}
              </div>
              <div className="h-1.5 w-full rounded-full bg-border/60 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${isFav ? 100 : pct}%`,
                    background: isFav
                      ? "hsl(330 81% 60%)"
                      : pct > 0
                      ? "hsl(142 71% 45%)"
                      : "hsl(var(--destructive))",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
