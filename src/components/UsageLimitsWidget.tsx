import { Video, Sparkles, ArrowRight, Sparkle, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsFreePlan } from "@/hooks/useIsFreePlan";
import { useFreeCredits } from "@/hooks/useFreeCredits";
import { useSubscription } from "@/hooks/useSubscription";

interface Props {
  showUpgradeLink?: boolean;
  className?: string;
}

/**
 * Виджет лимитов в Демо тарифе.
 *
 * Источники истины (оба применяются параллельно в системе):
 *  1) profiles.free_*_left — атомарно списывается через RPC consume_free_credit
 *  2) plans.usage_limits + activity_log — учитывается в useSubscription.checkAndLog
 *
 * Чтобы счётчики НЕ расходились с реальной блокировкой, для каждой
 * операции берём МИНИМАЛЬНОЕ оставшееся значение из обоих источников.
 * Именно это число — сколько раз пользователь реально ещё сможет нажать кнопку.
 */
export function UsageLimitsWidget({ showUpgradeLink = true, className = "" }: Props) {
  const { isFreePlan, isLoading: isPlanLoading } = useIsFreePlan();
  const { analysesLeft: freeAnalysesLeft, scriptsLeft: freeScriptsLeft, isLoading: isCreditsLoading } = useFreeCredits();
  const { limits, getRemaining, isLoading: isSubLoading } = useSubscription();

  if (isPlanLoading || isCreditsLoading || isSubLoading || !isFreePlan) return null;

  // Лимиты из плана (источник 2). Если поле undefined — безлимит по этому источнику.
  const planAnalysisLimit = limits?.video_analysis;
  const planScriptLimit = limits?.ai_script;
  const subAnalysisLeft = getRemaining("video_analysis"); // null = unlimited
  const subScriptLeft = getRemaining("ai_script");

  // Берём минимум из двух источников — это реальный потолок
  const analysisRemaining = subAnalysisLeft === null
    ? freeAnalysesLeft
    : Math.min(freeAnalysesLeft, subAnalysisLeft);
  const scriptRemaining = subScriptLeft === null
    ? freeScriptsLeft
    : Math.min(freeScriptsLeft, subScriptLeft);

  // Тотал — тоже минимум из двух источников (или 3 — дефолт free credits)
  const analysisTotal = planAnalysisLimit !== undefined
    ? Math.min(3, planAnalysisLimit)
    : 3;
  const scriptTotal = planScriptLimit !== undefined
    ? Math.min(3, planScriptLimit)
    : 3;

  const items = [
    { key: "analysis", label: "Видео анализ", remaining: analysisRemaining, total: analysisTotal, icon: Video, gradient: "from-purple-500 to-fuchsia-500" },
    { key: "script", label: "AI Сценарий", remaining: scriptRemaining, total: scriptTotal, icon: Sparkles, gradient: "from-amber-500 to-orange-500" },
  ];

  const totalLeft = Math.max(0, analysisRemaining) + Math.max(0, scriptRemaining);
  const isExhausted = totalLeft === 0;
  const isLow = !isExhausted && totalLeft <= 2;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border/50 bg-card p-4 md:p-6 ${className}`}>
      {/* Decorative gradient blob */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br from-primary/20 to-fuchsia-500/10 blur-3xl" />

      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center shadow-sm">
            <Sparkle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm md:text-base leading-tight">Ваш тариф: Демо</p>
            <p className="text-[11px] md:text-xs text-muted-foreground leading-tight">Лимитированный доступ</p>
          </div>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-2.5 md:gap-3 mb-3">
        {items.map(item => {
          const remaining = Math.max(0, item.remaining);
          const total = item.total;
          const pct = total > 0 ? (remaining / total) * 100 : 0;
          const Icon = item.icon;
          const isEmpty = remaining === 0;
          return (
            <div key={item.key} className="rounded-xl bg-muted/40 border border-border/30 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <div className={`shrink-0 h-5 w-5 rounded-md bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                  <Icon className="h-3 w-3 text-white" />
                </div>
                <span className="text-[10px] md:text-xs font-medium text-muted-foreground truncate flex-1">{item.label}</span>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className={`text-sm md:text-base font-bold ${isEmpty ? 'text-destructive' : 'text-foreground'}`}>
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

      {/* CTA */}
      {showUpgradeLink && (
        <Link
          to="/subscription"
          className="relative group flex items-center gap-3 rounded-xl p-3 bg-gradient-to-r from-primary/10 via-fuchsia-500/10 to-amber-500/10 border border-primary/20 hover:border-primary/40 transition-all duration-200 active:scale-[0.99]"
        >
          <div className="shrink-0 h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center shadow-sm">
            <Crown className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] md:text-sm font-bold text-foreground leading-tight">
              {isLow ? "Лимиты почти исчерпаны" : "Хотите безлимит?"}
            </p>
            <p className="text-[10px] md:text-[11px] text-muted-foreground leading-tight mt-0.5">
              Перейдите на платный тариф — без ограничений
            </p>
          </div>
          <ArrowRight className="shrink-0 h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}
