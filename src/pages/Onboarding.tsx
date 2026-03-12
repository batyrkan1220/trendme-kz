import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, Sparkles, Target, ShieldCheck, Zap, Search, BarChart3, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { isNativePlatform } from "@/lib/native";
import { NICHE_GROUPS } from "@/config/niches";

const NICHES = NICHE_GROUPS.map((g) => ({
  value: g.key,
  label: `${g.emoji} ${g.label}`,
}));

const GOALS = [
  { value: "grow_followers", label: "📈 Рост подписчиков" },
  { value: "find_ideas", label: "💡 Поиск идей для контента" },
  { value: "analyze_competitors", label: "🔍 Анализ конкурентов" },
  { value: "find_trends", label: "🔥 Ловить тренды" },
];

const PREPARING_STEPS = [
  { icon: Search, text: "Ищем тренды по вашей нише..." },
  { icon: BarChart3, text: "Анализируем популярный контент..." },
  { icon: TrendingUp, text: "Подбираем лучшие видео для вас..." },
  { icon: Zap, text: "Всё готово! Запускаем..." },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [niche, setNiche] = useState("");
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [transitioning, setTransitioning] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [privacyAccepted, setPrivacyAccepted] = useState(true);
  const [contentRulesAccepted, setContentRulesAccepted] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [prepStep, setPrepStep] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  const allConsentsAccepted = termsAccepted && privacyAccepted && contentRulesAccepted;

  const goToStep = (next: number) => {
    setDirection(next > step ? "forward" : "back");
    setTransitioning(true);
    setTimeout(() => {
      setStep(next);
      setTransitioning(false);
    }, 250);
  };

  const doSaveAndNavigate = async () => {
    try {
      if (isNativePlatform && !user) {
        localStorage.setItem("native_onboarding_done", "1");
        navigate("/trends", { replace: true });
        return;
      }

      if (!user) return;

      await supabase.from("eula_acceptances").upsert({
        user_id: user.id,
        version: "1.0",
        accepted_at: new Date().toISOString(),
      }, { onConflict: "user_id,version" }).throwOnError();

      const { error } = await supabase
        .from("profiles")
        .update({ niche, goal, onboarding_completed: true, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (error) throw error;
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error("Ошибка сохранения: " + err.message);
      setPreparing(false);
      setSaving(false);
    }
  };

  const handleFinish = () => {
    setSaving(true);
    setPreparing(true);
    setPrepStep(0);
  };

  // Preparing animation sequence
  useEffect(() => {
    if (!preparing) return;
    if (prepStep < PREPARING_STEPS.length - 1) {
      const timer = setTimeout(() => setPrepStep((s) => s + 1), 1200);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => doSaveAndNavigate(), 800);
      return () => clearTimeout(timer);
    }
  }, [preparing, prepStep]);

  const slideClass = transitioning
    ? direction === "forward"
      ? "opacity-0 translate-x-8"
      : "opacity-0 -translate-x-8"
    : "opacity-100 translate-x-0";

  if (preparing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-[0.08]" style={{ background: "hsl(72 100% 50%)" }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-[0.06]" style={{ background: "hsl(82 90% 45%)" }} />

        <div className="w-full max-w-sm space-y-10 text-center animate-fade-in">
          {/* Animated icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
              {(() => {
                const Icon = PREPARING_STEPS[prepStep].icon;
                return <Icon className="h-9 w-9 text-primary animate-scale-in" key={prepStep} />;
              })()}
            </div>
          </div>

          {/* Step text */}
          <div className="space-y-3">
            <p className="text-lg font-semibold text-foreground animate-fade-in" key={prepStep}>
              {PREPARING_STEPS[prepStep].text}
            </p>

            {/* Progress dots */}
            <div className="flex justify-center gap-2">
              {PREPARING_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    i <= prepStep ? "w-8 bg-primary" : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Selected niche & goal */}
          <div className="flex justify-center gap-2 flex-wrap">
            {niche && (
              <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {NICHES.find((n) => n.value === niche)?.label}
              </span>
            )}
            {goal && (
              <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {GOALS.find((g) => g.value === goal)?.label}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-[0.08]" style={{ background: "hsl(72 100% 50%)" }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-[0.06]" style={{ background: "hsl(82 90% 45%)" }} />

      <div className="w-full max-w-md space-y-6 animate-fade-in relative">
        {/* Progress */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full overflow-hidden bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }}
              />
            </div>
          ))}
        </div>

        <div className={`transition-all duration-250 ease-out ${slideClass}`}>
          {/* Step 0: Niche */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 animate-scale-in">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Какая у вас ниша?</h2>
                <p className="text-xs text-muted-foreground">Выберите основную тему контента</p>
              </div>
              <div className="max-h-[calc(100dvh-280px)] overflow-y-auto -mx-1 px-1 scrollbar-hide">
                <div className="flex flex-wrap gap-2 justify-center">
                  {NICHES.map((n, idx) => (
                    <button
                      key={n.value}
                      onClick={() => setNiche(n.value)}
                      className={`px-3 py-2 rounded-full border text-xs font-medium transition-all duration-200 active:scale-[0.95] whitespace-nowrap ${
                        niche === n.value
                          ? "border-primary bg-primary/15 text-foreground shadow-sm"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
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

          {/* Step 1: Goal */}
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
                  onClick={() => goToStep(2)}
                  disabled={!goal}
                  className="flex-1 h-12 gradient-hero text-primary-foreground border-0 glow-primary rounded-xl text-base font-semibold active:scale-[0.98] transition-transform"
                >
                  Далее <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Consent / Agreements */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 animate-scale-in">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Соглашения</h2>
                <p className="text-sm text-muted-foreground">Для продолжения примите условия использования</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card cursor-pointer select-none transition-all hover:border-primary/50 active:scale-[0.98]">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-border accent-primary shrink-0"
                  />
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium text-foreground">Пользовательское соглашение</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Я принимаю{" "}
                      <a href="/terms" target="_blank" className="text-primary hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                        Пользовательское соглашение
                      </a>
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card cursor-pointer select-none transition-all hover:border-primary/50 active:scale-[0.98]">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-border accent-primary shrink-0"
                  />
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium text-foreground">Политика конфиденциальности</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Я ознакомился с{" "}
                      <a href="/privacy" target="_blank" className="text-primary hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                        Политикой конфиденциальности
                      </a>
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card cursor-pointer select-none transition-all hover:border-primary/50 active:scale-[0.98]">
                  <input
                    type="checkbox"
                    checked={contentRulesAccepted}
                    onChange={(e) => setContentRulesAccepted(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-border accent-primary shrink-0"
                  />
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium text-foreground">Правила контента</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Я понимаю, что оскорбительный и нетерпимый контент запрещён и будет удалён
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => goToStep(1)}
                  className="h-12 rounded-xl px-6"
                >
                  Назад
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={!allConsentsAccepted || saving}
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