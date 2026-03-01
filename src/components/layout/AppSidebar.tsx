import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Radar, LayoutDashboard, TrendingUp, Search, BarChart3,
  Video, UserCircle, BookOpen, Star, ScrollText,
  Coins, CreditCard, LogOut, ChevronLeft, ChevronRight, Flame
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const mainItems: NavItem[] = [
  { label: "Разведка", icon: Radar, path: "/razvedka" },
  { label: "Дашборд", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Тренды", icon: TrendingUp, path: "/trends" },
  { label: "Поиск", icon: Search, path: "/search" },
  { label: "Аналитика", icon: BarChart3, path: "/analytics" },
  { label: "Анализ видео", icon: Video, path: "/video-analysis" },
  { label: "Анализ аккаунт", icon: UserCircle, path: "/account-analysis" },
  { label: "Библиотека", icon: BookOpen, path: "/library" },
  { label: "Избранное", icon: Star, path: "/favorites" },
  { label: "Журнал", icon: ScrollText, path: "/journal" },
];

const bottomItems: NavItem[] = [
  { label: "Токены", icon: Coins, path: "/tokens" },
  { label: "Тарифы", icon: CreditCard, path: "/pricing" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0 z-30",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
        <Flame className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && (
          <span className="font-bold text-lg text-sidebar-accent-foreground whitespace-nowrap">
            Trend TikTok
          </span>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {mainItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border py-3 px-2 space-y-0.5 shrink-0">
        {bottomItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg",
          collapsed && "justify-center px-0"
        )}>
          <div className="h-8 w-8 rounded-full gradient-hero shrink-0 flex items-center justify-center text-xs font-bold text-primary-foreground">
            U
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">Пользователь</p>
              <p className="text-xs text-sidebar-foreground truncate">user@example.com</p>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground w-full transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-[18px] w-[18px]" />
          ) : (
            <>
              <ChevronLeft className="h-[18px] w-[18px]" />
              <span>Свернуть</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
