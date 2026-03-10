import { useState, useRef, useCallback, useEffect } from "react";
import { hapticMedium, hapticSuccess } from "@/lib/haptics";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 80, maxPull = 120 }: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 0 || isRefreshing) return;
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      // Only prevent default scroll when actively pulling down from top
      const el = containerRef.current;
      if (el && el.scrollTop <= 0) {
        const dampened = Math.min(delta * 0.5, maxPull);
        setPullDistance(dampened);
        if (dampened > 10) e.preventDefault();
      } else {
        // User scrolled down, cancel pull gesture
        isPulling.current = false;
        setPullDistance(0);
      }
    } else {
      // Scrolling down (delta < 0), cancel pull gesture immediately
      isPulling.current = false;
      setPullDistance(0);
    }
  }, [isRefreshing, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6);
      hapticMedium();
      try {
        await onRefresh();
        hapticSuccess();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);

  return { containerRef, pullDistance, isRefreshing, progress };
}
