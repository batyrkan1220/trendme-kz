import { AppLayout } from "@/components/layout/AppLayout";
import { trackSearchEvent, trackAddToFavorites, trackPlausible } from "@/components/TrackingPixels";
import {
  Search as SearchIcon,
  Clock,
  Loader2,
  Sparkles,
  TrendingUp,
  Globe,
  Music2,
  Instagram,
  X,
  Check,
  Eye,
  Lock as LockIcon,
} from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsFreePlan } from "@/hooks/useIsFreePlan";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MemoVideoCard, VideoCardData } from "@/components/VideoCard";
import { VideoAnalysisDialog } from "@/components/VideoAnalysisDialog";
import { ScriptOnlyDialog } from "@/components/ScriptOnlyDialog";
import { LockedVideoOverlay } from "@/components/trends/LockedVideoOverlay";
import { cn } from "@/lib/utils";

const FREE_SEARCH_VISIBLE = 5;

type PlatformFilter = "all" | "tiktok" | "instagram";

const PLATFORM_TABS: Array<{ key: PlatformFilter; label: string; shortLabel: string; icon: typeof Globe }> = [
  { key: "all", label: "Все", shortLabel: "Все", icon: Globe },
  { key: "tiktok", label: "TikTok", shortLabel: "TT", icon: Music2 },
  { key: "instagram", label: "Instagram", shortLabel: "IG", icon: Instagram },
];

const POPULAR_NICHES: Array<{ emoji: string; name: string; query: string; tag?: PlatformFilter }> = [
  { emoji: "🍜", name: "Еда и рецепты", query: "рецепты завтрака" },
  { emoji: "💄", name: "Beauty", query: "skincare routine" },
  { emoji: "👗", name: "Fashion", query: "outfit ideas", tag: "instagram" },
  { emoji: "💪", name: "Фитнес", query: "fitness motivation" },
  { emoji: "🎧", name: "Lifestyle", query: "morning routine" },
  { emoji: "😂", name: "Юмор", query: "funny skits", tag: "tiktok" },
];

// Real backend stages → checklist labels.
// Stage names match `event: stage / data.stage` from ensemble-search SSE.
const STEP_DEFS_ALL: Array<{ key: string; label: string; matches: string[] }> = [
  { key: "cache", label: "Проверяем кэш", matches: ["cache_check", "cache_miss", "cache_hit"] },
  { key: "ai", label: "Подбираем хэштеги", matches: ["ai_keywords_start", "ai_keywords_done"] },
  { key: "tiktok", label: "Ищем в TikTok", matches: ["tiktok_start", "tiktok_done", "tiktok_failed"] },
  { key: "instagram", label: "Ищем в Instagram", matches: ["instagram_start", "instagram_done", "instagram_failed"] },
  { key: "merge", label: "Объединяем и сортируем", matches: ["merge_start"] },
  { key: "done", label: "Готовим результаты", matches: ["done"] },
];

const buildStepDefs = (platform: "all" | "tiktok" | "instagram") => {
  if (platform === "all") return STEP_DEFS_ALL;
  if (platform === "tiktok") return STEP_DEFS_ALL.filter((s) => s.key !== "instagram");
  return STEP_DEFS_ALL.filter((s) => s.key !== "tiktok");
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<any>(null);
  const [scriptVideo, setScriptVideo] = useState<any>(null);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { checkAndLog } = useSubscription();
  const { isFreePlan } = useIsFreePlan();
  const navigate = useNavigate();

  // Live progress: stage names received from the SSE backend
  const [reachedStages, setReachedStages] = useState<Set<string>>(new Set());


  const { data: recentQueries } = useQuery({
    queryKey: ["search-queries", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("search_queries")
        .select("*")
        .eq("user_id", user!.id)
        .order("last_run_at", { ascending: false })
        .limit(8);
      return data || [];
    },
    enabled: !!user,
  });

  const {
    data: searchResults,
    isPending: isSearching,
    mutate: doSearch,
    variables: searchVars,
    reset: resetSearch,
  } = useMutation({
    mutationFn: async ({ q, platform }: { q: string; platform: PlatformFilter }) => {
      // Reset live progress
      setReachedStages(new Set<string>());

      const projectId = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
      const fnUrl = `https://${projectId}.supabase.co/functions/v1/ensemble-search?stream=1`;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          apikey: (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
        },
        body: JSON.stringify({ query: q, platform }),
      });

      if (!res.ok || !res.body) {
        let msg = "Search failed";
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch (_) {/* ignore */}
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalPayload: any = null;

      const handleEvent = (eventName: string, dataStr: string) => {
        let parsed: any = null;
        try {
          parsed = JSON.parse(dataStr);
        } catch (_) {
          return;
        }
        if (eventName === "stage" && parsed?.stage) {
          setReachedStages((prev) => {
            const next = new Set(prev);
            next.add(parsed.stage);
            return next;
          });
        } else if (eventName === "done") {
          // Ensure all stages light up at the end
          setReachedStages((prev) => {
            const next = new Set(prev);
            next.add("done");
            return next;
          });
          finalPayload = parsed;
        } else if (eventName === "error") {
          throw new Error(parsed?.error || "Search failed");
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE blocks separated by blank lines
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const block = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          let eventName = "message";
          let dataLines: string[] = [];
          for (const line of block.split("\n")) {
            if (line.startsWith("event:")) eventName = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
          }
          if (dataLines.length) handleEvent(eventName, dataLines.join("\n"));
        }
      }

      if (!finalPayload) throw new Error("No response from server");
      if (finalPayload.error) throw new Error(finalPayload.error);

      return {
        videos: finalPayload.videos || [],
        relatedKeywords: finalPayload.relatedKeywords || [],
        warnings: (finalPayload.warnings as string[] | undefined) || [],
      };
    },
    onSuccess: (data, vars) => {
      trackSearchEvent(vars.q);
      trackPlausible("Search Performed", {
        query: String(vars.q).slice(0, 100),
        platform: vars.platform,
      });
      queryClient.invalidateQueries({ queryKey: ["search-queries"] });
      queryClient.invalidateQueries({ queryKey: ["recent-queries"] });
      data.warnings?.forEach((w) => toast.warning(w));
    },
    onError: (err: any) => {
      toast.error(err?.message || "Не удалось выполнить поиск. Попробуйте позже.");
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

  const toggleFav = useCallback(
    async (videoId: string) => {
      if (!user) return;
      const isFav = userFavorites.includes(videoId);
      if (isFav) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("video_id", videoId);
        trackPlausible("Favorite Removed", { source: "search" });
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, video_id: videoId });
        trackAddToFavorites(videoId);
        trackPlausible("Favorite Added", { source: "search" });
      }
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorites-count"] });
    },
    [user, userFavorites, queryClient],
  );

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) {
      toast.error("Введите запрос");
      return;
    }
    const ok = await checkAndLog("search", `Поиск: ${q}`);
    if (!ok) return;
    doSearch({ q, platform: platformFilter });
  };

  const handleSearchDirect = async (q: string, platform: PlatformFilter = platformFilter) => {
    if (!q.trim()) return;
    const ok = await checkAndLog("search", `Поиск: ${q.trim()}`);
    if (!ok) return;
    setQuery(q.trim());
    if (platform !== platformFilter) setPlatformFilter(platform);
    doSearch({ q: q.trim(), platform });
  };

  const handleNewSearch = () => {
    resetSearch();
    setQuery("");
  };

  // Viral score
  const computeViralScore = (v: any) => {
    const views = Number(v.views) || 0;
    const likes = Number(v.likes) || 0;
    const comments = Number(v.comments) || 0;
    const shares = Number(v.shares) || 0;
    if (views < 1000) return 0;
    const engagement = (likes + comments * 2 + shares * 3) / views;
    let velocity = Number(v.velocity_views) || 0;
    if (!velocity && v.published_at) {
      const hours = Math.max(1, (Date.now() - new Date(v.published_at).getTime()) / 3_600_000);
      velocity = views / hours;
    }
    const reachScore = Math.log10(views + 1) * 10;
    const velocityScore = Math.log10(velocity + 1) * 8;
    const engagementScore = Math.min(engagement * 1000, 50);
    return reachScore + velocityScore + engagementScore;
  };

  const allResults = useMemo(
    () =>
      [...(searchResults?.videos || [])]
        .filter((v: any) => (Number(v.views) || 0) >= 1000)
        .map((v: any) => ({ ...v, _viral: computeViralScore(v) }))
        .sort((a: any, b: any) => b._viral - a._viral),
    [searchResults],
  );

  const tiktokCount = allResults.filter((v: any) => (v.platform || "tiktok") === "tiktok").length;
  const instagramCount = allResults.filter((v: any) => v.platform === "instagram").length;

  const results =
    platformFilter === "all"
      ? allResults
      : allResults.filter((v: any) => (v.platform || "tiktok") === platformFilter);

  const relatedKeywords: string[] = searchResults?.relatedKeywords || [];

  const hasResults = !!searchResults && !isSearching;

  // ----- Loading checklist progress -----
  const loadingPlatform: PlatformFilter = (searchVars?.platform as PlatformFilter) || platformFilter;
  const loadingSteps =
    loadingPlatform === "all"
      ? LOADING_STEPS_ALL
      : LOADING_STEPS_ONE(loadingPlatform === "tiktok" ? "TikTok" : "Instagram");
  const [loadingStep, setLoadingStep] = useState(0);
  useEffect(() => {
    if (!isSearching) {
      setLoadingStep(0);
      return;
    }
    const total = loadingSteps.length;
    const interval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, total - 1));
    }, 2200);
    return () => clearInterval(interval);
  }, [isSearching, loadingSteps.length]);

  // ===========================================================
  // Sub-components — rendered inline per state
  // ===========================================================

  const SearchInputBar = ({
    showClear = false,
    fullWidthOnMobile = true,
  }: {
    showClear?: boolean;
    fullWidthOnMobile?: boolean;
  }) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch();
      }}
      className={cn("flex gap-2 w-full", fullWidthOnMobile ? "flex-col sm:flex-row" : "flex-row")}
    >
      <div className="relative flex-1">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Ключевое слово — RU / EN / KZ"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 pl-10 pr-10 bg-card/85 backdrop-blur-xl border-border/60 rounded-2xl shadow-soft text-sm md:text-[15px]"
        />
        {showClear && query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full grid place-items-center text-muted-foreground hover:bg-foreground/5 transition-colors"
            aria-label="Очистить"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSearching}
        className={cn(
          "h-12 rounded-2xl font-extrabold text-[13px] px-6 shadow-soft ring-1 ring-foreground/10 tracking-tight",
          "bg-foreground text-background hover:bg-foreground/90",
          fullWidthOnMobile && "w-full sm:w-auto justify-center",
        )}
      >
        {isSearching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <SearchIcon className="h-3.5 w-3.5 mr-1.5" />
            Искать
          </>
        )}
      </Button>
    </form>
  );

  const PlatformToggle = ({
    showCounts = false,
    size = "md",
  }: {
    showCounts?: boolean;
    size?: "sm" | "md";
  }) => (
    <div className="flex items-center gap-2.5 flex-wrap">
      {!showCounts && (
        <span className="eyebrow text-[10.5px]">Платформа</span>
      )}
      <div
        className={cn(
          "inline-flex items-center gap-1 p-1 rounded-full bg-card/80 backdrop-blur-xl border border-border/60 shadow-soft",
          size === "sm" ? "p-0.5" : "p-1",
        )}
      >
        {PLATFORM_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = platformFilter === tab.key;
          const count =
            tab.key === "all"
              ? allResults.length
              : tab.key === "tiktok"
                ? tiktokCount
                : instagramCount;
          const disabled = showCounts && count === 0 && tab.key !== "all";
          return (
            <button
              key={tab.key}
              type="button"
              disabled={disabled}
              onClick={() => setPlatformFilter(tab.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full font-extrabold tracking-tight transition-all",
                size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-8 px-3 text-[12.5px]",
                active
                  ? "bg-foreground text-background shadow-soft"
                  : "text-muted-foreground hover:text-foreground",
                disabled && "opacity-40 cursor-not-allowed hover:text-muted-foreground",
              )}
            >
              <Icon className="h-3 w-3" />
              {showCounts && size === "sm" ? tab.shortLabel : tab.label}
              {showCounts && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold",
                    active
                      ? "bg-background/20 text-background"
                      : "bg-foreground/10 text-foreground/70",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Platform badge overlay (TikTok / Reels) over each card
  const PlatformBadge = ({ platform }: { platform: "tiktok" | "instagram" }) => (
    <div className="absolute top-1.5 left-1.5 z-[2] pointer-events-none">
      {platform === "instagram" ? (
        <span className="inline-flex items-center gap-1 h-[22px] px-2 rounded-full text-white text-[10.5px] font-extrabold tracking-tight backdrop-blur-md border border-white/15 shadow-md
          bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4]">
          <Instagram className="h-2.5 w-2.5" />
          Reels
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 h-[22px] px-2 rounded-full text-white text-[10.5px] font-extrabold tracking-tight backdrop-blur-md border border-white/15 shadow-md bg-black/85">
          <Music2 className="h-2.5 w-2.5" />
          TikTok
        </span>
      )}
    </div>
  );

  // ===========================================================
  // Render
  // ===========================================================

  return (
    <AppLayout>
      {/* ========= EMPTY STATE ========= */}
      {!searchResults && !isSearching ? (
        <div
          className="animate-fade-in bg-background-subtle min-h-full"
          style={{
            paddingTop: "max(env(safe-area-inset-top, 0px) + 16px, 16px)",
            paddingBottom: "6rem",
          }}
        >
          <div className="px-4 pb-3 md:p-6 lg:p-8 max-w-3xl mx-auto">
            <div className="space-y-5">
              {/* Header */}
              <div className="space-y-1.5">
                <span className="eyebrow">Поиск</span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                  Найдите свои тренды
                </h1>
                <p className="text-[13px] md:text-sm text-muted-foreground leading-relaxed">
                  Соберём свежие вирусные видео в{" "}
                  <span className="text-foreground font-bold">TikTok</span> и{" "}
                  <span className="text-foreground font-bold">Instagram Reels</span> по вашему слову
                </p>
              </div>

              <SearchInputBar />
              <PlatformToggle />

              {/* Recent queries */}
              {recentQueries && recentQueries.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="eyebrow">Недавние запросы</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentQueries.slice(0, 8).map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handleSearchDirect(q.query_text)}
                        className="px-3.5 h-[30px] rounded-full bg-card/75 backdrop-blur-md border border-border/60 text-[12.5px] font-medium text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all active:scale-95 shadow-soft"
                      >
                        {q.query_text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular niches */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="eyebrow">Популярные ниши</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {POPULAR_NICHES.map((n) => {
                    const TagIcon = n.tag === "instagram" ? Instagram : n.tag === "tiktok" ? Music2 : null;
                    return (
                      <button
                        key={n.name}
                        onClick={() => handleSearchDirect(n.query, n.tag || "all")}
                        className="flex items-center gap-2.5 p-3 rounded-2xl bg-card/75 backdrop-blur-md border border-border/60 shadow-soft hover:bg-card hover:-translate-y-0.5 transition-all active:scale-[0.98] text-left"
                      >
                        <span className="text-xl leading-none">{n.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-extrabold text-foreground truncate">{n.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{n.query}</div>
                        </div>
                        {TagIcon && <TagIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tip card */}
              <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 p-4 md:p-5 shadow-soft">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-lg bg-viral/15 flex items-center justify-center ring-1 ring-viral/35">
                    <Sparkles className="h-3.5 w-3.5 text-viral" />
                  </div>
                  <h3 className="font-extrabold text-[13px] text-foreground">Как искать лучше</h3>
                </div>
                <ul className="space-y-1.5">
                  {[
                    <>Используйте конкретные слова: <b className="text-foreground font-semibold">«рецепты завтрака»</b>, а не «еда»</>,
                    <>Ищите на языке вашей аудитории — <b className="text-foreground font-semibold">RU / EN / KZ</b></>,
                    <>Переключайтесь между <b className="text-foreground font-semibold">TikTok</b> и <b className="text-foreground font-semibold">Instagram</b> — тренды разные</>,
                  ].map((line, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-[12.5px] text-muted-foreground leading-relaxed"
                    >
                      <span className="text-viral shrink-0">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : isSearching && !hasResults ? (
        /* ========= LOADING STATE — checklist ========= */
        <div
          className="flex flex-col items-center justify-center px-4 animate-fade-in bg-background-subtle"
          style={{
            minHeight: "calc(100dvh - 8rem)",
            paddingTop: "max(env(safe-area-inset-top, 0px) + 24px, 24px)",
          }}
        >
          <div className="w-full max-w-md flex flex-col items-center gap-5">
            <div className="relative">
              <span className="absolute -inset-1.5 rounded-2xl bg-viral/30 blur-2xl -z-10" />
              <div className="w-16 h-16 rounded-2xl bg-viral grid place-items-center shadow-glow-primary ring-1 ring-foreground/10">
                <Sparkles className="h-7 w-7 text-foreground animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <div className="eyebrow">Поиск трендов</div>
              <h2 className="text-lg font-extrabold tracking-tight text-foreground">
                «{searchVars?.q || query}»
              </h2>
              <p className="text-[12.5px] text-muted-foreground">Это займёт 30–90 секунд</p>
            </div>
            <ul className="w-full p-2 rounded-2xl bg-card/85 border border-border/60 shadow-soft space-y-0.5">
              {loadingSteps.map((label, i) => {
                const done = i < loadingStep;
                const active = i === loadingStep;
                return (
                  <li
                    key={label}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
                      active && "bg-viral/12",
                    )}
                  >
                    <span
                      className={cn(
                        "w-6 h-6 rounded-full grid place-items-center text-[11px] font-extrabold shrink-0",
                        done && "bg-viral text-foreground",
                        active && "bg-viral/20 ring-1 ring-viral/55 text-foreground",
                        !done && !active && "bg-muted text-muted-foreground",
                      )}
                    >
                      {done ? (
                        <Check className="h-3 w-3" strokeWidth={3} />
                      ) : active ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-[13px] font-bold",
                        done && "text-muted-foreground line-through decoration-muted-foreground/40",
                        !done && "text-foreground",
                      )}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : (
        /* ========= RESULTS STATE ========= */
        <>
          <div
            className="animate-fade-in bg-background-subtle min-h-full"
            style={{
              paddingTop: "max(env(safe-area-inset-top, 0px) + 16px, 16px)",
              paddingBottom: "6rem",
            }}
          >
            <div className="px-4 pb-3 md:p-6 lg:p-8">
              <div className="space-y-4 md:space-y-5">
                {/* Header row + new search button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <span className="eyebrow">Результаты</span>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight truncate">
                      «{searchVars?.q || query}»
                    </h1>
                    {allResults.length > 0 && (
                      <p className="text-[13px] text-muted-foreground flex items-center gap-x-1.5 flex-wrap">
                        <span>
                          <b className="text-foreground font-extrabold tabular-nums">{allResults.length}</b> видео
                        </span>
                        <span className="text-border">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Music2 className="h-3 w-3" />
                          <b className="text-foreground font-extrabold tabular-nums">{tiktokCount}</b> TikTok
                        </span>
                        <span className="text-border">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Instagram className="h-3 w-3" />
                          <b className="text-foreground font-extrabold tabular-nums">{instagramCount}</b> Instagram
                        </span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleNewSearch}
                    className="shrink-0 h-9 px-3.5 rounded-full bg-card/75 backdrop-blur-md border border-border/60 text-[12.5px] font-bold inline-flex items-center gap-1.5 hover:bg-card transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Новый
                  </button>
                </div>

                <SearchInputBar showClear />

                {/* Compact platform toggle with counts */}
                <PlatformToggle showCounts size="sm" />

                {/* Related keywords */}
                {relatedKeywords.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="eyebrow text-[10.5px]">Похожие:</span>
                    {relatedKeywords.map((kw) => (
                      <button
                        key={kw}
                        onClick={() => handleSearchDirect(kw)}
                        className="h-[26px] px-2.5 rounded-full bg-card/75 backdrop-blur-md border border-border/60 text-[11.5px] font-medium text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all active:scale-95 shadow-soft"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                )}

                {/* Empty results */}
                {results.length === 0 && (
                  <div
                    className="flex flex-col items-center justify-center gap-3 animate-fade-in py-12"
                    style={{ minHeight: "40vh" }}
                  >
                    <div className="h-16 w-16 rounded-2xl bg-card/70 border border-border/60 grid place-items-center">
                      <SearchIcon className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-base font-extrabold text-foreground">Ничего не найдено</p>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      По запросу «{query}» в выбранной платформе ничего нет. Попробуйте переключить платформу или изменить запрос.
                    </p>
                  </div>
                )}

                {/* Grid */}
                {results.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 md:gap-3.5">
                    {results.map((video: any, i: number) => {
                      const cardData: VideoCardData = {
                        id: video.id,
                        platform_video_id: video.platform_video_id,
                        url: video.url,
                        cover_url: video.cover_url,
                        caption: video.caption,
                        author_username: video.author_username,
                        author_avatar_url: video.author_avatar_url,
                        views: Number(video.views) || 0,
                        likes: Number(video.likes) || 0,
                        comments: Number(video.comments) || 0,
                        shares: Number(video.shares) || 0,
                        velocity_views: Number(video.velocity_views) || 0,
                        published_at: video.published_at,
                        duration: Number(video.duration_sec) || 0,
                      };

                      const platform: "tiktok" | "instagram" =
                        video.platform === "instagram" ? "instagram" : "tiktok";

                      const isLocked = isFreePlan && i >= FREE_SEARCH_VISIBLE;

                      return (
                        <div
                          key={video.id || i}
                          className={cn(
                            "relative",
                            isLocked &&
                              "group/lock cursor-pointer rounded-2xl transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-glow-viral",
                          )}
                          onClick={isLocked ? () => navigate("/subscription") : undefined}
                        >
                          <PlatformBadge platform={platform} />
                          <div className={isLocked ? "pointer-events-none select-none" : ""}>
                            <MemoVideoCard
                              video={cardData}
                              playingId={playingId}
                              onPlay={setPlayingId}
                              isFavorite={userFavorites.includes(video.id)}
                              onToggleFav={toggleFav}
                              onAnalyze={() => setAnalysisVideo(video)}
                              onScript={() => setScriptVideo(video)}
                              showTier={true}
                              showAuthor={false}
                              showAnalyzeButton={!isLocked}
                              showScriptButton={!isLocked}
                            />
                          </div>
                          {isLocked && <LockedVideoOverlay />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <VideoAnalysisDialog
            video={analysisVideo}
            open={!!analysisVideo}
            onOpenChange={(open) => {
              if (!open) setAnalysisVideo(null);
            }}
          />
          <ScriptOnlyDialog
            video={scriptVideo}
            open={!!scriptVideo}
            onOpenChange={(open) => {
              if (!open) setScriptVideo(null);
            }}
          />
        </>
      )}
    </AppLayout>
  );
}
