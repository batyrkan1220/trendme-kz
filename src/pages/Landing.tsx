import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Search, BarChart3, Eye, Zap,
  ArrowRight, Check, Sparkles, Star, Users, FileText, ChevronRight,
  Target, Clock, Flame, Video, Lightbulb,
  Rocket, CircleDot, Heart, MessageCircle, Share2, Play, Menu, X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TrendMeLogo } from "@/components/TrendMeLogo";
import trendImg1 from "@/assets/landing-trend-1.jpg";
import trendImg2 from "@/assets/landing-trend-2.jpg";
import trendImg3 from "@/assets/landing-trend-3.jpg";

/* ─── Scroll reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ─── Landing Nav with mobile menu ─── */
function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = [
    { href: "#how", label: "Как это работает" },
    { href: "#features", label: "Инструменты" },
    { href: "#reviews", label: "Отзывы" },
    { href: "#pricing", label: "Тарифы" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <TrendMeLogo size={28} className="md:w-9 md:h-9" />
          <BrandName className="text-lg md:text-2xl" />
        </div>
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-[15px] text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
          ))}
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/auth" className="hidden sm:block">
            <Button variant="ghost" className="text-[15px] font-medium text-muted-foreground hover:text-foreground px-4 md:px-5 h-10 md:h-11">
              Войти
            </Button>
          </Link>
          <Link to="/auth" className="hidden sm:block">
            <Button className="bg-primary text-primary-foreground rounded-xl text-[15px] font-semibold px-5 md:px-6 h-10 md:h-11 hover:bg-primary/90">
              Начать бесплатно <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-foreground">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-background border-t border-border/40 px-4 py-3 animate-fade-in">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-[15px] font-medium text-foreground hover:bg-muted transition-colors"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-2 pt-2 border-t border-border/40 flex flex-col gap-2">
            <Link to="/auth" onClick={() => setMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center text-[15px] font-semibold h-10 border-primary/30 text-primary hover:bg-primary/5">Войти</Button>
            </Link>
            <Link to="/auth" onClick={() => setMenuOpen(false)}>
              <Button className="w-full justify-center bg-primary text-primary-foreground rounded-xl text-[15px] font-semibold h-10">
                Начать бесплатно <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}


/* ─── Brand ─── */
const BrandName = ({ className = "" }: { className?: string }) => (
  <span className={`font-bold tracking-tight text-foreground ${className}`}>
    trendme
  </span>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z"/>
  </svg>
);

/* ─── Data ─── */
const features = [
  { icon: TrendingUp, title: "Мониторинг трендов", desc: "Уведомления о новых трендах раньше конкурентов. Анализ хештегов, звуков и форматов.", metric: "2x быстрее" },
  { icon: Search, title: "Умный поиск", desc: "Поиск по ключевым словам, нишам и авторам с фильтрацией по просмотрам и ER.", metric: "10M+ видео" },
  { icon: Eye, title: "Разведка конкурентов", desc: "Отслеживайте стратегии конкурентов. Какие форматы дают максимальный охват.", metric: "∞ авторов" },
  { icon: BarChart3, title: "Глубокая аналитика", desc: "Velocity просмотров, вовлечённость, прогноз виральности по каждому видео.", metric: "15+ метрик" },
  { icon: FileText, title: "ИИ-сценарии", desc: "Генерация сценариев, адаптированных под вашу нишу и стиль контента.", metric: "GPT-5" },
  { icon: Zap, title: "Авто-отчёты", desc: "Ежедневные инсайты, рекомендации и оповещения о трендах в ваш аккаунт.", metric: "24/7" },
];

const stats = [
  { value: "5M+", label: "видео проанализировано" },
  { value: "150+", label: "ниш и категорий" },
  { value: "24/7", label: "мониторинг трендов" },
  { value: "98%", label: "точность аналитики" },
];

const trendingVideos = [
  { title: "Утренние рутины", author: "@lifestyle_kz", views: "2.4M", likes: "342K", comments: "12K", growth: "+580%", tag: "🔥 В тренде", img: trendImg1 },
  { title: "Рецепт за 60 сек", author: "@chef_pro", views: "1.8M", likes: "256K", comments: "8.5K", growth: "+420%", tag: "📈 Растёт", img: trendImg2 },
  { title: "Лайфхак для дома", author: "@diy_master", views: "3.1M", likes: "489K", comments: "15K", growth: "+720%", tag: "💥 Вирусное", img: trendImg3 },
];

const testimonials = [
  { name: "Айдана К.", role: "SMM-менеджер", text: "За месяц охваты выросли в 4 раза. Тренды ловим за 2 дня до массового хайпа.", avatar: "🇰🇿", rating: 5, result: "+320% ROI" },
  { name: "Дмитрий Р.", role: "Блогер, 500K+", text: "Генератор сценариев — магия. Каждое второе видео залетает в рекомендации.", avatar: "🎬", rating: 5, result: "3ч экономии" },
  { name: "Мадина Т.", role: "Интернет-магазин", text: "Разведка конкурентов принесла 200+ заказов с одного видео. Окупилось за день.", avatar: "🛍️", rating: 5, result: "200+ заказов" },
];

const plans = [
  { name: "Старт", price: "Бесплатно", period: "", features: ["100 запросов/мес", "5 авторов", "Базовый анализ", "Поиск видео"], emoji: "🚀" },
  { name: "Про", price: "2 990 ₽", period: "/мес", features: ["5 000 запросов/мес", "50 авторов", "ИИ сценарии", "Экспорт", "Поддержка"], popular: true, emoji: "⚡" },
  { name: "Бизнес", price: "9 990 ₽", period: "/мес", features: ["Безлимит запросов", "Безлимит авторов", "API доступ", "Менеджер", "Кастом отчёты"], emoji: "🏆" },
];

const steps = [
  { num: "01", title: "Введите запрос", desc: "Ключевое слово, хештег или ссылку на аккаунт", icon: Search },
  { num: "02", title: "ИИ анализирует", desc: "Обработка данных и генерация инсайтов за секунды", icon: Zap },
  { num: "03", title: "Действуйте", desc: "Готовые сценарии, рекомендации и стратегия роста", icon: Lightbulb },
];

/* ─── Animated counter ─── */
function AnimatedStat({ value, label }: { value: string; label: string }) {
  const { ref, visible } = useReveal();
  const numMatch = value.match(/^([\d,.]+)/);
  const suffix = value.replace(/^[\d,.]+/, "");
  const target = numMatch ? parseFloat(numMatch[1].replace(",", ".")) : 0;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!visible || !target) return;
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
      else setCurrent(target);
    };
    requestAnimationFrame(animate);
  }, [visible, target]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight">
        {target ? current : value.replace(/[\d,.]+/, "")}{suffix}
      </div>
      <div className="text-sm md:text-base text-muted-foreground mt-1.5 md:mt-2">{label}</div>
    </div>
  );
}

/* ─── Trending showcase ─── */
function TrendingShowcase() {
  const [active, setActive] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const interval = setInterval(() => setActive((a) => (a + 1) % trendingVideos.length), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div ref={containerRef} className="flex gap-4 md:gap-5 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible scrollbar-none">
        <style>{`.scrollbar-none::-webkit-scrollbar{display:none}.scrollbar-none{-ms-overflow-style:none;scrollbar-width:none}`}</style>
        {trendingVideos.map((v, i) => (
          <div
            key={v.title}
            ref={(el) => { cardRefs.current[i] = el; }}
            className={`relative rounded-2xl p-4 md:p-6 border transition-all duration-500 cursor-pointer min-w-[260px] w-[75vw] md:w-auto md:min-w-0 snap-center shrink-0 md:shrink ${
              i === active
                ? "bg-card border-primary/30 shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.2)] scale-[1.02]"
                : "bg-card/60 border-border/40 opacity-70 hover:opacity-90"
            }`}
            onClick={() => setActive(i)}
          >
            {/* Tag */}
            <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full mb-4 ${
              i === active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              {v.tag}
            </span>

            {/* Video preview placeholder */}
            <div className={`w-full aspect-video rounded-xl mb-4 overflow-hidden relative transition-all duration-500 ${
              i === active ? "shadow-lg" : ""
            }`}>
              <img src={v.img} alt={v.title} width={512} height={287} loading="lazy" decoding="async" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${
                  i === active ? "bg-primary/80" : "bg-black/30"
                }`}>
                  <Play className="h-5 w-5 text-white fill-white" />
                </div>
              </div>
            </div>

            <h3 className="font-bold text-foreground text-base mb-1">{v.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{v.author}</p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{v.views}</span>
              <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{v.likes}</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{v.comments}</span>
            </div>

            {/* Growth badge */}
            <div className={`absolute top-5 right-5 text-xs font-bold px-2 py-0.5 rounded-md transition-colors ${
              i === active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {v.growth}
            </div>
          </div>
        ))}
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {trendingVideos.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Перейти к слайду ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === active ? "w-8 bg-primary" : "w-2 bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <LandingNav />

      {/* ═══ Hero ═══ */}
      <section className="pt-24 pb-10 md:pt-44 md:pb-20 px-4 relative">
        <div className="absolute top-0 left-0 right-0 h-[500px] md:h-[700px] bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[600px] md:w-[900px] h-[300px] md:h-[500px] bg-primary/[0.06] rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 text-sm md:text-base font-medium text-foreground mb-4 md:mb-10">
            <TikTokIcon className="h-4 w-4 md:h-6 md:w-6" />
            TikTok Official Partner
          </div>

          <h1 className="text-[1.75rem] sm:text-[2.6rem] md:text-[3.2rem] lg:text-[4rem] font-extrabold leading-[1.15] tracking-tight mb-5 md:mb-8">
            Находите{" "}
            <span className="relative inline text-primary">
              <span className="relative z-10">вирусные видео</span>
              <span className="absolute left-[-6px] right-[-6px] bottom-0 h-[40%] bg-primary/10 rounded-sm -skew-y-[0.5deg]" />
            </span>{" "}
            из TikTok и снимайте лучше
          </h1>

          <p className="text-[15px] sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-6 md:mb-12 leading-relaxed px-2">
            Узнайте, какие видео взрывают вашу нишу прямо сейчас. AI подскажет формат и напишет сценарий — вам останется только снять.
          </p>

          <div className="mb-5 md:mb-8">
            <Link to="/auth">
              <Button className="bg-primary text-primary-foreground rounded-2xl text-sm md:text-lg font-bold px-6 md:px-12 h-12 md:h-16 shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.4)] hover:shadow-[0_12px_40px_-6px_hsl(var(--primary)/0.5)] hover:bg-primary/90 transition-all">
                <Rocket className="mr-2 h-4 w-4 md:h-6 md:w-6" />
                Попробовать бесплатно
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-3 md:gap-8 text-xs md:text-base text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <CircleDot className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
              Без карты
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Clock className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
              Доступ сразу
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Zap className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
              50 запросов/день
            </span>
          </div>
        </div>
      </section>

      {/* ═══ Stats (animated counters kept) ═══ */}
      <section className="py-8 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-12">
            {stats.map((s) => (
              <AnimatedStat key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Trending Showcase ═══ */}
      <section className="py-8 md:py-24 px-4 bg-muted/20 border-y border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 md:mb-14">
            <div className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-primary uppercase tracking-wider mb-2 md:mb-3">
              <Flame className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Прямо сейчас в тренде
            </div>
            <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 md:mb-3">
              Видео, которые <span className="text-primary">взрывают</span> ленту
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Мы находим вирусные видео до того, как они станут мейнстримом
            </p>
          </div>
          <TrendingShowcase />
        </div>
      </section>

      {/* ═══ How it works ═══ */}
      <section id="how" className="py-10 md:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wider mb-2 md:mb-3">Как это работает</p>
            <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 md:mb-4">
              Три шага к <span className="text-primary">вирусному контенту</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {steps.map((step, i) => (
              <div key={step.num} className="relative text-center">
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 md:mb-5 shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.3)]">
                  <step.icon className="h-6 w-6 md:h-8 md:w-8 text-primary-foreground" />
                </div>
                <div className="text-xs md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 md:mb-2">Шаг {step.num}</div>
                <h3 className="text-lg md:text-2xl font-bold text-foreground mb-1.5 md:mb-2">{step.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-5 w-10">
                    <ChevronRight className="h-6 w-6 text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-8 md:mt-16">
            <Link to="/auth">
              <Button className="bg-primary text-primary-foreground rounded-xl text-sm md:text-lg font-bold px-6 md:px-10 h-11 md:min-h-[56px] hover:bg-primary/90">
                Начать сейчас — бесплатно
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section id="features" className="py-10 md:py-28 px-4 bg-muted/20 border-y border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wider mb-2 md:mb-3">Инструменты</p>
            <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 md:mb-4">
              Всё для <span className="text-primary">роста</span> в TikTok
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg lg:text-xl max-w-2xl mx-auto">
              Один инструмент заменяет десятки сервисов. Работайте умнее.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((f) => (
              <div key={f.title} className="group relative rounded-2xl p-5 md:p-7 bg-card border border-border/50 card-shadow hover-lift transition-all duration-300 hover:border-primary/20 h-full">
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-primary flex items-center justify-center shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.25)]">
                    <f.icon className="h-4 w-4 md:h-6 md:w-6 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md">
                    {f.metric}
                  </span>
                </div>
                <h3 className="text-base md:text-xl font-bold text-foreground mb-1.5 md:mb-2">{f.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Testimonials ═══ */}
      <section id="reviews" className="py-10 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wider mb-2 md:mb-3">Отзывы</p>
            <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 md:mb-4">
              Реальные <span className="text-primary">результаты</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg">Наши пользователи растут быстрее</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl p-5 md:p-7 bg-card border border-border/50 card-shadow hover-lift transition-all h-full">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex gap-0.5 md:gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 md:h-5 md:w-5 fill-[hsl(45,90%,55%)] text-[hsl(45,90%,55%)]" />
                    ))}
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full">
                    {t.result}
                  </span>
                </div>
                <p className="text-sm md:text-base text-foreground leading-relaxed mb-4 md:mb-5">«{t.text}»</p>
                <div className="flex items-center gap-2.5 md:gap-3">
                  <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-muted flex items-center justify-center text-lg md:text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm md:text-base font-semibold text-foreground">{t.name}</div>
                    <div className="text-xs md:text-sm text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Pricing ═══ */}
      <section id="pricing" className="py-10 md:py-28 px-4 bg-muted/20 border-y border-border/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wider mb-2 md:mb-3">Тарифы</p>
            <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 md:mb-4">
              Выберите свой <span className="text-primary">план</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg">Начните бесплатно. Масштабируйтесь, когда готовы.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-5 md:p-8 border transition-all hover-lift relative h-full ${
                plan.popular
                  ? "bg-card border-primary/30 shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.15)] scale-[1.01] md:scale-105"
                  : "bg-card border-border/50 card-shadow"
              }`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-[10px] md:text-xs font-bold text-primary-foreground bg-primary px-3 md:px-4 py-1 rounded-full shadow-lg">
                    <Sparkles className="h-3 w-3" /> Популярный
                  </span>
                )}
                <div className="text-2xl md:text-4xl mb-1.5 md:mb-2">{plan.emoji}</div>
                <h3 className="text-lg md:text-2xl font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2 mb-4 md:mt-3 md:mb-6">
                  <span className="text-2xl md:text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-xs md:text-base text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-2 md:space-y-3 mb-5 md:mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm md:text-base text-muted-foreground">
                      <Check className="h-3.5 w-3.5 md:h-5 md:w-5 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button className={`w-full rounded-xl h-10 md:h-12 font-semibold text-xs md:text-base ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground border border-border hover:bg-muted"
                  }`}>
                    {plan.price === "Бесплатно" ? "Начать бесплатно" : "Выбрать план"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="py-10 md:py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-center mb-6 md:mb-12">
            Частые <span className="text-primary">вопросы</span>
          </h2>
          <div className="space-y-3 md:space-y-4">
            {[
              { q: "Как быстро я увижу результат?", a: "Первые инсайты вы получите сразу после регистрации. Большинство пользователей замечают рост охватов уже в первую неделю." },
              { q: "Нужно ли привязывать аккаунт TikTok?", a: "Нет, мы работаем через открытые данные. Вам не нужно давать доступ к своему аккаунту." },
              { q: "Могу ли я отменить подписку?", a: "Да, отменить можно в любое время. Доступ сохранится до конца оплаченного периода." },
              { q: "Подходит ли для Reels и Shorts?", a: "Сейчас фокус на TikTok, но скоро добавим Instagram Reels и YouTube Shorts." },
            ].map((faq) => (
              <details key={faq.q} className="group rounded-2xl bg-card border border-border/50 card-shadow">
                <summary className="flex items-center justify-between cursor-pointer p-4 md:p-6 text-sm md:text-base font-semibold text-foreground list-none">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground transition-transform group-open:rotate-90 shrink-0 ml-2" />
                </summary>
                <div className="px-4 md:px-6 pb-4 md:pb-6 text-xs md:text-base text-muted-foreground leading-relaxed -mt-1">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-8 md:py-24 px-3 md:px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-2xl md:rounded-3xl bg-primary p-6 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.12),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.06),transparent_50%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 bg-primary-foreground/15 backdrop-blur-sm text-primary-foreground text-xs md:text-base font-semibold px-3 md:px-4 py-1 md:py-1.5 rounded-full mb-4 md:mb-6">
                <Flame className="h-3.5 w-3.5 md:h-5 md:w-5" />
                Присоединяйтесь к 2 500+ авторам
              </div>
              <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary-foreground mb-2 md:mb-5">
                Начните расти
                <br />
                в TikTok сегодня
              </h2>
              <p className="text-primary-foreground/80 text-sm md:text-xl mb-5 md:mb-8 max-w-lg mx-auto">
                Бесплатный старт. Без привязки карты. Первые инсайты через 30 секунд.
              </p>
              <Link to="/auth">
                <Button className="bg-card text-foreground hover:bg-card/90 rounded-xl text-sm md:text-lg font-bold px-6 md:px-12 h-11 md:h-14 shadow-xl">
                  Создать аккаунт бесплатно
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-border/50 py-8 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <TrendMeLogo size={24} className="md:w-9 md:h-9" />
              <BrandName className="text-sm md:text-xl" />
            </div>
            <div className="flex items-center gap-4 md:gap-8 flex-wrap justify-center">
              <a href="#features" className="text-xs md:text-[15px] text-muted-foreground hover:text-foreground transition-colors">Инструменты</a>
              <a href="#pricing" className="text-xs md:text-[15px] text-muted-foreground hover:text-foreground transition-colors">Тарифы</a>
              <a href="#reviews" className="text-xs md:text-[15px] text-muted-foreground hover:text-foreground transition-colors">Отзывы</a>
              <a href="#faq" className="text-xs md:text-[15px] text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </div>
          </div>
          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-border/30 text-center">
            <p className="text-xs md:text-[15px] text-muted-foreground">
              © 2026 trendme. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}