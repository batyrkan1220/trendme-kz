import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, TrendingUp, Search, Sparkles, BookOpen, Menu
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, path: "/dashboard", label: "Главная" },
  { icon: Search, path: "/search", label: "Поиск" },
  { icon: TrendingUp, path: "/trends", label: "Тренды" },
  { icon: Sparkles, path: "/video-analysis", label: "ИИ Видео" },
  { icon: BookOpen, path: "/library", label: "Библиотека" },
];

interface MobileBottomNavProps {
  onMenuOpen: () => void;
}

export function MobileBottomNav({ onMenuOpen }: MobileBottomNavProps) {
  const location = useLocation();

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
      }}
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
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
          onClick={onMenuOpen}
          className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-muted-foreground min-w-[56px]"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-tight">Меню</span>
        </button>
      </div>
    </nav>
  );

  // Portal to document.body to avoid any parent CSS breaking fixed positioning
  return createPortal(nav, document.body);
}
