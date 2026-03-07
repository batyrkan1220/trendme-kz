import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const NICHES = [
  { value: "beauty", label: "💄 Бьюти" },
  { value: "fitness", label: "💪 Фитнес" },
  { value: "food", label: "🍕 Еда" },
  { value: "education", label: "📚 Образование" },
  { value: "entertainment", label: "🎬 Развлечения" },
  { value: "business", label: "💼 Бизнес" },
  { value: "tech", label: "💻 Технологии" },
  { value: "travel", label: "✈️ Путешествия" },
  { value: "fashion", label: "👗 Мода" },
  { value: "other", label: "🔮 Другое" },
];

const GOALS = [
  { value: "grow_followers", label: "📈 Рост подписчиков" },
  { value: "find_ideas", label: "💡 Поиск идей для контента" },
  { value: "analyze_competitors", label: "🔍 Анализ конкурентов" },
  { value: "find_trends", label: "🔥 Ловить тренды" },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [niche, setNiche] = useState("");
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [transitioning, setTransitioning] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const goToStep = (next: number) => {
    setDirection(next > step ? "forward" : "back");
    setTransitioning(true);
    setTimeout(() => {
      setStep(next);
      setTransitioning(false);
    }, 250);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ niche, goal, onboarding_completed: true, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (error) throw error;
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error("Ошибка сохранения: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const slideClass = transitioning
    ? direction === "forward"
      ? "opacity-0 translate-x-8"
      : "opacity-0 -translate-x-8"
    : "opacity-100 translate-x-0";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-[0.08]" style={{ background: "hsl(72 100% 50%)" }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-[0.06]" style={{ background: "hsl(82 90% 45%)" }} />

      <div className="w-full max-w-md space-y-6 animate-fade-in relative">
        {/* Progress */}
        <div className="flex gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full overflow-hidden bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }}
              />
            </div>
          ))}
        </div>

        <div className={`transition-all duration-250 ease-out ${slideClass}`}>
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 animate-scale-in">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Какая у вас ниша?</h2>
                <p className="text-sm text-muted-foreground">Выберите основную тему контента</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {NICHES.map((n, idx) => (
                  <button
                    key={n.value}
                    onClick={() => setNiche(n.value)}
                    className={`p-3 rounded-xl border text-left text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                      niche === n.value
                        ? "border-primary bg-primary/10 text-foreground shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    }`}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
              <Button
                onClick={() => goToStep(1)}
                disabled={!niche}
                className="w-full h-12 gradient-hero text-primary-foreground border-0 glow-primary rounded-xl text-base font-semibold active:scale-[0.98] transition-transform"
              >
                Далее <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 animate-scale-in">
                  <Target className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Какая ваша цель?</h2>
                <p className="text-sm text-muted-foreground">Мы настроим дашборд под вас</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {GOALS.map((g, idx) => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    className={`p-4 rounded-xl border text-left text-base font-medium transition-all duration-200 active:scale-[0.97] ${
                      goal === g.value
                        ? "border-primary bg-primary/10 text-foreground shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => goToStep(0)}
                  className="h-12 rounded-xl px-6"
                >
                  Назад
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={!goal || saving}
                  className="flex-1 h-12 gradient-hero text-primary-foreground border-0 glow-primary rounded-xl text-base font-semibold active:scale-[0.98] transition-transform"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>Начать <ArrowRight className="h-5 w-5 ml-2" /></>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
