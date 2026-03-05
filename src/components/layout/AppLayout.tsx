import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileSidebarDrawer } from "./MobileSidebarDrawer";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="relative flex min-h-[100dvh] w-full overflow-x-hidden">
      {!isMobile && (
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      )}
      <main className="flex-1 min-w-0 min-h-[100dvh] pb-20 md:pb-0 overflow-x-hidden">
        {children}
      </main>
      {/* Always render on mobile via CSS, not JS condition */}
      <MobileBottomNav onMenuOpen={() => setDrawerOpen(true)} />
      <MobileSidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
