import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileSidebarDrawer } from "./MobileSidebarDrawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { isNativePlatform } from "@/lib/native";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden" style={{ background: "#0a0a0a", color: "#ffffff" }}>
      {!isMobile && !isNativePlatform && (
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      )}
      <main className="flex-1 min-w-0 h-full pb-24 md:pb-0 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
      {/* Always render on mobile via CSS, not JS condition */}
      <MobileBottomNav onMenuOpen={() => setDrawerOpen(true)} onDrawerClose={() => setDrawerOpen(false)} drawerOpen={drawerOpen} />
      <MobileSidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
