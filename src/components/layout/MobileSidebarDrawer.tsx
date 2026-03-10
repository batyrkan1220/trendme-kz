import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard, TrendingUp, Search, Video, UserCircle,
  Heart, LogOut, Shield, CreditCard, Trash2
} from "lucide-react";
import { TrendMeLogo } from "@/components/TrendMeLogo";
import { isNativePlatform } from "@/lib/native";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  iconColor?: string;
}

const searchItems: NavItem[] = [
  { label: "Тренды", icon: TrendingUp, path: "/trends", iconColor: "text-rose-500" },
  { label: "Поиск по слову", icon: Search, path: "/search", iconColor: "text-blue-500" },
];

const toolItems: NavItem[] = [
  { label: "Анализ видео", icon: Video, path: "/video-analysis", iconColor: "text-orange-500" },
  
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
    onClose();
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (resp.error) throw resp.error;
      toast.success("Аккаунт удалён");
      await signOut();
      navigate("/auth");
    } catch {
      toast.error("Не удалось удалить аккаунт. Попробуйте позже.");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      onClose();
    }
  };

  const renderGroup = (label: string, items: NavItem[]) => (
    <div className="mb-3">
      <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.14em] px-3 mb-2">{label}</p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[14px] transition-all",
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
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="left" className="w-[280px] p-0 flex flex-col safe-area-top" style={{ maxHeight: '100dvh', background: 'rgba(12,12,12,0.96)', backdropFilter: 'blur(40px) saturate(1.5)', WebkitBackdropFilter: 'blur(40px) saturate(1.5)' }}>
          <SheetHeader className="px-4 h-14 border-b border-white/[0.06] flex flex-row items-center gap-2.5 shrink-0">
            <TrendMeLogo size={28} />
            <SheetTitle className="font-extrabold text-base tracking-tight text-foreground">trendme</SheetTitle>
          </SheetHeader>

          <nav className="flex-1 py-4 px-3 overflow-y-auto min-h-0">
            {renderGroup("Поиск контента", searchItems)}
            {renderGroup("Инструменты", toolItems)}
            {renderGroup("Идеи", ideaItems)}
            {isAdmin && renderGroup("Админ", [{ label: "Управление", icon: Shield, path: "/admin", iconColor: "text-emerald-500" }])}
          </nav>

          <div className="border-t border-white/[0.06] p-3 space-y-1 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Выйти</span>
            </button>

            {/* Account deletion — required by App Store */}
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5 transition-colors"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span>Удалить аккаунт</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить аккаунт?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие необратимо. Все ваши данные, избранные, сценарии и история будут удалены навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Удаление..." : "Удалить навсегда"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
