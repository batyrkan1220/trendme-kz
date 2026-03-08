import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Flame, Search, Heart, Wrench, Video, Sparkles, BarChart3, ChevronUp
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const mainNavItems = [
  { icon: Flame, path: "/trends", label: "Тренды" },
  { icon: Search, path: "/search", label: "Поиск" },
];

const toolsMenuItems = [
  { icon: Video, path: "/video-analysis", label: "Анализ видео" },
  { icon: Sparkles, path: "/ai-script", label: "AI Сценарий" },
  { icon: BarChart3, path: "/account-analysis", label: "Анализ аккаунта" },
];

interface MobileBottomNavProps {
  onMenuOpen: () => void;
  onDrawerClose?: () => void;
  drawerOpen?: boolean;
}

export function MobileBottomNav({ onMenuOpen, onDrawerClose, drawerOpen }: MobileBottomNavProps) {
  const location = useLocation();
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isToolsActive = toolsMenuItems.some(item => location.pathname === item.path);

  useEffect(() => {
    if (!showToolsMenu) return;
    const handle = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowToolsMenu(false);
      }
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [showToolsMenu]);

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
          className="absolute bottom-full mb-2 rounded-2xl shadow-2xl p-2"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            animation: "slide-up 0.2s ease-out",
            right: "16px",
            left: "16px",
          }}
        >
          <div className="px-3 py-2 mb-1">
            <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">Инструменты</span>
          </div>
          {toolsMenuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setShowToolsMenu(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm transition-colors active:scale-[0.97]",
                  active
                    ? "text-neon font-semibold"
                    : "text-foreground/80 hover:text-foreground hover:bg-accent"
                )}
                style={active ? { background: "hsl(var(--neon) / 0.1)" } : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-around px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom,0px))] animate-bottom-nav-enter" style={{ background: "rgba(10,10,10,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        {/* Main nav items */}
        {mainNavItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => { drawerOpen && onDrawerClose?.(); setShowToolsMenu(false); }}
              className="relative flex flex-col items-center gap-1 py-1 min-w-[60px] transition-opacity active:opacity-70"
            >
              <item.icon
                className={cn(
                  "h-[26px] w-[26px] transition-colors duration-200",
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
            </Link>
          );
        })}

        {/* Tools button */}
        <button
          onClick={() => { drawerOpen && onDrawerClose?.(); setShowToolsMenu(v => !v); }}
          className="relative flex flex-col items-center gap-1 py-1 min-w-[60px] transition-opacity active:opacity-70"
        >
          <div className="relative">
            <Wrench
              className={cn(
                "h-[26px] w-[26px] transition-colors duration-200",
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
            Инструменты
          </span>
        </button>

        {/* Favorites */}
        {(() => {
          const active = location.pathname === "/library";
          return (
            <Link
              to="/library"
              onClick={() => { drawerOpen && onDrawerClose?.(); setShowToolsMenu(false); }}
              className="relative flex flex-col items-center gap-1 py-1 min-w-[60px] transition-opacity active:opacity-70"
            >
              <Heart
                className={cn(
                  "h-[26px] w-[26px] transition-colors duration-200",
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
            </Link>
          );
        })()}
      </div>
    </nav>
  );

  return createPortal(nav, document.body);
}
