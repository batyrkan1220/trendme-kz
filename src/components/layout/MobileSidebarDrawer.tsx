import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard, TrendingUp, Search, Video, UserCircle,
  Heart, ScrollText, LogOut, Shield, Sparkles, CreditCard
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
  { label: "AI Сценарий", icon: Sparkles, path: "/ai-script", iconColor: "text-pink-500" },
  { label: "Анализ профиля", icon: UserCircle, path: "/account-analysis", iconColor: "text-violet-500" },
];

const ideaItems: NavItem[] = [
  { label: "Избранные", icon: Heart, path: "/library", iconColor: "text-rose-500" },
  { label: "Подписка", icon: CreditCard, path: "/subscription", iconColor: "text-primary" },
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
