import { AppLayout } from "@/components/layout/AppLayout";
import {
  TrendingUp, Search, Video, UserCircle, Star, ArrowRight,
  CheckCircle2, Play, Zap, Target, BookOpen, ChevronDown, ChevronUp,
  Lightbulb, Sparkles, BarChart3, FileText, MousePointerClick,
  Eye, Heart, MessageCircle, Trophy, Filter, Clock
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
        <MousePointerClick className="h-3 w-3" /> Что ты увидишь на экране
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
    title: "Тренды — найди вирусные видео",
    subtitle: "Что сейчас набирает обороты в ТикТоке",
    icon: TrendingUp,
    path: "/trends",
    pathLabel: "Перейти к трендам",
    color: "from-amber-500/20 to-orange-500/10",
    borderColor: "border-amber-500/30",
    details: (
      <>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Тренды</strong> — сердце платформы. Здесь собраны самые быстрорастущие видео из ТикТока. Они автоматически ранжируются по скорости роста.
        </p>

        <ScreenHint>
          <p>На каждой карточке видео ты увидишь:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center gap-1.5"><Eye className="h-3 w-3 text-muted-foreground" /> <span>Просмотры</span></div>
            <div className="flex items-center gap-1.5"><Heart className="h-3 w-3 text-muted-foreground" /> <span>Лайки</span></div>
            <div className="flex items-center gap-1.5"><MessageCircle className="h-3 w-3 text-muted-foreground" /> <span>Комментарии</span></div>
            <div className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-muted-foreground" /> <span>Скорость роста (+/ч)</span></div>
          </div>
        </ScreenHint>

        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground">Уровни видео:</p>
          <div className="flex flex-wrap gap-1.5">
            <StepBadge icon={Trophy} text="Strong Trend — 80K+ просмотров" className="bg-amber-500/15 text-amber-700 dark:text-amber-400" />
            <StepBadge icon={Zap} text="Mid Trend — 15K+ просмотров" className="bg-primary/10 text-primary" />
            <StepBadge icon={Target} text="Micro Trend — 3K+ просмотров" className="bg-primary/[0.07] text-primary/80" />
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground flex items-center gap-1"><Filter className="h-3 w-3" /> Фильтры:</p>
          <p className="text-xs text-foreground/70">Нажми на кнопки ниш вверху — увидишь тренды только по своей теме. Например: «Красота», «Еда», «Бизнес».</p>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground">📋 Пошаговая инструкция:</p>
          <div className="space-y-1">
            <NumberedStep n={1}>Нажми <strong>Тренды</strong> в боковом меню</NumberedStep>
            <NumberedStep n={2}>Выбери свою нишу (например: «Красота»)</NumberedStep>
            <NumberedStep n={3}>Смотри видео по просмотрам и velocity (скорости роста)</NumberedStep>
            <NumberedStep n={4}>Нажми <strong>⭐</strong> чтобы сохранить понравившееся видео</NumberedStep>
            <NumberedStep n={5}>Нажми <strong>▶️</strong> чтобы посмотреть видео прямо на платформе</NumberedStep>
          </div>
        </div>

        <Tip>
          Совет для начинающих: начни с <strong>Micro Trend</strong> видео — конкуренция меньше, но динамика хорошая. Переделай такое видео в своём стиле!
        </Tip>
      </>
    ),
  },
  {
    emoji: "🔍",
    title: "Поиск — ищи по ключевым словам",
    subtitle: "Найди видео по любой теме",
    icon: Search,
    path: "/search",
    pathLabel: "Перейти к поиску",
    color: "from-blue-500/20 to-cyan-500/10",
    borderColor: "border-blue-500/30",
    details: (
      <>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Поиск</strong> позволяет находить видео из ТикТока по любому ключевому слову. Результаты сортируются по просмотрам.
        </p>

        <ScreenHint>
          <p>Вверху большая строка поиска. Введи ключевое слово и нажми Enter или 🔍.</p>
        </ScreenHint>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground">📋 Пошаговая инструкция:</p>
          <div className="space-y-1">
            <NumberedStep n={1}>Нажми <strong>Поиск</strong> в боковом меню</NumberedStep>
            <NumberedStep n={2}>Введи ключевое слово, например: <strong>«домашний десерт»</strong></NumberedStep>
            <NumberedStep n={3}>Посмотри результаты — видео отсортированы по просмотрам</NumberedStep>
            <NumberedStep n={4}>Сохрани понравившееся видео ⭐ или посмотри его</NumberedStep>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground">💡 Примеры запросов:</p>
          <div className="flex flex-wrap gap-1.5">
            {["рецепт десерт", "фитнес дома", "бизнес идея", "макияж tutorial", "мотивация"].map(q => (
              <span key={q} className="bg-muted rounded-lg px-2.5 py-1 text-[11px] font-medium text-foreground/70">«{q}»</span>
            ))}
          </div>
        </div>

        <Tip>Используй конкретные фразы: не «еда», а <strong>«домашний десерт рецепт»</strong>. Чем точнее запрос — тем лучше результаты.</Tip>
      </>
    ),
  },
  {
    emoji: "🎬",
    title: "Анализ видео — разбери по полочкам",
    subtitle: "Почему это видео стало вирусным? AI разберёт",
    icon: Video,
    path: "/video-analysis",
    pathLabel: "Перейти к анализу видео",
    color: "from-purple-500/20 to-pink-500/10",
    borderColor: "border-purple-500/30",
    details: (
      <>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Вставь ссылку на любое видео из ТикТока — AI полностью его разберёт: почему стало вирусным, какие приёмы использованы, что ты можешь перенять.
        </p>

        <ScreenHint>
          <p>На странице одно поле ввода — вставь туда ссылку на ТикТок видео. AI проанализирует за несколько секунд.</p>
        </ScreenHint>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground">📋 Пошаговая инструкция:</p>
          <div className="space-y-1">
            <NumberedStep n={1}>В ТикТоке открой видео → <strong>Поделиться → Скопировать ссылку</strong></NumberedStep>
            <NumberedStep n={2}>Открой <strong>Анализ видео</strong> в TrendMe</NumberedStep>
            <NumberedStep n={3}>Вставь ссылку в поле → нажми <strong>«Анализировать»</strong></NumberedStep>
            <NumberedStep n={4}>Прочитай AI-разбор и применяй к своему контенту</NumberedStep>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Что анализирует AI:</p>
          <ul className="space-y-1 ml-1 text-xs text-foreground/70">
            <li>• Хук (первые 3 секунды) — как привлекает внимание</li>
            <li>• Структура контента — как построено видео</li>
            <li>• Реакция аудитории — комментарии и лайки</li>
            <li>• Рекомендации — что применить в своём контенте</li>
          </ul>
        </div>

        <Tip>Отправляй на анализ <strong>Strong Trend</strong> видео из Трендов — раскрой их формулу успеха и используй для себя!</Tip>
      </>
    ),
  },
  {
    emoji: "👤",
    title: "Анализ аккаунта — изучи автора",
    subtitle: "Разбери стратегию конкурентов или лучших авторов",
    icon: UserCircle,
    path: "/account-analysis",
    pathLabel: "Перейти к анализу аккаунта",
    color: "from-green-500/20 to-emerald-500/10",
    borderColor: "border-green-500/30",
    details: (
      <>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Изучи любой ТикТок-аккаунт: сколько подписчиков, какие видео заходят лучше всего, какая стратегия используется.
        </p>

        <ScreenHint>
          <p>На странице поле ввода — введи <strong>username</strong> автора или вставь ссылку на его профиль.</p>
        </ScreenHint>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground">📋 Пошаговая инструкция:</p>
          <div className="space-y-1">
            <NumberedStep n={1}>Открой <strong>Анализ аккаунта</strong></NumberedStep>
            <NumberedStep n={2}>Введи username автора, например: <strong>@username</strong></NumberedStep>
            <NumberedStep n={3}>Посмотри статистику: подписчики, лайки, кол-во видео</NumberedStep>
            <NumberedStep n={4}>Найди их ТОП видео — что заходит лучше всего</NumberedStep>
          </div>
        </div>

        <Tip>Найди <strong>ТОП-5 авторов</strong> в своей нише. Разбери их 3 самых популярных видео. Ты увидишь закономерности!</Tip>
      </>
    ),
  },
  {
    emoji: "⭐",
    title: "Избранное — твоя коллекция",
    subtitle: "Сохранённые видео и сценарии в одном месте",
    icon: Star,
    path: "/library",
    pathLabel: "Перейти в Избранное",
    color: "from-yellow-500/20 to-amber-500/10",
    borderColor: "border-yellow-500/30",
    details: (
      <>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Все сохранённые видео и AI-сценарии собираются здесь. Это твоя личная библиотека контент-идей.
        </p>

        <ScreenHint>
          <p>Два таба: <strong>«Видео»</strong> — сохранённые видео, <strong>«Сценарии»</strong> — AI-сценарии.</p>
        </ScreenHint>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground">📋 Как сохранять:</p>
          <div className="space-y-1">
            <NumberedStep n={1}>Найди видео в Трендах или Поиске</NumberedStep>
            <NumberedStep n={2}>Нажми <strong>⭐ на карточке</strong> видео</NumberedStep>
            <NumberedStep n={3}>Видео автоматически добавится в Избранное</NumberedStep>
            <NumberedStep n={4}>Возвращайся сюда, когда будешь планировать контент</NumberedStep>
          </div>
        </div>

        <Tip>Сохраняй <strong>5-10 трендовых видео</strong> каждую неделю. Составляй контент-план на их основе — это твой банк вирусных идей!</Tip>
      </>
    ),
  },
  {
    emoji: "✨",
    title: "AI Сценарий — спланируй своё видео",
    subtitle: "На основе тренда AI напишет сценарий для тебя",
    icon: Sparkles,
    path: "/trends",
    pathLabel: "Найти тренд и написать сценарий",
    color: "from-violet-500/20 to-fuchsia-500/10",
    borderColor: "border-violet-500/30",
    details: (
      <>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Нашёл трендовое видео? Нажми кнопку — и <strong>AI напишет сценарий в твоём стиле</strong>. Готовый план для съёмки!
        </p>

        <ScreenHint>
          <p>На карточке видео (в Трендах или Поиске) есть кнопка <strong>«📝 Сценарий»</strong>. Нажми — откроется AI-панель.</p>
        </ScreenHint>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground">📋 Пошаговая инструкция:</p>
          <div className="space-y-1">
            <NumberedStep n={1}>Перейди в <strong>Тренды</strong> → найди Micro Trend видео</NumberedStep>
            <NumberedStep n={2}>Нажми <strong>«📝 Сценарий»</strong> на карточке видео</NumberedStep>
            <NumberedStep n={3}>AI автоматически напишет сценарий (10-15 секунд)</NumberedStep>
            <NumberedStep n={4}>Прочитай и отредактируй при необходимости</NumberedStep>
            <NumberedStep n={5}>Нажми <strong>«Сохранить»</strong> → найдёшь в Избранном</NumberedStep>
            <NumberedStep n={6}>Снимай видео по готовому сценарию! 🎬</NumberedStep>
          </div>
        </div>

        <Tip>
          <strong>Лучшая стратегия:</strong> Micro Trend → AI сценарий → снять за 24 часа. Скорость = шанс на вирусность! 🚀
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
                <h1 className="text-lg md:text-xl font-bold text-foreground">Как пользоваться платформой</h1>
                <p className="text-xs text-muted-foreground">Освой TrendMe за 6 простых шагов</p>
              </div>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed max-w-xl">
              Открывай каждый шаг, читай инструкцию, переходи в раздел и нажимай <strong>«Понятно»</strong>. Когда пройдёшь все — ты будешь находить тренды как профи! 💪
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
              {completed.size}/{steps.length} шагов
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
              <p className="text-xs font-semibold text-primary">Отлично! Ты полностью освоил TrendMe! Теперь иди искать тренды и создавай контент! 🎉</p>
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
                          <CheckCircle2 className="h-4 w-4" /> Понятно, дальше
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
            <h2 className="text-base md:text-lg font-bold text-foreground">🚀 Лучшая стратегия</h2>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-foreground/70">
              <span className="bg-card border border-border/60 rounded-lg px-3 py-1.5">1. Найди тренд</span>
              <ArrowRight className="h-3 w-3 text-primary" />
              <span className="bg-card border border-border/60 rounded-lg px-3 py-1.5">2. Разбери видео</span>
              <ArrowRight className="h-3 w-3 text-primary" />
              <span className="bg-card border border-border/60 rounded-lg px-3 py-1.5">3. Напиши сценарий</span>
              <ArrowRight className="h-3 w-3 text-primary" />
              <span className="bg-primary/10 border border-primary/20 text-primary rounded-lg px-3 py-1.5 font-bold">4. Снимай! 🎬</span>
            </div>
            <Link
              to="/trends"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-3 text-sm font-bold hover:bg-primary/90 transition-colors shadow-md"
            >
              Перейти к трендам <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
