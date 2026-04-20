import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Flame, Search, Heart, User } from "lucide-react";
import { useCallback } from "react";

// Тек 4 tab — барлық керегі осында
const NAV_ITEMS = [
  { icon: Flame,  path: "/trends",  labelKk: "Трендтер", labelRu: "Тренды" },
  { icon: Search, path: "/search",  labelKk: "Іздеу",    labelRu: "Поиск" },
  { icon: Heart,  path: "/library", labelKk: "Сақталған",labelRu: "Избранное" },
  { icon: User,   path: "/account-analysis", labelKk: "Профиль", labelRu: "Профиль" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const goTo = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // Осы беттерде nav жасырынады
  const hideOn = ["/auth", "/reset-password", "/payment", "/payment-success", "/payment-failure", "/terms", "/privacy", "/"];
  if (hideOn.includes(location.pathname)) return null;

  return (
    <nav
      className="md:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "rgba(8,8,8,0.92)",
        backdropFilter: "blur(32px) saturate(1.5)",
        WebkitBackdropFilter: "blur(32px) saturate(1.5)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => goTo(item.path)}
              className="flex flex-col items-center gap-0.5 py-1.5 px-4 min-w-[64px] active:opacity-60 transition-opacity"
            >
              <item.icon
                className={cn(
                  "h-6 w-6 transition-all duration-200",
                  active ? "text-neon" : "text-white/50"
                )}
                strokeWidth={active ? 2.5 : 1.8}
                style={active ? { filter: "drop-shadow(0 0 6px hsl(var(--neon) / 0.5))" } : undefined}
              />
              <span className={cn(
                "text-[10px] font-semibold leading-tight transition-colors",
                active ? "text-neon" : "text-white/40"
              )}>
                {item.labelRu}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
