import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsFreePlan } from "@/hooks/useIsFreePlan";
import { Sparkles } from "lucide-react";

/**
 * DemoBanner — 36px қара жолақ үстіңгі жағында.
 * Тек mobile + free-plan үшін көрсетіледі.
 * Оң жақта неон-жасыл «Открыть Pro» CTA → /subscription.
 * Safe-area inset-top ескерілген (Dynamic Island астынан кетеді).
 */
export function DemoBanner() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isFreePlan, isLoading } = useIsFreePlan();

  if (!isMobile || isLoading || !isFreePlan) return null;

  return (
    <div
      id="demo-banner"
      className="md:hidden fixed top-0 left-0 right-0 z-[100000] bg-black text-white"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div className="h-9 flex items-center justify-between gap-2 px-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-white/80" />
          <span className="text-[12px] font-medium truncate">
            Демо-режим · ограничено
          </span>
        </div>
        <button
          onClick={() => navigate("/subscription")}
          className="shrink-0 h-7 px-3 rounded-full text-[12px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform shadow-[0_0_12px_hsl(var(--primary)/0.45)]"
        >
          Открыть Pro
        </button>
      </div>
    </div>
  );
}

/** Banner-дің нақты биіктігі (safe-area + 36px). Padding есептеу үшін қолданылады. */
export const DEMO_BANNER_OFFSET_CSS =
  "calc(env(safe-area-inset-top, 0px) + 36px)";
