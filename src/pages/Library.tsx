import { AppLayout } from "@/components/layout/AppLayout";
import { BookOpen, Eye, Heart, MessageCircle, Trash2, Sparkles, Copy } from "lucide-react";
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

  return (
    <AppLayout>
      <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 animate-fade-in">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Избранные ⭐</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-full sm:w-fit">
          <button
            onClick={() => setTab("favorites")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "favorites"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className="h-4 w-4" />
            <span>Избранное</span>
            <span className="text-xs text-muted-foreground">({favorites.length})</span>
          </button>
          <button
            onClick={() => setTab("scripts")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "scripts"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Сценарии</span>
            <span className="text-xs text-muted-foreground">({scripts.length})</span>
          </button>
        </div>

        {/* Favorites tab */}
        {tab === "favorites" && (
          favorites.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-5">
              {favorites.map((fav: any) => {
                const video = fav.videos;
                if (!video) return null;
                return (
                  <div key={fav.id} className="bg-card rounded-xl md:rounded-2xl border border-border/50 overflow-hidden card-shadow hover-lift card-shadow-hover transition-all">
                    {video.cover_url && (
                      <img src={video.cover_url} alt="" className="w-full h-32 md:h-48 object-cover rounded-xl md:rounded-2xl p-1.5 md:p-2" />
                    )}
                    <div className="p-2 md:p-4 space-y-1.5 md:space-y-2">
                      <p className="text-xs md:text-sm font-medium text-foreground line-clamp-2">{video.caption || "Без описания"}</p>
                      <p className="text-[10px] md:text-xs text-primary font-semibold">@{video.author_username}</p>
                      <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{Number(video.views).toLocaleString("ru-RU")}</span>
                        <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{Number(video.likes).toLocaleString("ru-RU")}</span>
                        <span className="hidden sm:flex items-center gap-0.5"><MessageCircle className="h-3 w-3" />{Number(video.comments).toLocaleString("ru-RU")}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1.5 md:pt-2 border-t border-border/50">
                        <span className="text-xs text-muted-foreground">
                          {new Date(fav.created_at).toLocaleDateString("ru-RU")}
                        </span>
                        <button onClick={() => removeFav(fav.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
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
              <p className="text-muted-foreground font-medium">Нет избранных видео. Добавьте через поиск или анализ аккаунта.</p>
            </div>
          )
        )}

        {/* Scripts tab */}
        {tab === "scripts" && (
          scripts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {scripts.map((s: any) => (
                <div key={s.id} className="bg-card rounded-2xl border border-border/50 p-5 card-shadow hover-lift card-shadow-hover transition-all">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1">{s.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => copyScript(s.content)} className="text-muted-foreground/40 hover:text-foreground transition-colors p-1">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeScript(s.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/70 line-clamp-4 whitespace-pre-wrap leading-relaxed">{s.content}</p>
                  <p className="text-[11px] text-muted-foreground mt-3">{new Date(s.created_at).toLocaleDateString("ru-RU")}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground font-medium">Нет сохранённых сценариев. Сгенерируйте сценарий через анализ видео.</p>
            </div>
          )
        )}
      </div>
    </AppLayout>
  );
}
