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
      // First get stats
      const { data: statsData } = await supabase.functions.invoke("socialkit", {
        body: { action: "video_stats", video_url: videoUrl },
      });
      // Then full analysis
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
        <h1 className="text-2xl font-bold text-foreground">Анализ видео</h1>

        <div className="flex gap-3">
          <Input
            placeholder="Вставьте ссылку на TikTok видео..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            className="flex-1 bg-secondary border-border"
          />
          <Button
            onClick={handleAnalyze}
            disabled={isPending}
            className="gradient-hero text-primary-foreground border-0 px-6 glow-primary hover:opacity-90 transition-opacity"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><Video className="h-4 w-4 mr-2" />Анализировать</>
            )}
          </Button>
        </div>

        <div className="flex gap-1 bg-secondary rounded-lg p-1 border border-border w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "gradient-hero text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {analysis ? (
          <div className="bg-card rounded-xl border border-border p-6">
            {activeTab === "stats" && stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="gradient-card rounded-lg p-4 text-center">
                  <Eye className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{Number(stats.playCount || stats.views || 0).toLocaleString("ru-RU")}</p>
                  <p className="text-xs text-muted-foreground">Просмотры</p>
                </div>
                <div className="gradient-card rounded-lg p-4 text-center">
                  <Heart className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{Number(stats.diggCount || stats.likes || 0).toLocaleString("ru-RU")}</p>
                  <p className="text-xs text-muted-foreground">Лайки</p>
                </div>
                <div className="gradient-card rounded-lg p-4 text-center">
                  <MessageCircle className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{Number(stats.commentCount || stats.comments || 0).toLocaleString("ru-RU")}</p>
                  <p className="text-xs text-muted-foreground">Комментарии</p>
                </div>
                <div className="gradient-card rounded-lg p-4 text-center">
                  <Share2 className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{Number(stats.shareCount || stats.shares || 0).toLocaleString("ru-RU")}</p>
                  <p className="text-xs text-muted-foreground">Репосты</p>
                </div>
              </div>
            )}
            {activeTab === "summary" && (
              <div className="prose prose-invert max-w-none">
                {analysisData?.summary_json ? (
                  <pre className="text-sm text-foreground whitespace-pre-wrap bg-secondary rounded-lg p-4">
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
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-secondary rounded-lg p-4">
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
                  <pre className="text-sm text-foreground whitespace-pre-wrap bg-secondary rounded-lg p-4 max-h-96 overflow-y-auto">
                    {JSON.stringify(analysisData.comments_json, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-sm">Комментарии недоступны</p>
                )}
              </div>
            )}
          </div>
        ) : !isPending ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Вставьте ссылку на видео, чтобы начать анализ</p>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
