import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { DemoBanner, DEMO_BANNER_OFFSET_CSS } from "./DemoBanner";
import { PaywallDialog } from "@/components/PaywallDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsFreePlan } from "@/hooks/useIsFreePlan";
import { isNativePlatform } from "@/lib/native";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { ArrowLeft } from "lucide-react";

/** Main tab routes — no swipe-back on these */
const MAIN_TABS = ["/trends", "/search", "/library", "/account-analysis", "/"];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [paywallOpen, setPaywallOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const { isFreePlan, isLoading: isPlanLoading } = useIsFreePlan();

  const isMainTab = MAIN_TABS.includes(location.pathname);
  const { swipeProps, swipeStyle, showIndicator, indicatorProgress } = useSwipeBack({
    disabled: isMainTab,
  });

  // DemoBanner — strictly mobile + free + non-native (web only).
  // Must match DemoBanner internal visibility 1:1 to avoid padding/banner desync.
  const showDemoBanner = isMobile && isFreePlan && !isPlanLoading && !isNativePlatform;

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-background-subtle text-foreground">
      {!isMobile && !isNativePlatform && <AppSidebar />}

      {/* DemoBanner — тек mobile + free */}
      <DemoBanner />

      {/* Swipe-back edge indicator */}
      {showIndicator && (
        <div
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[99999] pointer-events-none"
          style={{
            opacity: indicatorProgress,
            transform: `translateX(${indicatorProgress * 16 - 12}px) translateY(-50%)`,
            transition: "none",
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: `hsl(var(--primary) / ${0.15 + indicatorProgress * 0.25})`,
              backdropFilter: "blur(8px)",
              boxShadow: `0 2px 12px hsl(var(--primary) / ${indicatorProgress * 0.3})`,
            }}
          >
            <ArrowLeft className="h-5 w-5 text-primary" style={{ opacity: indicatorProgress }} />
          </div>
        </div>
      )}

      <main
        className="flex-1 min-w-0 h-full overflow-x-hidden overflow-y-auto"
        style={{
          paddingTop: showDemoBanner ? DEMO_BANNER_OFFSET_CSS : undefined,
          paddingBottom: isMobile
            ? "calc(env(safe-area-inset-bottom, 0px) + 72px)"
            : "env(safe-area-inset-bottom, 0px)",
          ...swipeStyle,
        }}
        {...swipeProps}
      >
        {children}
      </main>

      {/* Bottom nav — Analyze free-планда paywall ашады */}
      <MobileBottomNav onOpenPaywall={() => setPaywallOpen(true)} />

      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        feature="analysis"
      />
    </div>
  );
}
