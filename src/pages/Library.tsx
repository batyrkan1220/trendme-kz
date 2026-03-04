import { AppLayout } from "@/components/layout/AppLayout";
import { Eye, Heart, MessageCircle, Trash2, Sparkles, Copy, Play, ExternalLink, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

type Tab = "favorites" | "scripts";

export default function Library() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("favorites");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

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

  const { data: scripts = [] } = useQuery({
    queryKey: ["saved-scripts", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_scripts" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
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

  const removeScript = async (id: string) => {
    await supabase.from("saved_scripts" as any).delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["saved-scripts"] });
    toast.success("Сценарий удалён");
  };

  const copyScript = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Скопировано!");
  };

  const formatNum = (n: number | null) => {
    if (!n) return "0";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toLocaleString("ru-RU");
  };

  return (
    <AppLayout>
      <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Избранные ⭐</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-full sm:w-fit">
          <button
            onClick={() => setTab("favorites")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === "favorites"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className="h-4 w-4" />
            <span>Видео</span>
            <span className="bg-primary/10 text-primary text-xs font-semibold px-1.5 py-0.5 rounded-md">{favorites.length}</span>
          </button>
          <button
            onClick={() => setTab("scripts")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === "scripts"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Сценарии</span>
            <span className="bg-primary/10 text-primary text-xs font-semibold px-1.5 py-0.5 rounded-md">{scripts.length}</span>
          </button>
        </div>

        {/* Favorites tab */}
        {tab === "favorites" && (
          favorites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {favorites.map((fav: any) => {
                const video = fav.videos;
                if (!video) return null;
                const isPlaying = playingVideoId === video.platform_video_id;
                const tiktokEmbedUrl = `https://www.tiktok.com/player/v1/${video.platform_video_id}?autoplay=1&loop=1`;

                return (
                  <div
                    key={fav.id}
                    className="bg-card rounded-2xl border border-border/50 overflow-hidden card-shadow hover-lift card-shadow-hover transition-all group"
                  >
                    {/* Video / Cover area */}
                    <div className="relative aspect-[9/12] bg-muted/30 overflow-hidden">
                      {isPlaying ? (
                        <>
                          <iframe
                            src={tiktokEmbedUrl}
                            className="absolute inset-0 w-full h-full"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                          />
                          <button
                            onClick={() => setPlayingVideoId(null)}
                            className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-sm text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          {video.cover_url ? (
                            <img
                              src={video.cover_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="h-12 w-12 text-muted-foreground/20" />
                            </div>
                          )}
                          {/* Play overlay */}
                          <button
                            onClick={() => setPlayingVideoId(video.platform_video_id)}
                            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors"
                          >
                            <div className="h-14 w-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200">
                              <Play className="h-6 w-6 text-foreground ml-0.5" fill="currentColor" />
                            </div>
                          </button>
                          {/* Stats overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8">
                            <div className="flex items-center gap-3 text-white/90 text-xs font-medium">
                              <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{formatNum(video.views)}</span>
                              <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{formatNum(video.likes)}</span>
                              <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{formatNum(video.comments)}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 md:p-4 space-y-2">
                      <p className="text-xs md:text-sm font-medium text-foreground line-clamp-2 leading-snug">
                        {video.caption || "Без описания"}
                      </p>
                      <div className="flex items-center gap-2">
                        {video.author_avatar_url && (
                          <img src={video.author_avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                        )}
                        <span className="text-xs text-primary font-semibold">@{video.author_username}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(fav.created_at).toLocaleDateString("ru-RU")}
                        </span>
                        <div className="flex items-center gap-1">
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground/50 hover:text-primary transition-colors p-1"
                            title="Открыть в TikTok"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => removeFav(fav.id)}
                            className="text-muted-foreground/50 hover:text-destructive transition-colors p-1"
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">Пока пусто</p>
              <p className="text-sm text-muted-foreground">Добавьте видео через поиск или тренды</p>
            </div>
          )
        )}

        {/* Scripts tab */}
        {tab === "scripts" && (
          scripts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scripts.map((s: any) => (
                <div key={s.id} className="bg-card rounded-2xl border border-border/50 p-5 card-shadow hover-lift card-shadow-hover transition-all">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1">{s.title}</h3>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => copyScript(s.content)} className="text-muted-foreground/50 hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/50" title="Копировать">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeScript(s.id)} className="text-muted-foreground/50 hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/5" title="Удалить">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/70 line-clamp-5 whitespace-pre-wrap leading-relaxed">{s.content}</p>
                  <p className="text-[11px] text-muted-foreground mt-3">{new Date(s.created_at).toLocaleDateString("ru-RU")}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">Нет сценариев</p>
              <p className="text-sm text-muted-foreground">Сгенерируйте сценарий через анализ видео</p>
            </div>
          )
        )}
      </div>
    </AppLayout>
  );
}
