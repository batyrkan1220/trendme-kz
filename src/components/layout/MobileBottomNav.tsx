import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, TrendingUp, Search, Video, BookOpen, Menu
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, path: "/dashboard", label: "Главная" },
  { icon: Search, path: "/search", label: "Поиск" },
  { icon: TrendingUp, path: "/trends", label: "Тренды" },
  { icon: Video, path: "/video-analysis", label: "Анализ" },
  { icon: BookOpen, path: "/library", label: "Библиотека" },
];

interface MobileBottomNavProps {
  onMenuOpen: () => void;
}

export function MobileBottomNav({ onMenuOpen }: MobileBottomNavProps) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/60 md:hidden safe-area-bottom" style={{ zIndex: 9999 }}>
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-[56px]",
                active
                  ? "text-primary"
                  : "text-muted-foreground"
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
}
