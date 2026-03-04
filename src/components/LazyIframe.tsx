import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

interface LazyIframeProps {
  src: string;
  className?: string;
  allow?: string;
  allowFullScreen?: boolean;
}

export function LazyIframe({ src, className, allow, allowFullScreen }: LazyIframeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full h-full">
      {inView ? (
        <iframe src={src} className={className} allow={allow} allowFullScreen={allowFullScreen} />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Play className="h-10 w-10 text-muted-foreground/30" />
        </div>
      )}
    </div>
  );
}
