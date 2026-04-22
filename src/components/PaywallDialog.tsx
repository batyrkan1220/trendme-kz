import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { hapticLight } from "@/lib/haptics";
import { useFreeCredits } from "@/hooks/useFreeCredits";

interface PaywallVideoPreview {
  cover_url?: string | null;
  cover?: string | null;
  views?: number;
  likes?: number;
  caption?: string | null;
  author_username?: string | null;
  published_at?: string | null;
  createTime?: number;
}

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional video context — shown as a hook to make the paywall feel personal */
  video?: PaywallVideoPreview | null;
  /** "analysis" | "script" | "account" — drives the headline */
  feature?: "analysis" | "script" | "account";
}

const fmt = (n: number) => {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
};

const hoursSince = (published?: string | number | null) => {
  if (!published) return null;
  const ms =
    typeof published === "number"
      ? published > 1e12
        ? published
        : published * 1000
      : new Date(published).getTime();
  const h = Math.max(Math.floor((Date.now() - ms) / 3600000), 1);
  return h;
};

const FEATURE_HEADLINES: Record<NonNullable<PaywallDialogProps["feature"]>, string> = {
  analysis: "Анализ трендов",
  script: "ИИ-сценарии",
  account: "Анализ аккаунтов",
};

export function PaywallDialog({ open, onOpenChange, video, feature = "analysis" }: PaywallDialogProps) {
  const navigate = useNavigate();
  const [monthlyPrice, setMonthlyPrice] = useState<number | null>(null);
  const { analysesLeft, scriptsLeft } = useFreeCredits();
  const creditsLeft = feature === "script" ? scriptsLeft : analysesLeft;
  const featureLabel = feature === "script" ? "сценариев" : feature === "account" ? "анализов профиля" : "анализов";

  useEffect(() => {
    if (!open || monthlyPrice !== null) return;
    supabase
      .from("plans")
      .select("price_rub")
      .eq("is_active", true)
      .eq("duration_days", 30)
      .gt("price_rub", 0)
      .order("price_rub", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.price_rub) setMonthlyPrice(data.price_rub);
      });
  }, [open, monthlyPrice]);

  const cover = video?.cover_url || video?.cover || null;
  const views = Number(video?.views || 0);
  const hours = hoursSince(video?.published_at || video?.createTime);
  const showHook = !!video && views > 1000;

  const handleUpgrade = () => {
    hapticLight();
    onOpenChange(false);
    navigate("/subscription");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden border-border/60 bg-card rounded-2xl w-[calc(100vw-24px)] max-w-[420px] max-h-[calc(100dvh-32px)] overflow-y-auto"
        style={{ boxShadow: "0 30px 80px -20px rgba(0,0,0,0.5), 0 0 0 1px hsl(0 0% 100% / 0.04) inset" }}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 z-20 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background flex items-center justify-center transition-all"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Video hook — only when we have context */}
        {showHook && (
          <div className="relative aspect-[16/9] bg-black overflow-hidden">
            {cover ? (
              <img
                src={cover}
                alt=""
                className="w-full h-full object-cover blur-[2px] brightness-[0.55] scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-viral/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-viral mb-1.5">
                <TrendingUp className="h-3 w-3" />
                Это видео взлетело
              </div>
              <p className="text-white text-[15px] font-semibold leading-snug">
                {fmt(views)} просмотров{hours ? ` за ${hours}ч` : ""} — узнай&nbsp;почему
              </p>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          {!showHook && (
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-2xl bg-viral/15 flex items-center justify-center ring-1 ring-viral/30">
                <Sparkles className="h-7 w-7 text-viral" />
              </div>
            </div>
          )}

          <div className={showHook ? "" : "text-center"}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary mb-1.5">
              Pro функция
            </p>
            <h2 className="text-[22px] font-bold tracking-tight text-foreground leading-tight">
              {FEATURE_HEADLINES[feature]} — в Pro
            </h2>
            <p className="mt-2 text-[13.5px] text-muted-foreground leading-relaxed">
              {creditsLeft <= 0 ? (
                <>Ваши <span className="text-foreground font-semibold">3 пробных {featureLabel}</span> закончились. Откройте Pro — без лимитов.</>
              ) : (
                <>Демо позволяет находить тренды. Чтобы понять <span className="text-foreground font-semibold">почему они работают</span> — нужен Pro.</>
              )}
            </p>
          </div>

          {/* What's included */}
          <ul className="space-y-2.5">
            {[
              "Глубокий ИИ-анализ любого видео",
              "Готовые сценарии за 12 секунд",
              "Анализ профилей конкурентов",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-foreground">
                <span className="shrink-0 mt-0.5 h-4 w-4 rounded-full bg-viral/15 flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-viral" strokeWidth={3} />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="space-y-2 pt-1">
            <Button
              onClick={handleUpgrade}
              className="w-full h-12 bg-viral text-foreground hover:brightness-110 font-bold text-[14px] rounded-xl shadow-glow-viral"
            >
              {monthlyPrice
                ? `Открыть Pro — ${monthlyPrice.toLocaleString("ru-RU")} ₸/мес`
                : "Открыть Pro"}
            </Button>
            <button
              onClick={() => onOpenChange(false)}
              className="w-full h-9 text-[12.5px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Посмотреть тренды дальше
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
