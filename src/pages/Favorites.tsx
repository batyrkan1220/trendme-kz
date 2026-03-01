import { AppLayout } from "@/components/layout/AppLayout";
import { Star, Eye, Heart, MessageCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function Favorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Избранное</h1>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((fav: any) => {
              const video = fav.videos;
              if (!video) return null;
              return (
                <div key={fav.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  {video.cover_url && (
                    <img src={video.cover_url} alt="" className="w-full h-48 object-cover" />
                  )}
                  <div className="p-4 space-y-2">
                    <p className="text-sm text-foreground line-clamp-2">{video.caption || "Без описания"}</p>
                    <p className="text-xs text-muted-foreground">@{video.author_username}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{Number(video.views).toLocaleString("ru-RU")}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{Number(video.likes).toLocaleString("ru-RU")}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{Number(video.comments).toLocaleString("ru-RU")}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(fav.created_at).toLocaleDateString("ru-RU")}
                      </span>
                      <button onClick={() => removeFav(fav.id)} className="text-muted-foreground hover:text-destructive transition-colors">
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
            <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">
              Нет избранных видео. Добавьте видео в избранное через поиск.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
