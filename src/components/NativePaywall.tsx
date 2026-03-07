import { useState } from "react";
import { X } from "lucide-react";
import { isNativePlatform } from "@/lib/native";

const PLANS = [
  {
    label: "3 месяца",
    price: "45,600₸",
    perMonth: "15,200₸/мес",
    discount: "ЭКОНОМИЯ 15%",
    popular: true,
  },
  {
    label: "1 месяц",
    price: "17,900₸",
    perMonth: "",
    discount: "",
    popular: false,
  },
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
    <div className="fixed inset-0 z-[99999] flex flex-col bg-black">
      {/* Background collage */}
      <div className="relative flex-1 min-h-0">
        {/* Grid of placeholder images */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1 p-1 opacity-60">
          {[
            "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=400&fit=crop",
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop",
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=400&fit=crop",
            "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300&h=400&fit=crop",
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=400&fit=crop",
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=400&fit=crop",
          ].map((src, i) => (
            <div key={i} className="rounded-xl overflow-hidden">
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          ))}
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black" />

        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 left-4 z-10 h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
          style={{ top: "env(safe-area-inset-top, 16px)" }}
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Bottom content */}
      <div className="bg-black px-6 pb-8 pt-4 space-y-5">
        <div className="text-center space-y-1">
          <p className="text-white/60 text-sm font-medium">Перейди на Pro</p>
          <h2 className="text-3xl font-black text-white leading-tight">
            Прокачай свои{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, hsl(72 100% 50%), hsl(120 70% 50%), hsl(280 80% 60%))",
              }}
            >
              социальные сети
            </span>
          </h2>
        </div>

        {/* Plan options */}
        <div className="space-y-3">
          {PLANS.map((plan, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`w-full flex items-center gap-3 rounded-2xl px-4 py-4 border-2 transition-all ${
                selected === i
                  ? "border-neon bg-neon/5"
                  : "border-white/15 bg-white/5"
              }`}
            >
              <div
                className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selected === i ? "border-neon" : "border-white/30"
                }`}
              >
                {selected === i && (
                  <div className="h-3 w-3 rounded-full bg-neon" />
                )}
              </div>
              <div className="text-left flex-1">
                <span className="text-white font-bold text-base">
                  {plan.label}
                </span>
                <br />
                <span className="text-white/50 text-sm">{plan.price}</span>
              </div>
              {plan.discount && (
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                  {plan.discount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          className="w-full py-4 rounded-2xl font-bold text-lg text-black bg-neon hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Подписаться
        </button>

        <p className="text-center text-white/30 text-xs">
          Оплата через WhatsApp. Можно отменить в любой момент.
        </p>
      </div>
    </div>
  );
}
