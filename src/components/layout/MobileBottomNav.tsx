import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Flame, Search, Heart, ScanSearch, Video, BarChart3, ChevronUp
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

const mainNavItems = [
  { icon: Flame, path: "/trends", label: "Тренды" },
  { icon: Search, path: "/search", label: "Поиск" },
];

const toolsMenuItems = [
  { icon: Video, path: "/video-analysis", label: "Анализ видео" },
  
  { icon: BarChart3, path: "/account-analysis", label: "Анализ аккаунта" },
];

interface MobileBottomNavProps {
  onMenuOpen: () => void;
  onDrawerClose?: () => void;
  drawerOpen?: boolean;
}

export function MobileBottomNav({ onMenuOpen, onDrawerClose, drawerOpen }: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isToolsActive = toolsMenuItems.some(item => location.pathname === item.path);

  useEffect(() => {
    if (!showToolsMenu) return;
    const handle = (e: MouseEvent | TouchEvent) => {
      // Check both the popover and the tools button itself
      const nav = document.getElementById("mobile-bottom-nav");
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        (!nav || !nav.contains(e.target as Node))
      ) {
        setShowToolsMenu(false);
      }
    };
    // Use click instead of mousedown/touchstart to avoid swallowing events
    document.addEventListener("click", handle, true);
    return () => {
      document.removeEventListener("click", handle, true);
    };
  }, [showToolsMenu]);

  const goTo = useCallback((path: string) => {
    drawerOpen && onDrawerClose?.();
    setShowToolsMenu(false);
    navigate(path);
  }, [navigate, drawerOpen, onDrawerClose]);

  const nav = (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: drawerOpen ? 40 : 99999,
        pointerEvents: drawerOpen ? "none" : "auto",
        paddingBottom: 0,
        transition: "opacity 0.2s",
        opacity: drawerOpen ? 0 : 1,
      }}
    >
      {/* Tools menu popover */}
      {showToolsMenu && (
        <div
          ref={popoverRef}
          className="absolute bottom-full mb-3 rounded-3xl shadow-2xl p-2.5"
          style={{
            background: "rgba(18,18,18,0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(40px) saturate(1.4)",
            WebkitBackdropFilter: "blur(40px) saturate(1.4)",
            animation: "slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            right: "16px",
            left: "16px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.06) inset",
          }}
        >
          <div className="px-3 py-2 mb-1">
            <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">Инструменты</span>
          </div>
          {toolsMenuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => goTo(item.path)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm transition-colors w-full text-left",
                  active
                    ? "text-neon font-semibold"
                    : "text-foreground/80 hover:text-foreground hover:bg-accent"
                )}
                style={active ? { background: "hsl(var(--neon) / 0.1)" } : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-around px-3 py-2 pb-[max(8px,env(safe-area-inset-bottom,0px))] animate-bottom-nav-enter" style={{ background: "rgba(8,8,8,0.75)", backdropFilter: "blur(32px) saturate(1.5)", WebkitBackdropFilter: "blur(32px) saturate(1.5)", borderTop: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 -8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
        {/* Main nav items */}
        {mainNavItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => goTo(item.path)}
              className="relative flex flex-col items-center gap-0.5 py-1 min-w-[56px] transition-opacity active:opacity-70"
            >
              <item.icon
                className={cn(
                  "h-[25px] w-[25px] transition-colors duration-200",
                  active ? "text-neon" : "text-white"
                )}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span className={cn(
                "text-[11px] font-semibold leading-tight transition-colors",
                active ? "text-neon" : "text-white"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Tools button */}
        <button
          onClick={() => { drawerOpen && onDrawerClose?.(); setShowToolsMenu(v => !v); }}
          className="relative flex flex-col items-center gap-0.5 py-1 min-w-[56px] transition-opacity active:opacity-70"
        >
          <div className="relative">
            <ScanSearch
              className={cn(
                "h-[25px] w-[25px] transition-colors duration-200",
                isToolsActive || showToolsMenu ? "text-neon" : "text-white"
              )}
              strokeWidth={isToolsActive || showToolsMenu ? 2.2 : 1.8}
            />
            <ChevronUp
              className={cn(
                "absolute -top-1.5 -right-1.5 h-3 w-3 transition-all duration-200",
                showToolsMenu ? "text-neon rotate-180" : "text-white/50"
              )}
            />
          </div>
          <span className={cn(
            "text-[11px] font-semibold leading-tight transition-colors",
            isToolsActive || showToolsMenu ? "text-neon" : "text-white"
          )}>
            Анализ
          </span>
        </button>

        {/* Favorites */}
        {(() => {
          const active = location.pathname === "/library";
          return (
            <button
              onClick={() => goTo("/library")}
              className="relative flex flex-col items-center gap-0.5 py-1 min-w-[56px] transition-opacity active:opacity-70"
            >
              <Heart
                className={cn(
                  "h-[25px] w-[25px] transition-colors duration-200",
                  active ? "text-neon fill-neon" : "text-white"
                )}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span className={cn(
                "text-[11px] font-semibold leading-tight transition-colors",
                active ? "text-neon" : "text-white"
              )}>
                Избранное
              </span>
            </button>
          );
        })()}
      </div>
    </nav>
  );

  return nav;
}
