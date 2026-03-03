import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard, TrendingUp, Search, Video, UserCircle,
  BookOpen, ScrollText, Coins, CreditCard, LogOut, Flame, ArrowRight
} from "lucide-react";
import logoIcon from "@/assets/logo-icon-v2.png";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const searchItems: NavItem[] = [
  { label: "Главная", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Поиск по слову", icon: Search, path: "/search" },
  { label: "Тренды", icon: TrendingUp, path: "/trends" },
];

const toolItems: NavItem[] = [
  { label: "Анализ видео", icon: Video, path: "/video-analysis" },
  { label: "Анализ профиля", icon: UserCircle, path: "/account-analysis" },
];

const ideaItems: NavItem[] = [
  { label: "Избранные", icon: BookOpen, path: "/library" },
  { label: "Журнал", icon: ScrollText, path: "/journal" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebarDrawer({ open, onClose }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
    onClose();
  };

  const renderGroup = (label: string, items: NavItem[]) => (
    <div className="mb-4">
      <p className="section-label">{label}</p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground hover:bg-muted/60"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground")} />
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
      <SheetContent side="left" className="w-[280px] p-0 bg-card">
        <SheetHeader className="px-4 h-14 border-b border-border/50 flex flex-row items-center gap-2.5">
          <img src={logoIcon} alt="TrendMe" className="h-8 w-8 rounded-lg shrink-0 object-cover" />
          <SheetTitle className="font-bold text-base text-foreground tracking-tight">TrendMe</SheetTitle>
          <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md uppercase">Beta</span>
        </SheetHeader>

        <nav className="py-4 px-3 flex-1 overflow-y-auto">
          {renderGroup("Поиск контента", searchItems)}
          {renderGroup("Инструменты", toolItems)}
          {renderGroup("Идеи", ideaItems)}
        </nav>

        <div className="border-t border-border/50 p-3 space-y-1">
          <Link to="/tokens" onClick={onClose} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-muted/60 transition-colors">
            <Flame className="h-4 w-4 text-primary shrink-0" />
            <span className="flex-1 text-muted-foreground font-medium">Токены</span>
            <span className="text-xs font-bold text-foreground">1000</span>
          </Link>
          <Link to="/pricing" onClick={onClose} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted/60 transition-colors">
            <CreditCard className="h-4 w-4 shrink-0" />
            <span>Тарифы</span>
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Link>

          <div className="flex items-center gap-2.5 px-3 py-2.5 mt-2 rounded-xl border border-border/50">
            <div className="h-7 w-7 rounded-full gradient-hero shrink-0 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.email?.split("@")[0] || "Пользователь"}
              </p>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
