import { AppLayout } from "@/components/layout/AppLayout";
import { Eye, Heart, MessageCircle, Trash2, Play, ExternalLink, X, Share2, Music } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
};

const getTimeAgo = (dateStr: string | null) => {
  if (!dateStr) return "";
  const h = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (h < 1) return "только что";
  if (h < 24) return `${h}ч назад`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}д назад`;
  return `${Math.floor(d / 30)} мес. назад`;
};

export default function Library() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [playingId, setPlayingId] = useState<string | null>(null);

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites-list", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("*, videos(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const removeFav = async (favId: string) => {
    await supabase.from("favorites").delete().eq("id", favId);
    queryClient.invalidateQueries({ queryKey: ["favorites-list"] });
    queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
    queryClient.invalidateQueries({ queryKey: ["favorites-count"] });
    toast.success("Удалено из избранного");
  };

  return (
    <AppLayout>
      <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-3xl font-bold text-foreground">Избранные ⭐</h1>
          <span className="text-sm text-muted-foreground">{favorites.length} видео</span>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">Пока пусто</p>
            <p className="text-sm text-muted-foreground">Добавьте видео через поиск или тренды</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 md:gap-4 pb-20 md:pb-0">
            {favorites.map((fav: any) => {
              const video = fav.videos;
              if (!video) return null;
              const timeAgo = getTimeAgo(video.published_at);

              return (
                <div key={fav.id} className="group bg-card rounded-xl md:rounded-2xl border border-border/40 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative flex flex-col">
                  <div className="relative aspect-[9/14] bg-black overflow-hidden rounded-xl md:rounded-2xl m-1.5 md:m-2">
                    {playingId === video.id ? (
                      <>
                        <iframe
                          src={`https://www.tiktok.com/player/v1/${video.platform_video_id}?music_info=1&description=0&muted=0&play_button=1&volume_control=1`}
                          className="w-full h-full border-0"
                          allow="autoplay; encrypted-media; fullscreen"
                          allowFullScreen
                        />
                        <button onClick={() => setPlayingId(null)} className="absolute top-2 right-2 z-20 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        {video.cover_url ? (
                          <img src={video.cover_url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover cursor-pointer" onClick={() => setPlayingId(video.id)} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center cursor-pointer bg-muted" onClick={() => setPlayingId(video.id)}>
                            <Play className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2.5 z-10 pointer-events-none">
                          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
                            <Music className="h-3 w-3 text-foreground" />
                            <span className="text-[11px] font-bold text-foreground">Tik-Tok</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); removeFav(fav.id); }} className="pointer-events-auto w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); window.open(video.url, '_blank'); }} className="absolute top-12 right-2.5 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                          <ExternalLink className="h-3.5 w-3.5 text-foreground" />
                        </button>
                        <div className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200" onClick={() => setPlayingId(video.id)}>
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center">
                            <Play className="h-6 w-6 md:h-7 md:w-7 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-around px-1.5 md:px-2 py-1.5 md:py-2 border-b border-border/30">
                    <span className="flex flex-col items-center gap-0.5"><Eye className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" /><span className="text-[10px] md:text-[11px] font-bold text-foreground">{fmt(Number(video.views))}</span></span>
                    <span className="flex flex-col items-center gap-0.5"><Heart className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" /><span className="text-[10px] md:text-[11px] font-bold text-foreground">{fmt(Number(video.likes))}</span></span>
                    <span className="flex flex-col items-center gap-0.5"><MessageCircle className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" /><span className="text-[10px] md:text-[11px] font-bold text-foreground">{fmt(Number(video.comments))}</span></span>
                    <span className="flex flex-col items-center gap-0.5"><Share2 className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" /><span className="text-[10px] md:text-[11px] font-bold text-foreground">{fmt(Number(video.shares || 0))}</span></span>
                  </div>
                  <div className="px-2 md:px-3 pt-2 md:pt-3 flex items-center gap-1.5 md:gap-2">
                    {video.author_avatar_url ? (
                      <img src={video.author_avatar_url} alt="" loading="lazy" className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover border-2 border-border/50 flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-muted flex-shrink-0" />
                    )}
                    <span className="text-xs md:text-sm font-semibold text-foreground truncate">@{video.author_username}</span>
                  </div>
                  <div className="px-2 md:px-3 pt-1 md:pt-1.5 pb-1">
                    <p className="text-[10px] md:text-xs text-foreground/80 line-clamp-2 leading-relaxed">{video.caption || "Без описания"}</p>
                  </div>
                  {timeAgo && (
                    <div className="px-2 md:px-3 pb-2">
                      <span className="text-[10px] md:text-[11px] text-muted-foreground">{timeAgo}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
