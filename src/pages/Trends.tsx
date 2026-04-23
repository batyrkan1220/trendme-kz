import { AppLayout } from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { TrendingUp, WifiOff, Eye, Heart, MessageCircle, X, ExternalLink, BadgeCheck, Instagram } from "lucide-react";
import { trackPlausible } from "@/components/TrackingPixels";
import { useOnlineStatus, saveTrendsCache, loadTrendsCache } from "@/hooks/useOfflineCache";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface TrendVideo {
  id: string;
  shortcode: string | null;
  url: string;
  author_username: string | null;
  full_name: string | null;
  profile_pic_url: string | null;
  is_verified: boolean | null;
  caption: string | null;
  thumbnail_url: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  posted_at: string | null;
  viral_score: number | null;
}

const formatNum = (n: number | null | undefined): string => {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(v);
};

export default function Trends() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const [openVideo, setOpenVideo] = useState<TrendVideo | null>(null);

  useEffect(() => {
    trackPlausible("Trends Viewed");
  }, []);

  const { data: videos = [], isLoading } = useQuery<TrendVideo[]>({
    queryKey: ["ig-trends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select(
          "id, shortcode, url, author_username, full_name, profile_pic_url, is_verified, caption, thumbnail_url, view_count, like_count, comment_count, posted_at, viral_score",
        )
        .eq("source", "trends")
        .eq("platform", "instagram")
        .order("viral_score", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as TrendVideo[];
    },
    staleTime: 120_000,
    placeholderData: (prev) => prev,
    enabled: isOnline,
  });

  const cachedVideos = useMemo(
    () => (loadTrendsCache() ?? []) as unknown as TrendVideo[],
    [],
  );
  useEffect(() => {
    if (videos.length > 0) saveTrendsCache(videos as any);
  }, [videos]);

  const effectiveVideos = isOnline && videos.length > 0 ? videos : cachedVideos;

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["ig-trends"] });
    await new Promise((r) => setTimeout(r, 500));
  };
  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  return (
    <AppLayout>
      <div
        ref={containerRef}
        className="overflow-x-hidden overflow-y-auto h-full text-foreground bg-background"
      >
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          progress={progress}
        />

        {!isOnline && (
          <div className="mx-4 md:mx-6 lg:mx-8 mt-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-500 text-[12.5px]">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span>Офлайн режим — кэшированные данные</span>
          </div>
        )}

        <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Тренды</h1>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Instagram className="h-3.5 w-3.5" />
            Вирусное сейчас в Instagram
          </p>
        </div>

        <div className="px-4 md:px-6 lg:px-8 pb-10">
          {isLoading && effectiveVideos.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[9/16] rounded-xl bg-card/50 animate-pulse"
                />
              ))}
            </div>
          ) : effectiveVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <TrendingUp className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-base font-medium mb-1">Тренды пока пустые</p>
              <p className="text-sm text-muted-foreground">
                Администратор скоро обновит ленту
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {effectiveVideos.map((v) => (
                <TrendCard key={v.id} video={v} onOpen={() => setOpenVideo(v)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {openVideo && (
        <ReelModal video={openVideo} onClose={() => setOpenVideo(null)} />
      )}
    </AppLayout>
  );
}

function TrendCard({ video, onOpen }: { video: TrendVideo; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-card border border-border/50 text-left transition-all hover:scale-[1.02] hover:border-primary/40 hover:shadow-glow-viral active:scale-[0.99]"
    >
      {video.thumbnail_url ? (
        <img
          src={video.thumbnail_url}
          alt={video.caption ?? video.author_username ?? ""}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Instagram className="h-8 w-8 text-muted-foreground/30" />
        </div>
      )}

      {/* IG badge */}
      <div className="absolute top-2 right-2 h-6 w-6 rounded-md bg-background/80 backdrop-blur-md flex items-center justify-center">
        <Instagram className="h-3.5 w-3.5 text-foreground" />
      </div>

      {/* Bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 pt-8 bg-gradient-to-t from-black/85 via-black/50 to-transparent">
        <div className="flex items-center gap-1 mb-1.5 min-w-0">
          <span className="text-white text-[12px] font-semibold truncate">
            @{video.author_username ?? "unknown"}
          </span>
          {video.is_verified && (
            <BadgeCheck className="h-3 w-3 text-[#3b9eff] shrink-0 fill-[#3b9eff] stroke-white" />
          )}
        </div>
        <div className="flex items-center gap-2.5 text-white/90 text-[11px] tabular-nums">
          <span className="flex items-center gap-0.5">
            <Eye className="h-3 w-3" /> {formatNum(video.view_count)}
          </span>
          <span className="flex items-center gap-0.5">
            <Heart className="h-3 w-3" /> {formatNum(video.like_count)}
          </span>
          <span className="flex items-center gap-0.5">
            <MessageCircle className="h-3 w-3" /> {formatNum(video.comment_count)}
          </span>
        </div>
      </div>
    </button>
  );
}

function ReelModal({ video, onClose }: { video: TrendVideo; onClose: () => void }) {
  const embedUrl = video.shortcode
    ? `https://www.instagram.com/reel/${video.shortcode}/embed/`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
        aria-label="Закрыть"
      >
        <X className="h-5 w-5 text-white" />
      </button>

      <div
        className="relative w-full max-w-md aspect-[9/16] bg-black rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allow="encrypted-media;"
            allowFullScreen
            title={video.caption ?? "Instagram reel"}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <p>Видео недоступно</p>
          </div>
        )}
      </div>

      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink className="h-4 w-4" />
        Открыть в Instagram
      </a>
    </div>
  );
}
