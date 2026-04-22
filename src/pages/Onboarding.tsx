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
  { eyebrow: "Шаг 1 · Ниша", icon: Sparkles, title: "В какой нише вы создаёте контент?", subtitle: "Можно выбрать до 5 — подберём тренды по всем" },
  { eyebrow: "Шаг 2 · Цель", icon: Target, title: "Какая ваша главная цель?", subtitle: "Настроим платформу под ваши задачи" },
  { eyebrow: "Шаг 3 · Платформа", icon: PlayCircle, title: "На какой платформе вы снимаете?", subtitle: "Будем искать тренды именно там" },
  { eyebrow: "Шаг 4 · Опыт", icon: Star, title: "Какой у вас опыт в контенте?", subtitle: "Подберём подходящий уровень аналитики" },
  { eyebrow: "Шаг 5 · Соглашения", icon: ShieldCheck, title: "Почти готово!", subtitle: "Примите условия использования для продолжения" },
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
    }, 200);
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
      ? "opacity-0 translate-x-4"
      : "opacity-0 -translate-x-4"
    : "opacity-100 translate-x-0";

  // ── PREPARING SCREEN ──────────────────────────────────────────────
  if (preparing) {
    const Icon = PREPARING_STEPS[prepStep].icon;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background gradient-mesh p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)] pointer-events-none" />
        <div className="w-full max-w-sm space-y-8 text-center relative">
          <div className="relative mx-auto w-20 h-20">
            <div
              className="absolute inset-0 rounded-3xl bg-viral/40 blur-2xl animate-pulse"
              style={{ animationDuration: "2.4s" }}
            />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-card border border-border shadow-card">
              <Icon className="h-9 w-9 text-foreground animate-scale-in" key={prepStep} />
            </div>
          </div>

          <div className="space-y-4">
            <p
              className="text-base font-semibold text-foreground tracking-tight"
              key={prepStep}
            >
              {PREPARING_STEPS[prepStep].text}
            </p>

            <div className="flex justify-center gap-1.5">
              {PREPARING_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i <= prepStep ? "w-8 bg-foreground" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-1.5 flex-wrap">
            {niches.map((nv) => {
              const n = NICHES.find((x) => x.value === nv);
              if (!n) return null;
              return (
                <span
                  key={nv}
                  className="px-2.5 py-1 rounded-full bg-viral-soft border border-viral/40 text-foreground text-[11px] font-semibold"
                >
                  {n.emoji} {n.label}
                </span>
              );
            })}
            {platform && (
              <span className="px-2.5 py-1 rounded-full bg-background border border-border text-foreground text-[11px] font-semibold shadow-soft">
                {PLATFORMS.find((p) => p.value === platform)?.emoji}{" "}
                {PLATFORMS.find((p) => p.value === platform)?.label}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  const meta = STEP_META[step];
  const StepIcon = meta.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background gradient-mesh p-4 relative overflow-hidden">
      {/* Landing-style dot grid with radial mask */}
      <div className="absolute inset-0 bg-dots opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* CARD — landing-style premium card */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          {/* HEADER (progress) — identical on every step */}
          <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-viral animate-pulse" />
                {meta.eyebrow}
              </span>
              <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                {step + 1} / {TOTAL_STEPS}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full overflow-hidden bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-500 ease-out"
                    style={{ width: i < step ? "100%" : i === step ? "55%" : "0%" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* BODY */}
          <div className="p-5 sm:p-6">
            <div className={`transition-all duration-200 ease-out ${slideClass}`}>
              {/* Title block — landing typography */}
              <div className="text-center space-y-2 mb-5">
                <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-viral-soft border border-viral/40">
                  <StepIcon className="h-5 w-5 text-foreground" strokeWidth={2.2} />
                </div>
                <h2 className="text-[22px] sm:text-[26px] font-bold text-foreground tracking-tight leading-[1.1]">
                  {meta.title}
                </h2>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  {meta.subtitle}
                </p>
              </div>

              <div className="min-h-[280px] flex flex-col">
                {/* ── STEP 0: Niches ─────────────────────────────────── */}
                {step === 0 && (
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex items-center justify-between text-[12px] font-semibold">
                      <span className="text-muted-foreground">
                        Выбрано <span className="text-foreground tabular-nums">{niches.length}</span> из 5
                      </span>
                      {niches.length > 0 && (
                        <button
                          onClick={() => setNiches([])}
                          className="text-foreground hover:underline"
                        >
                          Сбросить
                        </button>
                      )}
                    </div>
                    <div className="flex-1 max-h-[280px] overflow-y-auto -mx-1 px-1 scrollbar-hide">
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {NICHES.map((n) => {
                          const active = niches.includes(n.value);
                          const atLimit = !active && niches.length >= 5;
                          return (
                            <button
                              key={n.value}
                              onClick={() => {
                                if (active) setNiches((prev) => prev.filter((v) => v !== n.value));
                                else if (!atLimit) setNiches((prev) => [...prev, n.value]);
                              }}
                              disabled={atLimit}
                              className={`h-8 px-3 inline-flex items-center rounded-full border text-[13px] font-medium transition-all duration-150 press-feedback whitespace-nowrap ${
                                active
                                  ? "border-foreground bg-foreground text-background shadow-soft"
                                  : atLimit
                                  ? "border-border bg-muted text-muted-foreground/50 cursor-not-allowed"
                                  : "border-border bg-background text-foreground hover:border-foreground/40 hover:bg-muted"
                              }`}
                            >
                              <span className="mr-1.5">{n.emoji}</span>
                              {n.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 1: Goal ───────────────────────────────────── */}
                {step === 1 && (
                  <div className="flex-1 flex flex-col gap-2">
                    {GOALS.map((g) => (
                      <OptionRow
                        key={g.value}
                        active={goal === g.value}
                        onClick={() => setGoal(g.value)}
                        emoji={g.emoji}
                        title={g.label}
                      />
                    ))}
                  </div>
                )}

                {/* ── STEP 2: Platform ───────────────────────────────── */}
                {step === 2 && (
                  <div className="flex-1 grid grid-cols-2 gap-2.5">
                    {PLATFORMS.map((p) => {
                      const active = platform === p.value;
                      return (
                        <button
                          key={p.value}
                          onClick={() => setPlatform(p.value)}
                          className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-center transition-all duration-150 press-feedback ${
                            active
                              ? "border-foreground bg-muted shadow-soft"
                              : "border-border bg-background hover:border-foreground/40 hover:bg-muted/60"
                          }`}
                        >
                          <span className="text-3xl leading-none">{p.emoji}</span>
                          <span className="text-[13px] font-semibold text-foreground">{p.label}</span>
                          {active && (
                            <span className="absolute top-2 right-2 flex items-center justify-center h-5 w-5 rounded-full bg-foreground text-background">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── STEP 3: Experience ─────────────────────────────── */}
                {step === 3 && (
                  <div className="flex-1 flex flex-col gap-2">
                    {EXPERIENCE.map((e) => (
                      <OptionRow
                        key={e.value}
                        active={experience === e.value}
                        onClick={() => setExperience(e.value)}
                        emoji={e.emoji}
                        title={e.label}
                        subtitle={e.sub}
                      />
                    ))}
                  </div>
                )}

                {/* ── STEP 4: Consents ───────────────────────────────── */}
                {step === 4 && (
                  <div className="flex-1 flex flex-col gap-2">
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
                            className="text-foreground underline font-semibold"
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
                            className="text-foreground underline font-semibold"
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
                      body="Оскорбительный и нетерпимый контент запрещён и будет удалён"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="flex gap-2.5">
              {step > 0 && (
                <Button
                  variant="outline"
                  onClick={() => goToStep(step - 1)}
                  className="h-12 w-12 rounded-xl border-border bg-background hover:bg-muted shrink-0 p-0"
                  aria-label="Назад"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={() => {
                  if (step < TOTAL_STEPS - 1) goToStep(step + 1);
                  else handleFinish();
                }}
                disabled={
                  (step === 0 && niches.length === 0) ||
                  (step === 1 && !goal) ||
                  (step === 2 && !platform) ||
                  (step === 3 && !experience) ||
                  (step === 4 && (!allConsentsAccepted || saving))
                }
                className="flex-1 h-12 bg-foreground hover:bg-foreground/90 text-background rounded-xl text-[15px] font-semibold press-feedback hover:-translate-y-0.5 hover:shadow-glow-primary transition-all disabled:shadow-none disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {step === TOTAL_STEPS - 1 ? (
                  saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Начать <ArrowRight className="h-4 w-4 ml-1.5" />
                    </>
                  )
                ) : (
                  <>
                    Продолжить <ArrowRight className="h-4 w-4 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-[12px] text-muted-foreground mt-4 px-4">
          Эти данные помогут точнее подобрать тренды и аналитику
        </p>
      </div>
    </div>
  );
}

/* ─── Reusable option row ─────── */
function OptionRow({
  active,
  onClick,
  emoji,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-3 min-h-[60px] px-4 py-3 rounded-xl border text-left transition-all duration-150 press-feedback ${
        active
          ? "border-foreground bg-muted shadow-soft"
          : "border-border bg-background hover:border-foreground/40 hover:bg-muted/60"
      }`}
    >
      <span className="text-xl leading-none shrink-0 w-7 text-center">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-foreground leading-tight tracking-tight">{title}</p>
        {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5 leading-tight">{subtitle}</p>}
      </div>
      <span
        className={`flex items-center justify-center h-5 w-5 rounded-full shrink-0 transition-colors ${
          active ? "bg-foreground text-background" : "bg-muted border border-border"
        }`}
      >
        {active && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
    </button>
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
      className={`flex items-start gap-3 min-h-[60px] p-4 rounded-xl border cursor-pointer select-none transition-all press-feedback ${
        checked
          ? "border-foreground/30 bg-muted/60"
          : "border-border bg-background hover:border-foreground/30"
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
            checked ? "bg-foreground border-foreground" : "bg-background border-border-strong"
          }`}
        >
          {checked && <Check className="h-3.5 w-3.5 text-background" strokeWidth={3} />}
        </span>
      </span>
      <div className="space-y-0.5 min-w-0">
        <span className="block text-[14px] font-semibold text-foreground leading-tight tracking-tight">{title}</span>
        <p className="text-[12px] text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </label>
  );
}
