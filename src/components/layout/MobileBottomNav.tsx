import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Flame, Plus, Search, Video, Sparkles, BookOpen, Heart, BarChart3
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const mainNavItems = [
  { icon: Flame, path: "/trends", label: "Тренды" },
  { icon: Search, path: "/search", label: "Поиск" },
  { icon: BarChart3, path: "/account-analysis", label: "Анализ" },
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
      {/* Plus menu popover — dark style */}
      {showPlusMenu && (
        <div
          ref={popoverRef}
          className="absolute bottom-full right-3 mb-3 rounded-2xl shadow-2xl p-2 min-w-[200px]"
          style={{
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
            animation: "slide-up 0.2s ease-out",
          }}
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
                  active
                    ? "text-neon font-semibold"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                )}
                style={active ? { background: "rgba(200,255,0,0.1)" } : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom bar — dark glass */}
      <div className="flex items-center justify-between px-6 py-2" style={{ background: "rgba(10,10,10,0.75)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        {/* Left nav items */}
        {mainNavItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => { drawerOpen && onDrawerClose?.(); setShowPlusMenu(false); }}
              className="relative flex flex-col items-center gap-0.5 py-1.5 min-w-[56px] active:scale-[0.93] transition-transform"
            >
              <item.icon
                className={cn(
                  "h-[22px] w-[22px] transition-colors duration-200",
                  active ? "text-neon" : "text-white"
                )}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span className={cn(
                "text-[10px] font-semibold leading-tight transition-colors",
                active ? "text-neon" : "text-white/40"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Plus button — neon green */}
        <button
          onClick={() => { drawerOpen && onDrawerClose?.(); setShowPlusMenu(v => !v); }}
          className={cn(
            "shrink-0 h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90",
            showPlusMenu
              ? "shadow-lg"
              : ""
          )}
          style={{
            background: showPlusMenu ? "hsl(var(--neon))" : "hsl(var(--neon))",
            color: "#000",
            boxShadow: "0 0 20px hsl(var(--neon) / 0.4)",
          }}
        >
          <Plus
            className={cn("h-6 w-6 transition-transform duration-200", showPlusMenu && "rotate-45")}
            strokeWidth={2.5}
          />
        </button>
      </div>
    </nav>
  );

  return createPortal(nav, document.body);
}
