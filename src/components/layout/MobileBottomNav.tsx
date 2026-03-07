import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home, TrendingUp, Flame, UserSearch, Plus,
  Search, Video, UserCircle, Sparkles, BookOpen, Heart
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const mainNavItems = [
  { icon: Flame, path: "/trends", label: "Тренды" },
  { icon: TrendingUp, path: "/search", label: "Поиск" },
  { icon: UserSearch, path: "/account-analysis", label: "Анализ" },
];

const plusMenuItems = [
  { icon: Video, path: "/video-analysis", label: "Анализ видео" },
  { icon: Sparkles, path: "/ai-script", label: "AI Сценарий" },
  { icon: BookOpen, path: "/library", label: "Библиотека" },
  { icon: Heart, path: "/library", label: "Избранное" },
];

interface MobileBottomNavProps {
  onMenuOpen: () => void;
  onDrawerClose?: () => void;
  drawerOpen?: boolean;
}

export function MobileBottomNav({ onMenuOpen, onDrawerClose, drawerOpen }: MobileBottomNavProps) {
  const location = useLocation();
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPlusMenu) return;
    const handle = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPlusMenu(false);
      }
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [showPlusMenu]);

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
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        transition: "opacity 0.2s",
        opacity: drawerOpen ? 0 : 1,
      }}
    >
      {/* Plus menu popover */}
      {showPlusMenu && (
        <div
          ref={popoverRef}
          className="absolute bottom-full right-3 mb-3 bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl p-2 min-w-[200px]"
          style={{ animation: "slide-up 0.2s ease-out" }}
        >
          {plusMenuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path + item.label}
                to={item.path}
                onClick={() => setShowPlusMenu(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm transition-colors active:scale-[0.97]",
                  active ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="flex items-center px-4 py-2 gap-2">
        {/* Main nav pill */}
        <div
          className="flex-1 flex items-center justify-around rounded-2xl py-1.5 px-1"
          style={{
            background: "hsl(var(--card) / 0.85)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 2px 20px hsl(var(--foreground) / 0.08), inset 0 1px 0 hsl(var(--background) / 0.5)",
            border: "1px solid hsl(var(--border) / 0.5)",
          }}
        >
          {mainNavItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => { drawerOpen && onDrawerClose?.(); setShowPlusMenu(false); }}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[52px] active:scale-[0.93]",
                  active && "bg-primary/12"
                )}
              >
                <item.icon
                  className={cn(
                    "h-[22px] w-[22px] transition-colors duration-200",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                {active && (
                  <span className="text-[10px] font-semibold text-primary leading-tight">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Plus button */}
        <button
          onClick={() => { drawerOpen && onDrawerClose?.(); setShowPlusMenu(v => !v); }}
          className={cn(
            "shrink-0 h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90",
            showPlusMenu
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-card/85 text-muted-foreground border border-border/50"
          )}
          style={{
            backdropFilter: "blur(20px)",
            boxShadow: showPlusMenu
              ? "0 4px 20px hsl(var(--primary) / 0.3)"
              : "0 2px 12px hsl(var(--foreground) / 0.06)",
          }}
        >
          <Plus
            className={cn("h-6 w-6 transition-transform duration-200", showPlusMenu && "rotate-45")}
            strokeWidth={2}
          />
        </button>
      </div>
    </nav>
  );

  return createPortal(nav, document.body);
}
