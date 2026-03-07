import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp, Heart, Search, Play, Star, ChevronRight, ChevronLeft,
  Bell, Settings, User, Home, Bookmark, Eye, MessageCircle,
  Share2, Flame, Zap, Crown, Wrench, X, Trophy, Target,
  Video, Sparkles, BarChart3, ChevronUp, Music, ExternalLink,
} from "lucide-react";
import logoIcon from "@/assets/logo-icon-cropped.png";

/* ───────── Color data ───────── */
const COLORS = [
  { name: "Background", var: "--background", hsl: "0 0% 4%", hex: "#0a0a0a" },
  { name: "Foreground", var: "--foreground", hsl: "0 0% 95%", hex: "#f2f2f2" },
  { name: "Primary (Neon)", var: "--primary", hsl: "72 100% 50%", hex: "#c8ff00" },
  { name: "Secondary", var: "--secondary", hsl: "0 0% 12%", hex: "#1f1f1f" },
  { name: "Muted", var: "--muted", hsl: "0 0% 12%", hex: "#1f1f1f" },
  { name: "Muted FG", var: "--muted-foreground", hsl: "0 0% 55%", hex: "#8c8c8c" },
  { name: "Card", var: "--card", hsl: "0 0% 8%", hex: "#141414" },
  { name: "Destructive", var: "--destructive", hsl: "0 72% 55%", hex: "#e03838" },
  { name: "Border", var: "--border", hsl: "0 0% 16%", hex: "#292929" },
];

const NEON_SHADES = [
  { label: "100%", cls: "bg-primary" },
  { label: "80%", cls: "bg-primary/80" },
  { label: "60%", cls: "bg-primary/60" },
  { label: "40%", cls: "bg-primary/40" },
  { label: "20%", cls: "bg-primary/20" },
  { label: "10%", cls: "bg-primary/10" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-5 scroll-mt-20">
      <h2 className="text-lg font-bold text-foreground border-b border-border pb-2">{title}</h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">{children}</p>;
}

const TOC = [
  { id: "brand", label: "Brand" },
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "buttons", label: "Buttons" },
  { id: "badges", label: "Badges" },
  { id: "forms", label: "Forms" },
  { id: "cards", label: "Cards" },
  { id: "video-card", label: "Video Card" },
  { id: "navigation", label: "Navigation" },
  { id: "splash", label: "Splash Screen" },
  { id: "paywall", label: "Paywall" },
  { id: "glass", label: "Glassmorphism" },
  { id: "icons", label: "Icons" },
  { id: "spacing", label: "Spacing" },
  { id: "tokens", label: "CSS Tokens" },
];

export default function StyleGuide() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Header ─── */}
      <div
        className="sticky top-0 z-30 px-5 py-4 backdrop-blur-md border-b border-border"
        style={{ background: "rgba(10,10,10,0.9)" }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-black tracking-[0.2em] uppercase"
              style={{ color: "hsl(var(--neon))", textShadow: "0 0 20px hsl(var(--neon) / 0.4)" }}
            >
              trendme
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Mobile UI Kit · v1.0</p>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30">iOS & Android</Badge>
        </div>
      </div>

      {/* ─── TOC (horizontal scroll) ─── */}
      <div className="sticky top-[73px] z-20 border-b border-border" style={{ background: "rgba(10,10,10,0.85)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-5xl mx-auto flex gap-1 overflow-x-auto scrollbar-hide px-5 py-2">
          {TOC.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              {t.label}
            </a>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-5 space-y-14">

        {/* ═══════ 1. Brand ═══════ */}
        <Section id="brand" title="🎯 Brand Identity">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center gap-4">
                <img src={logoIcon} alt="trendme" className="h-20 w-20 rounded-2xl shadow-lg" />
                <h2
                  className="text-3xl font-black tracking-[0.25em] uppercase"
                  style={{ color: "hsl(var(--neon))", textShadow: "0 0 30px hsl(var(--neon) / 0.5)" }}
                >
                  trendme
                </h2>
                <p className="text-xs text-muted-foreground text-center">
                  Font: Inter Black · Tracking: 0.25em · Uppercase · Neon glow effect
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Design Principles</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>🌑 <strong className="text-foreground">Dark-first</strong> — Pure black (#0a0a0a)</p>
                <p>💚 <strong className="text-foreground">Neon accent</strong> — HSL(72, 100%, 50%)</p>
                <p>🪟 <strong className="text-foreground">Glassmorphism</strong> — backdrop-blur + rgba overlay</p>
                <p>✨ <strong className="text-foreground">Glow effects</strong> — text-shadow + box-shadow</p>
                <p>📱 <strong className="text-foreground">Mobile-first</strong> — safe-area aware, touch targets ≥44px</p>
                <p>🎭 <strong className="text-foreground">Immersive</strong> — Transparent status bar, edge-to-edge</p>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* ═══════ 2. Colors ═══════ */}
        <Section id="colors" title="🎨 Color Palette">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {COLORS.map((c) => (
              <div key={c.var} className="space-y-1.5">
                <div className="h-16 rounded-xl border border-border" style={{ background: `hsl(${c.hsl})` }} />
                <p className="text-xs font-medium text-foreground">{c.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{c.hex}</p>
              </div>
            ))}
          </div>

          <Label>Neon Scale</Label>
          <div className="flex gap-2">
            {NEON_SHADES.map((s) => (
              <div key={s.label} className="flex-1 space-y-1">
                <div className={`h-10 rounded-lg ${s.cls}`} />
                <p className="text-[10px] text-muted-foreground text-center">{s.label}</p>
              </div>
            ))}
          </div>

          <Label>Surface layers</Label>
          <div className="flex gap-2">
            {[
              { label: "BG #0a0a0a", cls: "bg-background" },
              { label: "Card #141414", cls: "bg-card" },
              { label: "Secondary #1f1f1f", cls: "bg-secondary" },
              { label: "white/5", cls: "bg-white/5" },
              { label: "white/10", cls: "bg-white/10" },
              { label: "white/20", cls: "bg-white/20" },
            ].map((s) => (
              <div key={s.label} className="flex-1 space-y-1">
                <div className={`h-10 rounded-lg ${s.cls} border border-border`} />
                <p className="text-[9px] text-muted-foreground text-center leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══════ 3. Typography ═══════ */}
        <Section id="typography" title="✏️ Typography">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Font: <strong className="text-foreground">Inter</strong> · Weights: 400, 500, 600, 700, 900</p>
            <Separator />
            <h1 className="text-4xl font-black text-foreground">H1 — 4xl / Black (900)</h1>
            <h2 className="text-2xl font-bold text-foreground">H2 — 2xl / Bold (700)</h2>
            <h3 className="text-xl font-bold text-foreground">H3 — xl / Bold (700)</h3>
            <h4 className="text-lg font-semibold text-foreground">H4 — lg / Semibold (600)</h4>
            <p className="text-base text-foreground">Body — base (16px) / Regular (400)</p>
            <p className="text-sm text-muted-foreground">Secondary — sm (14px) / Muted</p>
            <p className="text-xs text-muted-foreground">Caption — xs (12px) / Muted</p>
            <p className="text-[10px] text-muted-foreground">Micro — 10px / Stats, labels</p>
            <Separator />
            <p
              className="text-2xl font-black tracking-[0.2em] uppercase"
              style={{ color: "hsl(var(--neon))", textShadow: "0 0 20px hsl(var(--neon) / 0.4)" }}
            >
              neon glow text
            </p>
          </div>
        </Section>

        {/* ═══════ 4. Buttons ═══════ */}
        <Section id="buttons" title="🔘 Buttons">
          <Label>Shadcn Variants</Label>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>

          <Label>Sizes</Label>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon"><Heart className="h-4 w-4" /></Button>
          </div>

          <Label>Custom App Buttons</Label>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              className="px-5 py-2.5 rounded-full text-sm font-bold bg-primary text-primary-foreground active:scale-95 transition-transform"
              style={{ boxShadow: "0 0 25px hsl(var(--neon) / 0.4)" }}
            >
              ✨ Neon Glow CTA
            </button>
            <button className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/70 hover:bg-white/20 transition-all">
              Glass Chip
            </button>
            <button className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
              Active Chip
            </button>
            <button className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors active:scale-90">
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <button className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
              <X className="h-5 w-5 text-white/60" />
            </button>
          </div>

          <Label>Period Filter Chips</Label>
          <div className="flex gap-2">
            {[{ l: "3 дня", active: false }, { l: "7 дней", active: true }, { l: "30 дней", active: false }].map((p) => (
              <button
                key={p.l}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  p.active ? "bg-white/20 text-white" : "bg-white/5 text-white/40"
                }`}
              >
                {p.l}
              </button>
            ))}
          </div>
        </Section>

        {/* ═══════ 5. Badges ═══════ */}
        <Section id="badges" title="🏷️ Badges & Tier Labels">
          <Label>Standard Badges</Label>
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge className="bg-primary/20 text-primary border-primary/30">Neon Soft</Badge>
            <Badge className="bg-white/10 text-white/70 border-white/20">Glass</Badge>
          </div>

          <Label>Video Tier Badges</Label>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/90 text-white">
              <Trophy className="h-2.5 w-2.5" /> Взлетает
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/80 text-white">
              <Zap className="h-2.5 w-2.5" /> В тренде
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent/80 text-white">
              <Target className="h-2.5 w-2.5" /> Набирает
            </span>
          </div>
        </Section>

        {/* ═══════ 6. Forms ═══════ */}
        <Section id="forms" title="📝 Form Elements">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Text Input</label>
                <Input placeholder="Placeholder text..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Search Input</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="Іздеу..." />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch />
                <span className="text-sm text-foreground">Toggle Switch</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════ 7. Cards ═══════ */}
        <Section id="cards" title="🃏 Cards">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
                <CardDescription>With description</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">bg: card (#141414) · border: border (#292929) · radius: 0.75rem</p>
              </CardContent>
            </Card>

            <div
              className="rounded-2xl p-4 border border-primary/20 space-y-3"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), transparent)" }}
            >
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-foreground">Accent Card</h3>
              </div>
              <p className="text-sm text-muted-foreground">Neon gradient border</p>
              <Badge className="bg-primary/20 text-primary border-primary/30">
                <Zap className="h-3 w-3 mr-1" /> Featured
              </Badge>
            </div>

            <div
              className="rounded-2xl p-4 border border-white/10"
              style={{ background: "rgba(10,10,10,0.4)", backdropFilter: "blur(12px)" }}
            >
              <Crown className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-bold text-foreground">Glass Card</h3>
              <p className="text-sm text-muted-foreground mt-1">Transparent with blur</p>
            </div>
          </div>
        </Section>

        {/* ═══════ 8. Video Card ═══════ */}
        <Section id="video-card" title="🎬 Video Card Component">
          <Label>Compact (Trend Row) · 44vw / max 200px</Label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[
              { title: "Тренд макияж 2025 💄", views: "1.2M", likes: "45K", tier: "strong" as const },
              { title: "Фитнес дома за 15 мин 🏋️", views: "380K", likes: "12K", tier: "mid" as const },
              { title: "Рецепт бешбармак 🍜", views: "85K", likes: "3.2K", tier: "micro" as const },
            ].map((v, i) => (
              <div key={i} className="shrink-0 rounded-2xl overflow-hidden border border-border" style={{ width: "170px", background: "#141414" }}>
                {/* Cover */}
                <div className="relative m-1.5">
                  <div className="aspect-[9/14] bg-white/5 rounded-xl flex items-center justify-center">
                    <Play className="h-8 w-8 text-white/20" />
                  </div>
                  {/* Tier badge */}
                  <div className="absolute top-1.5 left-1.5">
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      v.tier === "strong" ? "bg-amber-500/90 text-white" :
                      v.tier === "mid" ? "bg-primary/80 text-white" : "bg-accent/80 text-white"
                    }`}>
                      {v.tier === "strong" ? <Trophy className="h-2.5 w-2.5" /> :
                       v.tier === "mid" ? <Zap className="h-2.5 w-2.5" /> : <Target className="h-2.5 w-2.5" />}
                      {v.tier === "strong" ? "Взлетает" : v.tier === "mid" ? "В тренде" : "Набирает"}
                    </span>
                  </div>
                  {/* Time */}
                  <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white font-medium">
                    {i === 0 ? "2ч назад" : i === 1 ? "5д назад" : "12д назад"}
                  </div>
                </div>
                {/* Info */}
                <div className="p-2 pt-0.5 space-y-1">
                  <p className="text-[11px] font-medium text-foreground line-clamp-2 leading-tight">{v.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {v.views}</span>
                    <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" /> {v.likes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Label>Action Buttons (on card)</Label>
          <div className="flex gap-3 items-center">
            <button className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </button>
            <button className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
              <Heart className="h-4 w-4 text-red-400 fill-red-400" />
            </button>
            <button className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
              <ExternalLink className="h-4 w-4 text-white" />
            </button>
            <button className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
              <Search className="h-4 w-4 text-white" />
            </button>
          </div>
        </Section>

        {/* ═══════ 9. Navigation ═══════ */}
        <Section id="navigation" title="🧭 Navigation Patterns">
          <Label>Category Tabs (Trends)</Label>
          <div className="flex items-center gap-4">
            {["Для тебя", "Бизнес", "Развлечения"].map((cat, i) => (
              <button
                key={cat}
                className={`text-sm font-bold pb-0.5 border-b-2 transition-all ${
                  i === 0 ? "text-primary border-primary" : "text-white/70 border-transparent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Label>Section Header (Niche Row)</Label>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Красота 💄</h3>
            <button className="flex items-center gap-0.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              Все <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Label>Drill-down Header</Label>
          <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(10,10,10,0.85)" }}>
            <div className="flex items-center gap-3">
              <button className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <h1 className="text-lg font-bold text-white">💄 Красота</h1>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {["3 дня", "7 дней", "30 дней"].map((p, i) => (
                <button key={p} className={`px-2.5 py-1 rounded-full font-medium ${i === 1 ? "bg-white/20 text-white" : "bg-white/5 text-white/40"}`}>{p}</button>
              ))}
              <span className="text-white/40 ml-1">· 127 видео</span>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {["Все", "Макияж", "Уход", "Волосы"].map((s, i) => (
                <button key={s} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${i === 0 ? "bg-primary text-primary-foreground" : "bg-white/10 text-white/70"}`}>{s}</button>
              ))}
            </div>
          </div>

          <Label>Bottom Navigation</Label>
          <div
            className="flex items-center justify-around rounded-2xl py-3 px-4"
            style={{ background: "rgba(10,10,10,0.75)", backdropFilter: "blur(20px)" }}
          >
            {[
              { icon: Flame, label: "Тренды", active: true },
              { icon: Search, label: "Поиск" },
              { icon: Wrench, label: "Инструменты", hasChevron: true },
              { icon: Heart, label: "Избранное" },
            ].map(({ icon: Icon, label, active, hasChevron }) => (
              <div key={label} className="flex flex-col items-center gap-0.5 min-w-[56px]">
                <div className="relative">
                  <Icon className={`h-[22px] w-[22px] ${active ? "text-primary" : "text-white"}`} strokeWidth={active ? 2.2 : 1.8} />
                  {hasChevron && <ChevronUp className="absolute -top-1.5 -right-1.5 h-3 w-3 text-white/50" />}
                </div>
                <span className={`text-[10px] font-semibold ${active ? "text-primary" : "text-white"}`}>{label}</span>
              </div>
            ))}
          </div>

          <Label>Tools Popover Menu</Label>
          <div className="rounded-2xl shadow-2xl p-2 max-w-xs" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <div className="px-3 py-2 mb-1">
              <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">Инструменты</span>
            </div>
            {[
              { icon: Video, label: "Анализ видео" },
              { icon: Sparkles, label: "AI Сценарий", active: true },
              { icon: BarChart3, label: "Анализ аккаунта" },
            ].map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm ${active ? "text-primary font-semibold" : "text-foreground/80"}`}
                style={active ? { background: "hsl(var(--neon) / 0.1)" } : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══════ 10. Splash Screen ═══════ */}
        <Section id="splash" title="🚀 Splash Screen">
          <div className="rounded-2xl overflow-hidden border border-border mx-auto" style={{ maxWidth: 280 }}>
            <div className="aspect-[9/16] bg-background flex flex-col items-center justify-center">
              <img src={logoIcon} alt="trendme" className="h-16 w-16 rounded-2xl shadow-lg mb-4" />
              <h2 className="text-xl font-bold text-foreground tracking-tight">trendme</h2>
              <p className="text-[10px] text-muted-foreground mt-1">TikTok Official Partner</p>
              <div className="flex gap-1.5 mt-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">Duration: 2s · Fade-in logo → Fade-out transition</p>
        </Section>

        {/* ═══════ 11. Paywall ═══════ */}
        <Section id="paywall" title="💎 Paywall Screen">
          <div className="rounded-2xl overflow-hidden border border-border mx-auto relative" style={{ maxWidth: 320 }}>
            <div className="aspect-[9/16] flex flex-col justify-end p-5" style={{ background: "linear-gradient(145deg, #0a0a0a 0%, #0d1117 40%, #0a0a0a 100%)" }}>
              {/* Glow */}
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 blur-[60px]" style={{ background: "hsl(72 100% 50%)" }} />
              {/* Close */}
              <button className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                <X className="h-4 w-4 text-white/60" />
              </button>
              {/* Content */}
              <div className="relative z-10 space-y-4">
                <div className="flex justify-center">
                  <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--neon) / 0.2), hsl(var(--neon) / 0.05))" }}>
                    <Crown className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h2 className="text-xl font-black text-center text-white">Откройте полный доступ</h2>

                {/* Plans */}
                {[
                  { label: "3 месяца", price: "45,600₸", per: "15,200₸/мес", popular: true },
                  { label: "1 месяц", price: "17,900₸", per: "", popular: false },
                ].map((plan, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3 border transition-all ${plan.popular ? "border-primary/50 bg-primary/5" : "border-white/10 bg-white/5"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{plan.label}</p>
                        {plan.per && <p className="text-[10px] text-muted-foreground">{plan.per}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-white">{plan.price}</p>
                        {plan.popular && <Badge className="bg-primary/20 text-primary border-0 text-[9px]">-15%</Badge>}
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  className="w-full py-3 rounded-xl font-bold text-sm bg-primary text-primary-foreground active:scale-95 transition-transform"
                  style={{ boxShadow: "0 0 30px hsl(var(--neon) / 0.3)" }}
                >
                  Подписаться
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════ 12. Glassmorphism ═══════ */}
        <Section id="glass" title="🪟 Glassmorphism & Effects">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Light Glass", bg: "rgba(10,10,10,0.4)", desc: "Headers, overlays" },
              { label: "Dark Glass", bg: "rgba(10,10,10,0.85)", desc: "Sticky headers, drill-down" },
              { label: "Bottom Nav Glass", bg: "rgba(10,10,10,0.75)", desc: "Tab bar" },
            ].map((g) => (
              <div
                key={g.label}
                className="rounded-2xl p-4 border border-white/10"
                style={{ background: g.bg, backdropFilter: "blur(20px)" }}
              >
                <p className="text-sm font-medium text-foreground">{g.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{g.desc}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-2 font-mono">{g.bg}</p>
              </div>
            ))}
          </div>

          <Label>Neon Glow Effect</Label>
          <div
            className="rounded-2xl p-5 border border-primary/30 text-center"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.03))",
              boxShadow: "0 0 40px hsl(var(--neon) / 0.15)",
            }}
          >
            <p className="text-foreground font-bold">Neon Gradient + Box Shadow Glow</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">box-shadow: 0 0 40px hsl(--neon / 0.15)</p>
          </div>
        </Section>

        {/* ═══════ 13. Icons ═══════ */}
        <Section id="icons" title="🔣 Icons (Lucide React)">
          <div className="flex flex-wrap gap-3">
            {[
              { Icon: Flame, name: "Flame" }, { Icon: Search, name: "Search" },
              { Icon: Heart, name: "Heart" }, { Icon: Wrench, name: "Wrench" },
              { Icon: TrendingUp, name: "TrendingUp" }, { Icon: Play, name: "Play" },
              { Icon: Eye, name: "Eye" }, { Icon: MessageCircle, name: "MessageCircle" },
              { Icon: Share2, name: "Share2" }, { Icon: Star, name: "Star" },
              { Icon: Crown, name: "Crown" }, { Icon: Zap, name: "Zap" },
              { Icon: Trophy, name: "Trophy" }, { Icon: Target, name: "Target" },
              { Icon: Sparkles, name: "Sparkles" }, { Icon: Video, name: "Video" },
              { Icon: BarChart3, name: "BarChart3" }, { Icon: Music, name: "Music" },
              { Icon: ExternalLink, name: "ExternalLink" }, { Icon: Bell, name: "Bell" },
              { Icon: Settings, name: "Settings" }, { Icon: User, name: "User" },
              { Icon: Bookmark, name: "Bookmark" }, { Icon: ChevronRight, name: "ChevronRight" },
            ].map(({ Icon, name }) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <span className="text-[9px] text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══════ 14. Spacing ═══════ */}
        <Section id="spacing" title="📐 Spacing & Radius">
          <Label>Border Radius</Label>
          <div className="flex items-end gap-4">
            {["sm", "md", "lg", "xl", "2xl", "full"].map((r) => (
              <div key={r} className="flex flex-col items-center gap-1">
                <div className={`h-12 w-12 rounded-${r} bg-primary/20 border border-primary/40`} />
                <span className="text-[10px] text-muted-foreground">{r}</span>
              </div>
            ))}
          </div>

          <Label>Touch Targets</Label>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center border border-dashed border-white/20">
              <span className="text-[9px] text-muted-foreground">44px</span>
            </div>
            <div className="h-12 w-20 rounded-xl bg-white/10 flex items-center justify-center border border-dashed border-white/20">
              <span className="text-[9px] text-muted-foreground">48×80</span>
            </div>
            <p className="text-xs text-muted-foreground">Min touch target: 44×44px (Apple HIG)</p>
          </div>

          <Label>Safe Areas</Label>
          <div className="rounded-2xl border border-border p-4 space-y-2 text-xs text-muted-foreground font-mono">
            <p>padding-top: env(safe-area-inset-top) <span className="text-foreground">// Dynamic Island</span></p>
            <p>padding-bottom: env(safe-area-inset-bottom) <span className="text-foreground">// Home Indicator</span></p>
          </div>
        </Section>

        {/* ═══════ 15. CSS Tokens ═══════ */}
        <Section id="tokens" title="🔧 CSS Token Reference">
          <div className="rounded-xl bg-card border border-border p-4 overflow-x-auto">
            <pre className="text-[11px] text-muted-foreground font-mono whitespace-pre leading-6">{`/* ─── Core Tokens (index.css :root) ─── */
--background:         0 0% 4%         #0a0a0a
--foreground:         0 0% 95%        #f2f2f2
--primary / --neon:   72 100% 50%     #c8ff00
--primary-foreground: 0 0% 0%         #000000
--secondary:          0 0% 12%        #1f1f1f
--muted:              0 0% 12%        #1f1f1f
--muted-foreground:   0 0% 55%        #8c8c8c
--card:               0 0% 8%         #141414
--destructive:        0 72% 55%       #e03838
--border:             0 0% 16%        #292929
--radius:             0.75rem

/* ─── Glass Backgrounds ─── */
Header light:   rgba(10,10,10, 0.4)  + blur(12px)
Header dark:    rgba(10,10,10, 0.85) + blur(12px)
Bottom nav:     rgba(10,10,10, 0.75) + blur(20px)

/* ─── Glow Effects ─── */
Text glow:  text-shadow: 0 0 20px hsl(--neon / 0.4)
Box glow:   box-shadow: 0 0 30px hsl(--neon / 0.3)
Soft glow:  box-shadow: 0 0 40px hsl(--neon / 0.15)

/* ─── Font ─── */
Family: Inter, sans-serif
Weights: 400 (body), 500 (medium), 600 (semibold),
         700 (bold), 900 (black/logo)`}</pre>
          </div>
        </Section>

        <div className="text-center py-8 text-muted-foreground text-xs border-t border-border">
          trendme.kz · Mobile UI Kit v1.0 · iOS & Android
        </div>
      </div>
    </div>
  );
}
