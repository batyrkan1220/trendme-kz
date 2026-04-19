import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Search, BarChart3, Eye, Zap,
  ArrowRight, Check, Sparkles, Star, FileText, ChevronRight,
  Clock, Flame, Video, Lightbulb,
  Rocket, CircleDot, Heart, MessageCircle, Play, Menu, X,
  Shield, Globe, BarChart, Cpu, Target, Users
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { TrendMeLogo } from "@/components/TrendMeLogo";
import trendImg1 from "@/assets/landing-trend-1.jpg";
import trendImg2 from "@/assets/landing-trend-2.jpg";
import trendImg3 from "@/assets/landing-trend-3.jpg";

/* ─── Scroll reveal hook ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Stagger children reveal ─── */
function RevealGroup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal(0.1);
  return (
    <div ref={ref} className={`${className} ${visible ? "animate-in" : "opacity-0"}`}>
      {children}
    </div>
  );
}

/* ─── Landing Nav ─── */
function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "#how", label: "Как это работает" },
    { href: "#features", label: "Инструменты" },
    { href: "#reviews", label: "Отзывы" },
    { href: "#pricing", label: "Тарифы" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-background/90 backdrop-blur-xl border-b border-border/40 shadow-[0_1px_8px_hsl(var(--primary)/0.04)]"
        : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <TrendMeLogo size={28} className="md:w-9 md:h-9" />
          <BrandName className="text-lg md:text-2xl" />
        </div>
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-[15px] text-muted-foreground hover:text-foreground transition-colors duration-200">{l.label}</a>
          ))}
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/auth" className="hidden sm:block">
            <Button variant="ghost" className="text-[15px] font-medium text-muted-foreground hover:text-foreground px-4 md:px-5 h-10 md:h-11">
              Войти
            </Button>
          </Link>
          <Link to="/auth?mode=register" className="hidden sm:block">
            <Button className="bg-primary text-primary-foreground rounded-xl text-[15px] font-semibold px-5 md:px-6 h-10 md:h-11 hover:bg-primary/90 shadow-[0_2px_12px_-2px_hsl(var(--primary)/0.3)]">
              Начать бесплатно <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-foreground">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border/40 px-4 py-3 animate-fade-in">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-[15px] font-medium text-foreground hover:bg-muted transition-colors">
              {l.label}
            </a>
          ))}
          <div className="mt-3 pt-3 border-t border-border/40 flex flex-col gap-2">
            <Link to="/auth" onClick={() => setMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center text-[15px] font-semibold h-10 border-primary/30 text-primary hover:bg-primary/5">Войти</Button>
            </Link>
            <Link to="/auth?mode=register" onClick={() => setMenuOpen(false)}>
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
  <span className={`font-bold tracking-tight text-foreground ${className}`}>trendme</span>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z"/>
  </svg>
);

/* ─── Data ─── */
const features = [
  { icon: TrendingUp, title: "Мониторинг трендов", desc: "Уведомления о новых трендах раньше конкурентов. Анализ хештегов, звуков и форматов.", metric: "2x быстрее", color: "from-violet-500 to-purple-600" },
  { icon: Search, title: "Умный поиск", desc: "Поиск по ключевым словам, нишам и авторам с фильтрацией по просмотрам и ER.", metric: "10M+ видео", color: "from-blue-500 to-cyan-500" },
  { icon: Eye, title: "Разведка конкурентов", desc: "Отслеживайте стратегии конкурентов. Какие форматы дают максимальный охват.", metric: "∞ авторов", color: "from-emerald-500 to-teal-500" },
  { icon: BarChart3, title: "Глубокая аналитика", desc: "Velocity просмотров, вовлечённость, прогноз виральности по каждому видео.", metric: "15+ метрик", color: "from-orange-500 to-amber-500" },
  { icon: FileText, title: "ИИ-сценарии", desc: "Генерация сценариев, адаптированных под вашу нишу и стиль контента.", metric: "GPT-5", color: "from-pink-500 to-rose-500" },
  { icon: Zap, title: "Авто-отчёты", desc: "Ежедневные инсайты, рекомендации и оповещения о трендах в ваш аккаунт.", metric: "24/7", color: "from-indigo-500 to-violet-500" },
];

const stats = [
  { value: "5M+", label: "видео проанализировано", icon: Video },
  { value: "150+", label: "ниш и категорий", icon: Target },
  { value: "24/7", label: "мониторинг трендов", icon: Clock },
  { value: "98%", label: "точность аналитики", icon: BarChart },
];

const trendingVideos = [
  { title: "Утренние рутины", author: "@lifestyle_kz", views: "2.4M", likes: "342K", comments: "12K", growth: "+580%", tag: "🔥 В тренде", img: trendImg1 },
  { title: "Рецепт за 60 сек", author: "@chef_pro", views: "1.8M", likes: "256K", comments: "8.5K", growth: "+420%", tag: "📈 Растёт", img: trendImg2 },
  { title: "Лайфхак для дома", author: "@diy_master", views: "3.1M", likes: "489K", comments: "15K", growth: "+720%", tag: "💥 Вирусное", img: trendImg3 },
];

const testimonials = [
  { name: "Айгерім Сәтбаева", role: "SMM-маман, @aigstyle", text: "2 аптада TikTok аккаунтым 12K-дан 87K-ға өсті. trendme арқылы трендті 3 күн бұрын ұстаймын — конкуренттер тек қарап тұрады.", avatar: "👩‍💻", rating: 5, result: "+625% охват", followers: "87K+", period: "2 апта" },
  { name: "Нұрсұлтан Байқадамов", role: "Блогер, 340K подписчик", text: "ИИ сценарий генераторы — бомба. Әр видеоға 3-4 сағат жұмсайтынмын, енді 20 минутта дайын. Соңғы 5 видеом рекомендацияға түсті.", avatar: "🎬", rating: 5, result: "5 видео рек-қа", followers: "340K", period: "1 ай" },
  { name: "Дана Оспанова", role: "Интернет-дүкен иесі", text: "Конкуренттерді разведка жасап, олардың вирусты стратегиясын көшірдім. Бір видеодан 380+ тапсырыс келді. Платформа өзін 1 күнде ақтады.", avatar: "🛍️", rating: 5, result: "380+ тапсырыс", followers: "52K", period: "1 апта" },
  { name: "Асхат Тұрғынбеков", role: "Маркетолог, Digital Agency", text: "Клиенттерге ай сайын 15+ контент-план жасаймын. trendme болмаса бұл мүмкін емес еді. Аналитика қуатты, баға арзан.", avatar: "📊", rating: 5, result: "15+ жоба/ай", followers: "", period: "3 ай" },
  { name: "Мадина Жұмабекова", role: "Бьюти-блогер, 120K", text: "Нишалық тренд мониторингі өте дәл жұмыс істейді. Менің beauty контентім әрқашан топта. Подписчиктерім 3 есе өсті!", avatar: "💄", rating: 5, result: "3x подписчик", followers: "120K", period: "1.5 ай" },
  { name: "Ерболат Қасымов", role: "TikTok Shop иесі", text: "trendme-дің трендтер базасынан вирусты тауар тауып, 1 видеодан 2.4 млн қаратып, 890 тауар саттым. Бұл — нағыз game changer.", avatar: "🏆", rating: 5, result: "2.4M просмотр", followers: "210K", period: "2 апта" },
];

const plans = [
  { name: "Демо режим", price: "Бесплатно", period: "", subtitle: "С лимитами", features: ["Все функции платформы", "Тренды — 5 видео", "10 поисков", "5 анализов видео", "5 анализов профиля", "5 ИИ сценариев"], emoji: "🎁" },
  { name: "1 мес", price: "17 900 ₸", period: "/мес", subtitle: "Ежемесячная подписка", features: ["Безлимитный поиск", "Безлимитный анализ видео", "Безлимитный анализ профиля", "Безлимитный AI Сценарии", "Тренды без ограничений", "30 авторов"], popular: true, emoji: "⚡" },
  { name: "3 мес", price: "45 600 ₸", period: "/3 мес", subtitle: "Экономия 15%", features: ["Безлимитный поиск", "Безлимитный анализ видео", "Безлимитный анализ профиля", "Безлимитный AI Сценарии", "Тренды без ограничений", "200 авторов"], emoji: "🏆", badge: "Лучшая цена" },
];

const steps = [
  { num: "01", title: "Введите запрос", desc: "Ключевое слово, хештег или ссылку на аккаунт конкурента", icon: Search },
  { num: "02", title: "ИИ анализирует", desc: "Обработка миллионов видео и генерация инсайтов за секунды", icon: Cpu },
  { num: "03", title: "Действуйте", desc: "Готовые сценарии, рекомендации и пошаговая стратегия роста", icon: Rocket },
];

const faqs = [
  { q: "Как быстро я увижу результат?", a: "Первые инсайты вы получите сразу после регистрации. Большинство пользователей замечают рост охватов уже в первую неделю использования платформы." },
  { q: "Нужно ли привязывать аккаунт TikTok?", a: "Нет, мы работаем через открытые данные. Вам не нужно давать доступ к своему аккаунту — полная безопасность." },
  { q: "Могу ли я отменить подписку?", a: "Да, отменить можно в любое время без штрафов. Доступ сохранится до конца оплаченного периода." },
  { q: "Подходит ли для Reels и Shorts?", a: "Сейчас фокус на TikTok, но скоро добавим Instagram Reels и YouTube Shorts — следите за обновлениями." },
  { q: "Какие данные вы анализируете?", a: "Просмотры, лайки, комментарии, шеры, velocity роста, ER, длительность, хештеги, звуки — более 15 метрик для каждого видео." },
];

/* ─── Animated counter ─── */
function AnimatedStat({ value, label, icon: Icon }: { value: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  const { ref, visible } = useReveal();
  const numMatch = value.match(/^([\d,.]+)/);
  const suffix = value.replace(/^[\d,.]+/, "");
  const target = numMatch ? parseFloat(numMatch[1].replace(",", ".")) : 0;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!visible || !target) return;
    const duration = 1800;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCurrent(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
      else setCurrent(target);
    };
    requestAnimationFrame(animate);
  }, [visible, target]);

  return (
    <div ref={ref} className="text-center group">
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/15 transition-colors">
        <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
      </div>
      <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
        {target ? current : value.replace(/[\d,.]+/, "")}{suffix}
      </div>
      <div className="text-sm md:text-base text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

/* ─── Trending showcase ─── */
function TrendingShowcase() {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setActive((a) => (a + 1) % trendingVideos.length), 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div ref={containerRef} className="flex gap-4 md:gap-5 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible scrollbar-none">
        <style>{`.scrollbar-none::-webkit-scrollbar{display:none}.scrollbar-none{-ms-overflow-style:none;scrollbar-width:none}`}</style>
        {trendingVideos.map((v, i) => (
          <div
            key={v.title}
            className={`relative rounded-2xl p-4 md:p-6 border transition-all duration-500 cursor-pointer min-w-[260px] w-[75vw] md:w-auto md:min-w-0 snap-center shrink-0 md:shrink ${
              i === active
                ? "bg-card border-primary/30 shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.2)] scale-[1.02]"
                : "bg-card/60 border-border/40 opacity-70 hover:opacity-90"
            }`}
            onClick={() => setActive(i)}
          >
            <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full mb-4 transition-colors ${
              i === active ? "bg-primary/10 text-primary" : "bg-muted text-foreground/60"
            }`}>
              {v.tag}
            </span>

            <div className={`w-full aspect-video rounded-xl mb-4 overflow-hidden relative transition-all duration-500 ${
              i === active ? "shadow-lg" : ""
            }`}>
              <img src={v.img} alt={v.title} width={512} height={287} loading="lazy" decoding="async" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent flex items-center justify-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${
                  i === active ? "bg-primary/80 scale-110" : "bg-black/30"
                }`}>
                  <Play className="h-5 w-5 text-white fill-white" />
                </div>
              </div>
            </div>

            <h3 className="font-bold text-foreground text-base mb-1">{v.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{v.author}</p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{v.views}</span>
              <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{v.likes}</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{v.comments}</span>
            </div>

            <div className={`absolute top-5 right-5 text-xs font-bold px-2 py-0.5 rounded-md transition-colors ${
              i === active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/60"
            }`}>
              {v.growth}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 mt-6">
        {trendingVideos.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Перейти к слайду ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === active ? "w-8 bg-primary" : "w-2 bg-border hover:bg-primary/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Floating particles (decorative) ─── */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[15%] left-[10%] w-72 h-72 bg-primary/[0.04] rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "6s" }} />
      <div className="absolute top-[40%] right-[5%] w-96 h-96 bg-primary/[0.03] rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "8s", animationDelay: "2s" }} />
      <div className="absolute bottom-[10%] left-[20%] w-64 h-64 bg-primary/[0.05] rounded-full blur-[80px] animate-pulse" style={{ animationDuration: "7s", animationDelay: "4s" }} />
    </div>
  );
}

/* ─── Main ─── */
export default function Landing() {
  return (
    <main className="bg-background text-foreground overflow-x-hidden min-h-screen relative">
      <LandingNav />

      {/* ═══ Hero ═══ */}
      <section className="pt-24 pb-10 md:pt-44 md:pb-24 px-4 relative">
        <div className="absolute top-0 left-0 right-0 h-[600px] md:h-[800px] bg-gradient-to-b from-primary/[0.05] via-primary/[0.02] to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] md:w-[1000px] h-[300px] md:h-[600px] bg-primary/[0.06] rounded-full blur-[160px] pointer-events-none" />
        
        {/* Decorative grid pattern */}
        <div className="absolute top-0 left-0 right-0 h-[500px] opacity-[0.015] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 text-sm md:text-base font-medium text-foreground mb-6 md:mb-10 bg-card/80 backdrop-blur-sm border border-border/50 rounded-full px-4 py-2 shadow-sm">
            <TikTokIcon className="h-4 w-4 md:h-5 md:w-5" />
            <span>TikTok Official Partner</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          </div>

          <h1 className="text-[1.75rem] sm:text-[2.6rem] md:text-[3.4rem] lg:text-[4.2rem] font-extrabold leading-[1.1] tracking-tight mb-5 md:mb-8">
            Находите{" "}
            <span className="relative inline-block">
              <span className="relative z-10 gradient-text">вирусные тренды</span>
            </span>
            <br className="hidden sm:block" />
            <span className="text-foreground"> и снимайте лучше всех</span>
          </h1>

          <p className="text-[15px] sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 md:mb-12 leading-relaxed px-2">
            Узнайте, какие видео взрывают вашу нишу прямо сейчас.
            <br className="hidden md:block" />
            ИИ подскажет формат и напишет сценарий — вам останется только снять.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 md:mb-10">
            <Link to="/auth?mode=register">
              <Button className="bg-primary text-primary-foreground rounded-2xl text-sm md:text-lg font-bold px-8 md:px-12 h-12 md:h-16 shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.4)] hover:shadow-[0_12px_40px_-6px_hsl(var(--primary)/0.5)] hover:bg-primary/90 transition-all w-full sm:w-auto">
                <Rocket className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Попробовать бесплатно
              </Button>
            </Link>
            <a href="#how">
              <Button variant="outline" className="rounded-2xl text-sm md:text-lg font-semibold px-6 md:px-8 h-12 md:h-16 border-border/60 hover:bg-muted w-full sm:w-auto">
                <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Как это работает
              </Button>
            </a>
          </div>

          <div className="flex items-center justify-center gap-4 md:gap-8 text-xs md:text-sm text-muted-foreground flex-wrap">
            {[
              { icon: Shield, text: "Без карты" },
              { icon: Clock, text: "Доступ за 30 сек" },
              { icon: Zap, text: "50 запросов/день" },
            ].map((item) => (
              <span key={item.text} className="flex items-center gap-1.5 whitespace-nowrap">
                <item.icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary/60 shrink-0" />
                {item.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Trusted by ═══ */}
      <section className="py-6 md:py-10 px-4 border-y border-border/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs md:text-sm font-medium text-muted-foreground/70 uppercase tracking-wider mb-6">
            Нам доверяют 2 500+ авторов и брендов
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
            {stats.map((s) => (
              <AnimatedStat key={s.label} value={s.value} label={s.label} icon={s.icon} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Trending Showcase ═══ */}
      <section className="py-10 md:py-28 px-4 relative">
        <FloatingOrbs />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-8 md:mb-14">
            <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              <Flame className="h-4 w-4" />
              Прямо сейчас в тренде
            </div>
            <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3">
              Видео, которые <span className="gradient-text">взрывают</span> ленту
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Мы находим вирусные видео до того, как они станут мейнстримом
            </p>
          </div>
          <TrendingShowcase />
        </div>
      </section>

      {/* ═══ How it works ═══ */}
      <section id="how" className="py-12 md:py-32 px-4 bg-muted/30 border-y border-border/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-20">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Как это работает</p>
            <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4">
              Три шага к <span className="gradient-text">вирусному контенту</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg max-w-xl mx-auto">
              От идеи до готового сценария — за считанные минуты
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-[52px] left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            
            {steps.map((step, i) => (
              <div key={step.num} className="relative text-center group">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-5 md:mb-6 shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.35)] group-hover:shadow-[0_12px_40px_-6px_hsl(var(--primary)/0.45)] transition-shadow relative z-10">
                  <step.icon className="h-7 w-7 md:h-10 md:w-10 text-primary-foreground" />
                </div>
                <div className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Шаг {step.num}</div>
                <h3 className="text-lg md:text-2xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10 md:mt-16">
            <Link to="/auth?mode=register">
              <Button className="bg-primary text-primary-foreground rounded-xl text-sm md:text-lg font-bold px-8 md:px-10 h-12 md:h-14 hover:bg-primary/90 shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.3)]">
                Начать сейчас — бесплатно
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section id="features" className="py-12 md:py-32 px-4 relative">
        <FloatingOrbs />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-10 md:mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Инструменты</p>
            <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4">
              Всё для <span className="gradient-text">роста</span> в TikTok
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg lg:text-xl max-w-2xl mx-auto">
              Один инструмент заменяет десятки сервисов. Работайте умнее.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((f, i) => (
              <div key={f.title} className="group relative rounded-2xl p-5 md:p-7 bg-card border border-border/50 card-shadow hover-lift transition-all duration-300 hover:border-primary/20 h-full overflow-hidden">
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg`}>
                      <f.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      {f.metric}
                    </span>
                  </div>
                  <h3 className="text-base md:text-xl font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Testimonials ═══ */}
      <section id="reviews" className="py-12 md:py-32 px-4 bg-muted/30 border-y border-border/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Отзывы</p>
            <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4">
              Қазақстандықтар <span className="gradient-text">нәтиже</span> көрсетуде
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg">Біздің қолданушылар конкуренттерден тез өседі</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {testimonials.map((t, idx) => (
              <div key={t.name} className="rounded-2xl p-5 md:p-7 bg-card border border-border/50 card-shadow hover-lift transition-all h-full relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.03] rounded-full blur-3xl group-hover:bg-primary/[0.08] transition-colors" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 md:h-5 md:w-5 fill-[hsl(45,90%,55%)] text-[hsl(45,90%,55%)]" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      {t.result}
                    </span>
                  </div>
                  
                  <p className="text-sm md:text-base text-foreground leading-relaxed mb-5">«{t.text}»</p>
                  
                  {/* Metrics row */}
                  <div className="flex gap-3 mb-5">
                    {t.followers && (
                      <div className="text-center px-3 py-1.5 rounded-lg bg-muted/60 border border-border/30">
                        <div className="text-xs font-bold text-foreground">{t.followers}</div>
                        <div className="text-[10px] text-muted-foreground">подписчик</div>
                      </div>
                    )}
                    <div className="text-center px-3 py-1.5 rounded-lg bg-muted/60 border border-border/30">
                      <div className="text-xs font-bold text-foreground">{t.period}</div>
                      <div className="text-[10px] text-muted-foreground">мерзім</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-lg md:text-xl border border-primary/10">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm md:text-base font-semibold text-foreground">{t.name}</div>
                      <div className="text-xs md:text-sm text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Pricing ═══ */}
      <section id="pricing" className="py-12 md:py-32 px-4 relative">
        <FloatingOrbs />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-10 md:mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Тарифы</p>
            <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4">
              Выберите свой <span className="gradient-text">план</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg">Начните бесплатно. Масштабируйтесь, когда готовы.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-6 md:p-8 border transition-all hover-lift relative h-full ${
                plan.popular || plan.badge
                  ? "bg-card border-primary/30 shadow-[0_8px_40px_-8px_hsl(var(--primary)/0.18)] md:scale-105 ring-1 ring-primary/10"
                  : "bg-card border-border/50 card-shadow"
              }`}>
                {(plan.popular || plan.badge) && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-xs font-bold text-primary-foreground bg-gradient-to-r from-primary to-primary/80 px-4 py-1.5 rounded-full shadow-lg">
                    <Sparkles className="h-3 w-3" /> {plan.badge || "Популярный"}
                  </span>
                )}
                <div className="text-3xl md:text-4xl mb-2">{plan.emoji}</div>
                <h3 className="text-lg md:text-2xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{plan.subtitle}</p>
                <div className="mt-3 mb-5 md:mb-7">
                  <span className="text-2xl md:text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-sm md:text-base text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 md:space-y-3 mb-6 md:mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm md:text-base text-muted-foreground">
                      <Check className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth?mode=register">
                  <Button className={`w-full rounded-xl h-11 md:h-12 font-semibold text-sm md:text-base ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.3)]"
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
      <section id="faq" className="py-12 md:py-28 px-4 bg-muted/30 border-y border-border/20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 md:mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold">
              Частые <span className="gradient-text">вопросы</span>
            </h2>
          </div>
          <div className="space-y-3 md:space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl bg-card border border-border/50 card-shadow transition-all hover:border-primary/10">
                <summary className="flex items-center justify-between cursor-pointer p-4 md:p-6 text-sm md:text-base font-semibold text-foreground list-none select-none">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground transition-transform duration-300 group-open:rotate-90 shrink-0 ml-2" />
                </summary>
                <div className="px-4 md:px-6 pb-4 md:pb-6 text-sm md:text-base text-muted-foreground leading-relaxed -mt-1">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-10 md:py-28 px-3 md:px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-primary/85 p-8 md:p-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08),transparent_50%)]" />
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-64 h-64 border border-white/10 rounded-full" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 border border-white/10 rounded-full" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-primary-foreground text-sm md:text-base font-semibold px-4 py-1.5 rounded-full mb-6 md:mb-8">
                <Users className="h-4 w-4 md:h-5 md:w-5" />
                Присоединяйтесь к 2 500+ авторам
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary-foreground mb-4 md:mb-6 leading-tight">
                Начните расти
                <br />
                в TikTok сегодня
              </h2>
              <p className="text-primary-foreground/80 text-sm md:text-xl mb-6 md:mb-10 max-w-lg mx-auto leading-relaxed">
                Бесплатный старт. Без привязки карты.
                <br className="hidden md:block" />
                Первые инсайты через 30 секунд.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link to="/auth?mode=register">
                  <Button className="bg-card text-foreground hover:bg-card/90 rounded-xl text-sm md:text-lg font-bold px-8 md:px-14 h-12 md:h-16 shadow-xl hover:shadow-2xl transition-all">
                    Создать аккаунт бесплатно
                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary rounded-xl text-sm md:text-lg font-bold px-8 md:px-14 h-12 md:h-16 transition-all">
                    Войти
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-border/50 py-8 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between md:gap-6">
            <div className="flex items-center gap-2.5">
              <TrendMeLogo size={24} className="md:w-8 md:h-8" />
              <BrandName className="text-base md:text-xl" />
            </div>
            <div className="flex items-center gap-4 md:gap-8 flex-wrap justify-center">
              <a href="#features" className="text-xs md:text-[15px] text-muted-foreground hover:text-foreground transition-colors">Инструменты</a>
              <a href="#pricing" className="text-xs md:text-[15px] text-muted-foreground hover:text-foreground transition-colors">Тарифы</a>
              <a href="#reviews" className="text-xs md:text-[15px] text-muted-foreground hover:text-foreground transition-colors">Отзывы</a>
              <a href="#faq" className="text-xs md:text-[15px] text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </div>
          </div>
          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-border/30 flex flex-col items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground text-center">
            <div className="grid grid-cols-2 md:flex md:items-center gap-2 md:gap-6 justify-items-center">
              <Link to="/terms" className="hover:text-foreground transition-colors">Пользовательское соглашение</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Политика конфиденциальности</Link>
              <Link to="/payment" className="hover:text-foreground transition-colors">Оплата и возврат</Link>
              <Link to="/contacts" className="hover:text-foreground transition-colors">Контакты</Link>
            </div>
            <div className="space-y-0.5 text-[11px] md:text-sm">
              <p>© 2026 trendme</p>
              <p>ИП Батырхан · БИН 970528301753</p>
              <p>г. Шымкент, ул. Кунаева 59, БЦ "Астана", офис 501</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
