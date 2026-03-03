import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useTokens } from "@/hooks/useTokens";
import {
  Home, Search, Target, Eye, Flame, ArrowRight, Shield,
  Link2, UserSearch, FileText, CalendarDays,
  LogOut, ChevronLeft, ChevronRight, X
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  iconColor?: string;
  badge?: string;
}

const searchItems: NavItem[] = [
  { label: "Главная", icon: Home, path: "/dashboard", iconColor: "text-amber-500" },
  { label: "Поиск по слову", icon: Search, path: "/search", iconColor: "text-blue-500" },
  { label: "Контент-радар", icon: Target, path: "/trends", iconColor: "text-rose-500" },
  { label: "Шпионаж", icon: Eye, path: "/razvedka", iconColor: "text-violet-500" },
];

const toolItems: NavItem[] = [
  { label: "Анализ видео", icon: Link2, path: "/video-analysis", iconColor: "text-orange-500" },
  { label: "Анализ профиля", icon: UserSearch, path: "/account-analysis", iconColor: "text-orange-500" },
  { label: "Черновик", icon: FileText, path: "#", iconColor: "text-muted-foreground", badge: "Скоро" },
  { label: "Контент план", icon: CalendarDays, path: "#", iconColor: "text-muted-foreground", badge: "Скоро" },
];

const ideaItems: NavItem[] = [
  { label: "Библиотека", icon: Flame, path: "/library", iconColor: "text-red-500" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { balance, totalEarned } = useTokens();
  const tokenPercent = totalEarned > 0 ? Math.min(100, (balance / totalEarned) * 100) : 0;
  const [showBanner, setShowBanner] = useState(true);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = user?.email?.charAt(0).toUpperCase() || "U";

  const renderGroup = (label: string, items: NavItem[]) => (
    <div className="mb-2">
      {!collapsed && <p className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider px-3 mb-1.5">{label}</p>}
      <div className="space-y-0.5">
        {items.map((item) => {
          const active = location.pathname === item.path;
          const disabled = item.path === "#";
          return (
            <Link
              key={item.label}
              to={disabled ? "#" : item.path}
              onClick={disabled ? (e) => e.preventDefault() : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all duration-150 group relative",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-foreground/80 hover:bg-muted/50",
                disabled && "opacity-60 cursor-default",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0",
                active ? item.iconColor : item.iconColor
              )} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0 z-30",
        collapsed ? "w-[64px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border shrink-0">
        <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center shrink-0">
          <Flame className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base text-foreground tracking-tight">TrendTok</span>
            <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md uppercase">Beta</span>
          </div>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {renderGroup("Поиск контента", searchItems)}
        {renderGroup("Инструменты", toolItems)}
        {renderGroup("Идеи", ideaItems)}
        {isAdmin && renderGroup("Админ", [{ label: "Управление", icon: Shield, path: "/admin", iconColor: "text-emerald-500" }])}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border py-3 px-2 space-y-2 shrink-0">
        {/* Promo banner */}
        {!collapsed && showBanner && (
          <div className="relative rounded-2xl overflow-hidden p-3" style={{
            background: "linear-gradient(135deg, hsl(35 95% 55%), hsl(330 80% 55%), hsl(280 70% 55%))"
          }}>
            <button
              onClick={() => setShowBanner(false)}
              className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <p className="text-white font-bold text-sm">Платим за кейсы</p>
            <p className="text-white/80 text-xs">Подробнее</p>
          </div>
        )}

        {/* Token widget */}
        {!collapsed && (
          <div className="rounded-xl p-3 space-y-2 bg-muted/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold text-foreground">Осталось токенов:</span>
              </div>
              <span className="text-sm font-bold text-foreground">{balance}</span>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden" style={{
              background: "hsl(var(--muted))"
            }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${tokenPercent}%`,
                  background: "linear-gradient(90deg, hsl(220 80% 55%), hsl(258 80% 58%))"
                }}
              />
            </div>
            <Link
              to="/pricing"
              className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              Открыть тарифы <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
        {collapsed && (
          <Link
            to="/pricing"
            title={`Токены: ${balance}`}
            className="flex justify-center py-2 rounded-xl text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <Flame className="h-[18px] w-[18px] text-orange-500" />
          </Link>
        )}

        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-xl",
          collapsed && "justify-center px-0"
        )}>
          <div className="h-7 w-7 rounded-full gradient-hero shrink-0 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.email?.split("@")[0] || "Пользователь"}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Выйти"
              className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={handleLogout}
            title="Выйти"
            className="flex justify-center py-2 rounded-xl text-muted-foreground hover:text-destructive w-full transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs text-muted-foreground/50 hover:text-foreground w-full transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Свернуть</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
