import { AppLayout } from "@/components/layout/AppLayout";
import { Video, BarChart3, FileText, MessageCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const tabs = [
  { id: "stats", label: "Статистика", icon: BarChart3 },
  { id: "summary", label: "Краткий разбор", icon: Sparkles },
  { id: "transcript", label: "Транскрипт", icon: FileText },
  { id: "comments", label: "Комментарии", icon: MessageCircle },
];

export default function VideoAnalysis() {
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState("stats");

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Анализ видео</h1>

        <div className="flex gap-3">
          <Input
            placeholder="Вставьте ссылку на TikTok видео..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-secondary border-border"
          />
          <Button className="gradient-hero text-primary-foreground border-0 px-6 glow-primary hover:opacity-90 transition-opacity">
            <Video className="h-4 w-4 mr-2" />
            Анализировать
          </Button>
        </div>

        {/* Tabs */}
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

        {/* Empty State */}
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Video className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            Вставьте ссылку на видео, чтобы начать анализ
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
