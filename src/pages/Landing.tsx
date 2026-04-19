import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight, Check, X, Star, Play, Menu, X as Close,
  TrendingUp, Search, Sparkles, Users, Wand2, BarChart3,
  ChevronDown, Flame, Heart, Instagram, Youtube,
} from "lucide-react";

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
    { href: "#features", label: "Возможности" },
    { href: "#product", label: "Продукт" },
    { href: "#pricing", label: "Тарифы" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all ${
      scrolled ? "glass border-b border-border" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center relative">
            <div className="w-3 h-3 rounded-full bg-viral" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-viral animate-ping" />
          </div>
          <span className="font-bold text-[17px] tracking-tight text-foreground">trendme</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-[14px] font-medium text-muted-foreground">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="px-3 py-2 rounded-lg hover:bg-muted hover:text-foreground transition">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden sm:inline-flex px-3 py-2 rounded-lg text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition">
            Войти
          </Link>
          <Link
            to="/auth"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[14px] font-semibold bg-foreground text-background hover:bg-foreground/90 hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            Начать бесплатно
            <ArrowRight className="w-4 h-4" />
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
    <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 overflow-hidden gradient-mesh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.15fr,1fr] gap-10 lg:gap-16 items-center">
        <div className="animate-fade-in text-center lg:text-left">
          <Pill className="bg-viral-soft text-foreground border border-viral/40 mb-5 sm:mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-viral animate-pulse" />
            Новое · ИИ-сценарии для TikTok
          </Pill>

          <h1 className="text-[clamp(2rem,8vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-foreground">
            Находите <span className="gradient-text">вирусные тренды</span>
            <br className="hidden sm:block" />{" "}раньше конкурентов
          </h1>

          <p className="mt-5 sm:mt-6 text-[16px] sm:text-[18px] md:text-[19px] leading-relaxed text-muted-foreground max-w-[560px] mx-auto lg:mx-0">
            Платформа для мониторинга TikTok-трендов, разведки конкурентов и генерации ИИ-сценариев.{" "}
            <span className="text-foreground font-medium">5M+ видео</span>,{" "}
            <span className="text-foreground font-medium">150+ ниш</span>, обновление в реальном времени.
          </p>

          <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold bg-foreground text-background hover:bg-foreground/90 hover:-translate-y-0.5 hover:shadow-glow-primary transition-all"
            >
              Попробовать бесплатно
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#product"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold text-foreground border border-border bg-background hover:bg-muted transition"
            >
              <Play className="w-4 h-4" />
              Смотреть демо · 2 мин
            </a>
          </div>

          <div className="mt-8 sm:mt-10 flex items-center justify-center lg:justify-start gap-4 text-[13px] text-muted-foreground">
            <div className="flex -space-x-2 shrink-0">
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
                <span className="ml-1.5 text-foreground font-semibold">5.0</span>
              </div>
              <div className="mt-0.5">
                Более <span className="text-foreground font-semibold">2 400 креаторов</span> уже используют
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
              <div className="text-[13px] font-semibold leading-tight">Как сделать тренд-макияж за 30 сек</div>
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

/* ───────── LOGO MARQUEE ───────── */
function Trust() {
  const brands = ["AURORA", "BeautyLab", "Kaspi Media", "SMM Agency", "ViralCo", "FoodieHub", "FitnessPro", "ContentHouse"];
  return (
    <section className="py-10 sm:py-12 border-y border-border bg-background-subtle overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <p className="text-center text-[11px] sm:text-[12px] uppercase font-semibold tracking-[0.14em] sm:tracking-[0.16em] text-muted-foreground mb-6 sm:mb-8">
          Нам доверяют команды и агентства
        </p>
        <div className="overflow-hidden">
          <div className="flex gap-8 sm:gap-14 text-border-strong font-bold text-[16px] sm:text-[22px] whitespace-nowrap animate-[marq_30s_linear_infinite]">
            {[...brands, ...brands, ...brands].map((b, i) => (
              <span key={i} className="shrink-0">{b} ·</span>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes marq { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </section>
  );
}

/* ───────── STATS ───────── */
function Stats() {
  const items = [
    { value: "5M+", label: "Видео в базе", note: "Обновляется каждый час" },
    { value: "150+", label: "Ниш и категорий", note: "От beauty до edtech" },
    { value: "24/7", label: "Мониторинг", note: "Тренды в реальном времени" },
    { value: "12s", label: "Генерация сценария", note: "ИИ на основе тренда" },
  ];
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {items.map((s) => (
            <div key={s.label} className="border border-border rounded-2xl p-4 sm:p-6 bg-card hover-lift shadow-card-hover">
              <div className="text-[28px] sm:text-[38px] font-bold tracking-tight gradient-text">{s.value}</div>
              <div className="mt-1 text-[13px] sm:text-[14px] text-muted-foreground">{s.label}</div>
              <div className="mt-2 sm:mt-3 text-[12px] sm:text-[13px] text-foreground/80">{s.note}</div>
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
    { icon: TrendingUp, color: "rose", title: "Реальные тренды 24/7", desc: "Ловите тренд на взлёте: каждое видео в базе получает score вирусности и динамику за 24 ч / 7 д." },
    { icon: Search, color: "blue", title: "Умный поиск по слову", desc: "Ищите по хэштегу, ключевой фразе или звуку. Фильтры по нише, дате, охвату и росту." },
    { icon: Wand2, color: "orange", title: "ИИ-анализ видео", desc: "Разбор хука, структуры, CTA и причин вирусности. Готовый чек-лист для повторения." },
    { icon: Users, color: "violet", title: "Разведка конкурентов", desc: "Полный профиль аккаунта: что заходит, что нет, расписание публикаций, рост за период." },
    { icon: Sparkles, color: "primary", title: "ИИ-сценарии", desc: "Готовый сценарий на основе любого тренда за 12 секунд. Хук, структура, CTA, звук — всё адаптировано под вашу нишу." },
    { icon: BarChart3, color: "emerald", title: "Аналитика ниши", desc: "Средние охваты, лучшие форматы, часы публикаций и сезонные пики — все метрики вашего рынка." },
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
    <section id="features" className="py-16 sm:py-24 bg-background-subtle border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl">
          <span className="eyebrow">Возможности</span>
          <h2 className="mt-3 text-[clamp(1.75rem,5vw,2.75rem)] font-bold tracking-tight text-foreground">
            Всё, что нужно для работы с<br className="hidden sm:block" />{" "}вирусным контентом TikTok
          </h2>
          <p className="mt-4 text-[15px] sm:text-[17px] text-muted-foreground leading-relaxed">
            От поиска тренда до готового сценария — одна платформа. Без ручного листания ленты и гаданий.
          </p>
        </div>

        <div className="mt-10 sm:mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-card-hover hover-lift">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 sm:mb-5 ${colorMap[f.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-[17px] sm:text-[18px] font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────── PRODUCT ───────── */
function Product() {
  const steps = [
    { n: 1, title: "Находите тренд", desc: "Откройте ленту трендов вашей ниши или найдите видео по ключевому слову." },
    { n: 2, title: "Анализируете ИИ", desc: "ИИ раскладывает ролик на хук, структуру, CTA и причины вирусности." },
    { n: 3, title: "Снимаете своё", desc: "Получаете готовый сценарий под вашу нишу и запускаете ролик в нужный момент." },
  ];

  return (
    <section id="product" className="py-16 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <span className="eyebrow">Продукт</span>
          <h2 className="mt-3 text-[clamp(1.75rem,5vw,2.75rem)] font-bold tracking-tight text-foreground">
            От ленты до сценария — за 3 шага
          </h2>
        </div>

        {/* Dashboard mockup */}
        <div className="bg-gradient-to-br from-background-subtle to-primary-soft/40 p-3 sm:p-6 md:p-10 rounded-2xl sm:rounded-[28px] border border-border shadow-card">
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
                  <Users className="w-4 h-4 text-violet-500" /> Анализ профиля
                </div>
              </aside>

              <div className="p-4 sm:p-6">
                <div className="flex items-start sm:items-center justify-between gap-3 mb-4 sm:mb-5">
                  <div className="min-w-0">
                    <h4 className="text-[16px] sm:text-[20px] font-bold text-foreground truncate">Тренды · Казахстан</h4>
                    <p className="text-[11px] sm:text-[12px] text-muted-foreground mt-0.5">Обновлено 2 минуты назад</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-[12px] font-medium border border-border rounded-lg text-foreground">24ч</button>
                    <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-[12px] font-medium bg-foreground text-background rounded-lg">7д</button>
                    <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-[12px] font-medium border border-border rounded-lg text-foreground">30д</button>
                  </div>
                </div>
                <div className="flex flex-nowrap sm:flex-wrap gap-2 mb-4 sm:mb-5 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                  <Pill className="bg-foreground text-background shrink-0">Все ниши</Pill>
                  <Pill className="bg-muted text-foreground/80 shrink-0">Beauty</Pill>
                  <Pill className="bg-muted text-foreground/80 shrink-0">Food</Pill>
                  <Pill className="bg-muted text-foreground/80 shrink-0">Fitness</Pill>
                  <Pill className="bg-muted text-foreground/80 shrink-0">Edu</Pill>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                  {[
                    { bg: "from-pink-500 via-rose-400 to-orange-400", badge: "🔥 +420%", badgeBg: "bg-viral text-foreground", user: "@beauty.viral", title: "Макияж за 30 сек", views: "▶ 2.4M" },
                    { bg: "from-primary via-purple-500 to-fuchsia-500", badge: "⭐ TOP", badgeBg: "bg-background text-foreground", user: "@food.hub", title: "5 рецептов", views: "▶ 8.1M" },
                    { bg: "from-emerald-500 via-teal-500 to-cyan-500", badge: "↑ +183%", badgeBg: "bg-background text-foreground", user: "@fit.pro", title: "5 мин тренировка", views: "▶ 960K" },
                    { bg: "from-amber-500 via-orange-400 to-rose-400", badge: "🔥 Hot", badgeBg: "bg-background text-foreground", user: "@edu.kz", title: "IELTS за месяц", views: "▶ 1.1M" },
                  ].map((c, i) => (
                    <div key={i} className={`relative aspect-[9/14] rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-br ${c.bg}`}>
                      <div className={`absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold ${c.badgeBg}`}>{c.badge}</div>
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2 sm:left-2 sm:right-2 text-white">
                        <div className="text-[9px] sm:text-[10px] opacity-80 truncate">{c.user}</div>
                        <div className="text-[10px] sm:text-[11px] font-bold leading-tight">{c.title}</div>
                        <div className="text-[9px] sm:text-[10px] opacity-90 mt-0.5">{c.views}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {steps.map((s) => (
            <div key={s.n} className="bg-card border border-border rounded-2xl p-6 hover-lift shadow-card-hover">
              <div className="w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center font-bold mb-4">{s.n}</div>
              <h3 className="text-[17px] font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── PRICING ───────── */
function Pricing() {
  const plans = [
    {
      name: "Старт", price: "0 ₽", desc: "Для первого знакомства",
      cta: "Начать бесплатно", featured: false,
      features: [
        { ok: true, label: "10 видео в день" },
        { ok: true, label: "3 ниши" },
        { ok: true, label: "Поиск по слову" },
        { ok: false, label: "ИИ-сценарии" },
        { ok: false, label: "Анализ конкурентов" },
      ],
    },
    {
      name: "Про", price: "2 990 ₽", desc: "Для активных креаторов",
      cta: "Выбрать Про", featured: true,
      features: [
        { ok: true, label: "Безлимитный доступ" },
        { ok: true, label: "Все 150+ ниш" },
        { ok: true, label: "50 ИИ-сценариев/мес" },
        { ok: true, label: "Анализ видео и профилей" },
        { ok: true, label: "Приоритетная поддержка" },
      ],
    },
    {
      name: "Бизнес", price: "9 990 ₽", desc: "Для команд и агентств",
      cta: "Выбрать Бизнес", featured: false,
      features: [
        { ok: true, label: "Всё из Про" },
        { ok: true, label: "Безлимит ИИ-сценариев" },
        { ok: true, label: "Командный доступ (до 10)" },
        { ok: true, label: "API-доступ" },
        { ok: true, label: "Персональный менеджер" },
      ],
    },
  ];

  return (
    <section id="pricing" className="py-28 bg-background-subtle border-y border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="eyebrow">Тарифы</span>
          <h2 className="mt-3 text-[clamp(2rem,3.5vw,2.75rem)] font-bold tracking-tight text-foreground">
            Простые тарифы для любого масштаба
          </h2>
          <p className="mt-4 text-[17px] text-muted-foreground leading-relaxed">
            Начните бесплатно. Отмените в любой момент.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-8 transition-all hover:-translate-y-1 ${
                p.featured
                  ? "bg-foreground text-background border border-foreground shadow-card"
                  : "bg-card border border-border shadow-card-hover"
              }`}
            >
              {p.featured && (
                <Pill className="absolute -top-3 left-1/2 -translate-x-1/2 bg-viral text-foreground">
                  ★ Популярный
                </Pill>
              )}
              <div className={`text-[14px] font-semibold ${p.featured ? "text-background/70" : "text-muted-foreground"}`}>{p.name}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-[44px] font-bold tracking-tight">{p.price}</span>
                <span className={`text-[14px] ${p.featured ? "text-background/70" : "text-muted-foreground"}`}>/мес</span>
              </div>
              <p className={`mt-2 text-[14px] ${p.featured ? "text-background/70" : "text-muted-foreground"}`}>{p.desc}</p>
              <Link
                to="/auth"
                className={`mt-6 inline-flex w-full justify-center py-3 rounded-xl text-[14px] font-semibold transition ${
                  p.featured
                    ? "bg-viral text-foreground hover:opacity-90"
                    : "border border-border text-foreground hover:bg-muted"
                }`}
              >
                {p.cta}
              </Link>
              <ul className="mt-8 space-y-3 text-[14px]">
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
      </div>
    </section>
  );
}

/* ───────── TESTIMONIALS ───────── */
function Testimonials() {
  const items = [
    {
      text: "За две недели подняли охваты на 3.2M. Главное — ловишь тренд до того, как он станет массовым. ИИ-сценарии реально работают.",
      name: "Айгерим К.", role: "SMM-менеджер · Almaty", grad: "from-pink-400 to-orange-400",
    },
    {
      text: "Экономит 5-7 часов в неделю на ручном поиске. Анализ конкурентов — это золото для агентства.",
      name: "Данияр Т.", role: "Founder · Content Studio", grad: "from-purple-400 to-blue-500",
    },
    {
      text: "Пробовали 3 других сервиса — trendme единственный реально понимает ру-сегмент и СНГ-тренды. Ну и интерфейс огонь.",
      name: "Мария Р.", role: "Content Creator · 1.2M подписчиков", grad: "from-emerald-400 to-cyan-500",
    },
  ];

  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mb-14">
          <span className="eyebrow">Отзывы</span>
          <h2 className="mt-3 text-[clamp(2rem,3.5vw,2.75rem)] font-bold tracking-tight text-foreground">
            Что говорят пользователи
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {items.map((t) => (
            <div key={t.name} className="bg-card border border-border rounded-2xl p-7 hover-lift shadow-card-hover">
              <div className="flex gap-0.5 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-[15px] leading-relaxed text-foreground">«{t.text}»</p>
              <div className="mt-6 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.grad}`} />
                <div>
                  <div className="text-[14px] font-semibold text-foreground">{t.name}</div>
                  <div className="text-[12px] text-muted-foreground">{t.role}</div>
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
    { q: "Откуда берутся данные?", a: "Мы агрегируем публичные данные TikTok, фильтруем по качеству и обогащаем собственными метриками вирусности. Всё легально." },
    { q: "Работает ли для Казахстана и СНГ?", a: "Да, trendme создан в первую очередь для русско- и казахоязычного контента. Фильтры по стране, языку и региону." },
    { q: "Можно ли отменить подписку?", a: "Да, в любой момент — в один клик в настройках. Без скрытых комиссий." },
    { q: "Есть ли бесплатная версия?", a: "Да — тариф Старт навсегда бесплатный. 10 видео в день, 3 ниши, без карты." },
    { q: "Как работает ИИ-сценарий?", a: "Выбираете тренд → указываете свою нишу и tone-of-voice → ИИ выдаёт готовый сценарий с хуком, структурой и CTA за 12 секунд." },
  ];

  return (
    <section id="faq" className="py-24 bg-background-subtle border-y border-border">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="eyebrow">FAQ</span>
          <h2 className="mt-3 text-[clamp(2rem,3.5vw,2.75rem)] font-bold tracking-tight text-foreground">
            Частые вопросы
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details key={i} className="group bg-card border border-border rounded-xl p-5" open={i === 0}>
              <summary className="flex items-center justify-between font-semibold text-[15px] text-foreground cursor-pointer list-none">
                {f.q}
                <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-[14px] text-muted-foreground leading-relaxed">{f.a}</p>
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
    <section className="py-28">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative bg-foreground rounded-[32px] p-12 md:p-16 overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-primary/40 to-fuchsia-500/30 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-viral/20 blur-3xl" />

          <div className="relative">
            <h2 className="text-background text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight max-w-2xl leading-[1.05]">
              Перестаньте угадывать.<br />
              <span className="gradient-text">Работайте с трендами на фактах.</span>
            </h2>
            <p className="mt-4 text-background/70 text-[17px] max-w-xl leading-relaxed">
              Попробуйте trendme бесплатно — 10 видео в день, 3 ниши, без карты.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-viral text-foreground text-[15px] font-semibold hover:opacity-90 transition"
              >
                Начать бесплатно
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-background/10 text-background text-[15px] font-semibold hover:bg-background/15 transition"
              >
                Сравнить тарифы
              </a>
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
    <footer className="border-t border-border py-14 bg-background-subtle">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-[2fr,1fr,1fr,1fr] gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-viral" />
            </div>
            <span className="font-bold text-[17px] tracking-tight text-foreground">trendme</span>
          </div>
          <p className="text-[14px] text-muted-foreground max-w-sm leading-relaxed">
            Платформа для мониторинга трендов TikTok, аналитики вирусного контента и генерации ИИ-сценариев.
          </p>
        </div>
        {[
          { title: "Продукт", links: [["Возможности", "#features"], ["Тарифы", "#pricing"], ["Интеграции", "#"], ["API", "#"]] },
          { title: "Компания", links: [["О нас", "#"], ["Блог", "#"], ["Контакты", "#"]] },
          { title: "Правовое", links: [["Условия", "/terms"], ["Конфиденциальность", "/privacy"]] },
        ].map((col) => (
          <div key={col.title}>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">{col.title}</div>
            <ul className="space-y-2 text-[14px] text-foreground/80">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="hover:text-foreground transition">{label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-10 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
        <div className="text-[13px] text-muted-foreground">© 2026 trendme. Все права защищены.</div>
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
        <Trust />
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
