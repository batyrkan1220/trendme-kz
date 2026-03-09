import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileSidebarDrawer } from "./MobileSidebarDrawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { isNativePlatform } from "@/lib/native";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { ArrowLeft } from "lucide-react";

/** Routes that handle their own swipe-back or shouldn't have it */
const SWIPE_DISABLED_ROUTES = ["/trends", "/search", "/library", "/", "/video-analysis"];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  const isSwipeDisabled = SWIPE_DISABLED_ROUTES.includes(location.pathname);
  const { swipeProps, swipeStyle, showIndicator, indicatorProgress } = useSwipeBack({
    disabled: isSwipeDisabled || drawerOpen,
  });

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden" style={{ background: "#0a0a0a", color: "#ffffff" }}>
      {!isMobile && !isNativePlatform && (
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      )}

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
        className="flex-1 min-w-0 h-full pb-0 md:pb-0 overflow-x-hidden overflow-y-auto"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingTop: isNativePlatform ? 'env(safe-area-inset-top, 0px)' : undefined,
          ...swipeStyle,
        }}
        {...swipeProps}
      >
        {children}
      </main>
      {/* Always render on mobile via CSS, not JS condition */}
      <MobileBottomNav onMenuOpen={() => setDrawerOpen(true)} onDrawerClose={() => setDrawerOpen(false)} drawerOpen={drawerOpen} />
      <MobileSidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
