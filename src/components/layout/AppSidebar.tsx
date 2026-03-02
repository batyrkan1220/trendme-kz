import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  Radar, LayoutDashboard, TrendingUp, Search, BarChart3,
  Video, UserCircle, BookOpen, ScrollText,
  Coins, CreditCard, LogOut, ChevronLeft, ChevronRight, Flame
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
        collapsed ? "w-[68px]" : "w-[248px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="h-9 w-9 rounded-xl gradient-hero flex items-center justify-center shrink-0 glow-primary">
          <Flame className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg text-foreground whitespace-nowrap gradient-text">
            Trend TikTok
          </span>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {mainItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors",
                active && "text-primary"
              )} />
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
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn(
                "h-[18px] w-[18px] shrink-0",
                active && "text-primary"
              )} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl",
          collapsed && "justify-center px-0"
        )}>
          <div className="h-9 w-9 rounded-full gradient-hero shrink-0 flex items-center justify-center text-xs font-bold text-primary-foreground shadow-md">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.email?.split("@")[0] || "Пользователь"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
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
