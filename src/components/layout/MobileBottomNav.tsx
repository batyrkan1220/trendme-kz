import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, TrendingUp, Search, Sparkles, Star, Menu,
  Video, UserCircle, FileText
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const navItems = [
  { icon: LayoutDashboard, path: "/dashboard", label: "Главная" },
  { icon: Search, path: "/search", label: "Поиск" },
  { icon: TrendingUp, path: "/trends", label: "Тренды" },
];

const analysisItems = [
  { icon: Video, path: "/video-analysis", label: "Анализ видео" },
  { icon: UserCircle, path: "/account-analysis", label: "Анализ аккаунта" },
];

interface MobileBottomNavProps {
  onMenuOpen: () => void;
  onDrawerClose?: () => void;
  drawerOpen?: boolean;
}

export function MobileBottomNav({ onMenuOpen, onDrawerClose, drawerOpen }: MobileBottomNavProps) {
  const location = useLocation();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const analysisActive = analysisItems.some(i => location.pathname === i.path);

  useEffect(() => {
    if (!showAnalysis) return;
    const handle = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowAnalysis(false);
      }
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [showAnalysis]);

  const nav = (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden safe-area-bottom"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: "hsl(var(--background))",
        borderTop: "1px solid hsl(var(--border))",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
        pointerEvents: "auto",
      }}
    >
      {/* Analysis popover */}
      {showAnalysis && (
        <div
          ref={popoverRef}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-card border border-border rounded-2xl shadow-lg p-2 min-w-[200px]"
        >
          {analysisItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setShowAnalysis(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                  active ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => drawerOpen && onDrawerClose?.()}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-[56px]",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "text-primary")} />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => { drawerOpen && onDrawerClose?.(); setShowAnalysis(v => !v); }}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-[56px]",
            analysisActive || showAnalysis ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Search className={cn("h-5 w-5", (analysisActive || showAnalysis) && "text-primary")} />
          <span className="text-[10px] font-medium leading-tight">Анализ</span>
        </button>

        <Link
          to="/ai-script"
          onClick={() => drawerOpen && onDrawerClose?.()}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-[56px]",
            location.pathname === "/ai-script" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Sparkles className={cn("h-5 w-5", location.pathname === "/ai-script" && "text-primary")} />
          <span className="text-[10px] font-medium leading-tight">Сценарий</span>
        </Link>

        <button
          onClick={onMenuOpen}
          className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-muted-foreground min-w-[56px]"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-tight">Меню</span>
        </button>
      </div>
    </nav>
  );

  return createPortal(nav, document.body);
}
