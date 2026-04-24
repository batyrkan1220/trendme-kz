import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Flame, Search, Crown, Heart, User, type LucideIcon } from "lucide-react";
import { useCallback } from "react";
import { useIsFreePlan } from "@/hooks/useIsFreePlan";
import { useFreeCredits } from "@/hooks/useFreeCredits";

interface MobileBottomNavProps {
  /** Сақталған: бұрын Analyze үшін paywall ашатын. Қазір қолданылмайды. */
  onOpenPaywall?: () => void;
}

type NavItem = {
  key: string;
  icon: LucideIcon;
  label: string;
  path: string;
  /** Free-планда paywall-ге бағытталатын элемент. */
  freeGated?: boolean;
};

const ITEMS: NavItem[] = [
  { key: "trends", icon: Flame, label: "Тренды", path: "/trends" },
  { key: "search", icon: Search, label: "Поиск", path: "/search" },
  { key: "subscription", icon: Crown, label: "Подписка", path: "/subscription" },
  { key: "library", icon: Heart, label: "Избранное", path: "/library" },
  { key: "profile", icon: User, label: "Профиль", path: "/" },
];

/**
 * Mobile bottom nav — 5 иконка, hamburger жоқ.
 * Active күйінде иконка астында 3×3 жасыл нүкте.
 * Analyze (freeGated) тармағы free-планда paywall-ді ашады.
 *
 * ⚠ trendsee.io дизайнын ҚАЙТАЛАМА — бұл TrendMe жеке стилі: жұмсақ
 * glassmorphism фон, жасыл primary акцент, минималды иконка-зат.
 */
export function MobileBottomNav({ onOpenPaywall }: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isFreePlan } = useIsFreePlan();
  const { analysesLeft } = useFreeCredits();

  const handleClick = useCallback(
    (item: NavItem) => {
      if (item.freeGated && isFreePlan && analysesLeft <= 0 && onOpenPaywall) {
        onOpenPaywall();
        return;
      }
      navigate(item.path);
    },
    [isFreePlan, analysesLeft, navigate, onOpenPaywall],
  );

  const isActive = (item: NavItem) => location.pathname === item.path;

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-[99999]"
    >
      <div
        className="px-1 pt-1.5 glass-strong"
        style={{
          paddingBottom: "max(6px, env(safe-area-inset-bottom, 0px))",
          borderTop: "1px solid hsl(var(--border))",
          boxShadow: "0 -4px 20px rgba(16, 24, 40, 0.06)",
        }}
      >
        <div className="flex items-center gap-0.5">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button
                key={item.key}
                onClick={() => handleClick(item)}
                className={cn(
                  "relative flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 rounded-[10px] font-semibold transition-all duration-150 press-feedback",
                  active
                    ? "bg-foreground text-background"
                    : "text-foreground/70 hover:bg-muted",
                )}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
              >
                <Icon
                  className={cn(
                    "h-[19px] w-[19px] shrink-0 transition-colors",
                    active ? "text-background" : "text-muted-foreground",
                  )}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span className="truncate leading-none text-[10px] max-w-full">
                  {item.label}
                </span>
                {/* Active индикатор — иконка астында 3×3 жасыл нүкте */}
                {active && (
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.7)]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
