import { useState, useRef, useEffect } from "react";
import { X, Loader2, Eye, Heart, MessageCircle, Share2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { VideoCardData } from "./VideoCard";

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
};

interface MobileVideoPlayerProps {
  video: VideoCardData;
  onClose: () => void;
}

export function MobileVideoPlayer({ video, onClose }: MobileVideoPlayerProps) {
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoId = video.platform_video_id || video.id;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("socialkit", {
          body: { action: "get_play_url", video_url: video.url },
        });
        if (!cancelled) {
          if (!error && data?.play_url) {
            setPlayUrl(data.play_url);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [video.url]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2 min-w-0">
          {video.author_avatar_url && (
            <img src={video.author_avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0" />
          )}
          {video.author_username && (
            <span className="text-white text-sm font-semibold truncate">@{video.author_username}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(video.url, "_blank")}
            className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center"
          >
            <ExternalLink className="h-4 w-4 text-white" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="flex-1 flex items-center justify-center">
        {loading ? (
          <Loader2 className="h-10 w-10 text-white animate-spin" />
        ) : playUrl ? (
          <video
            ref={videoRef}
            src={playUrl}
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <iframe
            src={`https://www.tiktok.com/player/v1/${videoId}?music_info=1&description=0&muted=0&play_button=1&volume_control=1`}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        )}
      </div>

      {/* Bottom stats */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-4 pb-6">
        {(video.caption || video.desc) && (
          <p className="text-white text-xs mb-3 line-clamp-3 leading-relaxed">
            {video.caption || video.desc}
          </p>
        )}
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-white/70" />
            <span className="text-white text-xs font-semibold">{fmt(Number(video.views) || 0)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-white/70" />
            <span className="text-white text-xs font-semibold">{fmt(Number(video.likes) || 0)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4 text-white/70" />
            <span className="text-white text-xs font-semibold">{fmt(Number(video.comments) || 0)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Share2 className="h-4 w-4 text-white/70" />
            <span className="text-white text-xs font-semibold">{fmt(Number(video.shares || 0))}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
