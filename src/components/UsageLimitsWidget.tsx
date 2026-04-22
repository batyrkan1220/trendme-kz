import { Video, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

interface Props {
  showUpgradeLink?: boolean;
  className?: string;
}

export function UsageLimitsWidget({ showUpgradeLink = true, className = "" }: Props) {
  const { limits, getRemaining, isFreeTrial, hasActiveSubscription, isLoading } = useSubscription();

  if (!hasActiveSubscription || !isFreeTrial || !limits || isLoading) return null;

  const items = [
    { key: "video_analysis" as const, label: "Видео анализ", limit: limits.video_analysis ?? null, icon: Video, iconBg: "bg-purple-500" },
    { key: "ai_script" as const, label: "AI Сценарий", limit: limits.ai_script ?? null, icon: Sparkles, iconBg: "bg-amber-500" },
  ].filter(i => i.limit != null);

  if (items.length === 0) return null;

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
      <div className="grid grid-cols-2 gap-2.5 md:gap-3">
        {items.map(item => {
          const remaining = getRemaining(item.key);
          const total = item.limit!;
          const pct = total > 0 ? ((remaining ?? 0) / total) * 100 : 0;
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
                <span className={`text-sm md:text-base font-bold ${remaining === 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {remaining}
                  <span className="text-[10px] md:text-xs font-normal text-muted-foreground">/{total}</span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border/60 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: pct > 0 ? "hsl(142 71% 45%)" : "hsl(var(--destructive))",
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
