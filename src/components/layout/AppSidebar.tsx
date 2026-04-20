import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import {
  TrendingUp, Search, Heart, CreditCard,
  LogOut, ChevronLeft, ChevronRight, UserCircle, Shield,
} from "lucide-react";
import { TrendMeLogo } from "@/components/TrendMeLogo";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  iconColor?: string;
}

const mainItems: NavItem[] = [
  { label: "Тренды",         icon: TrendingUp,  path: "/trends",           iconColor: "text-rose-500" },
  { label: "Поиск",          icon: Search,       path: "/search",           iconColor: "text-blue-500" },
  { label: "Избранное",      icon: Heart,        path: "/library",          iconColor: "text-pink-500" },
  { label: "Анализ профиля", icon: UserCircle,   path: "/account-analysis", iconColor: "text-violet-500" },
  { label: "Подписка",       icon: CreditCard,   path: "/subscription",     iconColor: "text-primary" },
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

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-border/50 bg-sidebar-background transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-14 px-4 border-b border-border/30", collapsed && "justify-center px-0")}>
        {!collapsed && <TrendMeLogo className="h-7" />}
        {collapsed && <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-viral" /></div>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {mainItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all duration-150",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "text-foreground/70 hover:bg-muted/50",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", item.iconColor)} />
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            to="/admin"
            title={collapsed ? "Admin" : undefined}
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all text-muted-foreground hover:bg-muted/50", collapsed && "justify-center px-0")}
          >
            <Shield className="h-5 w-5 shrink-0 text-amber-500" />
            {!collapsed && <span>Admin</span>}
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-border/30">
        <button
          onClick={handleLogout}
          className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-muted-foreground hover:bg-muted/50 transition-all w-full", collapsed && "justify-center px-0")}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Выйти</span>}
        </button>
        <button
          onClick={onToggle}
          className={cn("flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] text-muted-foreground/50 hover:bg-muted/30 transition-all w-full mt-1", collapsed && "justify-center px-0")}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Свернуть</span></>}
        </button>
      </div>
    </aside>
  );
}
