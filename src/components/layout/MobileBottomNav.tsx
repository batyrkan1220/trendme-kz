import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Flame, Search, Heart, User } from "lucide-react";
import { useCallback } from "react";

const NAV_ITEMS = [
  { icon: Flame,  path: "/trends",            labelRu: "Тренды" },
  { icon: Search, path: "/search",             labelRu: "Поиск" },
  { icon: Heart,  path: "/library",            labelRu: "Избранное" },
  { icon: User,   path: "/account-analysis",   labelRu: "Профиль" },
];

const HIDE_ON = ["/auth", "/reset-password", "/payment", "/payment-success", "/payment-failure", "/terms", "/privacy", "/"];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  if (HIDE_ON.includes(location.pathname)) return null;

  return (
    <nav
      className="md:hidden"
      style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        zIndex: 99999,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(24px) saturate(1.5)",
        WebkitBackdropFilter: "blur(24px) saturate(1.5)",
        borderTop: "1px solid hsl(240 6% 90% / 0.8)",
        boxShadow: "0 -1px 0 rgba(0,0,0,0.04), 0 -8px 24px rgba(16,24,40,0.06)",
      }}
    >
      <div
        className="flex items-center justify-around px-2 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}
      >
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 py-1 px-4 min-w-[60px] press-feedback"
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                active ? "bg-primary-soft" : "bg-transparent"
              )}>
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>
              <span className={cn(
                "text-[10px] font-semibold leading-tight transition-colors",
                active ? "text-primary" : "text-muted-foreground"
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
