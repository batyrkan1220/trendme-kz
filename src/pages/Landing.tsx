import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Search, BarChart3, Eye, Zap,
  ArrowRight, Check, Sparkles, Star, Play, Users, FileText, ChevronRight,
  Target, Clock, Globe, Shield, Flame, BarChart, Video, Lightbulb
} from "lucide-react";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z"/>
  </svg>
);

const features = [
  {
    icon: TrendingUp,
    title: "Мониторинг трендов",
    desc: "Получайте уведомления о новых трендах раньше конкурентов. Анализ хештегов, звуков и форматов в реальном времени.",
    color: "bg-primary",
    metric: "2x быстрее",
  },
  {
    icon: Search,
    title: "Умный поиск",
    desc: "Поиск по ключевым словам, нишам и авторам с фильтрацией по просмотрам, ER и velocity-метрикам.",
    color: "bg-accent",
    metric: "10M+ видео",
  },
  {
    icon: Eye,
    title: "Разведка конкурентов",
    desc: "Отслеживайте стратегии конкурентов. Узнавайте какие форматы и темы дают им максимальный охват.",
    color: "bg-primary",
    metric: "∞ авторов",
  },
  {
    icon: BarChart3,
    title: "Глубокая аналитика",
    desc: "Velocity просмотров, вовлечённость, прогноз виральности — полная картина по каждому видео.",
    color: "bg-accent",
    metric: "15+ метрик",
  },
  {
    icon: FileText,
    title: "ИИ-сценарии",
    desc: "Анализируем вирусные видео и генерируем сценарии, адаптированные под вашу нишу и стиль.",
    color: "bg-primary",
    metric: "GPT-5",
  },
  {
    icon: Zap,
    title: "Автоматические отчёты",
    desc: "Ежедневные инсайты, рекомендации по контенту и оповещения о трендах прямо в ваш аккаунт.",
    color: "bg-accent",
    metric: "24/7",
  },
];

const stats = [
  { value: "10M+", label: "Видео в базе", icon: Video },
  { value: "50K+", label: "Трендов найдено", icon: TrendingUp },
  { value: "2 500+", label: "Пользователей", icon: Users },
  { value: "98%", label: "Точность ИИ", icon: Target },
];

const testimonials = [
  {
    name: "Айдана К.",
    role: "SMM-менеджер, агентство",
    text: "За месяц охваты выросли в 4 раза. Тренды ловим за 2 дня до массового хайпа. ROI по контенту вырос на 320%.",
    avatar: "🇰🇿",
    rating: 5,
    result: "+320% ROI",
  },
  {
    name: "Дмитрий Р.",
    role: "Блогер, 500K+ подписчиков",
    text: "Генератор сценариев — это магия. Каждое второе видео по ним залетает в рекомендации. Экономлю 3 часа в день.",
    avatar: "🎬",
    rating: 5,
    result: "3ч экономии/день",
  },
  {
    name: "Мадина Т.",
    role: "Владелец интернет-магазина",
    text: "Разведка конкурентов помогла найти формат, который принёс 200+ заказов с одного видео. Окупилось за день.",
    avatar: "🛍️",
    rating: 5,
    result: "200+ заказов",
  },
];

const plans = [
  {
    name: "Старт",
    price: "Бесплатно",
    period: "",
    features: ["100 запросов/мес", "5 отслеживаемых авторов", "Базовый анализ трендов", "Поиск видео"],
    emoji: "🚀",
  },
  {
    name: "Про",
    price: "2 990 ₽",
    period: "/мес",
    features: ["5 000 запросов/мес", "50 отслеживаемых авторов", "Полный анализ + ИИ сценарии", "Экспорт данных", "Приоритетная поддержка"],
    popular: true,
    emoji: "⚡",
  },
  {
    name: "Бизнес",
    price: "9 990 ₽",
    period: "/мес",
    features: ["Безлимитные запросы", "Безлимитные авторы", "API доступ", "Персональный менеджер", "Кастомные отчёты"],
    emoji: "🏆",
  },
];

const steps = [
  { num: "01", title: "Введите запрос", desc: "Ключевое слово, хештег или ссылку на аккаунт", icon: Search },
  { num: "02", title: "ИИ анализирует", desc: "Обработка данных и генерация инсайтов за секунды", icon: Zap },
  { num: "03", title: "Действуйте", desc: "Готовые сценарии, рекомендации и стратегия", icon: Lightbulb },
];

const painPoints = [
  { problem: "Тратите часы на поиск идей?", solution: "ИИ генерирует сценарии за 30 секунд" },
  { problem: "Не знаете что сейчас в тренде?", solution: "Получайте тренды на 48ч раньше" },
  { problem: "Конкуренты растут быстрее?", solution: "Разведка покажет их стратегию" },
  { problem: "Низкие охваты и ER?", solution: "Velocity-метрики прогнозируют виральность" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shadow-lg">
              <TrendingUp className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">Trend TikTok</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Возможности</a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Как это работает</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Тарифы</a>
            <a href="#reviews" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Отзывы</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Войти
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="gradient-hero text-primary-foreground border-0 glow-primary rounded-xl text-sm font-semibold px-5 h-9">
                Начать бесплатно
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-44 md:pb-32 px-4 relative">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-muted/40 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 text-accent text-sm font-semibold px-4 py-1.5 rounded-full mb-8">
            <TikTokIcon className="h-4 w-4" />
            TikTok Official Partner
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-[4.5rem] font-extrabold leading-[1.05] tracking-tight mb-6">
            Ваши видео будут
            <br />
            <span className="gradient-text">залетать в ТОП</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            ИИ-платформа для мониторинга трендов, анализа конкурентов и генерации вирусных сценариев. Более 2 500 авторов уже растут с нами.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link to="/auth">
              <Button className="gradient-hero text-primary-foreground border-0 glow-primary rounded-xl text-base font-bold px-8 h-14 min-h-[56px] text-[15px]">
                Попробовать бесплатно
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#how">
              <Button variant="outline" className="rounded-xl text-base font-semibold px-8 h-14 min-h-[56px] border-border/50 bg-card hover:bg-muted">
                <Play className="mr-2 h-4 w-4" />
                Как это работает
              </Button>
            </a>
          </div>

          <p className="text-xs text-muted-foreground mb-14">
            Бесплатно · Без карты · Настройка за 30 секунд
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-4 card-shadow hover-lift transition-all">
                <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-extrabold gradient-text">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points — Social proof of problems */}
      <section className="py-12 md:py-16 px-4 border-y border-border/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {painPoints.map((p) => (
              <div key={p.problem} className="flex flex-col gap-2 p-5 rounded-2xl bg-card border border-border/50 card-shadow">
                <p className="text-sm font-medium text-foreground">{p.problem}</p>
                <p className="text-sm text-primary font-semibold flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  {p.solution}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Возможности</p>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              Всё для <span className="gradient-text">роста</span> в TikTok
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Один инструмент заменяет десятки сервисов. Работайте умнее, а не больше.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl p-6 bg-card border border-border/50 card-shadow hover-lift transition-all duration-300 hover:border-primary/20"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center`}>
                    <f.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-[11px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-md">
                    {f.metric}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 md:py-28 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Как это работает</p>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              Три шага к <span className="gradient-text">вирусному контенту</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-5 glow-primary">
                  <step.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <div className="text-xs font-bold text-primary/40 uppercase tracking-widest mb-2">Шаг {step.num}</div>
                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8">
                    <ChevronRight className="h-5 w-5 text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/auth">
              <Button className="gradient-hero text-primary-foreground border-0 glow-primary rounded-xl text-base font-bold px-8 h-13 min-h-[52px]">
                Начать сейчас — бесплатно
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="py-16 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Отзывы</p>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              Реальные <span className="gradient-text">результаты</span>
            </h2>
            <p className="text-muted-foreground text-lg">Наши пользователи растут быстрее</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-6 bg-card border border-border/50 card-shadow hover-lift transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[hsl(45,90%,55%)] text-[hsl(45,90%,55%)]" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {t.result}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-5">«{t.text}»</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-28 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Тарифы</p>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              Выберите свой <span className="gradient-text">план</span>
            </h2>
            <p className="text-muted-foreground text-lg">Начните бесплатно. Масштабируйтесь, когда будете готовы.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 md:p-7 border transition-all hover-lift relative ${
                  plan.popular
                    ? "gradient-card glow-primary border-primary/20 scale-[1.02] md:scale-105"
                    : "bg-card border-border/50 card-shadow"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-xs font-bold text-primary-foreground gradient-hero px-4 py-1 rounded-full shadow-lg">
                    <Sparkles className="h-3 w-3" /> Популярный
                  </span>
                )}
                <div className="text-3xl mb-2">{plan.emoji}</div>
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <div className="mt-3 mb-5">
                  <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button
                    className={`w-full rounded-xl h-11 font-semibold ${
                      plan.popular
                        ? "gradient-hero text-primary-foreground border-0 glow-primary"
                        : "bg-secondary text-secondary-foreground border border-border hover:bg-muted"
                    }`}
                  >
                    {plan.price === "Бесплатно" ? "Начать бесплатно" : "Выбрать план"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ quick */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-10">
            Частые <span className="gradient-text">вопросы</span>
          </h2>
          <div className="space-y-4">
            {[
              { q: "Как быстро я увижу результат?", a: "Первые инсайты вы получите сразу после регистрации. Большинство пользователей замечают рост охватов уже в первую неделю использования." },
              { q: "Нужно ли привязывать аккаунт TikTok?", a: "Нет, мы работаем через открытые данные платформы. Вам не нужно давать доступ к своему аккаунту." },
              { q: "Могу ли я отменить подписку в любой момент?", a: "Да, вы можете отменить подписку в любое время. Доступ сохранится до конца оплаченного периода." },
              { q: "Подходит ли для Instagram Reels и YouTube Shorts?", a: "Сейчас мы фокусируемся на TikTok, но в ближайшем обновлении добавим поддержку Reels и Shorts." },
            ].map((faq) => (
              <details key={faq.q} className="group rounded-2xl bg-card border border-border/50 card-shadow">
                <summary className="flex items-center justify-between cursor-pointer p-5 text-sm font-semibold text-foreground list-none">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90 shrink-0" />
                </summary>
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed -mt-1">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-3xl gradient-hero p-10 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08),transparent_50%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-primary-foreground text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
                <Flame className="h-4 w-4" />
                Присоединяйтесь к 2 500+ авторам
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-4">
                Начните расти
                <br className="hidden sm:block" />
                в TikTok сегодня
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto">
                Бесплатный старт. Без привязки карты. Первые инсайты через 30 секунд.
              </p>
              <Link to="/auth">
                <Button className="bg-white text-foreground hover:bg-white/90 rounded-xl text-base font-bold px-10 h-14 min-h-[56px] shadow-xl">
                  Создать аккаунт бесплатно
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground">Trend TikTok</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Возможности</a>
              <a href="#pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Тарифы</a>
              <a href="#reviews" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Отзывы</a>
              <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Политика конфиденциальности</a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border/30 text-center">
            <p className="text-xs text-muted-foreground">
              © 2026 Trend TikTok. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
