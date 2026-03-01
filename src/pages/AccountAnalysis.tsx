import { AppLayout } from "@/components/layout/AppLayout";
import { UserCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AccountAnalysis() {
  const [url, setUrl] = useState("");

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Анализ аккаунта</h1>

        <div className="flex gap-3">
          <Input
            placeholder="Вставьте ссылку на профиль TikTok..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-secondary border-border"
          />
          <Button className="gradient-hero text-primary-foreground border-0 px-6 glow-primary hover:opacity-90 transition-opacity">
            <UserCircle className="h-4 w-4 mr-2" />
            Анализировать
          </Button>
        </div>

        {/* Empty State */}
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <UserCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            Вставьте ссылку на профиль TikTok для анализа аккаунта
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
