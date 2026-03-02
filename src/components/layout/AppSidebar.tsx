import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, TrendingUp, Search,
  Video, UserCircle, BookOpen, ScrollText,
  Coins, CreditCard, LogOut, ChevronLeft, ChevronRight, Zap
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const mainItems: NavItem[] = [
  { label: "Дашборд", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Тренды", icon: TrendingUp, path: "/trends" },
  { label: "Поиск", icon: Search, path: "/search" },
  { label: "Анализ видео", icon: Video, path: "/video-analysis" },
  { label: "Анализ аккаунт", icon: UserCircle, path: "/account-analysis" },
  { label: "Библиотека", icon: BookOpen, path: "/library" },
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
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0 z-30",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 neon-border">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg whitespace-nowrap gradient-text tracking-tight">
            TrendTok
          </span>
        )}
      </div>

      {/* Section Label */}
      {!collapsed && (
        <div className="px-4 pt-5 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
            Меню
          </span>
        </div>
      )}

      {/* Main Nav */}
      <nav className="flex-1 py-1 px-2 space-y-0.5 overflow-y-auto">
        {mainItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative",
                active
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
              )}
              <item.icon className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors",
                active ? "text-primary" : "group-hover:text-foreground"
              )} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border py-3 px-2 space-y-0.5 shrink-0">
        {!collapsed && (
          <div className="px-2 pb-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
              Настройки
            </span>
          </div>
        )}

        {bottomItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative",
                active
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
              )}
              <item.icon className={cn(
                "h-[18px] w-[18px] shrink-0",
                active ? "text-primary" : "group-hover:text-foreground"
              )} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 mt-3 rounded-xl glass",
          collapsed && "justify-center px-0"
        )}>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent shrink-0 flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.email?.split("@")[0] || "Пользователь"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email || ""}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && <span>Выйти</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors",
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
