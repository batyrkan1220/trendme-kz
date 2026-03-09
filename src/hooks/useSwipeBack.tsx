import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { isNativePlatform } from "@/lib/native";
import { useIsMobile } from "@/hooks/use-mobile";

interface SwipeBackOptions {
  /** Custom back action. Defaults to navigate(-1) */
  onBack?: () => void;
  /** Minimum swipe distance to trigger back (px) */
  threshold?: number;
  /** Disable swipe-back (e.g. when a modal is open) */
  disabled?: boolean;
}

/**
 * Hook that adds iOS-style swipe-right-to-go-back gesture.
 * Returns props to spread on the page container element.
 * Only active on mobile / native platforms.
 */
export function useSwipeBack(options: SwipeBackOptions = {}) {
  const { threshold = 120, disabled = false } = options;
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef<"h" | "v" | null>(null);

  const isActive = (isMobile || isNativePlatform) && !disabled;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isActive) return;
    // Only trigger from left edge (first 40px)
    if (e.touches[0].clientX > 40) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    locked.current = null;
    setIsSwiping(false);
  }, [isActive]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isActive || startX.current === 0) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (!locked.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      locked.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }
    if (locked.current !== "h") return;

    const val = Math.max(0, dx);
    if (val > 0) {
      setIsSwiping(true);
      setSwipeX(val);
    }
  }, [isActive]);

  const onTouchEnd = useCallback(() => {
    if (!isSwiping) {
      startX.current = 0;
      return;
    }
    if (swipeX > threshold) {
      if (options.onBack) {
        options.onBack();
      } else {
        navigate(-1);
      }
    }
    setSwipeX(0);
    setIsSwiping(false);
    locked.current = null;
    startX.current = 0;
  }, [isSwiping, swipeX, threshold, navigate, options.onBack]);

  const swipeProps = isActive ? {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  } : {};

  const swipeStyle: React.CSSProperties = swipeX > 0 ? {
    transform: `translateX(${swipeX * 0.5}px)`,
    transition: isSwiping ? "none" : "transform 0.3s ease-out, opacity 0.3s ease-out",
    opacity: Math.max(0.4, 1 - swipeX / 400),
  } : {
    transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
  };

  // Edge indicator (shows a back arrow hint when swiping)
  const showIndicator = isSwiping && swipeX > 20;
  const indicatorProgress = Math.min(1, swipeX / threshold);

  return {
    swipeProps,
    swipeStyle,
    showIndicator,
    indicatorProgress,
    swipeX,
  };
}
