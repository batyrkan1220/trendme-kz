import { AppLayout } from "@/components/layout/AppLayout";
import { Search as SearchIcon, Clock, Star, Eye, Heart, MessageCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: recentQueries } = useQuery({
    queryKey: ["search-queries", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("search_queries")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: searchResults, isPending: isSearching, mutate: doSearch } = useMutation({
    mutationFn: async (q: string) => {
      const { data, error } = await supabase.functions.invoke("socialkit", {
        body: { action: "search", query: q, limit: 20 },
      });
      if (error) throw error;
      return data.videos || [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-queries"] });
      queryClient.invalidateQueries({ queryKey: ["recent-queries"] });
    },
    onError: (err: Error) => {
      toast.error("Не удалось выполнить поиск: " + err.message);
    },
  });

  const { data: userFavorites = [] } = useQuery({
    queryKey: ["user-favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("video_id")
        .eq("user_id", user!.id);
      return data?.map((f) => f.video_id) || [];
    },
    enabled: !!user,
  });

  const toggleFav = async (videoId: string) => {
    if (!user) return;
    const isFav = userFavorites.includes(videoId);
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("video_id", videoId);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, video_id: videoId });
    }
    queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
    queryClient.invalidateQueries({ queryKey: ["favorites-count"] });
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    doSearch(query.trim());
  };

  const results = searchResults || [];

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 flex gap-6 animate-fade-in">
        <div className="flex-1 space-y-6 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Поиск</h1>

          <div className="flex gap-3">
            <Input
              placeholder="Введите ключевое слово..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 bg-secondary border-border"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="gradient-hero text-primary-foreground border-0 px-6 glow-primary hover:opacity-90 transition-opacity"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <SearchIcon className="h-4 w-4 mr-2" />
                  Искать
                </>
              )}
            </Button>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((video: any) => (
                <div
                  key={video.id}
                  className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-colors"
                >
                  <div className="flex gap-4 p-4">
                    {video.cover_url && (
                      <img
                        src={video.cover_url}
                        alt=""
                        className="h-24 w-[68px] object-cover rounded-lg shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-sm text-foreground line-clamp-2">{video.caption || "Без описания"}</p>
                      <p className="text-xs text-muted-foreground">@{video.author_username}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {Number(video.views).toLocaleString("ru-RU")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {Number(video.likes).toLocaleString("ru-RU")}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {Number(video.comments).toLocaleString("ru-RU")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFav(video.id)}
                      className="shrink-0 self-start"
                    >
                      <Star
                        className={`h-5 w-5 transition-colors ${
                          userFavorites.includes(video.id)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground hover:text-yellow-400"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !isSearching ? (
            <div className="text-center py-20">
              <SearchIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">
                Введите запрос для поиска видео в TikTok
              </p>
            </div>
          ) : null}
        </div>

        <div className="w-72 shrink-0 hidden xl:block">
          <div className="bg-card rounded-xl p-5 border border-border sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm text-foreground">Последние запросы</h3>
            </div>
            {recentQueries && recentQueries.length > 0 ? (
              <div className="space-y-2">
                {recentQueries.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setQuery(q.query_text);
                      doSearch(q.query_text);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors truncate"
                  >
                    {q.query_text}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs text-center py-6">Нет запросов</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
