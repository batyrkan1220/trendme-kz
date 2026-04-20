import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { TrendingUp, Search, Heart, CreditCard, LogOut, ChevronLeft, ChevronRight, UserCircle, Shield } from "lucide-react";
import { TrendMeLogo } from "@/components/TrendMeLogo";

const NAV_ITEMS = [
  { label: "Тренды",         icon: TrendingUp,  path: "/trends",            iconColor: "text-rose-500",    bg: "bg-rose-50" },
  { label: "Поиск",          icon: Search,       path: "/search",            iconColor: "text-blue-500",    bg: "bg-blue-50" },
  { label: "Избранное",      icon: Heart,        path: "/library",           iconColor: "text-pink-500",    bg: "bg-pink-50" },
  { label: "Анализ профиля", icon: UserCircle,   path: "/account-analysis",  iconColor: "text-violet-500",  bg: "bg-violet-50" },
  { label: "Подписка",       icon: CreditCard,   path: "/subscription",      iconColor: "text-primary",     bg: "bg-primary-soft" },
];

export function AppSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin } = useAdmin();

  return (
    <aside className={cn(
      "flex flex-col h-full border-r border-border bg-sidebar-background transition-all duration-300 shrink-0",
      collapsed ? "w-[68px]" : "w-[220px]"
    )}>
      {/* Logo */}
      <div className={cn("flex items-center h-14 border-b border-border px-4", collapsed && "justify-center px-0")}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center relative">
              <div className="w-2.5 h-2.5 rounded-full bg-viral" />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-viral animate-ping" />
            </div>
            <span className="font-bold text-[16px] tracking-tight text-foreground">trendme</span>
          </div>
        ) : (
          <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-viral" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground px-3 py-1.5">Навигация</p>
        )}
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group",
                active ? "bg-primary-soft text-primary" : "text-foreground/70 hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all",
                active ? "bg-primary text-primary-foreground" : `${item.bg} ${item.iconColor}`
              )}>
                <item.icon className="h-3.5 w-3.5" strokeWidth={active ? 2.5 : 2} />
              </div>
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            </Link>
          );
        })}

        {isAdmin && (
          <Link to="/admin" title={collapsed ? "Admin" : undefined}
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-muted-foreground hover:bg-muted transition-all", collapsed && "justify-center px-0")}>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <Shield className="h-3.5 w-3.5 text-amber-500" />
            </div>
            {!collapsed && <span>Admin</span>}
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-border space-y-0.5">
        <button onClick={() => { signOut(); navigate("/auth"); }}
          className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-destructive transition-all w-full", collapsed && "justify-center px-0")}>
          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <LogOut className="h-3.5 w-3.5" />
          </div>
          {!collapsed && <span>Выйти</span>}
        </button>
        <button onClick={onToggle}
          className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] text-muted-foreground/50 hover:bg-muted/60 transition-all w-full", collapsed && "justify-center px-0")}>
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <><ChevronLeft className="h-3.5 w-3.5" /><span>Свернуть</span></>}
        </button>
      </div>
    </aside>
  );
}
