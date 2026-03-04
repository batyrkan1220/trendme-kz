import { AppLayout } from "@/components/layout/AppLayout";
import { Eye, Heart, MessageCircle, Trash2, Sparkles, Copy, Play, ExternalLink, X, Share2, Music, FileText, ChevronDown, ChevronUp, Target, Video } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";


type Tab = "favorites" | "analyses" | "scripts";

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

function parseSummary(raw: any) {
  if (!raw) return null;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return raw;
}

function parseTranscript(raw: any): string {
  if (!raw) return "";
  let t = typeof raw === "string" ? raw : JSON.stringify(raw);
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      const parsed = JSON.parse(t);
      t = parsed?.transcript || parsed?.text || parsed?.data?.transcript || t;
    } catch { /* keep */ }
  }
  return t;
}

function extractVideoId(url: string, storedId?: string | null): string | null {
  if (storedId) return storedId;
  // Extract from URLs like https://www.tiktok.com/@user/video/7611995834628066561
  const match = url?.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

export default function Library() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("favorites");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);
  

  // Favorites
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

  // Analyses — also fetch cover_url from videos table
  const { data: analyses = [] } = useQuery({
    queryKey: ["user-analyses", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("video_analysis")
        .select("*")
        .eq("user_id", user!.id)
        .order("analyzed_at", { ascending: false });
      const items = (data || []) as any[];
      // Extract video IDs from URLs where platform_video_id is null
      const extractId = (url: string) => {
        const m = url?.match(/\/video\/(\d+)/);
        return m ? m[1] : null;
      };
      items.forEach(a => {
        if (!a.platform_video_id) {
          a.platform_video_id = extractId(a.video_url);
        }
      });
      // Try to match cover_url from videos table
      const videoIds = items.map(a => a.platform_video_id).filter(Boolean);
      if (videoIds.length > 0) {
        const { data: vids } = await supabase
          .from("videos")
          .select("platform_video_id, cover_url")
          .in("platform_video_id", videoIds);
        const coverMap = new Map((vids || []).map(v => [v.platform_video_id, v.cover_url]));
        items.forEach(a => { a._cover_url = coverMap.get(a.platform_video_id) || null; });
      }
      return items;
    },
    enabled: !!user,
  });

  // Scripts
  const { data: scripts = [] } = useQuery({
    queryKey: ["saved-scripts", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_scripts")
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

  const removeAnalysis = async (id: string) => {
    await supabase.from("video_analysis").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["user-analyses"] });
    toast.success("Анализ удалён");
  };

  const removeScript = async (id: string) => {
    await supabase.from("saved_scripts").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["saved-scripts"] });
    toast.success("Сценарий удалён");
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Скопировано!");
  };

  const toggleExpand = (id: string) => {
    setExpandedAnalysis(prev => prev === id ? null : id);
  };

  return (
    <AppLayout>
      <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 animate-fade-in">
        <h1 className="text-xl md:text-3xl font-bold text-foreground">Избранные ⭐</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-full sm:w-fit overflow-x-auto no-scrollbar">
          {([
            { key: "favorites" as Tab, icon: Heart, label: "Видео", count: favorites.length },
            { key: "analyses" as Tab, icon: FileText, label: "Анализы", count: analyses.length },
            { key: "scripts" as Tab, icon: Sparkles, label: "Сценарии", count: scripts.length },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span>{t.label}</span>
              <span className="bg-primary/10 text-primary text-[10px] md:text-xs font-semibold px-1.5 py-0.5 rounded-md">{t.count}</span>
            </button>
          ))}
        </div>

        {/* Favorites tab */}
        {tab === "favorites" && (
          <FavoritesTab favorites={favorites} playingId={playingId} setPlayingId={setPlayingId} removeFav={removeFav} />
        )}

        {/* Analyses tab */}
        {tab === "analyses" && (
          <AnalysesTab analyses={analyses} expandedAnalysis={expandedAnalysis} toggleExpand={toggleExpand} removeAnalysis={removeAnalysis} copyText={copyText} />
        )}

        {/* Scripts tab */}
        {tab === "scripts" && (
          <ScriptsTab scripts={scripts} removeScript={removeScript} copyText={copyText} />
        )}
      </div>
    </AppLayout>
  );
}

/* ─── Favorites Tab ─── */
function FavoritesTab({ favorites, playingId, setPlayingId, removeFav }: any) {
  if (favorites.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Heart className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <p className="text-lg font-medium text-foreground mb-1">Пока пусто</p>
        <p className="text-sm text-muted-foreground">Добавьте видео через поиск или тренды</p>
      </div>
    );
  }

  return (
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
            <div className="flex items-center justify-around px-2 py-2 border-b border-border/30">
              <span className="flex flex-col items-center gap-0.5"><Eye className="h-4 w-4 text-muted-foreground" /><span className="text-[11px] font-bold text-foreground">{fmt(Number(video.views))}</span></span>
              <span className="flex flex-col items-center gap-0.5"><Heart className="h-4 w-4 text-muted-foreground" /><span className="text-[11px] font-bold text-foreground">{fmt(Number(video.likes))}</span></span>
              <span className="flex flex-col items-center gap-0.5"><MessageCircle className="h-4 w-4 text-muted-foreground" /><span className="text-[11px] font-bold text-foreground">{fmt(Number(video.comments))}</span></span>
              <span className="flex flex-col items-center gap-0.5"><Share2 className="h-4 w-4 text-muted-foreground" /><span className="text-[11px] font-bold text-foreground">{fmt(Number(video.shares || 0))}</span></span>
            </div>
            <div className="px-3 pt-3 flex items-center gap-2">
              {video.author_avatar_url ? (
                <img src={video.author_avatar_url} alt="" loading="lazy" className="w-8 h-8 rounded-full object-cover border-2 border-border/50 flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
              )}
              <span className="text-sm font-semibold text-foreground truncate">@{video.author_username}</span>
            </div>
            <div className="px-3 pt-1.5 pb-1">
              <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">{video.caption || "Без описания"}</p>
            </div>
            {timeAgo && (
              <div className="px-3 pb-2">
                <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Analyses Tab ─── */
function AnalysesTab({ analyses, expandedAnalysis, toggleExpand, removeAnalysis, copyText }: {
  analyses: any[];
  expandedAnalysis: string | null;
  toggleExpand: (id: string) => void;
  removeAnalysis: (id: string) => void;
  copyText: (text: string) => void;
}) {
  if (analyses.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <p className="text-lg font-medium text-foreground mb-1">Нет анализов</p>
        <p className="text-sm text-muted-foreground">Анализируйте видео — результаты появятся здесь автоматически</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
      {analyses.map((a: any) => {
        const summary = parseSummary(a.summary_json);
        const transcript = parseTranscript(a.transcript_text);
        const isExpanded = expandedAnalysis === a.id;
        const date = new Date(a.analyzed_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

        return (
          <div key={a.id} className="group bg-card rounded-2xl border border-border/40 overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col">
            {/* Compact preview header */}
            <div className="flex items-center gap-3 p-3 border-b border-border/30">
              {/* Mini video preview thumbnail */}
              <a
                href={a.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-muted flex items-center justify-center hover:scale-105 transition-transform"
                title="Открыть видео"
              >
                {a._cover_url ? (
                  <img src={a._cover_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <Video className="h-5 w-5 text-muted-foreground" />
                )}
              </a>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                  {summary?.topic || "Анализ видео"}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{date}</p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => removeAnalysis(a.id)}
                  className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <a
                  href={a.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                  title="Открыть видео"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Tags */}
            {summary?.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 px-3 pt-2">
                {summary.tags.slice(0, 3).map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">{tag}</span>
                ))}
              </div>
            )}

            {/* Expand toggle */}
            <div className="mt-auto border-t border-border/30">
              <button onClick={() => toggleExpand(a.id)} className="w-full flex items-center justify-center gap-1 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {isExpanded ? "Свернуть" : "Подробнее"}
              </button>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-3 pb-3 space-y-3 border-t border-border/30 pt-3">
                {summary?.language && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Язык:</span>
                    <span className="font-medium text-foreground">
                      {summary.language === "Русский" ? "🇷🇺 " : summary.language === "English" ? "🇺🇸 " : ""}
                      {summary.language}
                    </span>
                  </div>
                )}
                {summary?.niches?.length > 0 && (
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">Категории</p>
                    <div className="flex flex-wrap gap-1">
                      {summary.niches.map((niche: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-card border border-border/50 text-foreground">{niche}</span>
                      ))}
                    </div>
                  </div>
                )}
                {summary?.summary && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-foreground">Суть</p>
                      <button onClick={() => copyText(summary.summary)} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3">
                      <p className="text-xs text-foreground/80 leading-relaxed">{summary.summary}</p>
                    </div>
                  </div>
                )}
                {summary?.hooks?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Хуки</p>
                    <div className="space-y-1">
                      {summary.hooks.map((hook: string, i: number) => (
                        <div key={i} className="flex items-start gap-1.5 bg-muted/30 rounded-lg p-2">
                          <Target className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                          <p className="text-xs text-foreground/80">{hook}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {transcript && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-foreground">Транскрибация</p>
                      <button onClick={() => copyText(transcript)} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3 max-h-40 overflow-y-auto">
                      <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{transcript}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Scripts Tab ─── */
function ScriptsTab({ scripts, removeScript, copyText }: any) {
  if (scripts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <p className="text-lg font-medium text-foreground mb-1">Нет сценариев</p>
        <p className="text-sm text-muted-foreground">Сгенерируйте сценарий через анализ видео</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {scripts.map((s: any) => (
        <div key={s.id} className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground line-clamp-1">{s.title}</h3>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={() => copyText(s.content)} className="text-muted-foreground/50 hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/50" title="Копировать">
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
  );
}
