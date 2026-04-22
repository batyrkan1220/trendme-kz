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
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { isNativePlatform } from "@/lib/native";
import { NICHE_GROUPS } from "@/config/niches";

const NICHES = NICHE_GROUPS.map((g) => ({
  value: g.key,
  label: g.label,
  emoji: g.emoji,
}));

const GOALS = [
  { value: "grow_followers", label: "Быстро набрать подписчиков", emoji: "📈" },
  { value: "find_ideas", label: "Найти идеи для контента", emoji: "💡" },
  { value: "analyze_competitors", label: "Следить за конкурентами", emoji: "🔍" },
  { value: "find_trends", label: "Первым ловить вирусные тренды", emoji: "🔥" },
  { value: "grow_income", label: "Монетизировать контент", emoji: "💰" },
];

const PLATFORMS = [
  { value: "tiktok", label: "TikTok", emoji: "🎵" },
  { value: "instagram", label: "Instagram Reels", emoji: "📸" },
  { value: "youtube", label: "YouTube Shorts", emoji: "▶️" },
  { value: "all", label: "Все платформы", emoji: "🌐" },
];

const EXPERIENCE = [
  { value: "beginner", label: "Только начинаю", sub: "меньше 1 000 подписчиков", emoji: "🌱" },
  { value: "growing", label: "Активно расту", sub: "1 000 – 50 000 подписчиков", emoji: "🚀" },
  { value: "experienced", label: "Опытный автор", sub: "больше 50 000 подписчиков", emoji: "⭐" },
  { value: "agency", label: "Агентство / SMM", sub: "несколько аккаунтов", emoji: "🏢" },
];

const PREPARING_STEPS = [
  { icon: Search, text: "Ищем тренды по вашей нише…" },
  { icon: BarChart3, text: "Анализируем вашу платформу…" },
  { icon: TrendingUp, text: "Подбираем контент под ваш уровень…" },
  { icon: Zap, text: "Всё готово! Запускаем…" },
];

const TOTAL_STEPS = 5;

const STEP_META = [
  { eyebrow: "Шаг 1 · Ниша", icon: Sparkles },
  { eyebrow: "Шаг 2 · Цель", icon: Target },
  { eyebrow: "Шаг 3 · Платформа", icon: PlayCircle },
  { eyebrow: "Шаг 4 · Опыт", icon: Star },
  { eyebrow: "Шаг 5 · Соглашения", icon: ShieldCheck },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [niches, setNiches] = useState<string[]>([]);
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
    }, 220);
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
          niche: niches.join(","),
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
      ? "opacity-0 translate-x-6"
      : "opacity-0 -translate-x-6"
    : "opacity-100 translate-x-0";

  // ── PREPARING SCREEN ──────────────────────────────────────────────
  if (preparing) {
    const Icon = PREPARING_STEPS[prepStep].icon;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background gradient-mesh p-4 relative overflow-hidden">
        <div className="w-full max-w-sm space-y-10 text-center animate-fade-in relative">
          {/* Animated icon */}
          <div className="relative mx-auto w-24 h-24">
            <div
              className="absolute inset-0 rounded-3xl bg-primary/15 blur-2xl animate-pulse"
              style={{ animationDuration: "2.4s" }}
            />
            <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-card border border-border shadow-card">
              <Icon className="h-10 w-10 text-primary animate-scale-in" key={prepStep} />
            </div>
          </div>

          {/* Step text */}
          <div className="space-y-4">
            <p
              className="text-base font-semibold text-foreground animate-fade-in tracking-tight"
              key={prepStep}
            >
              {PREPARING_STEPS[prepStep].text}
            </p>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5">
              {PREPARING_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i <= prepStep ? "w-8 bg-primary" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Selection chips */}
          <div className="flex justify-center gap-1.5 flex-wrap">
            {niches.map((nv) => {
              const n = NICHES.find((x) => x.value === nv);
              if (!n) return null;
              return (
                <span
                  key={nv}
                  className="px-2.5 py-1 rounded-full bg-primary-soft text-accent-foreground text-[11px] font-semibold"
                >
                  {n.emoji} {n.label}
                </span>
              );
            })}
            {platform && (
              <span className="px-2.5 py-1 rounded-full bg-primary-soft text-accent-foreground text-[11px] font-semibold">
                {PLATFORMS.find((p) => p.value === platform)?.emoji}{" "}
                {PLATFORMS.find((p) => p.value === platform)?.label}
              </span>
            )}
            {goal && (
              <span className="px-2.5 py-1 rounded-full bg-primary-soft text-accent-foreground text-[11px] font-semibold">
                {GOALS.find((g) => g.value === goal)?.emoji}{" "}
                {GOALS.find((g) => g.value === goal)?.label}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  const StepIcon = STEP_META[step].icon;

  // ── MAIN ONBOARDING ───────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-background gradient-mesh p-4 relative overflow-hidden">
      {/* Subtle dot grid behind everything */}
      <div className="absolute inset-0 bg-dots opacity-[0.35] pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="rounded-3xl border border-border bg-card/90 glass-strong shadow-card p-6 sm:p-8 space-y-6 animate-fade-in">
          {/* Top bar: progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="section-label !px-0 !mb-0">{STEP_META[step].eyebrow}</span>
              <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                {step + 1}/{TOTAL_STEPS}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full overflow-hidden bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: i < step ? "100%" : i === step ? "55%" : "0%" }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={`transition-all duration-200 ease-out ${slideClass}`}>
            {/* Header (shared across steps) */}
            <div className="text-center space-y-2 mb-5">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary-soft border border-border animate-scale-in">
                <StepIcon className="h-6 w-6 text-primary" strokeWidth={2.2} />
              </div>
              {step === 0 && (
                <>
                  <h2 className="text-[22px] font-bold text-foreground tracking-tight">
                    В какой нише вы создаёте контент?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Можно выбрать до 5 — подберём тренды по всем
                  </p>
                </>
              )}
              {step === 1 && (
                <>
                  <h2 className="text-[22px] font-bold text-foreground tracking-tight">
                    Какая ваша главная цель?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Настроим платформу под ваши задачи
                  </p>
                </>
              )}
              {step === 2 && (
                <>
                  <h2 className="text-[22px] font-bold text-foreground tracking-tight">
                    На какой платформе вы снимаете?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Будем искать тренды именно там
                  </p>
                </>
              )}
              {step === 3 && (
                <>
                  <h2 className="text-[22px] font-bold text-foreground tracking-tight">
                    Какой у вас опыт в контенте?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Подберём подходящий уровень аналитики
                  </p>
                </>
              )}
              {step === 4 && (
                <>
                  <h2 className="text-[22px] font-bold text-foreground tracking-tight">
                    Почти готово!
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Примите условия использования для продолжения
                  </p>
                </>
              )}
            </div>

            {/* ── STEP 0: Ниша (multi-select, max 5) ─────────────────── */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-muted-foreground">
                    Выбрано <span className="text-foreground tabular-nums">{niches.length}</span> из 5
                  </span>
                  {niches.length > 0 && (
                    <button
                      onClick={() => setNiches([])}
                      className="text-primary hover:underline"
                    >
                      Сбросить
                    </button>
                  )}
                </div>
                <div className="max-h-[calc(100dvh-420px)] min-h-[180px] overflow-y-auto -mx-2 px-2 scrollbar-hide">
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {NICHES.map((n) => {
                      const active = niches.includes(n.value);
                      const atLimit = !active && niches.length >= 5;
                      return (
                        <button
                          key={n.value}
                          onClick={() => {
                            if (active) {
                              setNiches((prev) => prev.filter((v) => v !== n.value));
                            } else if (!atLimit) {
                              setNiches((prev) => [...prev, n.value]);
                            }
                          }}
                          disabled={atLimit}
                          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 press-feedback whitespace-nowrap ${
                            active
                              ? "border-primary bg-primary text-primary-foreground shadow-glow-primary"
                              : atLimit
                              ? "border-border bg-muted text-muted-foreground/60 cursor-not-allowed"
                              : "border-border bg-background text-foreground/80 hover:border-primary/40 hover:bg-primary-soft"
                          }`}
                        >
                          <span className="mr-1">{n.emoji}</span>
                          {n.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button
                  onClick={() => goToStep(1)}
                  disabled={niches.length === 0}
                  className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-[15px] font-semibold shadow-glow-primary press-feedback"
                >
                  Продолжить <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            )}

            {/* ── STEP 1: Цель ─────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-2">
                  {GOALS.map((g) => {
                    const active = goal === g.value;
                    return (
                      <button
                        key={g.value}
                        onClick={() => setGoal(g.value)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 press-feedback ${
                          active
                            ? "border-primary bg-primary-soft shadow-soft"
                            : "border-border bg-background hover:border-primary/40 hover:bg-primary-soft/50"
                        }`}
                      >
                        <span className="text-xl shrink-0">{g.emoji}</span>
                        <span
                          className={`text-sm font-semibold flex-1 ${
                            active ? "text-foreground" : "text-foreground/85"
                          }`}
                        >
                          {g.label}
                        </span>
                        {active && (
                          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground shrink-0">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <NavRow
                  onBack={() => goToStep(0)}
                  onNext={() => goToStep(2)}
                  nextDisabled={!goal}
                />
              </div>
            )}

            {/* ── STEP 2: Платформа ────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-2.5">
                  {PLATFORMS.map((p) => {
                    const active = platform === p.value;
                    return (
                      <button
                        key={p.value}
                        onClick={() => setPlatform(p.value)}
                        className={`relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border text-center transition-all duration-150 press-feedback aspect-[4/3] ${
                          active
                            ? "border-primary bg-primary-soft shadow-soft"
                            : "border-border bg-background hover:border-primary/40 hover:bg-primary-soft/50"
                        }`}
                      >
                        <span className="text-3xl">{p.emoji}</span>
                        <span
                          className={`text-[13px] font-semibold ${
                            active ? "text-foreground" : "text-foreground/85"
                          }`}
                        >
                          {p.label}
                        </span>
                        {active && (
                          <span className="absolute top-2 right-2 flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <NavRow
                  onBack={() => goToStep(1)}
                  onNext={() => goToStep(3)}
                  nextDisabled={!platform}
                />
              </div>
            )}

            {/* ── STEP 3: Опыт ─────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-2">
                  {EXPERIENCE.map((e) => {
                    const active = experience === e.value;
                    return (
                      <button
                        key={e.value}
                        onClick={() => setExperience(e.value)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 press-feedback ${
                          active
                            ? "border-primary bg-primary-soft shadow-soft"
                            : "border-border bg-background hover:border-primary/40 hover:bg-primary-soft/50"
                        }`}
                      >
                        <span className="text-2xl shrink-0">{e.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{e.label}</p>
                          <p className="text-xs text-muted-foreground">{e.sub}</p>
                        </div>
                        {active && (
                          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground shrink-0">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <NavRow
                  onBack={() => goToStep(2)}
                  onNext={() => goToStep(4)}
                  nextDisabled={!experience}
                />
              </div>
            )}

            {/* ── STEP 4: Соглашения ───────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <ConsentRow
                    checked={termsAccepted}
                    onChange={setTermsAccepted}
                    title="Пользовательское соглашение"
                    body={
                      <>
                        Я принимаю{" "}
                        <a
                          href="/terms"
                          target="_blank"
                          className="text-primary hover:underline font-semibold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Пользовательское соглашение
                        </a>
                      </>
                    }
                  />
                  <ConsentRow
                    checked={privacyAccepted}
                    onChange={setPrivacyAccepted}
                    title="Политика конфиденциальности"
                    body={
                      <>
                        Я ознакомился с{" "}
                        <a
                          href="/privacy"
                          target="_blank"
                          className="text-primary hover:underline font-semibold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Политикой конфиденциальности
                        </a>
                      </>
                    }
                  />
                  <ConsentRow
                    checked={contentRulesAccepted}
                    onChange={setContentRulesAccepted}
                    title="Правила контента"
                    body="Я понимаю, что оскорбительный и нетерпимый контент запрещён и будет удалён"
                  />
                </div>

                <div className="flex gap-2.5">
                  <Button
                    variant="outline"
                    onClick={() => goToStep(3)}
                    className="h-12 rounded-xl px-4 border-border"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleFinish}
                    disabled={!allConsentsAccepted || saving}
                    className="flex-1 h-12 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-[15px] font-semibold shadow-glow-primary press-feedback"
                  >
                    {saving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Начать <ArrowRight className="h-4 w-4 ml-1.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-[11px] text-muted-foreground mt-4">
          Эти данные помогут точнее подобрать тренды и аналитику
        </p>
      </div>
    </div>
  );
}

/* ─── Small helper components ─────────────────────────────────────── */

function NavRow({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled: boolean;
}) {
  return (
    <div className="flex gap-2.5">
      <Button variant="outline" onClick={onBack} className="h-12 rounded-xl px-4 border-border">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button
        onClick={onNext}
        disabled={nextDisabled}
        className="flex-1 h-12 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-[15px] font-semibold shadow-glow-primary press-feedback"
      >
        Продолжить <ArrowRight className="h-4 w-4 ml-1.5" />
      </Button>
    </div>
  );
}

function ConsentRow({
  checked,
  onChange,
  title,
  body,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all press-feedback ${
        checked
          ? "border-primary/50 bg-primary-soft/60"
          : "border-border bg-background hover:border-primary/30"
      }`}
    >
      <span className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={`flex items-center justify-center h-5 w-5 rounded-md border-2 transition-colors ${
            checked ? "bg-primary border-primary" : "bg-background border-border-strong"
          }`}
        >
          {checked && <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />}
        </span>
      </span>
      <div className="space-y-0.5 min-w-0">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </label>
  );
}
