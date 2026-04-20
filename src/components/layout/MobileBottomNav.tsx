import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Flame, Search, Heart, ScanSearch, Video, UserSearch, ChevronUp
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

const mainNavItems = [
  { icon: Flame, path: "/trends", label: "Тренды" },
  { icon: Search, path: "/search", label: "Поиск" },
];

const toolsMenuItems = [
  { icon: Video, path: "/video-analysis", label: "Анализ видео" },
  { icon: UserSearch, path: "/account-analysis", label: "Анализ аккаунта" },
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
      const nav = document.getElementById("mobile-bottom-nav");
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        (!nav || !nav.contains(e.target as Node))
      ) {
        setShowToolsMenu(false);
      }
    };
    document.addEventListener("click", handle, true);
    return () => document.removeEventListener("click", handle, true);
  }, [showToolsMenu]);

  const goTo = useCallback((path: string) => {
    drawerOpen && onDrawerClose?.();
    setShowToolsMenu(false);
    navigate(path);
  }, [navigate, drawerOpen, onDrawerClose]);

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden"
      style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        zIndex: drawerOpen ? 40 : 99999,
        pointerEvents: drawerOpen ? "none" : "auto",
        transition: "opacity 0.2s",
        opacity: drawerOpen ? 0 : 1,
      }}
    >
      {/* Tools popover — light premium */}
      {showToolsMenu && (
        <div
          ref={popoverRef}
          className="absolute bottom-full mb-3 rounded-2xl p-2 glass-strong shadow-card"
          style={{
            animation: "slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            right: 16,
            left: 16,
          }}
        >
          <div className="px-3 py-1.5 mb-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.14em]">
              Инструменты
            </span>
          </div>
          {toolsMenuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => goTo(item.path)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-left transition-colors",
                  active
                    ? "bg-primary-soft text-primary font-semibold"
                    : "text-foreground/80 hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom bar — light premium */}
      <div
        className="flex items-center justify-around px-3 py-2 pb-[max(8px,env(safe-area-inset-bottom,0px))] animate-bottom-nav-enter glass-strong"
        style={{
          borderTop: "1px solid hsl(var(--border))",
          boxShadow: "0 -4px 20px rgba(16, 24, 40, 0.06)",
        }}
      >
        {mainNavItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => goTo(item.path)}
              className="relative flex flex-col items-center gap-0.5 py-1 min-w-[56px] press-feedback"
            >
              <item.icon
                className={cn(
                  "h-[24px] w-[24px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                strokeWidth={active ? 2.3 : 1.8}
              />
              <span className={cn(
                "text-[11px] font-semibold leading-tight",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Tools */}
        <button
          onClick={() => { drawerOpen && onDrawerClose?.(); setShowToolsMenu(v => !v); }}
          className="relative flex flex-col items-center gap-0.5 py-1 min-w-[56px] press-feedback"
        >
          <div className="relative">
            <ScanSearch
              className={cn(
                "h-[24px] w-[24px] transition-colors",
                isToolsActive || showToolsMenu ? "text-primary" : "text-muted-foreground"
              )}
              strokeWidth={isToolsActive || showToolsMenu ? 2.3 : 1.8}
            />
            <ChevronUp
              className={cn(
                "absolute -top-1.5 -right-1.5 h-3 w-3 transition-all",
                showToolsMenu ? "text-primary rotate-180" : "text-muted-foreground/60"
              )}
            />
          </div>
          <span className={cn(
            "text-[11px] font-semibold leading-tight",
            isToolsActive || showToolsMenu ? "text-primary" : "text-muted-foreground"
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
              className="relative flex flex-col items-center gap-0.5 py-1 min-w-[56px] press-feedback"
            >
              <Heart
                className={cn(
                  "h-[24px] w-[24px] transition-colors",
                  active ? "text-primary fill-primary" : "text-muted-foreground"
                )}
                strokeWidth={active ? 2.3 : 1.8}
              />
              <span className={cn(
                "text-[11px] font-semibold leading-tight",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                Избранное
              </span>
            </button>
          );
        })()}
      </div>
    </nav>
  );
}
