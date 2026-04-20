import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import {
  TrendingUp, Search, Video, UserCircle, Heart,
  Shield, Sparkles, CreditCard, LogOut
} from "lucide-react";
import { toast } from "sonner";
import { TrendMeWordmark } from "@/components/TrendMeWordmark";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  iconColor?: string;
  badge?: { text: string; tone: "viral" | "muted" };
}

const searchItems: NavItem[] = [
  { label: "Тренды", icon: TrendingUp, path: "/trends", iconColor: "text-rose-500", badge: { text: "HOT", tone: "viral" } },
  { label: "Поиск по слову", icon: Search, path: "/search", iconColor: "text-blue-500" },
];

const toolItems: NavItem[] = [
  { label: "Анализ профиля", icon: UserCircle, path: "/account-analysis", iconColor: "text-violet-500" },
];

const ideaItems: NavItem[] = [
  { label: "Избранные", icon: Heart, path: "/library", iconColor: "text-rose-500" },
  { label: "Подписка", icon: CreditCard, path: "/subscription", iconColor: "text-primary" },
];

interface AppSidebarProps {
  /** kept for layout-API compatibility — sidebar is no longer collapsible */
  collapsed?: boolean;
  onToggle?: () => void;
}

export function AppSidebar(_props: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();

  const initial = (user?.email?.[0] || "U").toUpperCase();
  const displayName = (user?.user_metadata as any)?.name || user?.email?.split("@")[0] || "Гость";

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Вы вышли из аккаунта");
      navigate("/auth", { replace: true });
    } catch (e: any) {
      toast.error(e?.message || "Не удалось выйти");
    }
  };

  const renderItem = (item: NavItem) => {
    const active = location.pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        className={cn(
          "group flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13.5px] font-medium transition-all duration-150",
          active
            ? "bg-foreground text-background font-semibold shadow-soft"
            : "text-foreground/70 hover:bg-muted hover:text-foreground"
        )}
      >
        <item.icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            active ? "text-viral" : item.iconColor
          )}
        />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge && (
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              item.badge.tone === "viral"
                ? "bg-viral text-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {item.badge.text}
          </span>
        )}
      </Link>
    );
  };

  const renderGroup = (label: string, items: NavItem[]) => (
    <div className="mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground px-3 mb-1.5">
        {label}
      </p>
      <div className="space-y-0.5">{items.map(renderItem)}</div>
    </div>
  );

  return (
    <aside className="h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 z-30 w-[240px]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-sidebar-border shrink-0">
        <TrendMeWordmark size="lg" />
      </div>

      {/* Quick search (visual only) */}
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 px-3 h-9 bg-muted rounded-lg">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Быстрый поиск..."
            onFocus={() => navigate("/search")}
            className="flex-1 bg-transparent text-[13px] placeholder:text-muted-foreground focus:outline-none"
          />
          <span className="text-[10px] font-semibold text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5">
            ⌘K
          </span>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {renderGroup("Поиск контента", searchItems)}
        {renderGroup("Инструменты", toolItems)}
        {renderGroup("Идеи", ideaItems)}
        {isAdmin && renderGroup("Админ", [{ label: "Управление", icon: Shield, path: "/admin", iconColor: "text-emerald-500" }])}
      </nav>

      {/* Upgrade card */}
      <div className="px-3 pb-3">
        <div className="relative overflow-hidden rounded-xl bg-foreground text-background p-4">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-viral/20 blur-2xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide bg-viral text-foreground px-2 py-0.5 rounded-full">
              <Sparkles className="h-2.5 w-2.5" />
              PRO
            </span>
            <div className="text-[13px] font-semibold leading-tight mt-2">Безлимит на всё</div>
            <div className="text-[11px] text-background/60 mt-1">150+ ниш, ИИ-сценарии, анализ</div>
            <button
              onClick={() => navigate("/subscription")}
              className="mt-3 w-full py-2 rounded-lg bg-background text-foreground text-[12px] font-semibold hover:bg-muted transition"
            >
              Улучшить
            </button>
          </div>
        </div>
      </div>

      {/* User pill + sign out */}
      <div className="border-t border-sidebar-border px-3 py-3 shrink-0 space-y-1.5">
        <button
          onClick={() => navigate("/subscription")}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted w-full text-left transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center text-primary-foreground font-bold text-[13px] shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold truncate text-foreground">{displayName}</div>
            <div className="text-[11px] text-muted-foreground truncate">{user?.email || "—"}</div>
          </div>
        </button>
        <button
          onClick={handleSignOut}
          className="group flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] w-full text-[13px] font-medium text-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 text-muted-foreground group-hover:text-destructive transition-colors" />
          <span className="flex-1 text-left">Выйти из аккаунта</span>
        </button>
      </div>
    </aside>
  );
}
