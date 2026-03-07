import { useState } from "react";
import { X, Flame, TrendingUp, Sparkles, Zap, Crown } from "lucide-react";
import { isNativePlatform } from "@/lib/native";

const PLANS = [
  {
    label: "3 месяца",
    price: "45,600₸",
    perMonth: "15,200₸/мес",
    oldPrice: "53,700₸",
    discount: "-15%",
    popular: true,
  },
  {
    label: "1 месяц",
    price: "17,900₸",
    perMonth: "",
    oldPrice: "",
    discount: "",
    popular: false,
  },
];

const FEATURES = [
  { icon: TrendingUp, text: "Безлимитный доступ к трендам" },
  { icon: Sparkles, text: "AI-анализ видео и аккаунтов" },
  { icon: Zap, text: "Генерация сценариев" },
  { icon: Flame, text: "Мониторинг конкурентов" },
];

export function NativePaywall({ onDismiss }: { onDismiss: () => void }) {
  const [selected, setSelected] = useState(0);

  if (!isNativePlatform) return null;

  const handleSubscribe = () => {
    const plan = PLANS[selected];
    const duration = selected === 0 ? "3" : "1";
    const msg = encodeURIComponent(
      `Я хочу Купить ${duration}-месячную подписку на платформу trendme.kz`
    );
    window.open(`https://wa.me/77770145874?text=${msg}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col overflow-hidden">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(145deg, #0a0a0a 0%, #0d1117 40%, #0a0a0a 100%)",
        }}
      />

      {/* Subtle glow orbs */}
      <div
        className="absolute top-[-20%] right-[-20%] w-[60vw] h-[60vw] rounded-full opacity-20 blur-[80px]"
        style={{ background: "hsl(72 100% 50%)" }}
      />
      <div
        className="absolute bottom-[20%] left-[-15%] w-[40vw] h-[40vw] rounded-full opacity-10 blur-[60px]"
        style={{ background: "hsl(280 80% 60%)" }}
      />

      {/* Close button */}
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
        style={{ top: "calc(env(safe-area-inset-top, 16px) + 8px)" }}
      >
        <X className="h-5 w-5 text-white/60" />
      </button>

      {/* Content */}
      <div className="relative flex-1 flex flex-col justify-end px-6 pb-8"
           style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}>
        
        {/* Crown icon */}
        <div className="flex justify-center mb-4">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(72 100% 50% / 0.2), hsl(72 100% 50% / 0.05))",
              border: "1px solid hsl(72 100% 50% / 0.3)",
            }}
          >
            <Crown className="h-8 w-8" style={{ color: "hsl(72 100% 50%)" }} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
            Открой полный{"\n"}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(90deg, hsl(72 100% 50%), hsl(90 80% 55%))",
              }}
            >
              доступ к TrendMe
            </span>
          </h2>
          <p className="text-white/50 text-sm">
            Все инструменты для роста в соцсетях
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <f.icon className="h-4 w-4 shrink-0" style={{ color: "hsl(72 100% 50%)" }} />
              <span className="text-white/80 text-xs font-medium leading-tight">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Plan options */}
        <div className="space-y-3 mb-5">
          {PLANS.map((plan, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className="w-full relative flex items-center gap-3 rounded-2xl px-4 py-4 transition-all active:scale-[0.98]"
              style={{
                background: selected === i
                  ? "linear-gradient(135deg, hsl(72 100% 50% / 0.08), hsl(72 100% 50% / 0.02))"
                  : "rgba(255,255,255,0.04)",
                border: selected === i
                  ? "2px solid hsl(72 100% 50% / 0.5)"
                  : "2px solid rgba(255,255,255,0.08)",
              }}
            >
              {plan.popular && (
                <span
                  className="absolute -top-2.5 right-4 text-[10px] font-bold px-2.5 py-0.5 rounded-full text-black"
                  style={{ background: "hsl(72 100% 50%)" }}
                >
                  ВЫГОДНО
                </span>
              )}
              <div
                className="h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{
                  borderColor: selected === i ? "hsl(72 100% 50%)" : "rgba(255,255,255,0.2)",
                }}
              >
                {selected === i && (
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(72 100% 50%)" }} />
                )}
              </div>
              <div className="text-left flex-1">
                <span className="text-white font-bold text-base">{plan.label}</span>
                {plan.perMonth && (
                  <span className="text-white/40 text-sm ml-2">{plan.perMonth}</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-white font-bold text-base">{plan.price}</span>
                {plan.oldPrice && (
                  <>
                    <br />
                    <span className="text-white/30 text-xs line-through">{plan.oldPrice}</span>
                    <span
                      className="text-xs font-bold ml-1.5"
                      style={{ color: "hsl(72 100% 50%)" }}
                    >
                      {plan.discount}
                    </span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          className="w-full py-4 rounded-2xl font-bold text-lg text-black active:scale-[0.97] transition-all"
          style={{
            background: "linear-gradient(135deg, hsl(72 100% 50%), hsl(80 90% 45%))",
            boxShadow: "0 4px 24px hsl(72 100% 50% / 0.3)",
          }}
        >
          Подписаться
        </button>

        <p className="text-center text-white/25 text-[11px] mt-3">
          Оплата через WhatsApp · Отмена в любой момент
        </p>
      </div>
    </div>
  );
}
