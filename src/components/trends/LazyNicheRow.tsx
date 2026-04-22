import { useRef, useState, useEffect, memo } from "react";
import { TrendNicheRow } from "./TrendNicheRow";
import { NicheGroup } from "@/config/niches";

interface LazyNicheRowProps {
  group: NicheGroup;
  videos: any[];
  userFavorites: string[];
  onToggleFav: (id: string) => void;
  onAnalyze: (v: any) => void;
  onScript?: (v: any) => void;
  playingId: string | null;
  onPlay: (id: string | null) => void;
  onViewAll: (nicheKey: string, subNicheKey?: string) => void;
  darkMode?: boolean;
  isFreePlan?: boolean;
  freeVisibleCount?: number;
}

function LazyNicheRowImpl(props: LazyNicheRowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!visible) {
    return (
      <div ref={ref} style={{ minHeight: 220 }}>
        <div className="h-5 bg-white/5 rounded w-32 animate-pulse mb-2" />
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="shrink-0 rounded-2xl overflow-hidden"
              style={{ width: "40vw", maxWidth: "200px", background: "#1a1a1a" }}
            >
              <div className="aspect-[9/16] bg-white/5 m-1.5 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <TrendNicheRow {...props} />;
}

export const LazyNicheRow = memo(LazyNicheRowImpl);
