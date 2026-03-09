import { useSwipeBack } from "@/hooks/useSwipeBack";
import { ArrowLeft } from "lucide-react";

interface SwipeBackPageProps {
  children: React.ReactNode;
  onBack?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Wraps a page with iOS-style swipe-right-to-go-back gesture.
 * Shows a visual indicator on the left edge when swiping.
 * Only active on mobile.
 */
export function SwipeBackPage({ children, onBack, disabled, className = "" }: SwipeBackPageProps) {
  const { swipeProps, swipeStyle, showIndicator, indicatorProgress } = useSwipeBack({ onBack, disabled });

  return (
    <div className={`relative ${className}`} style={{ minHeight: "100%" }}>
      {/* Swipe back edge indicator */}
      {showIndicator && (
        <div
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[99999] pointer-events-none"
          style={{
            opacity: indicatorProgress,
            transform: `translateX(${indicatorProgress * 16 - 16}px) translateY(-50%)`,
            transition: "none",
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: `hsl(var(--primary) / ${0.15 + indicatorProgress * 0.25})`,
              backdropFilter: "blur(8px)",
              boxShadow: `0 2px 12px hsl(var(--primary) / ${indicatorProgress * 0.3})`,
            }}
          >
            <ArrowLeft
              className="h-5 w-5 text-primary"
              style={{ opacity: indicatorProgress }}
            />
          </div>
        </div>
      )}

      <div {...swipeProps} style={swipeStyle}>
        {children}
      </div>
    </div>
  );
}
