import { useNavigate } from "react-router-dom";
import { useIsFreePlan } from "@/hooks/useIsFreePlan";
import { isNativePlatform } from "@/lib/native";
import { Sparkles, ArrowRight } from "lucide-react";

/**
 * DemoBanner — премиум жоғарғы жолақ (Trends бетінің viral эстетикасында).
 * Тек mobile + free-plan үшін көрсетіледі.
 *
 * Дизайн:
 *  - Қою фон + жұмсақ viral-glow (жасыл-лайм радиалды жарық)
 *  - Сол жақта: pulse-dot + «Демо-режим» eyebrow + кішкентай "ограничено" subtitle
 *  - Оң жақта: viral-gradient pill CTA «Открыть Pro» + arrow icon
 *  - Safe-area inset-top ескерілген (Dynamic Island астынан кетеді)
 *
 * ⚠ Trendsee.io дизайнын қайталама — бұл TrendMe жеке стилі.
 */
export function DemoBanner({ leftOffsetPx = 0 }: { leftOffsetPx?: number }) {
  const navigate = useNavigate();
  const { isFreePlan, isLoading } = useIsFreePlan();

  // Free + non-native (web only, mobile + desktop). Hide while loading to avoid flicker.
  if (isLoading || !isFreePlan || isNativePlatform) return null;

  return (
    <div
      id="demo-banner"
      className="fixed top-0 right-0 z-[100000] text-white"
      style={{
        left: leftOffsetPx ? `${leftOffsetPx}px` : 0,
        paddingTop: "env(safe-area-inset-top, 0px)",
        background:
          "linear-gradient(90deg, hsl(240 10% 4%) 0%, hsl(240 10% 6%) 50%, hsl(240 10% 4%) 100%)",
        boxShadow:
          "0 1px 0 hsl(var(--viral) / 0.18) inset, 0 6px 18px -6px hsl(var(--viral) / 0.25)",
      }}
    >
      {/* viral glow accent (right side) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
        style={{
          background:
            "radial-gradient(60% 120% at 80% 50%, hsl(var(--viral) / 0.18) 0%, transparent 70%)",
        }}
      />
      {/* hairline bottom border (viral tint) */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--viral) / 0.55), transparent)",
        }}
      />

      <div className="relative h-10 flex items-center justify-between gap-2 px-3">
        {/* LEFT — pulse + eyebrow */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inset-0 rounded-full bg-viral animate-ping opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-viral shadow-[0_0_8px_hsl(var(--viral)/0.9)]" />
          </span>
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-viral">
              Демо
            </span>
            <span className="text-[11px] font-medium text-white/55 truncate">
              · ограниченный доступ
            </span>
          </div>
        </div>

        {/* RIGHT — viral gradient CTA */}
        <button
          onClick={() => navigate("/subscription")}
          className="group shrink-0 inline-flex items-center gap-1 h-7 pl-3 pr-2 rounded-full text-[11.5px] font-bold text-viral-foreground active:scale-95 transition-transform"
          style={{
            background: "var(--gradient-brand)",
            boxShadow:
              "0 0 0 1px hsl(var(--viral) / 0.5) inset, 0 4px 14px -2px hsl(var(--viral) / 0.55)",
          }}
          aria-label="Открыть Pro подписку"
        >
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
          <span>Открыть Pro</span>
          <ArrowRight
            className="h-3 w-3 transition-transform group-active:translate-x-0.5"
            strokeWidth={2.75}
          />
        </button>
      </div>
    </div>
  );
}

/** Banner-дің нақты биіктігі (safe-area + 40px). Padding есептеу үшін қолданылады. */
export const DEMO_BANNER_OFFSET_CSS =
  "calc(env(safe-area-inset-top, 0px) + 40px)";
