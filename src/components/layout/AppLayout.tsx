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
    <div className="flex min-h-screen w-full">
      {!isMobile && (
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      )}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>
      {isMobile && (
        <>
          <MobileBottomNav onMenuOpen={() => setDrawerOpen(true)} />
          <MobileSidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
      )}
    </div>
  );
}
