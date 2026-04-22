import { useNavigate } from "react-router-dom";
import { ChevronRight, Lock } from "lucide-react";

/**
 * Premium-style overlay shown on top of locked video cards
 * for users on the free/demo plan.
 */
export function LockedVideoOverlay() {
  const navigate = useNavigate();
  return (
    <div
      className="absolute inset-0 z-10 rounded-2xl overflow-hidden ring-1 ring-transparent transition-all duration-300 ease-out group-hover/lock:ring-viral/70"
      aria-label="Доступно на платном тарифе"
    >
      {/* Средний blur и затемнение */}
      <div className="absolute inset-0 backdrop-blur-sm bg-foreground/40 transition-all duration-300 ease-out group-hover/lock:backdrop-blur group-hover/lock:bg-foreground/45" />
      {/* Градиент снизу */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/45 via-foreground/10 to-foreground/15" />
      {/* Viral glow при hover */}
      <div className="absolute inset-0 opacity-0 group-hover/lock:opacity-100 transition-opacity duration-300 bg-gradient-to-tr from-viral/15 via-transparent to-viral/10" />

      <div className="relative z-10 h-full w-full flex items-center justify-center p-2.5">
        <div className="w-full flex flex-col items-center gap-2 px-2.5 py-3 rounded-xl bg-foreground/85 backdrop-blur-md border border-viral/40 shadow-glow-viral transition-all duration-300 ease-out group-hover/lock:scale-[1.04] group-hover/lock:border-viral/80 group-hover/lock:bg-foreground/90">
          <div className="h-9 w-9 rounded-full bg-viral flex items-center justify-center shadow-md transition-transform duration-300 ease-out group-hover/lock:scale-110 group-hover/lock:rotate-[-6deg]">
            <Lock className="h-4 w-4 text-foreground" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <p className="text-[11.5px] font-extrabold text-background leading-tight drop-shadow-sm">
              Только на платном тарифе
            </p>
            <p className="text-[9.5px] text-background/75 leading-tight mt-0.5">
              Откройте доступ ко всем трендам
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/subscription");
            }}
            className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-viral text-foreground text-[11px] font-bold transition-all duration-200 hover:opacity-90 active:scale-95 group-hover/lock:shadow-glow-viral"
          >
            Открыть
            <ChevronRight
              className="h-3 w-3 transition-transform duration-300 group-hover/lock:translate-x-0.5"
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
