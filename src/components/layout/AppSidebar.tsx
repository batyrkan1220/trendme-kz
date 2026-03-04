import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useTokens } from "@/hooks/useTokens";
import {
  LayoutDashboard, TrendingUp, Search,
  Video, UserCircle, Star, ScrollText,
  Flame, ArrowRight, Shield,
  LogOut, ChevronLeft, ChevronRight
} from "lucide-react";
import { TrendMeLogo } from "@/components/TrendMeLogo";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  iconColor?: string;
  badge?: string;
}

const searchItems: NavItem[] = [
  { label: "Главная", icon: LayoutDashboard, path: "/dashboard", iconColor: "text-amber-500" },
  { label: "Поиск по слову", icon: Search, path: "/search", iconColor: "text-blue-500" },
  { label: "Тренды", icon: TrendingUp, path: "/trends", iconColor: "text-rose-500" },
];

const aiVideoItems: NavItem[] = [
  { label: "Анализ видео", icon: Video, path: "/video-analysis", iconColor: "text-orange-500" },
  { label: "Анализ профиля", icon: UserCircle, path: "/account-analysis", iconColor: "text-violet-500" },
];

const ideaItems: NavItem[] = [
  { label: "Избранные", icon: Star, path: "/library", iconColor: "text-amber-500" },
  { label: "Журнал", icon: ScrollText, path: "/journal", iconColor: "text-sky-500" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { balance, totalEarned } = useTokens();
  const tokenPercent = totalEarned > 0 ? Math.min(100, (balance / totalEarned) * 100) : 0;

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

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
              <item.icon className={cn("h-5 w-5 shrink-0", item.iconColor)} />
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
        collapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border shrink-0">
        <TrendMeLogo size={32} />
        {!collapsed && (
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight"><span className="text-foreground">Trend</span><span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">Me</span></span>
            <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md uppercase">Beta</span>
          </div>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {renderGroup("Поиск контента", searchItems)}
        {renderGroup("Инструменты", aiVideoItems)}
        {renderGroup("Идеи", ideaItems)}
        {isAdmin && renderGroup("Админ", [{ label: "Управление", icon: Shield, path: "/admin", iconColor: "text-emerald-500" }])}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border py-3 px-2 space-y-2 shrink-0">
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
            <div className="h-2 w-full rounded-full overflow-hidden bg-muted">
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

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Выйти"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 w-full transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Выйти</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs text-muted-foreground/50 hover:text-foreground w-full transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : (
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
