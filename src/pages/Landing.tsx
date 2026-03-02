import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Search, BarChart3, Eye, Zap, Shield,
  ArrowRight, Check, Sparkles, Star, Play, Users, FileText, ChevronRight
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Мониторинг трендов",
    desc: "Отслеживайте тренды в реальном времени. Узнавайте о вирусных форматах раньше конкурентов.",
    color: "from-primary to-[hsl(340,75%,55%)]",
  },
  {
    icon: Search,
    title: "Поиск контента",
    desc: "Находите лучшие видео по ключевым словам, хештегам и нишам с фильтрацией по метрикам.",
    color: "from-[hsl(165,65%,43%)] to-[hsl(190,70%,45%)]",
  },
  {
    icon: Eye,
    title: "Разведка конкурентов",
    desc: "Следите за аккаунтами конкурентов. Анализируйте их стратегию и находите рабочие связки.",
    color: "from-[hsl(260,70%,60%)] to-[hsl(290,65%,55%)]",
  },
  {
    icon: BarChart3,
    title: "Глубокая аналитика",
    desc: "Разбирайте каждое видео: просмотры, вовлечённость, velocity-метрики и прогнозы роста.",
    color: "from-[hsl(45,90%,55%)] to-primary",
  },
  {
    icon: FileText,
    title: "Генерация сценариев",
    desc: "ИИ анализирует вирусные видео и создаёт сценарии, адаптированные под вашу нишу.",
    color: "from-primary to-[hsl(30,85%,55%)]",
  },
  {
    icon: Zap,
    title: "Мгновенные инсайты",
    desc: "Автоматические отчёты и рекомендации. Экономьте часы ручного анализа каждый день.",
    color: "from-[hsl(340,75%,55%)] to-[hsl(300,60%,50%)]",
  },
];

const stats = [
  { value: "10M+", label: "Видео проанализировано" },
  { value: "50K+", label: "Трендов обнаружено" },
  { value: "2 500+", label: "Активных пользователей" },
  { value: "98%", label: "Точность прогнозов" },
];

const testimonials = [
  {
    name: "Айдана К.",
    role: "SMM-менеджер",
    text: "За месяц охваты выросли в 4 раза. Тренды ловлю за 2 дня до массового хайпа.",
    avatar: "🇰🇿",
    rating: 5,
  },
  {
    name: "Дмитрий Р.",
    role: "Блогер, 500K подписчиков",
    text: "Генератор сценариев — это магия. Каждое второе видео по ним залетает в рекомендации.",
    avatar: "🎬",
    rating: 5,
  },
  {
    name: "Мадина Т.",
    role: "Владелец интернет-магазина",
    text: "Разведка конкурентов помогла найти формат, который принёс 200+ заказов с одного видео.",
    avatar: "🛍️",
    rating: 5,
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
  { num: "01", title: "Введите запрос", desc: "Ключевое слово, хештег или ссылку на аккаунт" },
  { num: "02", title: "Получите анализ", desc: "ИИ обработает данные и покажет инсайты за секунды" },
  { num: "03", title: "Действуйте", desc: "Используйте готовые сценарии и рекомендации" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Trend TikTok</span>
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
      <section className="pt-28 pb-16 md:pt-40 md:pb-28 px-4 relative">
        {/* Decorative blurs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            Платформа #1 для аналитики TikTok
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6">
            Ловите тренды
            <br />
            <span className="gradient-text">раньше всех</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Мониторинг трендов, анализ конкурентов и ИИ-генерация сценариев — всё, чтобы ваши видео залетали в рекомендации.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/auth">
              <Button className="gradient-hero text-primary-foreground border-0 glow-primary rounded-xl text-base font-bold px-8 h-13 min-h-[52px]">
                Попробовать бесплатно
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#how">
              <Button variant="outline" className="rounded-xl text-base font-semibold px-8 h-13 min-h-[52px] border-border/50 bg-card hover:bg-muted">
                <Play className="mr-2 h-4 w-4" />
                Как это работает
              </Button>
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold gradient-text">{s.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
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
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              Три шага к <span className="gradient-text">вирусному контенту</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {steps.map((step) => (
              <div key={step.num} className="text-center md:text-left">
                <div className="text-5xl md:text-6xl font-black gradient-text opacity-30 mb-3">{step.num}</div>
                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              Нам <span className="gradient-text">доверяют</span>
            </h2>
            <p className="text-muted-foreground text-lg">Реальные результаты наших пользователей</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-6 bg-card border border-border/50 card-shadow hover-lift transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[hsl(45,90%,55%)] text-[hsl(45,90%,55%)]" />
                  ))}
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
      <section id="pricing" className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              Выберите свой <span className="gradient-text">тариф</span>
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
                      <Check className="h-4 w-4 text-accent shrink-0" />
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

      {/* CTA */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl gradient-hero p-10 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-primary-foreground mb-4">
                Начните ловить тренды сегодня
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto">
                Присоединяйтесь к 2 500+ создателям контента, которые уже используют Trend TikTok
              </p>
              <Link to="/auth">
                <Button className="bg-white text-foreground hover:bg-white/90 rounded-xl text-base font-bold px-8 h-13 min-h-[52px] shadow-xl">
                  Создать аккаунт бесплатно
                  <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-hero flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">Trend TikTok</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 Trend TikTok. Все права защищены.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Политика конфиденциальности</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Условия использования</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
