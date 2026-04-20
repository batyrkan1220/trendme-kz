import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Flame, Search, Heart, ScanSearch, Video, UserSearch, ChevronUp } from "lucide-react";
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

/**
 * Mobile bottom nav — full-width pill style, sidebar nav-item parity.
 * Active tab uses bg-foreground + text-background + viral icon (dashboard style).
 */
export function MobileBottomNav({ onMenuOpen, onDrawerClose, drawerOpen }: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isToolsActive = toolsMenuItems.some((item) => location.pathname === item.path);

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

  const goTo = useCallback(
    (path: string) => {
      drawerOpen && onDrawerClose?.();
      setShowToolsMenu(false);
      navigate(path);
    },
    [navigate, drawerOpen, onDrawerClose],
  );

  const Item = ({
    icon: Icon,
    label,
    active,
    onClick,
    chevron = false,
    iconAccent = false,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    active: boolean;
    onClick: () => void;
    chevron?: boolean;
    iconAccent?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[12px] font-semibold transition-all duration-150 press-feedback",
        active
          ? "bg-foreground text-background"
          : "text-foreground/70 hover:bg-muted",
      )}
    >
      <div className="relative">
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            active ? (iconAccent ? "text-viral" : "text-background") : "text-muted-foreground",
          )}
          strokeWidth={active ? 2.4 : 2}
        />
        {chevron && (
          <ChevronUp
            className={cn(
              "absolute -top-1.5 -right-1.5 h-3 w-3 transition-all",
              showToolsMenu ? "rotate-180" : "",
              active ? "text-viral" : "text-muted-foreground/60",
            )}
          />
        )}
      </div>
      <span className="truncate leading-none">{label}</span>
    </button>
  );

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
      {/* Tools popover */}
      {showToolsMenu && (
        <div
          ref={popoverRef}
          className="absolute bottom-full mb-3 rounded-2xl p-2 glass-strong shadow-card border border-border"
          style={{
            animation: "slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            right: 12,
            left: 12,
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
                    ? "bg-foreground text-background font-semibold"
                    : "text-foreground/80 hover:bg-muted",
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", active && "text-viral")} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom bar */}
      <div
        className="px-2 pt-2 animate-bottom-nav-enter glass-strong"
        style={{
          paddingBottom: "max(8px, env(safe-area-inset-bottom, 0px))",
          borderTop: "1px solid hsl(var(--border))",
          boxShadow: "0 -4px 20px rgba(16, 24, 40, 0.06)",
        }}
      >
        <div className="flex items-center gap-1.5">
          {mainNavItems.map((item) => (
            <Item
              key={item.path}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.path}
              onClick={() => goTo(item.path)}
              iconAccent
            />
          ))}

          <Item
            icon={ScanSearch}
            label="Анализ"
            active={isToolsActive || showToolsMenu}
            onClick={() => {
              drawerOpen && onDrawerClose?.();
              setShowToolsMenu((v) => !v);
            }}
            chevron
            iconAccent
          />

          <Item
            icon={Heart}
            label="Избранное"
            active={location.pathname === "/library"}
            onClick={() => goTo("/library")}
            iconAccent
          />
        </div>
      </div>
    </nav>
  );
}
