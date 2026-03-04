import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useTokens } from "@/hooks/useTokens";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard, TrendingUp, Search, Video, UserCircle,
  Star, ScrollText, LogOut, Flame, ArrowRight, Shield
} from "lucide-react";
import { TrendMeLogo } from "@/components/TrendMeLogo";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  iconColor?: string;
}

const searchItems: NavItem[] = [
  { label: "Главная", icon: LayoutDashboard, path: "/dashboard", iconColor: "text-amber-500" },
  { label: "Поиск по слову", icon: Search, path: "/search", iconColor: "text-blue-500" },
  { label: "Тренды", icon: TrendingUp, path: "/trends", iconColor: "text-rose-500" },
];

const toolItems: NavItem[] = [
  { label: "Анализ видео", icon: Video, path: "/video-analysis", iconColor: "text-orange-500" },
  { label: "Анализ профиля", icon: UserCircle, path: "/account-analysis", iconColor: "text-violet-500" },
];

const ideaItems: NavItem[] = [
  { label: "Избранные", icon: Star, path: "/library", iconColor: "text-amber-500" },
  { label: "Журнал", icon: ScrollText, path: "/journal", iconColor: "text-sky-500" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebarDrawer({ open, onClose }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { balance, totalEarned } = useTokens();
  const tokenPercent = totalEarned > 0 ? Math.min(100, (balance / totalEarned) * 100) : 0;

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
    onClose();
  };

  const renderGroup = (label: string, items: NavItem[]) => (
    <div className="mb-3">
      <p className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider px-3 mb-1.5">{label}</p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-foreground/80 hover:bg-muted/50"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", item.iconColor)} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  const initials = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-[280px] p-0 bg-card flex flex-col" style={{ maxHeight: '100dvh' }}>
        <SheetHeader className="px-4 h-14 border-b border-border/50 flex flex-row items-center gap-2.5 shrink-0">
          <TrendMeLogo size={28} />
          <SheetTitle className="font-bold text-base tracking-tight text-foreground">trendme</SheetTitle>
          
        </SheetHeader>

        <nav className="flex-1 py-4 px-3 overflow-y-auto min-h-0">
          {renderGroup("Поиск контента", searchItems)}
          {renderGroup("Инструменты", toolItems)}
          {renderGroup("Идеи", ideaItems)}
          {isAdmin && renderGroup("Админ", [{ label: "Управление", icon: Shield, path: "/admin", iconColor: "text-emerald-500" }])}
        </nav>

        <div className="border-t border-border/50 p-3 space-y-2 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px)+80px)]">
          {/* Token widget - matches desktop */}
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
              onClick={onClose}
              className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              Открыть тарифы <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Выйти</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
