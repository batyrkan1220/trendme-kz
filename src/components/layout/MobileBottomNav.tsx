import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Flame, Search, Heart, CreditCard, LogOut } from "lucide-react";
import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

interface MobileBottomNavProps {
  /** Kept for API compatibility with AppLayout — drawer is no longer used. */
  onMenuOpen?: () => void;
  onDrawerClose?: () => void;
  drawerOpen?: boolean;
}

/**
 * Mobile bottom nav — 5 кнопок:
 * Тренды | Поиск | Избранное | Подписка | Выход
 */
export function MobileBottomNav({ drawerOpen }: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const goTo = useCallback(
    (path: string) => navigate(path),
    [navigate],
  );

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate("/auth");
  }, [signOut, navigate]);

  const Item = ({
    icon: Icon,
    label,
    active,
    onClick,
  }: {
    icon: React.ComponentType<any>;
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 rounded-[10px] font-semibold transition-all duration-150 press-feedback",
        active
          ? "bg-foreground text-background"
          : "text-foreground/70 hover:bg-muted",
      )}
    >
      <Icon
        className={cn(
          "h-[19px] w-[19px] shrink-0 transition-colors",
          active ? "text-background" : "text-muted-foreground",
        )}
        strokeWidth={active ? 2.4 : 2}
      />
      <span className="truncate leading-none text-[10px] max-w-full">{label}</span>
    </button>
  );

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden"
      style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        zIndex: drawerOpen ? 40 : 99999,
        pointerEvents: drawerOpen ? "none" : "auto",
        transition: "opacity 0.2s",
        opacity: drawerOpen ? 0 : 1,
      }}
    >
      <div
        className="px-1 pt-1.5 animate-bottom-nav-enter glass-strong"
        style={{
          paddingBottom: "max(6px, env(safe-area-inset-bottom, 0px))",
          borderTop: "1px solid hsl(var(--border))",
          boxShadow: "0 -4px 20px rgba(16, 24, 40, 0.06)",
        }}
      >
        <div className="flex items-center gap-0.5">
          <Item
            icon={Flame}
            label="Тренды"
            active={location.pathname === "/trends"}
            onClick={() => goTo("/trends")}
          />
          <Item
            icon={Search}
            label="Поиск"
            active={location.pathname === "/search"}
            onClick={() => goTo("/search")}
          />
          <Item
            icon={Heart}
            label="Избранное"
            active={location.pathname === "/library"}
            onClick={() => goTo("/library")}
          />
          <Item
            icon={CreditCard}
            label="Подписка"
            active={location.pathname === "/subscription"}
            onClick={() => goTo("/subscription")}
          />
          <Item
            icon={LogOut}
            label="Выход"
            active={false}
            onClick={handleLogout}
          />
        </div>
      </div>
    </nav>
  );
}
