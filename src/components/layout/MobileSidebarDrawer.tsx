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
import { TrendMeWordmark } from "@/components/TrendMeWordmark";
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
  badge?: { text: string; tone: "viral" | "muted" };
}

const searchItems: NavItem[] = [
  { label: "Тренды", icon: TrendingUp, path: "/trends", iconColor: "text-rose-500", badge: { text: "HOT", tone: "viral" } },
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
    <div className="mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground px-3 mb-1.5">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
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
        })}
      </div>
    </div>
  );

  const initial = (user?.email?.[0] || "U").toUpperCase();
  const displayName = (user?.user_metadata as any)?.name || user?.email?.split("@")[0] || "Гость";

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="left"
          className="w-[300px] max-w-[85vw] p-0 flex flex-col safe-area-top bg-background"
          style={{ maxHeight: '100dvh' }}
        >
          <SheetHeader className="px-5 h-16 border-b border-border flex flex-row items-center gap-2.5 shrink-0">
            <TrendMeWordmark size="lg" />
            <SheetTitle className="sr-only">Меню</SheetTitle>
          </SheetHeader>

          {/* User profile pill */}
          <button
            onClick={() => { navigate("/subscription"); onClose(); }}
            className="mx-3 mt-3 flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted text-left transition-colors shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center text-primary-foreground font-bold text-[14px] shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-semibold truncate text-foreground">{displayName}</div>
              <div className="text-[11px] text-muted-foreground truncate">{user?.email || "Гость"}</div>
            </div>
          </button>

          <nav className="flex-1 py-3 px-3 overflow-y-auto min-h-0">
            {renderGroup("Поиск контента", searchItems)}
            {renderGroup("Инструменты", toolItems)}
            {renderGroup("Идеи", ideaItems)}
            {isAdmin && renderGroup("Админ", [{ label: "Управление", icon: Shield, path: "/admin", iconColor: "text-emerald-500" }])}
          </nav>

          <div className="border-t border-border p-3 space-y-1 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-foreground/80 hover:text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              <span>Выйти из аккаунта</span>
            </button>

            {/* Account deletion — required by App Store */}
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-[12px] text-muted-foreground/70 hover:text-destructive hover:bg-destructive/5 transition-colors"
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
