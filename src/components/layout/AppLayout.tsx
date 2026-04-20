import { useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { isNativePlatform } from "@/lib/native";
import { useState } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      {!isMobile && !isNativePlatform && (
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      )}

      {/* Негізгі контент */}
      <main
        className="flex-1 min-w-0 h-full overflow-x-hidden overflow-y-auto"
        style={{ paddingBottom: isMobile ? "calc(env(safe-area-inset-bottom, 0px) + 64px)" : 0 }}
      >
        {children}
      </main>

      {/* Мобильде 4 tab */}
      <MobileBottomNav />
    </div>
  );
}
