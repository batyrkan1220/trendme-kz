import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import {
  LayoutDashboard, TrendingUp, Search,
  Video, UserCircle, Heart, ScrollText,
  ArrowRight, Shield,
  LogOut, ChevronLeft, ChevronRight, CreditCard
} from "lucide-react";
import { TrendMeWordmark } from "@/components/TrendMeWordmark";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  iconColor?: string;
  badge?: string;
}

const searchItems: NavItem[] = [
  { label: "Тренды", icon: TrendingUp, path: "/trends", iconColor: "text-rose-500" },
  { label: "Поиск по слову", icon: Search, path: "/search", iconColor: "text-blue-500" },
];

const aiVideoItems: NavItem[] = [
  { label: "Анализ видео", icon: Video, path: "/video-analysis", iconColor: "text-orange-500" },
  
  { label: "Анализ профиля", icon: UserCircle, path: "/account-analysis", iconColor: "text-violet-500" },
];

const ideaItems: NavItem[] = [
  { label: "Избранные", icon: Heart, path: "/library", iconColor: "text-rose-500" },
  { label: "Подписка", icon: CreditCard, path: "/subscription", iconColor: "text-primary" },
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
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-sidebar-border shrink-0">
        {collapsed ? (
          <span
            className="inline-block rounded-full mx-auto"
            style={{
              width: 14,
              height: 14,
              background: "var(--gradient-brand)",
              boxShadow: "0 0 0 4px hsl(var(--primary) / 0.12)",
            }}
          />
        ) : (
          <TrendMeWordmark size="lg" />
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
