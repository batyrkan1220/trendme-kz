import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Target,
  ShieldCheck,
  Zap,
  Search,
  BarChart3,
  TrendingUp,
  PlayCircle,
  Star,
} from "lucide-react";
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
  { value: "grow_followers", label: "📈 Хочу быстро набрать подписчиков" },
  { value: "find_ideas", label: "💡 Не знаю о чём снимать — нужны идеи" },
  { value: "analyze_competitors", label: "🔍 Хочу следить за конкурентами" },
  { value: "find_trends", label: "🔥 Хочу первым ловить вирусные тренды" },
  { value: "grow_income", label: "💰 Хочу монетизировать контент" },
];

const PLATFORMS = [
  { value: "tiktok", label: "🎵 TikTok" },
  { value: "instagram", label: "📸 Instagram Reels" },
  { value: "youtube", label: "▶️ YouTube Shorts" },
  { value: "all", label: "🌐 Все платформы" },
];

const EXPERIENCE = [
  { value: "beginner", label: "🌱 Только начинаю", sub: "меньше 1 000 подписчиков" },
  { value: "growing", label: "🚀 Активно расту", sub: "от 1 000 до 50 000 подписчиков" },
  { value: "experienced", label: "⭐ Опытный автор", sub: "больше 50 000 подписчиков" },
  { value: "agency", label: "🏢 Агентство / SMM", sub: "управляю несколькими аккаунтами" },
];

const PREPARING_STEPS = [
  { icon: Search, text: "Ищем тренды по вашей нише..." },
  { icon: BarChart3, text: "Анализируем вашу платформу..." },
  { icon: TrendingUp, text: "Подбираем контент под ваш уровень..." },
  { icon: Zap, text: "Всё готово! Запускаем..." },
];

const TOTAL_STEPS = 5;

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [niche, setNiche] = useState("");
  const [goal, setGoal] = useState("");
  const [platform, setPlatform] = useState("");
  const [experience, setExperience] = useState("");
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

      await supabase
        .from("eula_acceptances")
        .upsert(
          { user_id: user.id, version: "1.0", accepted_at: new Date().toISOString() },
          { onConflict: "user_id,version" }
        )
        .throwOnError();

      const { error } = await supabase
        .from("profiles")
        .update({
          niche,
          goal,
          platform,
          experience,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
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

  // ── PREPARING SCREEN ──────────────────────────────────────────────
  if (preparing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-[0.08]" style={{ background: "hsl(72 100% 50%)" }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-[0.06]" style={{ background: "hsl(82 90% 45%)" }} />

        <div className="w-full max-w-sm space-y-10 text-center animate-fade-in">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
              {(() => {
                const Icon = PREPARING_STEPS[prepStep].icon;
                return <Icon className="h-9 w-9 text-primary animate-scale-in" key={prepStep} />;
              })()}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-lg font-semibold text-foreground animate-fade-in" key={prepStep}>
              {PREPARING_STEPS[prepStep].text}
            </p>
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

          <div className="flex justify-center gap-2 flex-wrap">
            {niche && (
              <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {NICHES.find((n) => n.value === niche)?.label}
              </span>
            )}
            {platform && (
              <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {PLATFORMS.find((p) => p.value === platform)?.label}
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

  // ── MAIN ONBOARDING ───────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-[0.08]" style={{ background: "hsl(72 100% 50%)" }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-[0.06]" style={{ background: "hsl(82 90% 45%)" }} />

      <div className="w-full max-w-md space-y-6 animate-fade-in relative">

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full overflow-hidden bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: i < step ? "100%" : i === step ? "60%" : "0%" }}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-right">
            Шаг {step + 1} из {TOTAL_STEPS}
          </p>
        </div>

        <div className={`transition-all duration-250 ease-out ${slideClass}`}>

          {/* ── STEP 0: Ниша ─────────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 animate-scale-in">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">В какой нише вы создаёте контент?</h2>
                <p className="text-xs text-muted-foreground">Мы подберём тренды именно для вашей темы</p>
              </div>
              <div className="max-h-[calc(100dvh-300px)] overflow-y-auto -mx-1 px-1 scrollbar-hide">
                <div className="flex flex-wrap gap-2 justify-center">
                  {NICHES.map((n) => (
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

          {/* ── STEP 1: Цель ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 animate-scale-in">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Какая ваша главная цель?</h2>
                <p className="text-xs text-muted-foreground">Настроим платформу под ваши задачи</p>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    className={`p-3.5 rounded-xl border text-left text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                      goal === g.value
                        ? "border-primary bg-primary/10 text-foreground shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => goToStep(0)} className="h-12 rounded-xl px-4">
                  <ArrowLeft className="h-4 w-4" />
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

          {/* ── STEP 2: Платформа ────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 animate-scale-in">
                  <PlayCircle className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">На какой платформе вы снимаете?</h2>
                <p className="text-xs text-muted-foreground">Будем искать тренды именно там</p>
              </div>
              <div className="flex flex-wrap gap-2.5 justify-center">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={`px-5 py-3 rounded-2xl border text-sm font-semibold transition-all duration-200 active:scale-[0.95] ${
                      platform === p.value
                        ? "border-primary bg-primary/15 text-foreground shadow-sm scale-[1.03]"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => goToStep(1)} className="h-12 rounded-xl px-4">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => goToStep(3)}
                  disabled={!platform}
                  className="flex-1 h-12 gradient-hero text-primary-foreground border-0 glow-primary rounded-xl text-base font-semibold active:scale-[0.98] transition-transform"
                >
                  Далее <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Опыт ─────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 animate-scale-in">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Какой у вас опыт в контенте?</h2>
                <p className="text-xs text-muted-foreground">Подберём подходящий уровень аналитики</p>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {EXPERIENCE.map((e) => (
                  <button
                    key={e.value}
                    onClick={() => setExperience(e.value)}
                    className={`p-3.5 rounded-xl border text-left transition-all duration-200 active:scale-[0.97] ${
                      experience === e.value
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <p className={`text-sm font-semibold ${experience === e.value ? "text-foreground" : "text-muted-foreground"}`}>
                      {e.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{e.sub}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => goToStep(2)} className="h-12 rounded-xl px-4">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => goToStep(4)}
                  disabled={!experience}
                  className="flex-1 h-12 gradient-hero text-primary-foreground border-0 glow-primary rounded-xl text-base font-semibold active:scale-[0.98] transition-transform"
                >
                  Далее <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Соглашения ───────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 animate-scale-in">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Почти готово!</h2>
                <p className="text-xs text-muted-foreground">Примите условия использования для продолжения</p>
              </div>

              <div className="space-y-2.5">
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
                <Button variant="outline" onClick={() => goToStep(3)} className="h-12 rounded-xl px-4">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={!allConsentsAccepted || saving}
                  className="flex-1 h-12 gradient-hero text-primary-foreground border-0 glow-primary rounded-xl text-base font-semibold active:scale-[0.98] transition-transform"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Начать <ArrowRight className="h-5 w-5 ml-2" />
                    </>
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
