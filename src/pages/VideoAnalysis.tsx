import { AppLayout } from "@/components/layout/AppLayout";
import { Video, BarChart3, FileText, MessageCircle, Sparkles, Loader2, Eye, Heart, Share2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const tabs = [
  { id: "stats", label: "Статистика", icon: BarChart3 },
  { id: "summary", label: "Краткий разбор", icon: Sparkles },
  { id: "transcript", label: "Транскрипт", icon: FileText },
  { id: "comments", label: "Комментарии", icon: MessageCircle },
];

export default function VideoAnalysis() {
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState("stats");

  const { data: analysis, isPending, mutate: analyze } = useMutation({
    mutationFn: async (videoUrl: string) => {
      const { data: statsData } = await supabase.functions.invoke("socialkit", {
        body: { action: "video_stats", video_url: videoUrl },
      });
      const { data: analysisData, error } = await supabase.functions.invoke("socialkit", {
        body: { action: "analyze_video", video_url: videoUrl },
      });
      if (error) throw error;
      return { stats: statsData, analysis: analysisData };
    },
    onError: (err: Error) => {
      toast.error("Не удалось проанализировать видео: " + err.message);
    },
  });

  const handleAnalyze = () => {
    if (!url.trim()) return;
    analyze(url.trim());
  };

  const stats = analysis?.stats;
  const analysisData = analysis?.analysis;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Анализ видео 🎬</h1>

        <div className="flex gap-3">
          <Input
            placeholder="Вставьте ссылку на TikTok видео..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            className="flex-1 h-12 bg-card border-border rounded-xl card-shadow"
          />
          <Button
            onClick={handleAnalyze}
            disabled={isPending}
            className="h-12 gradient-hero text-primary-foreground border-0 px-7 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><Video className="h-4 w-4 mr-2" />Анализировать</>
            )}
          </Button>
        </div>

        <div className="flex gap-1 bg-card rounded-xl p-1 border border-border/50 w-fit card-shadow">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "gradient-hero text-primary-foreground glow-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {analysis ? (
          <div className="bg-card rounded-2xl border border-border/50 p-6 card-shadow">
            {activeTab === "stats" && stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Eye, value: stats.playCount || stats.views || 0, label: "Просмотры" },
                  { icon: Heart, value: stats.diggCount || stats.likes || 0, label: "Лайки" },
                  { icon: MessageCircle, value: stats.commentCount || stats.comments || 0, label: "Комментарии" },
                  { icon: Share2, value: stats.shareCount || stats.shares || 0, label: "Репосты" },
                ].map((s) => (
                  <div key={s.label} className="gradient-card rounded-xl p-5 text-center hover-lift transition-transform">
                    <s.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{Number(s.value).toLocaleString("ru-RU")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "summary" && (
              <div>
                {analysisData?.summary_json ? (
                  <pre className="text-sm text-foreground whitespace-pre-wrap bg-muted rounded-xl p-5">
                    {typeof analysisData.summary_json === "string"
                      ? analysisData.summary_json
                      : JSON.stringify(analysisData.summary_json, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-sm">Краткий разбор недоступен</p>
                )}
              </div>
            )}
            {activeTab === "transcript" && (
              <div>
                {analysisData?.transcript_text ? (
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-muted rounded-xl p-5">
                    {analysisData.transcript_text}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">Транскрипт недоступен</p>
                )}
              </div>
            )}
            {activeTab === "comments" && (
              <div>
                {analysisData?.comments_json ? (
                  <pre className="text-sm text-foreground whitespace-pre-wrap bg-muted rounded-xl p-5 max-h-96 overflow-y-auto">
                    {JSON.stringify(analysisData.comments_json, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-sm">Комментарии недоступны</p>
                )}
              </div>
            )}
          </div>
        ) : !isPending ? (
          <div className="bg-card rounded-2xl border border-border/50 p-12 text-center card-shadow">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Video className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">Вставьте ссылку на видео, чтобы начать анализ</p>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
