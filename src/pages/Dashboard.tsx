import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, Search, Video, UserCircle, Star, ArrowRight, CheckCircle2, Play, Zap, Target, BookOpen, ChevronDown, ChevronUp, ExternalLink, Lightbulb, Sparkles, BarChart3, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  details: React.ReactNode;
  path: string;
  pathLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  completed: boolean;
  onComplete: () => void;
}

function TutorialStep({ number, title, description, icon: Icon, details, path, pathLabel, isOpen, onToggle, completed, onComplete }: StepProps) {
  return (
    <div className={cn(
      "rounded-2xl border transition-all duration-300",
      isOpen ? "border-primary/40 bg-card shadow-lg" : "border-border/60 bg-card/80 hover:border-primary/20",
      completed && !isOpen && "border-primary/20 bg-primary/[0.03]"
    )}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 md:gap-4 p-4 md:p-5 text-left"
      >
        <div className={cn(
          "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
          completed ? "bg-primary/15" : isOpen ? "bg-primary/10" : "bg-muted"
        )}>
          {completed ? (
            <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          ) : (
            <span className="text-base md:text-lg font-bold text-primary">{number}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-sm md:text-base font-bold text-foreground truncate">{title}</h3>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
        </div>
        <div className="shrink-0 text-muted-foreground">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-4 animate-fade-in">
          <div className="border-t border-border/40 pt-4" />
          <div className="text-sm text-foreground/80 leading-relaxed space-y-3">
            {details}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
            <Link
              to={path}
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              {pathLabel} <ArrowRight className="h-4 w-4" />
            </Link>
            {!completed && (
              <button
                onClick={(e) => { e.stopPropagation(); onComplete(); }}
                className="inline-flex items-center justify-center gap-2 bg-muted text-foreground rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" /> Түсіндім, келесіге
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-primary/5 border border-primary/10 rounded-xl p-3">
      <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <p className="text-xs text-foreground/70">{children}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [openStep, setOpenStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const handleComplete = (step: number) => {
    setCompleted(prev => new Set(prev).add(step));
    if (step < 5) setOpenStep(step + 1);
  };

  const progress = Math.round((completed.size / 6) * 100);

  const steps = [
    {
      title: "🔥 Тренды — вирусты видеоларды тап",
      description: "Платформаның негізгі құралы — трендтегі видеоларды қара",
      icon: TrendingUp,
      path: "/trends",
      pathLabel: "Трендтерге өту",
      details: (
        <>
          <p><strong>Тренды</strong> бөлімі — бұл платформаның жүрегі. Мұнда TikTok-тағы ең вирусты және тез өсіп жатқан видеолар жиналады.</p>
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Не көресің:</p>
            <ul className="space-y-1.5 ml-1">
              <li className="flex items-start gap-2"><Zap className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span><strong>Strong Trend</strong> — 80K+ көрілім, вирусты контент</span></li>
              <li className="flex items-start gap-2"><Target className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span><strong>Mid Trend</strong> — 15K+ көрілім, жақсы серпін</span></li>
              <li className="flex items-start gap-2"><Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span><strong>Micro Trend</strong> — 3K+ көрілім, жаңа бастаушыларға тамаша</span></li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Қалай қолданасың:</p>
            <ol className="space-y-1.5 ml-1 list-decimal list-inside">
              <li>Нише бойынша фильтрлеп, өз тақырыбыңдағы трендтерді тап</li>
              <li>Видеоның <strong>velocity</strong> көрсеткішіне назар аудар — ол қаншалықты тез өсіп жатқанын көрсетеді</li>
              <li>Ұнаған видеоны ⭐ Избранноеге сақта</li>
              <li>Видеоны қарап, оны өз стиліңмен қайта жаса</li>
            </ol>
          </div>
          <Tip>Micro Trend — ең жақсы бастау нүктесі. Бәсекелес аз, бірақ серпін бар!</Tip>
        </>
      ),
    },
    {
      title: "🔍 Іздеу — кілт сөздер бойынша тап",
      description: "Кез-келген тақырып бойынша TikTok видеоларын іздеу",
      icon: Search,
      path: "/search",
      pathLabel: "Іздеуге өту",
      details: (
        <>
          <p><strong>Іздеу</strong> арқылы кез-келген кілт сөз бойынша TikTok видеоларын таба аласың.</p>
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Қалай қолданасың:</p>
            <ol className="space-y-1.5 ml-1 list-decimal list-inside">
              <li>Іздеу жолағына кілт сөзді жаз (мысалы: "рецепт", "фитнес", "бизнес")</li>
              <li>Нәтижелерді көрілім, лайк бойынша сұрыпта</li>
              <li>Қызықты видеоларды Избранноеге қос</li>
            </ol>
          </div>
          <Tip>Нақты кілт сөздерді қолдан: "тамақ" емес, "үйде жасайтын десерт" деп іздесең — нәтиже дәлірек болады.</Tip>
        </>
      ),
    },
    {
      title: "🎬 Видео анализ — вирусты видеоны бөлшекте",
      description: "Кез-келген TikTok видеосын терең талда",
      icon: Video,
      path: "/video-analysis",
      pathLabel: "Видео анализге өту",
      details: (
        <>
          <p><strong>Видео анализ</strong> арқылы кез-келген TikTok видеосын толық талдауға болады: не себепті вирусты болды, қандай тәсілдер қолданылды.</p>
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Не көресің:</p>
            <ul className="space-y-1.5 ml-1">
              <li className="flex items-start gap-2"><BarChart3 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span>Видеоның статистикасы (көрілім, лайк, комменттер)</span></li>
              <li className="flex items-start gap-2"><FileText className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span>AI талдауы — не жасайды видеоны вирусты</span></li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Қалай қолданасың:</p>
            <ol className="space-y-1.5 ml-1 list-decimal list-inside">
              <li>TikTok видеосының сілтемесін көшір</li>
              <li>Видео анализ бетіне қой</li>
              <li>AI талдауын оқып, өз видеоңа қолдан</li>
            </ol>
          </div>
          <Tip>Трендтерде тапқан видеоларды бірден анализге жібер — олардың сәттілік формуласын ашасың!</Tip>
        </>
      ),
    },
    {
      title: "👤 Аккаунт анализ — авторды зертте",
      description: "Кез-келген TikTok авторының профилін талда",
      icon: UserCircle,
      path: "/account-analysis",
      pathLabel: "Аккаунт анализге өту",
      details: (
        <>
          <p><strong>Аккаунт анализ</strong> — бәсекелестерді немесе ұнаған авторларды зерттеу үшін. Олардың стратегиясын түсін.</p>
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Қалай қолданасың:</p>
            <ol className="space-y-1.5 ml-1 list-decimal list-inside">
              <li>TikTok авторының username-ін немесе профиль сілтемесін жаз</li>
              <li>Аккаунттың толық статистикасын қара</li>
              <li>Олардың ең сәтті видеоларын тап</li>
            </ol>
          </div>
          <Tip>Өз нишеңдегі ТОП-5 авторды зертте — олардың контент стратегиясын көшір!</Tip>
        </>
      ),
    },
    {
      title: "⭐ Избранное — жинақтаңды құр",
      description: "Ұнаған видеолар мен сценарийлерді сақта",
      icon: Star,
      path: "/library",
      pathLabel: "Избранноеге өту",
      details: (
        <>
          <p><strong>Избранное</strong> — сен сақтаған барлық видеолар мен AI сценарийлер осында жиналады.</p>
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Не сақтауға болады:</p>
            <ul className="space-y-1.5 ml-1">
              <li className="flex items-start gap-2"><Play className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span><strong>Видеолар</strong> — трендтерден немесе іздеуден тапқан видеолар</span></li>
              <li className="flex items-start gap-2"><FileText className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span><strong>Сценарийлер</strong> — AI арқылы жасалған видео сценарийлер</span></li>
            </ul>
          </div>
          <Tip>Апта сайын 5-10 тренд видеоны сақтап, контент-планыңды осыған негіздесең — серпін кепілдікті!</Tip>
        </>
      ),
    },
    {
      title: "📝 AI Сценарий — бірден видео жаса",
      description: "Тренд видеоны негізге алып, AI-мен сценарий жаз",
      icon: Sparkles,
      path: "/trends",
      pathLabel: "Тренд тауып, сценарий жаз",
      details: (
        <>
          <p><strong>AI Сценарий</strong> — трендті видеоны негізге алып, өзіңнің стиліңде жаңа сценарий жазады.</p>
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Қалай қолданасың:</p>
            <ol className="space-y-1.5 ml-1 list-decimal list-inside">
              <li>Трендтерде немесе Іздеуде видеоны тап</li>
              <li>Видео картасындағы "Сценарий" батырмасын бас</li>
              <li>AI автоматты түрде сценарий жасайды</li>
              <li>Сценарийді өңдеп, өз видеоңды түсір!</li>
            </ol>
          </div>
          <Tip>Ең жақсы стратегия: Micro Trend тауып → AI сценарий жазып → бірден түсіру. Жылдамдық — табыстың кілті!</Tip>
        </>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 animate-fade-in w-full overflow-hidden max-w-3xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <h1 className="text-lg md:text-2xl font-bold text-foreground">Платформаны үйрен</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Қадам-қадаммен TrendMe платформасын меңгер. Әр қадамды оқып, тиісті бөлімге өт.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-card rounded-xl border border-border/60 p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Прогресс</span>
            <span className="text-xs font-bold text-primary">{completed.size}/6 қадам</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {completed.size === 6 && (
            <p className="text-xs text-primary font-semibold mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Тамаша! Сен платформаны толық меңгердің! 🎉
            </p>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, i) => (
            <TutorialStep
              key={i}
              number={i + 1}
              {...step}
              isOpen={openStep === i}
              onToggle={() => setOpenStep(openStep === i ? -1 : i)}
              completed={completed.has(i)}
              onComplete={() => handleComplete(i)}
            />
          ))}
        </div>

        {/* Quick start CTA */}
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 md:p-6 text-center space-y-3">
          <h2 className="text-base md:text-lg font-bold text-foreground">🚀 Дайынсың ба?</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Ең жақсы стратегия: Трендтерді тауып → Анализ жасап → AI сценарий жазып → Видео түсір!
          </p>
          <Link
            to="/trends"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-3 text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            Трендтерді қарау <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
