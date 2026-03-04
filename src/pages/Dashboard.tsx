import { AppLayout } from "@/components/layout/AppLayout";
import {
  TrendingUp, Search, Video, UserCircle, Star, ArrowRight,
  CheckCircle2, Play, Zap, Target, BookOpen, ChevronDown, ChevronUp,
  Lightbulb, Sparkles, BarChart3, FileText, Copy, MousePointerClick,
  Eye, Heart, MessageCircle, Trophy, Filter, Clock, Link2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/* ───── persist progress ───── */
const STORAGE_KEY = "trendme_tutorial_progress";
const loadProgress = (): number[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
};
const saveProgress = (arr: number[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

/* ───── mini components ───── */
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 bg-primary/[0.06] border border-primary/15 rounded-xl p-3 md:p-3.5">
      <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
        <Lightbulb className="h-3.5 w-3.5 text-primary" />
      </div>
      <p className="text-xs leading-relaxed text-foreground/70">{children}</p>
    </div>
  );
}

function StepBadge({ icon: Icon, text, className }: { icon: React.ElementType; text: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold", className)}>
      <Icon className="h-3 w-3" /> {text}
    </span>
  );
}

function ScreenHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/60 border border-border/40 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        <MousePointerClick className="h-3 w-3" /> Экранда не көресің
      </div>
      <div className="text-xs text-foreground/70 leading-relaxed">{children}</div>
    </div>
  );
}

function NumberedStep({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-primary">{n}</span>
      </div>
      <p className="text-xs leading-relaxed text-foreground/80">{children}</p>
    </div>
  );
}

/* ───── step data ───── */
const steps = [
  {
    emoji: "🔥",
    title: "Тренды — вирусты видеоларды тап",
    subtitle: "Қазір ТикТокта не вирусты? Мұнда көресің",
    icon: TrendingUp,
    path: "/trends",
    pathLabel: "Трендтерге өту",
    color: "from-amber-500/20 to-orange-500/10",
    borderColor: "border-amber-500/30",
    details: (
      <>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Тренды</strong> бөліміне кірген кезде — сен қазір ТикТокта ең тез өсіп жатқан видеоларды көресің. Бұл видеолар автоматты түрде жиналып, рейтингке қойылады.
        </p>

        <ScreenHint>
          <p>Әр видео картасында мынаны көресің:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center gap-1.5"><Eye className="h-3 w-3 text-muted-foreground" /> <span>Көрілімдер саны</span></div>
            <div className="flex items-center gap-1.5"><Heart className="h-3 w-3 text-muted-foreground" /> <span>Лайктар саны</span></div>
            <div className="flex items-center gap-1.5"><MessageCircle className="h-3 w-3 text-muted-foreground" /> <span>Комменттер</span></div>
            <div className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-muted-foreground" /> <span>Жылдамдық (+/ч)</span></div>
          </div>
        </ScreenHint>

        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground">Видео деңгейлері:</p>
          <div className="flex flex-wrap gap-1.5">
            <StepBadge icon={Trophy} text="Strong Trend — 80K+ көрілім" className="bg-amber-500/15 text-amber-700 dark:text-amber-400" />
            <StepBadge icon={Zap} text="Mid Trend — 15K+ көрілім" className="bg-primary/10 text-primary" />
            <StepBadge icon={Target} text="Micro Trend — 3K+ көрілім" className="bg-primary/[0.07] text-primary/80" />
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground flex items-center gap-1"><Filter className="h-3 w-3" /> Фильтрлер:</p>
          <p className="text-xs text-foreground/70">Жоғарғы жақтағы нише батырмаларын бас — өз тақырыбыңдағы трендтер ғана көрінеді. Мысалы: "Красота", "Еда", "Бизнес".</p>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground">📋 Нақты қадамдар:</p>
          <div className="space-y-1">
            <NumberedStep n={1}>Сол жақтағы <strong>Тренды</strong> менюін бас</NumberedStep>
            <NumberedStep n={2}>Өз нишеңді таңда (мысалы: "Красота")</NumberedStep>
            <NumberedStep n={3}>Видеоларды көрілім мен velocity бойынша қара</NumberedStep>
            <NumberedStep n={4}>Ұнаған видеоны <strong>⭐ батырмасын</strong> басып сақта</NumberedStep>
            <NumberedStep n={5}>Видеоның ▶️ батырмасын басып, тікелей қара</NumberedStep>
          </div>
        </div>

        <Tip>
          Жаңа бастаушыға кеңес: <strong>Micro Trend</strong> видеоларынан баста — бәсекелес аз, бірақ серпін жақсы. Осы видеоны өз стиліңмен қайта жаса!
        </Tip>
      </>
    ),
  },
  {
    emoji: "🔍",
    title: "Іздеу — кілт сөзбен тап",
    subtitle: "Кез-келген тақырыпты теріп, видеоларды тап",
    icon: Search,
    path: "/search",
    pathLabel: "Іздеуге өту",
    color: "from-blue-500/20 to-cyan-500/10",
    borderColor: "border-blue-500/30",
    details: (
      <>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Іздеу</strong> арқылы ТикТоктан кез-келген тақырыпқа байланысты видеоларды табасың. Нәтижелер көрілім бойынша сұрыпталады.
        </p>

        <ScreenHint>
          <p>Жоғарғы жақта үлкен іздеу жолағы бар. Кілт сөзді теріп, Enter бас немесе 🔍 батырмасын бас.</p>
        </ScreenHint>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground">📋 Нақты қадамдар:</p>
          <div className="space-y-1">
            <NumberedStep n={1}>Сол жақтағы <strong>Іздеу</strong> менюін бас</NumberedStep>
            <NumberedStep n={2}>Іздеу жолағына кілт сөзді жаз, мысалы: <strong>"үйде тамақ жасау"</strong></NumberedStep>
            <NumberedStep n={3}>Нәтижелерді қара — видеолар көрілім бойынша сұрыпталған</NumberedStep>
            <NumberedStep n={4}>Ұнаған видеоны ⭐ сақта немесе тікелей қара</NumberedStep>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground">💡 Іздеу мысалдары:</p>
          <div className="flex flex-wrap gap-1.5">
            {["рецепт десерт", "фитнес үйде", "бизнес идея", "макияж tutorial", "мотивация"].map(q => (
              <span key={q} className="bg-muted rounded-lg px-2.5 py-1 text-[11px] font-medium text-foreground/70">"{q}"</span>
            ))}
          </div>
        </div>

        <Tip>Нақты сөздер қолдан: "тамақ" емес — <strong>"үйде жасайтын десерт рецепт"</strong>. Нақтырақ іздесең — дәлірек нәтиже аласың.</Tip>
      </>
    ),
  },
  {
    emoji: "🎬",
    title: "Видео анализ — видеоны бөлшекте",
    subtitle: "Неліктен вирусты? AI-мен талда",
    icon: Video,
    path: "/video-analysis",
    pathLabel: "Видео анализге өту",
    color: "from-purple-500/20 to-pink-500/10",
    borderColor: "border-purple-500/30",
    details: (
      <>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Кез-келген ТикТок видеосының сілтемесін қой — AI оны толық талдайды: не себепті вирусты болды, қандай тәсілдер қолданылған, сен не үйрене аласың.
        </p>

        <ScreenHint>
          <p>Бетте бір ғана іздеу жолағы бар — ТикТок видеосының сілтемесін осыған қоясың. AI бірнеше секундта нәтиже береді.</p>
        </ScreenHint>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground">📋 Нақты қадамдар:</p>
          <div className="space-y-1">
            <NumberedStep n={1}>ТикТокта видеоны аш → <strong>Бөлісу → Сілтемені көшіру</strong></NumberedStep>
            <NumberedStep n={2}>TrendMe-де <strong>Видео анализ</strong> бетін аш</NumberedStep>
            <NumberedStep n={3}>Сілтемені жолаққа қой → <strong>"Анализ"</strong> бас</NumberedStep>
            <NumberedStep n={4}>AI талдауын оқы — видеоның сәттілік формуласын түсін</NumberedStep>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground flex items-center gap-1"><BarChart3 className="h-3 w-3" /> AI не талдайды:</p>
          <ul className="space-y-1 ml-1 text-xs text-foreground/70">
            <li>• Видеоның хук (алғашқы 3 секунд) — назар аударту тәсілі</li>
            <li>• Контент құрылымы — қалай салынған</li>
            <li>• Аудитория реакциясы — комменттер мен лайктар</li>
            <li>• Сенің контентіңе қолдану жолдары</li>
          </ul>
        </div>

        <Tip>Трендтер бетінен тапқан <strong>Strong Trend</strong> видеоларын анализге жібер — олардың жетістік формуласын ашып, өзіңе қолданасың!</Tip>
      </>
    ),
  },
  {
    emoji: "👤",
    title: "Аккаунт анализ — авторды зертте",
    subtitle: "Бәсекелестерді немесе үлгі авторларды талда",
    icon: UserCircle,
    path: "/account-analysis",
    pathLabel: "Аккаунт анализге өту",
    color: "from-green-500/20 to-emerald-500/10",
    borderColor: "border-green-500/30",
    details: (
      <>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Кез-келген ТикТок авторының аккаунтын толық зертте: қанша подписчик, қандай видеолар жақсы жұмыс істейді, қандай стратегия қолданады.
        </p>

        <ScreenHint>
          <p>Бетте іздеу жолағы бар — ТикТок авторының <strong>username</strong>-ін немесе профиль сілтемесін жаз.</p>
        </ScreenHint>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground">📋 Нақты қадамдар:</p>
          <div className="space-y-1">
            <NumberedStep n={1}><strong>Аккаунт анализ</strong> бетін аш</NumberedStep>
            <NumberedStep n={2}>Автордың username-ін жаз, мысалы: <strong>@username</strong></NumberedStep>
            <NumberedStep n={3}>Аккаунт статистикасын қара: подписчиктер, лайктар, видео саны</NumberedStep>
            <NumberedStep n={4}>Олардың ТОП видеоларын тап — не жақсы жұмыс істейді</NumberedStep>
          </div>
        </div>

        <Tip>Өз нишеңдегі <strong>ТОП-5 авторды</strong> тап. Олардың ең көп көрілген 3 видеосын анализ жаса. Осыдан паттерн табасың!</Tip>
      </>
    ),
  },
  {
    emoji: "⭐",
    title: "Избранное — жинақтаңды құр",
    subtitle: "Сақталған видеолар мен сценарийлер",
    icon: Star,
    path: "/library",
    pathLabel: "Избранноеге өту",
    color: "from-yellow-500/20 to-amber-500/10",
    borderColor: "border-yellow-500/30",
    details: (
      <>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Барлық сақтаған видеоларың мен AI жасаған сценарийлерің бір жерде жиналады.
        </p>

        <ScreenHint>
          <p>Екі таб бар: <strong>"Видеолар"</strong> — сақтаған видеолар, <strong>"Сценарийлер"</strong> — AI жазған сценарийлер.</p>
        </ScreenHint>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground">📋 Қалай сақтайсың:</p>
          <div className="space-y-1">
            <NumberedStep n={1}>Трендтерде немесе Іздеуде видеоны тап</NumberedStep>
            <NumberedStep n={2}>Видео картасындағы <strong>⭐ батырмасын</strong> бас</NumberedStep>
            <NumberedStep n={3}>Видео автоматты түрде Избранноеге қосылады</NumberedStep>
            <NumberedStep n={4}>Кейін Избранноеден қарап, контент жасай аласың</NumberedStep>
          </div>
        </div>

        <Tip>Апта сайын <strong>5-10 тренд видео</strong> сақта. Осыларға негізделіп контент-план жаса — бұл сенің вирусты контент жинағың!</Tip>
      </>
    ),
  },
  {
    emoji: "✨",
    title: "AI Сценарий — видеоңды жоспарла",
    subtitle: "Тренд негізінде AI сценарий жаз",
    icon: Sparkles,
    path: "/trends",
    pathLabel: "Тренд тауып, сценарий жаз",
    color: "from-violet-500/20 to-fuchsia-500/10",
    borderColor: "border-violet-500/30",
    details: (
      <>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Тренд видеоны тауып, оны негізге алып <strong>AI-мен өзіңнің стиліңде жаңа сценарий</strong> жаздыра аласың. Сценарий бірден дайын — тек түсір!
        </p>

        <ScreenHint>
          <p>Трендтер немесе Іздеу бетінде видео картасында <strong>"📝 Сценарий"</strong> батырмасы бар. Оны бассаң — AI панелі ашылады.</p>
        </ScreenHint>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground">📋 Нақты қадамдар:</p>
          <div className="space-y-1">
            <NumberedStep n={1}><strong>Трендтер</strong> бетіне кір → Micro Trend видеоны тап</NumberedStep>
            <NumberedStep n={2}>Видео картасындағы <strong>"📝 Сценарий"</strong> батырмасын бас</NumberedStep>
            <NumberedStep n={3}>AI автоматты түрде сценарий жасайды (10-15 секунд)</NumberedStep>
            <NumberedStep n={4}>Сценарийді оқы, қажет болса өңде</NumberedStep>
            <NumberedStep n={5}><strong>"Сақтау"</strong> батырмасын бас → Избранноеде табасың</NumberedStep>
            <NumberedStep n={6}>Сценарий бойынша видеоңды түсір! 🎬</NumberedStep>
          </div>
        </div>

        <Tip>
          <strong>Ең тиімді стратегия:</strong> Micro Trend тауып → AI сценарий жазып → 24 сағат ішінде түсіру. Жылдамдық = вирустық мүмкіндік! 🚀
        </Tip>
      </>
    ),
  },
];

/* ───── main ───── */
export default function Dashboard() {
  const [openStep, setOpenStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(() => new Set(loadProgress()));

  useEffect(() => { saveProgress([...completed]); }, [completed]);

  const handleComplete = (step: number) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.add(step);
      return next;
    });
    if (step < steps.length - 1) setOpenStep(step + 1);
  };

  const progress = Math.round((completed.size / steps.length) * 100);
  const allDone = completed.size === steps.length;

  return (
    <AppLayout>
      <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 animate-fade-in w-full overflow-hidden max-w-3xl mx-auto">

        {/* Hero header */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 rounded-2xl p-4 md:p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="relative space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-foreground">Платформаны үйрен</h1>
                <p className="text-xs text-muted-foreground">6 қадамда TrendMe-ді толық меңгер</p>
              </div>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed max-w-xl">
              Әр қадамды ашып оқы, бөлімге өтіп көр, содан <strong>"Түсіндім"</strong> батырмасын бас. Аяқтаған кезде — сен тренд табудың шебері боласың! 💪
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-card rounded-xl border border-border/60 p-3 md:p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Прогресс
            </span>
            <span className={cn("text-xs font-bold", allDone ? "text-primary" : "text-muted-foreground")}>
              {completed.size}/{steps.length} қадам
            </span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {allDone && (
            <div className="mt-2.5 bg-primary/[0.06] border border-primary/15 rounded-lg p-2.5 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs font-semibold text-primary">Тамаша! Сен TrendMe-ді толық меңгердің! Енді трендтерді тауып, контент жаса! 🎉</p>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, i) => {
            const isOpen = openStep === i;
            const isDone = completed.has(i);

            return (
              <div
                key={i}
                className={cn(
                  "rounded-2xl border transition-all duration-300 overflow-hidden",
                  isOpen ? `${step.borderColor} bg-card shadow-lg` : isDone ? "border-primary/15 bg-primary/[0.02]" : "border-border/50 bg-card/80 hover:border-border"
                )}
              >
                {/* Header */}
                <button
                  onClick={() => setOpenStep(isOpen ? -1 : i)}
                  className="w-full flex items-center gap-3 md:gap-4 p-3.5 md:p-5 text-left"
                >
                  <div className={cn(
                    "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 transition-all",
                    isDone ? "bg-primary/15" : isOpen ? `bg-gradient-to-br ${step.color}` : "bg-muted/80"
                  )}>
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    ) : (
                      <span className="text-lg md:text-xl">{step.emoji}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "text-sm md:text-base font-bold truncate",
                      isDone ? "text-primary" : "text-foreground"
                    )}>{step.title}</h3>
                    <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5 line-clamp-1">{step.subtitle}</p>
                  </div>
                  <div className="shrink-0 text-muted-foreground">
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>

                {/* Content */}
                {isOpen && (
                  <div className="px-3.5 md:px-5 pb-4 md:pb-5 space-y-3.5 animate-fade-in">
                    <div className="border-t border-border/30" />
                    {step.details}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <Link
                        to={step.path}
                        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        {step.pathLabel} <ArrowRight className="h-4 w-4" />
                      </Link>
                      {!isDone && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleComplete(i); }}
                          className="inline-flex items-center justify-center gap-2 bg-muted hover:bg-muted/70 text-foreground rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Түсіндім, келесіге
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Final CTA */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5 md:p-7 text-center space-y-3 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--primary)/0.08),transparent_60%)]" />
          <div className="relative space-y-3">
            <h2 className="text-base md:text-lg font-bold text-foreground">🚀 Ең тиімді стратегия</h2>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-foreground/70">
              <span className="bg-card border border-border/60 rounded-lg px-3 py-1.5">1. Тренд тап</span>
              <ArrowRight className="h-3 w-3 text-primary" />
              <span className="bg-card border border-border/60 rounded-lg px-3 py-1.5">2. Анализ жаса</span>
              <ArrowRight className="h-3 w-3 text-primary" />
              <span className="bg-card border border-border/60 rounded-lg px-3 py-1.5">3. Сценарий жаз</span>
              <ArrowRight className="h-3 w-3 text-primary" />
              <span className="bg-primary/10 border border-primary/20 text-primary rounded-lg px-3 py-1.5 font-bold">4. Түсір! 🎬</span>
            </div>
            <Link
              to="/trends"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-3 text-sm font-bold hover:bg-primary/90 transition-colors shadow-md"
            >
              Трендтерді қарау <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
