import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight, Check, X, Star, Play, Menu, X as Close,
  TrendingUp, Search, Sparkles, Wand2, BarChart3, Clock,
  ChevronDown, Flame, Heart, Instagram, Youtube, Zap, Target,
  ShieldCheck, Rocket,
} from "lucide-react";
import { TrendMeWordmark } from "@/components/TrendMeWordmark";

/* ───────── NAV ───────── */
function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#how", label: "Как это работает" },
    { href: "#features", label: "Возможности" },
    { href: "#pricing", label: "Тарифы" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all ${
      scrolled ? "glass border-b border-border" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <TrendMeWordmark size="lg" />
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-[14px] font-medium text-muted-foreground">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="px-3 py-2 rounded-lg hover:bg-muted hover:text-foreground transition">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 md:gap-2">
          <Link
            to="/auth"
            className="hidden md:inline-flex items-center px-3 py-2 rounded-lg text-[14px] font-medium text-foreground hover:bg-muted transition"
          >
            Войти
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-2 rounded-lg text-[13px] md:text-[14px] font-semibold bg-foreground text-background hover:bg-foreground/90 hover:-translate-y-0.5 hover:shadow-lg transition-all whitespace-nowrap"
          >
            Начать бесплатно
            <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg hover:bg-muted text-foreground"
            aria-label="Menu"
          >
            {open ? <Close className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass-strong border-t border-border px-6 py-4 space-y-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-3 rounded-lg text-[15px] font-medium text-foreground hover:bg-muted"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/auth"
            className="block px-3 py-3 rounded-lg text-[15px] font-medium text-foreground hover:bg-muted"
          >
            Войти
          </Link>
        </div>
      )}
    </header>
  );
}

/* ───────── PILL ───────── */
function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold tracking-[0.02em] ${className}`}>
      {children}
    </span>
  );
}

/* ───────── HERO ───────── */
function Hero() {
  return (
    <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden gradient-mesh">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-[1.15fr,1fr] gap-10 lg:gap-16 items-center">
        <div className="animate-fade-in text-center lg:text-left">
          <Pill className="bg-viral-soft text-foreground border border-viral/40 mb-5 md:mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-viral animate-pulse" />
            <span>База обновляется каждый час</span>
          </Pill>

          <h1 className="text-[clamp(2rem,7.5vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-foreground">
            Найди <span className="gradient-text">вирусный тренд</span>
            <br className="hidden sm:block" />
            <span className="sm:inline"> за 5 минут.</span>
          </h1>

          <p className="mt-5 md:mt-6 text-[15px] md:text-[19px] leading-relaxed text-muted-foreground max-w-[580px] mx-auto lg:mx-0">
            Перестань листать TikTok часами. Открывай тренды своей ниши, разбирай их с ИИ и получай готовый сценарий — пока тренд ещё на взлёте.
          </p>

          <div className="mt-7 md:mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold bg-foreground text-background hover:bg-foreground/90 hover:-translate-y-0.5 hover:shadow-glow-primary transition-all"
            >
              Начать бесплатно
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold text-foreground border border-border bg-background hover:bg-muted transition"
            >
              <Play className="w-4 h-4" />
              Как это работает
            </a>
          </div>

          {/* Trust row */}
          <div className="mt-6 md:mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
              Без карты
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
              Отмена в 1 клик
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
              Русский и казахский
            </span>
          </div>

          <div className="mt-8 md:mt-10 flex items-center justify-center lg:justify-start gap-4 text-[13px] text-muted-foreground">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-pink-400 to-orange-400" />
              <div className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-purple-400 to-blue-500" />
              <div className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-emerald-400 to-cyan-500" />
              <div className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-amber-400 to-rose-500" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
                <span className="ml-1.5 text-foreground font-semibold">4.9</span>
              </div>
              <div className="mt-0.5">
                <span className="text-foreground font-semibold">2 400+ креаторов</span> уже растут с нами
              </div>
            </div>
          </div>
        </div>

        {/* Hero mockup */}
        <div className="relative h-[520px] hidden lg:block">
          <div className="absolute inset-0 bg-dots opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />

          {/* Card 1 */}
          <div className="video-card absolute w-[200px] left-0 top-10 bg-gradient-to-br from-pink-500 via-rose-400 to-orange-400 animate-[floatA_6s_ease-in-out_infinite]">
            <Pill className="absolute top-3 left-3 bg-background/95 text-foreground">
              <Heart className="w-3 h-3 text-rose-500 fill-current" />
              Вирус
            </Pill>
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="text-[11px] opacity-80 mb-0.5">@beauty.trend</div>
              <div className="text-[13px] font-semibold leading-tight">Тренд-макияж за 30 секунд</div>
              <div className="mt-1.5 flex items-center gap-3 text-[11px] opacity-90">
                <span>▶ 2.4M</span><span>♥ 340K</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="video-card absolute w-[230px] left-[170px] top-0 z-10 bg-gradient-to-br from-primary via-purple-500 to-fuchsia-500 animate-[floatB_7s_ease-in-out_infinite]">
            <Pill className="absolute top-3 left-3 bg-viral text-foreground">
              <Star className="w-3 h-3 fill-current" />
              TOP 1
            </Pill>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-1 fill-current" />
              </div>
            </div>
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="text-[11px] opacity-80 mb-0.5">@food.viral</div>
              <div className="text-[13px] font-semibold leading-tight">5 рецептов, которые взорвали TikTok</div>
              <div className="mt-1.5 flex items-center gap-3 text-[11px] opacity-90">
                <span>▶ 8.1M</span><span>♥ 1.2M</span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="video-card absolute w-[180px] right-0 top-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 animate-[floatC_8s_ease-in-out_infinite]">
            <Pill className="absolute top-3 left-3 bg-background/95 text-foreground">
              <ArrowRight className="w-3 h-3 text-emerald-600" />
              +420%
            </Pill>
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="text-[11px] opacity-80 mb-0.5">@fitness.pro</div>
              <div className="text-[13px] font-semibold leading-tight">Тренировка 5 минут в день</div>
              <div className="mt-1.5 flex items-center gap-3 text-[11px] opacity-90">
                <span>▶ 960K</span><span>♥ 89K</span>
              </div>
            </div>
          </div>

          {/* Stat card */}
          <div className="absolute bottom-4 left-8 bg-card shadow-card rounded-2xl p-4 w-[260px] animate-fade-in" style={{ animationDelay: ".3s" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Рост за 24 часа</span>
              <Pill className="bg-emerald-50 text-emerald-700 border border-emerald-200">↑ 183%</Pill>
            </div>
            <div className="text-[22px] font-bold tracking-tight text-foreground">2.4M просмотров</div>
            <svg className="mt-3" width="100%" height="44" viewBox="0 0 240 44" fill="none">
              <defs>
                <linearGradient id="sparkG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity=".3" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 34 L30 30 L60 32 L90 24 L120 22 L150 14 L180 12 L210 6 L240 2 L240 44 L0 44 Z" fill="url(#sparkG)" />
              <path d="M0 34 L30 30 L60 32 L90 24 L120 22 L150 14 L180 12 L210 6 L240 2" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>

          {/* AI badge */}
          <div className="absolute top-4 right-4 bg-card shadow-card rounded-2xl px-4 py-3 flex items-center gap-2.5 animate-fade-in" style={{ animationDelay: ".5s" }}>
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground font-medium">ИИ-сценарий</div>
              <div className="text-[13px] font-bold text-foreground">готов за 12 сек</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floatA { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-12px) rotate(-3deg); } }
        @keyframes floatB { 0%,100% { transform: translateY(0) rotate(2deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
        @keyframes floatC { 0%,100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-14px) rotate(-1deg); } }
        .video-card {
          aspect-ratio: 9/16;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(16,24,40,0.04), 0 10px 30px -8px rgba(16,24,40,0.15);
        }
        .video-card::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%);
          pointer-events: none;
        }
      `}</style>
    </section>
  );
}

/* ───────── PROBLEM (Pain points) ───────── */
function Problem() {
  const pains = [
    { emoji: "😩", title: "Часами листаешь ленту", desc: "А идеи всё равно появляются у конкурентов раньше." },
    { emoji: "🐢", title: "Заходишь в тренд поздно", desc: "Когда снимаешь — алгоритм уже не подхватывает." },
    { emoji: "🤔", title: "Не понимаешь, почему зашло", desc: "Копируешь форму, но без структуры и хука." },
  ];

  return (
    <section className="py-14 md:py-20 border-y border-border bg-background-subtle">
      <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
        <span className="eyebrow">Знакомо?</span>
        <h2 className="mt-3 text-[clamp(1.5rem,4.5vw,2.4rem)] font-bold tracking-tight text-foreground leading-tight max-w-2xl mx-auto">
          TikTok съедает время — а охваты стоят на месте
        </h2>
        <div className="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5">
          {pains.map((p) => (
            <div key={p.title} className="bg-card border border-border rounded-2xl p-5 md:p-6 text-left">
              <div className="text-[28px] mb-2">{p.emoji}</div>
              <h3 className="text-[15px] md:text-[16px] font-semibold text-foreground">{p.title}</h3>
              <p className="mt-1 text-[13.5px] md:text-[14px] text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 md:mt-10 text-[15px] md:text-[17px] text-foreground/80 max-w-xl mx-auto">
          <span className="font-semibold text-foreground">trendme</span> делает за тебя самую муторную часть — поиск и разбор. Тебе остаётся только снять.
        </p>
      </div>
    </section>
  );
}

/* ───────── HOW IT WORKS ───────── */
function HowItWorks() {
  const steps = [
    {
      n: 1, icon: Target,
      title: "Выбери свою нишу",
      desc: "150+ ниш и категорий: beauty, food, fitness, edu, бизнес, лайфстайл. Тренды только по твоей теме — ничего лишнего.",
      time: "30 секунд",
    },
    {
      n: 2, icon: Zap,
      title: "Открой ленту трендов",
      desc: "Видео отсортированы по вирусности и динамике роста. Ты сразу видишь, что взлетает прямо сейчас в Казахстане и СНГ.",
      time: "2 минуты",
    },
    {
      n: 3, icon: Wand2,
      title: "Получи ИИ-сценарий",
      desc: "Один клик — и ИИ выдаёт готовый сценарий под твою нишу: хук, структура, CTA, идея для звука. Снимай и публикуй.",
      time: "12 секунд",
    },
  ];

  return (
    <section id="how" className="py-16 md:py-28">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <span className="eyebrow">Как это работает</span>
          <h2 className="mt-3 text-[clamp(1.6rem,5vw,2.75rem)] font-bold tracking-tight text-foreground leading-tight">
            От «хочу снять» до готового сценария — 5 минут
          </h2>
          <p className="mt-3 md:mt-4 text-[15px] md:text-[17px] text-muted-foreground leading-relaxed">
            Без таблиц, без бесконечного скролла, без догадок.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.n} className="relative bg-card border border-border rounded-2xl p-6 md:p-7 hover-lift shadow-card-hover">
                <div className="absolute top-5 right-5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  {s.time}
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Шаг 0{s.n}</span>
                </div>
                <h3 className="text-[17px] md:text-[18px] font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-[13.5px] md:text-[14.5px] text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 md:mt-12 text-center">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold bg-foreground text-background hover:bg-foreground/90 hover:-translate-y-0.5 hover:shadow-glow-primary transition-all"
          >
            Попробовать бесплатно
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-3 text-[13px] text-muted-foreground">Регистрация за 10 секунд · без карты</p>
        </div>
      </div>
    </section>
  );
}

/* ───────── STATS ───────── */
function Stats() {
  const items = [
    { value: "5M+", label: "видео в базе", note: "Обновляются каждый час" },
    { value: "150+", label: "ниш и категорий", note: "От beauty до бизнеса" },
    { value: "2 400+", label: "креаторов и брендов", note: "Уже растут с trendme" },
    { value: "12s", label: "средняя генерация", note: "Сценарий под твою нишу" },
  ];
  return (
    <section className="py-14 md:py-20 bg-background-subtle border-y border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {items.map((s) => (
            <div key={s.label} className="border border-border rounded-2xl p-4 md:p-6 bg-card hover-lift shadow-card-hover">
              <div className="text-[26px] md:text-[38px] font-bold tracking-tight gradient-text">{s.value}</div>
              <div className="mt-1 text-[12px] md:text-[14px] text-muted-foreground">{s.label}</div>
              <div className="mt-2 md:mt-3 text-[11.5px] md:text-[13px] text-foreground/80 leading-snug">{s.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── FEATURES ───────── */
function Features() {
  const features = [
    { icon: TrendingUp, color: "rose", title: "Реальные тренды 24/7", desc: "Каждое видео получает score вирусности и динамику за 24 часа и 7 дней. Ловишь тренд на взлёте, а не на спаде." },
    { icon: Search, color: "blue", title: "Поиск по слову или хэштегу", desc: "Ищи по ключевой фразе, хэштегу или звуку. Фильтры по нише, дате, охвату и языку (RU / KK / EN)." },
    { icon: Wand2, color: "orange", title: "ИИ-разбор любого видео", desc: "Загрузи ссылку — получи разбор хука, структуры, CTA и причин, почему ролик зашёл. Готовый чек-лист для повторения." },
    { icon: Sparkles, color: "primary", title: "ИИ-сценарии под твою нишу", desc: "Сценарий с хуком, тайм-кодами и CTA за 12 секунд. На русском или казахском, под твой tone-of-voice." },
    { icon: BarChart3, color: "emerald", title: "Аналитика конкурентов", desc: "Полный профиль аккаунта: что заходит, что нет, лучшие часы публикаций, рост за период." },
    { icon: Rocket, color: "violet", title: "Контент-журнал и идеи", desc: "Сохраняй вирусные ролики в избранное, копи библиотеку идей и сценариев — всё в одном месте." },
  ];

  const colorMap: Record<string, string> = {
    rose: "bg-rose-50 text-rose-500",
    blue: "bg-blue-50 text-blue-500",
    orange: "bg-orange-50 text-orange-500",
    violet: "bg-violet-50 text-violet-500",
    primary: "bg-primary-soft text-primary",
    emerald: "bg-emerald-50 text-emerald-500",
  };

  return (
    <section id="features" className="py-16 md:py-24 bg-background-subtle border-y border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="max-w-2xl">
          <span className="eyebrow">Возможности</span>
          <h2 className="mt-3 text-[clamp(1.6rem,5vw,2.75rem)] font-bold tracking-tight text-foreground leading-tight">
            Всё для работы с TikTok — на одной платформе
          </h2>
          <p className="mt-3 md:mt-4 text-[15px] md:text-[17px] text-muted-foreground leading-relaxed">
            От поиска тренда до готового сценария. Без вкладок, экспорта и лишних движений.
          </p>
        </div>

        <div className="mt-8 md:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-card border border-border rounded-2xl p-5 md:p-7 shadow-card-hover hover-lift">
                <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center mb-4 md:mb-5 ${colorMap[f.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-[16px] md:text-[18px] font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 md:mt-2 text-[13.5px] md:text-[14px] text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────── PRODUCT (mockup) ───────── */
function Product() {
  return (
    <section id="product" className="py-16 md:py-28">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="max-w-2xl mb-8 md:mb-12">
          <span className="eyebrow">Внутри платформы</span>
          <h2 className="mt-3 text-[clamp(1.6rem,5vw,2.75rem)] font-bold tracking-tight text-foreground leading-tight">
            Чистый интерфейс. Только нужное.
          </h2>
          <p className="mt-3 md:mt-4 text-[15px] md:text-[17px] text-muted-foreground leading-relaxed">
            Лента трендов, поиск и ИИ — в одном окне. Никаких 7 вкладок и Excel-таблиц.
          </p>
        </div>

        <div className="bg-gradient-to-br from-background-subtle to-primary-soft/40 p-3 md:p-10 rounded-2xl md:rounded-[28px] border border-border shadow-card">
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
            <div className="flex items-center gap-2 px-4 h-10 border-b border-border bg-background-subtle">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1" />
              <div className="text-[11px] text-muted-foreground">app.trendme.kz/trends</div>
              <div className="flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] min-h-[480px]">
              <aside className="hidden md:block border-r border-border p-3">
                <div className="flex items-center gap-2 px-2 h-10 mb-3">
                  <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-viral" />
                  </div>
                  <span className="font-bold text-[13px] text-foreground">trendme</span>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1.5">Поиск</div>
                <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-primary-soft text-primary text-[13px] font-semibold mb-0.5">
                  <TrendingUp className="w-4 h-4" /> Тренды
                </div>
                <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-foreground/80 text-[13px] hover:bg-muted mb-0.5">
                  <Search className="w-4 h-4 text-blue-500" /> Поиск по слову
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1.5 mt-4">Инструменты</div>
                <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-foreground/80 text-[13px] hover:bg-muted mb-0.5">
                  <Play className="w-4 h-4 text-orange-500" /> Анализ видео
                </div>
                <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-foreground/80 text-[13px] hover:bg-muted">
                  <Sparkles className="w-4 h-4 text-violet-500" /> ИИ-сценарий
                </div>
              </aside>

              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h4 className="text-[20px] font-bold text-foreground">Тренды · Казахстан</h4>
                    <p className="text-[12px] text-muted-foreground mt-0.5">Обновлено 2 минуты назад</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-lg text-foreground">24ч</button>
                    <button className="px-3 py-1.5 text-[12px] font-medium bg-foreground text-background rounded-lg">7д</button>
                    <button className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-lg text-foreground">30д</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-5">
                  <Pill className="bg-foreground text-background">Все ниши</Pill>
                  <Pill className="bg-muted text-foreground/80">Beauty</Pill>
                  <Pill className="bg-muted text-foreground/80">Food</Pill>
                  <Pill className="bg-muted text-foreground/80">Fitness</Pill>
                  <Pill className="bg-muted text-foreground/80">Edu</Pill>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { bg: "from-pink-500 via-rose-400 to-orange-400", badge: "🔥 +420%", badgeBg: "bg-viral text-foreground", user: "@beauty.viral", title: "Макияж за 30 сек", views: "▶ 2.4M" },
                    { bg: "from-primary via-purple-500 to-fuchsia-500", badge: "⭐ TOP", badgeBg: "bg-background text-foreground", user: "@food.hub", title: "5 рецептов", views: "▶ 8.1M" },
                    { bg: "from-emerald-500 via-teal-500 to-cyan-500", badge: "↑ +183%", badgeBg: "bg-background text-foreground", user: "@fit.pro", title: "5 мин тренировка", views: "▶ 960K" },
                    { bg: "from-amber-500 via-orange-400 to-rose-400", badge: "🔥 Hot", badgeBg: "bg-background text-foreground", user: "@edu.kz", title: "IELTS за месяц", views: "▶ 1.1M" },
                  ].map((c, i) => (
                    <div key={i} className={`relative aspect-[9/14] rounded-xl overflow-hidden bg-gradient-to-br ${c.bg}`}>
                      <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.badgeBg}`}>{c.badge}</div>
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <div className="text-[10px] opacity-80">{c.user}</div>
                        <div className="text-[11px] font-bold">{c.title}</div>
                        <div className="text-[10px] opacity-90 mt-0.5">{c.views}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── PRICING ───────── */
function Pricing() {
  const plans = [
    {
      name: "Демо", price: "0 ₸", period: "навсегда",
      desc: "Познакомиться с платформой",
      cta: "Начать бесплатно", featured: false,
      features: [
        { ok: true, label: "5 поисков, 10 видео в день" },
        { ok: true, label: "5 ИИ-разборов" },
        { ok: true, label: "5 ИИ-сценариев" },
        { ok: false, label: "Безлимит и приоритет" },
      ],
    },
    {
      name: "1 месяц", price: "17 900 ₸", period: "/мес",
      desc: "Для активных креаторов",
      cta: "Выбрать", featured: true, badge: "★ Популярный",
      features: [
        { ok: true, label: "Безлимит трендов и поиска" },
        { ok: true, label: "Безлимит ИИ-сценариев" },
        { ok: true, label: "Анализ видео и профилей" },
        { ok: true, label: "Приоритетная поддержка" },
      ],
    },
    {
      name: "3 месяца", price: "45 600 ₸", period: "/3 мес",
      desc: "Экономия 15% — лучший выбор",
      cta: "Выбрать", featured: false, badge: "−15%",
      features: [
        { ok: true, label: "Всё из тарифа «1 месяц»" },
        { ok: true, label: "Цена 15 200 ₸/мес" },
        { ok: true, label: "Экономия 8 100 ₸" },
        { ok: true, label: "Доступ ко всем будущим обновлениям" },
      ],
    },
  ];

  return (
    <section id="pricing" className="py-16 md:py-28 bg-background-subtle border-y border-border">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <span className="eyebrow">Тарифы</span>
          <h2 className="mt-3 text-[clamp(1.6rem,5vw,2.75rem)] font-bold tracking-tight text-foreground leading-tight">
            Один тариф окупается одним вирусным видео
          </h2>
          <p className="mt-3 md:mt-4 text-[15px] md:text-[17px] text-muted-foreground leading-relaxed">
            Начни бесплатно. Без карты. Отмена в один клик.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-6 md:p-8 transition-all hover:-translate-y-1 ${
                p.featured
                  ? "bg-foreground text-background border border-foreground shadow-card"
                  : "bg-card border border-border shadow-card-hover"
              }`}
            >
              {p.badge && (
                <Pill className={`absolute -top-3 left-1/2 -translate-x-1/2 ${
                  p.featured ? "bg-viral text-foreground" : "bg-emerald-500 text-white"
                }`}>
                  {p.badge}
                </Pill>
              )}
              <div className={`text-[14px] font-semibold ${p.featured ? "text-background/70" : "text-muted-foreground"}`}>{p.name}</div>
              <div className="mt-2 md:mt-3 flex items-baseline gap-1">
                <span className="text-[34px] md:text-[42px] font-bold tracking-tight">{p.price}</span>
                <span className={`text-[13px] md:text-[14px] ${p.featured ? "text-background/70" : "text-muted-foreground"}`}>{p.period}</span>
              </div>
              <p className={`mt-1.5 md:mt-2 text-[13.5px] md:text-[14px] ${p.featured ? "text-background/70" : "text-muted-foreground"}`}>{p.desc}</p>
              <Link
                to="/auth"
                className={`mt-5 md:mt-6 inline-flex w-full justify-center py-3 rounded-xl text-[14px] font-semibold transition ${
                  p.featured
                    ? "bg-viral text-foreground hover:opacity-90"
                    : "border border-border text-foreground hover:bg-muted"
                }`}
              >
                {p.cta}
              </Link>
              <ul className="mt-6 md:mt-8 space-y-2.5 md:space-y-3 text-[13.5px] md:text-[14px]">
                {p.features.map((f) => (
                  <li key={f.label} className={`flex gap-2.5 ${
                    f.ok
                      ? p.featured ? "" : "text-foreground/80"
                      : p.featured ? "text-background/50" : "text-muted-foreground"
                  }`}>
                    {f.ok ? (
                      <Check className={`w-5 h-5 shrink-0 ${p.featured ? "text-viral" : "text-emerald-500"}`} strokeWidth={2.5} />
                    ) : (
                      <X className="w-5 h-5 shrink-0" />
                    )}
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 md:mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Безопасная оплата · Freedom Pay
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
            Отмена в 1 клик
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
            Без скрытых комиссий
          </span>
        </div>
      </div>
    </section>
  );
}

/* ───────── TESTIMONIALS ───────── */
function Testimonials() {
  const items = [
    {
      text: "За две недели подняли охваты на 3.2M. Главное — ловишь тренд до того, как он стал массовым. ИИ-сценарии экономят кучу времени.",
      name: "Айгерим К.", role: "SMM-менеджер · Алматы", grad: "from-pink-400 to-orange-400",
      result: "+3.2M охвата за 14 дней",
    },
    {
      text: "Раньше тратил 2 часа в день на поиск идей. Сейчас — 15 минут утром, и контент-план готов. Анализ конкурентов — отдельный кайф.",
      name: "Данияр Т.", role: "Founder · Content Studio", grad: "from-purple-400 to-blue-500",
      result: "−7 часов в неделю",
    },
    {
      text: "Пробовала 3 других сервиса — trendme единственный, кто реально понимает СНГ-тренды и казахский контент. Интерфейс — огонь.",
      name: "Мария Р.", role: "Креатор · 1.2M подписчиков", grad: "from-emerald-400 to-cyan-500",
      result: "5 вирусных видео за месяц",
    },
  ];

  return (
    <section className="py-14 md:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="max-w-2xl mb-8 md:mb-14">
          <span className="eyebrow">Отзывы</span>
          <h2 className="mt-3 text-[clamp(1.6rem,5vw,2.75rem)] font-bold tracking-tight text-foreground leading-tight">
            Реальные результаты пользователей
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {items.map((t) => (
            <div key={t.name} className="bg-card border border-border rounded-2xl p-5 md:p-7 hover-lift shadow-card-hover flex flex-col">
              <div className="flex gap-0.5 text-amber-500 mb-3 md:mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-[14px] md:text-[15px] leading-relaxed text-foreground flex-1">«{t.text}»</p>
              <div className="mt-4 inline-flex self-start items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[12px] font-semibold border border-emerald-200">
                <TrendingUp className="w-3.5 h-3.5" />
                {t.result}
              </div>
              <div className="mt-5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.grad}`} />
                <div>
                  <div className="text-[13.5px] md:text-[14px] font-semibold text-foreground">{t.name}</div>
                  <div className="text-[11.5px] md:text-[12px] text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── FAQ ───────── */
function FAQ() {
  const faqs = [
    { q: "Можно начать бесплатно без карты?", a: "Да. Тариф «Демо» — навсегда бесплатный: 5 поисков и 10 трендов в день, 5 ИИ-разборов и 5 сценариев. Карту указывать не нужно." },
    { q: "Подходит ли для Казахстана и казахского контента?", a: "Да, trendme создан в первую очередь для русско- и казахоязычного контента. Есть фильтры по стране и языку, ИИ-сценарии генерируются на русском или казахском." },
    { q: "Откуда берутся данные о трендах?", a: "Мы агрегируем публичные данные TikTok, обновляем каждый час и обогащаем собственными метриками вирусности (score, динамика за 24 ч / 7 дней)." },
    { q: "Как работает ИИ-сценарий?", a: "Выбираешь любой тренд → указываешь свою нишу и tone-of-voice → ИИ выдаёт готовый сценарий с хуком, тайм-кодами, CTA и идеей звука. Около 12 секунд." },
    { q: "Можно отменить подписку?", a: "Да, в один клик в настройках. Деньги за неиспользованный период не сгорают — доступ остаётся до конца оплаченного срока." },
    { q: "Подходит ли для агентств и команд?", a: "Да. Если нужно несколько мест или API-доступ — напишите нам, подберём индивидуальные условия." },
  ];

  return (
    <section id="faq" className="py-14 md:py-24 bg-background-subtle border-y border-border">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-12">
          <span className="eyebrow">FAQ</span>
          <h2 className="mt-3 text-[clamp(1.6rem,5vw,2.75rem)] font-bold tracking-tight text-foreground leading-tight">
            Частые вопросы
          </h2>
        </div>
        <div className="space-y-2.5 md:space-y-3">
          {faqs.map((f, i) => (
            <details key={i} className="group bg-card border border-border rounded-xl p-4 md:p-5" open={i === 0}>
              <summary className="flex items-center justify-between gap-3 font-semibold text-[14px] md:text-[15px] text-foreground cursor-pointer list-none">
                {f.q}
                <ChevronDown className="w-5 h-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-[13.5px] md:text-[14px] text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── FINAL CTA ───────── */
function FinalCTA() {
  return (
    <section className="py-16 md:py-28">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="relative bg-foreground rounded-2xl md:rounded-[32px] p-8 md:p-16 overflow-hidden">
          <div className="absolute -right-20 -top-20 w-72 md:w-80 h-72 md:h-80 rounded-full bg-gradient-to-br from-primary/40 to-fuchsia-500/30 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-72 md:w-80 h-72 md:h-80 rounded-full bg-viral/20 blur-3xl" />

          <div className="relative">
            <Pill className="bg-viral text-foreground mb-5">
              <Flame className="w-3.5 h-3.5" />
              Старт за 30 секунд
            </Pill>
            <h2 className="text-background text-[clamp(1.6rem,5.5vw,3rem)] font-bold tracking-tight max-w-2xl leading-[1.08]">
              Твой следующий вирусный ролик —<br />
              <span className="gradient-text">уже в ленте трендов.</span>
            </h2>
            <p className="mt-3 md:mt-4 text-background/70 text-[14.5px] md:text-[17px] max-w-xl leading-relaxed">
              Начни бесплатно — без карты. 5 поисков, 10 видео в день, ИИ-сценарии в подарок.
            </p>
            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-viral text-foreground text-[15px] font-semibold hover:opacity-90 transition"
              >
                Найти свой тренд бесплатно
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-background/10 text-background text-[15px] font-semibold hover:bg-background/15 transition"
              >
                Сравнить тарифы
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-background/60">
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-viral" strokeWidth={3} /> Без карты
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-viral" strokeWidth={3} /> Регистрация 10 секунд
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-viral" strokeWidth={3} /> Отмена в 1 клик
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── FOOTER ───────── */
function Footer() {
  return (
    <footer className="border-t border-border py-10 md:py-14 bg-background-subtle">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-2 md:grid-cols-[2fr,1fr,1fr,1fr] gap-8 md:gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <TrendMeWordmark size="lg" animated={false} />
          </div>
          <p className="text-[13.5px] md:text-[14px] text-muted-foreground max-w-sm leading-relaxed">
            Платформа №1 в Казахстане для поиска TikTok-трендов, разбора вирусного контента и генерации ИИ-сценариев.
          </p>
        </div>
        {[
          { title: "Продукт", links: [["Возможности", "#features"], ["Как работает", "#how"], ["Тарифы", "#pricing"], ["FAQ", "#faq"]] },
          { title: "Компания", links: [["Контакты", "/contacts"]] },
          { title: "Правовое", links: [["Условия", "/terms"], ["Конфиденциальность", "/privacy"]] },
        ].map((col) => (
          <div key={col.title}>
            <div className="text-[11px] md:text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 md:mb-4">{col.title}</div>
            <ul className="space-y-2 text-[13.5px] md:text-[14px] text-foreground/80">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="hover:text-foreground transition">{label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 md:mt-10 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
        <div className="text-[12px] md:text-[13px] text-muted-foreground">© 2026 trendme. Все права защищены.</div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <a href="#" className="hover:text-foreground transition" aria-label="Instagram"><Instagram className="w-5 h-5" /></a>
          <a href="#" className="hover:text-foreground transition" aria-label="YouTube"><Youtube className="w-5 h-5" /></a>
          <a href="#" className="hover:text-foreground transition" aria-label="TikTok"><Flame className="w-5 h-5" /></a>
        </div>
      </div>
    </footer>
  );
}

/* ───────── PAGE ───────── */
export default function Landing() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <LandingNav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Stats />
        <Features />
        <Product />
        <Pricing />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
