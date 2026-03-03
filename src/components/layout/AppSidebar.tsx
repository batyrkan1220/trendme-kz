import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import {
  LayoutDashboard, TrendingUp, Search,
  Video, UserCircle, BookOpen, ScrollText,
  Coins, CreditCard, LogOut, ChevronLeft, ChevronRight, Flame, ArrowRight, Shield, Sparkles
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string;
}

const searchItems: NavItem[] = [
  { label: "Главная", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Поиск по слову", icon: Search, path: "/search" },
  { label: "Тренды", icon: TrendingUp, path: "/trends" },
];

const aiVideoItems: NavItem[] = [
  { label: "Анализ видео", icon: Video, path: "/video-analysis" },
  { label: "Анализ профиля", icon: UserCircle, path: "/account-analysis" },
];

const ideaItems: NavItem[] = [
  { label: "Библиотека", icon: BookOpen, path: "/library" },
  { label: "Журнал", icon: ScrollText, path: "/journal" },
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

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = user?.email?.charAt(0).toUpperCase() || "U";

  const renderGroup = (label: string, items: NavItem[]) => (
    <div className="mb-3">
      {!collapsed && <p className="section-label">{label}</p>}
      <div className="space-y-0.5">
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 group relative",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-sidebar-foreground hover:bg-muted/60 hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors",
                active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
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
        collapsed ? "w-[64px]" : "w-[232px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border shrink-0">
        <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center shrink-0">
          <Flame className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base text-foreground tracking-tight">
              TrendTok
            </span>
            <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md uppercase">
              Beta
            </span>
          </div>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        {renderGroup("Поиск контента", searchItems)}
        {renderGroup("ИИ Видео", aiVideoItems)}
        {renderGroup("Идеи", ideaItems)}
        {isAdmin && renderGroup("Админ", [{ label: "Управление", icon: Shield, path: "/admin" }])}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border py-3 px-2 space-y-1 shrink-0">
        {/* Token counter */}
        {!collapsed && (
          <Link
            to="/tokens"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-muted/60 transition-colors group"
          >
            <Flame className="h-4 w-4 text-accent shrink-0" />
            <span className="flex-1 text-sm text-muted-foreground font-medium">Токены</span>
            <span className="text-xs font-bold text-foreground">1000</span>
          </Link>
        )}
        {collapsed && (
          <Link
            to="/tokens"
            title="Токены"
            className="flex justify-center py-2 rounded-xl text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <Coins className="h-[18px] w-[18px]" />
          </Link>
        )}

        {/* Pricing */}
        {!collapsed && (
          <Link
            to="/pricing"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <CreditCard className="h-4 w-4 shrink-0" />
            <span>Тарифы</span>
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Link>
        )}
        {collapsed && (
          <Link
            to="/pricing"
            title="Тарифы"
            className="flex justify-center py-2 rounded-xl text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <CreditCard className="h-[18px] w-[18px]" />
          </Link>
        )}

        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl border border-sidebar-border",
          collapsed && "justify-center px-0 border-0"
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
