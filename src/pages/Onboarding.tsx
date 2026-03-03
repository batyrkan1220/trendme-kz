import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, ArrowRight, Loader2, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const NICHES = [
  { value: "beauty", label: "💄 Бьюти", emoji: "💄" },
  { value: "fitness", label: "💪 Фитнес", emoji: "💪" },
  { value: "food", label: "🍕 Еда", emoji: "🍕" },
  { value: "education", label: "📚 Образование", emoji: "📚" },
  { value: "entertainment", label: "🎬 Развлечения", emoji: "🎬" },
  { value: "business", label: "💼 Бизнес", emoji: "💼" },
  { value: "tech", label: "💻 Технологии", emoji: "💻" },
  { value: "travel", label: "✈️ Путешествия", emoji: "✈️" },
  { value: "fashion", label: "👗 Мода", emoji: "👗" },
  { value: "other", label: "🔮 Другое", emoji: "🔮" },
];

const GOALS = [
  { value: "grow_followers", label: "📈 Рост подписчиков", icon: "📈" },
  { value: "find_ideas", label: "💡 Поиск идей для контента", icon: "💡" },
  { value: "analyze_competitors", label: "🔍 Анализ конкурентов", icon: "🔍" },
  { value: "find_trends", label: "🔥 Ловить тренды", icon: "🔥" },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [niche, setNiche] = useState("");
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-[0.08]" style={{ background: "hsl(258 80% 58%)" }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-[0.06]" style={{ background: "hsl(168 76% 42%)" }} />

      <div className="w-full max-w-md space-y-6 animate-fade-in relative">
        {/* Progress */}
        <div className="flex gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Какая у вас ниша?</h2>
              <p className="text-sm text-muted-foreground">Выберите основную тему контента</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {NICHES.map((n) => (
                <button
                  key={n.value}
                  onClick={() => setNiche(n.value)}
                  className={`p-3 rounded-xl border text-left text-sm font-medium transition-all ${
                    niche === n.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
            <Button
              onClick={() => setStep(1)}
              disabled={!niche}
              className="w-full h-12 gradient-hero text-primary-foreground border-0 glow-primary rounded-xl text-base font-semibold"
            >
              Далее <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Какая ваша цель?</h2>
              <p className="text-sm text-muted-foreground">Мы настроим дашборд под вас</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={`p-4 rounded-xl border text-left text-base font-medium transition-all ${
                    goal === g.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <Button
              onClick={handleFinish}
              disabled={!goal || saving}
              className="w-full h-12 gradient-hero text-primary-foreground border-0 glow-primary rounded-xl text-base font-semibold"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>Начать <ArrowRight className="h-5 w-5 ml-2" /></>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
