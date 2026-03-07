import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp, Heart, Search, Play, Star, ChevronRight,
  Bell, Settings, User, Home, Bookmark, Eye, MessageCircle,
  Share2, Flame, Zap, Crown,
} from "lucide-react";

const COLORS = [
  { name: "Background", var: "--background", class: "bg-background" },
  { name: "Foreground", var: "--foreground", class: "bg-foreground" },
  { name: "Primary (Neon)", var: "--primary", class: "bg-primary" },
  { name: "Secondary", var: "--secondary", class: "bg-secondary" },
  { name: "Muted", var: "--muted", class: "bg-muted" },
  { name: "Accent", var: "--accent", class: "bg-accent" },
  { name: "Card", var: "--card", class: "bg-card" },
  { name: "Destructive", var: "--destructive", class: "bg-destructive" },
  { name: "Border", var: "--border", class: "bg-border" },
];

const NEON_SHADES = [
  { label: "100%", cls: "bg-primary" },
  { label: "80%", cls: "bg-primary/80" },
  { label: "60%", cls: "bg-primary/60" },
  { label: "40%", cls: "bg-primary/40" },
  { label: "20%", cls: "bg-primary/20" },
  { label: "10%", cls: "bg-primary/10" },
  { label: "5%", cls: "bg-primary/5" },
];

const SURFACE_SHADES = [
  { label: "#0a0a0a", cls: "bg-background" },
  { label: "#141414", cls: "bg-card" },
  { label: "#1f1f1f", cls: "bg-secondary" },
  { label: "white/5", cls: "bg-white/5" },
  { label: "white/10", cls: "bg-white/10" },
  { label: "white/20", cls: "bg-white/20" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">{title}</h2>
      {children}
    </section>
  );
}

export default function StyleGuide() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-6 py-4 backdrop-blur-md border-b border-border"
        style={{ background: "rgba(10,10,10,0.85)" }}
      >
        <h1
          className="text-2xl font-black tracking-[0.2em] uppercase text-center"
          style={{ color: "hsl(var(--neon))", textShadow: "0 0 20px hsl(var(--neon) / 0.4)" }}
        >
          trendme · style guide
        </h1>
        <p className="text-center text-muted-foreground text-sm mt-1">
          Design System & UI Kit · v1.0
        </p>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-12">

        {/* ─── Brand Identity ─── */}
        <Section title="🎨 Brand Identity">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Logo</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <h2
                  className="text-3xl font-black tracking-[0.25em] uppercase"
                  style={{ color: "hsl(var(--neon))", textShadow: "0 0 30px hsl(var(--neon) / 0.5)" }}
                >
                  trendme
                </h2>
                <p className="text-xs text-muted-foreground">
                  Font: Inter Black · Tracking: 0.25em · Uppercase · Neon glow
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Theme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>🌑 <strong className="text-foreground">Dark-first</strong> — қара фон (#0a0a0a)</p>
                <p>💚 <strong className="text-foreground">Neon accent</strong> — HSL(72, 100%, 50%)</p>
                <p>🪟 <strong className="text-foreground">Glassmorphism</strong> — backdrop-blur + rgba</p>
                <p>✨ <strong className="text-foreground">Glow effects</strong> — text-shadow + box-shadow</p>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* ─── Color Palette ─── */}
        <Section title="🎨 Color Palette">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {COLORS.map((c) => (
              <div key={c.var} className="space-y-1.5">
                <div className={`h-16 rounded-xl ${c.class} border border-border`} />
                <p className="text-xs font-medium text-foreground">{c.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{c.var}</p>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-foreground mt-6">Neon Green Scale</h3>
          <div className="flex gap-2">
            {NEON_SHADES.map((s) => (
              <div key={s.label} className="flex-1 space-y-1">
                <div className={`h-10 rounded-lg ${s.cls}`} />
                <p className="text-[10px] text-muted-foreground text-center">{s.label}</p>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-foreground mt-4">Surface Scale</h3>
          <div className="flex gap-2">
            {SURFACE_SHADES.map((s) => (
              <div key={s.label} className="flex-1 space-y-1">
                <div className={`h-10 rounded-lg ${s.cls} border border-border`} />
                <p className="text-[10px] text-muted-foreground text-center">{s.label}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ─── Typography ─── */}
        <Section title="✏️ Typography">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Font Family</p>
              <p className="text-lg text-foreground">Inter — Sans-serif</p>
            </div>
            <Separator />
            <div className="space-y-3">
              <h1 className="text-4xl font-black text-foreground">Heading 1 — 4xl / Black</h1>
              <h2 className="text-2xl font-bold text-foreground">Heading 2 — 2xl / Bold</h2>
              <h3 className="text-xl font-bold text-foreground">Heading 3 — xl / Bold</h3>
              <h4 className="text-lg font-semibold text-foreground">Heading 4 — lg / Semibold</h4>
              <p className="text-base text-foreground">Body — base / Regular</p>
              <p className="text-sm text-muted-foreground">Secondary text — sm / Muted</p>
              <p className="text-xs text-muted-foreground">Caption — xs / Muted</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p
                className="text-2xl font-black tracking-[0.2em] uppercase"
                style={{ color: "hsl(var(--neon))", textShadow: "0 0 20px hsl(var(--neon) / 0.4)" }}
              >
                neon glow text
              </p>
              <p className="text-primary font-bold">Primary colored text</p>
              <p className="text-destructive font-medium">Destructive / Error text</p>
            </div>
          </div>
        </Section>

        {/* ─── Buttons ─── */}
        <Section title="🔘 Buttons">
          <div className="space-y-6">
            <div>
              <p className="text-xs text-muted-foreground mb-3">Variants</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-3">Sizes</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Heart className="h-4 w-4" /></Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-3">Custom Styles (used in app)</p>
              <div className="flex flex-wrap gap-3">
                <button
                  className="px-4 py-2 rounded-full text-sm font-bold bg-primary text-primary-foreground"
                  style={{ boxShadow: "0 0 20px hsl(var(--neon) / 0.4)" }}
                >
                  Neon Glow Button
                </button>
                <button className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/70 hover:bg-white/20 transition-all">
                  Glass Chip
                </button>
                <button className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                  Active Chip
                </button>
                <button className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <ChevronRight className="h-4 w-4 text-foreground" />
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── Badges ─── */}
        <Section title="🏷️ Badges">
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge className="bg-primary/20 text-primary border-primary/30">Neon Soft</Badge>
            <Badge className="bg-white/10 text-white/70 border-white/20">Glass</Badge>
          </div>
        </Section>

        {/* ─── Form Elements ─── */}
        <Section title="📝 Form Elements">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Input</label>
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
                <span className="text-sm text-foreground">Switch</span>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox />
                <span className="text-sm text-foreground">Checkbox</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Slider</label>
                <Slider defaultValue={[50]} max={100} step={1} />
              </div>
            </div>
          </div>
        </Section>

        {/* ─── Cards ─── */}
        <Section title="🃏 Cards">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
                <CardDescription>Card description text</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Card content area</p>
              </CardContent>
            </Card>

            <div className="rounded-2xl overflow-hidden border border-border" style={{ background: "#141414" }}>
              <div className="aspect-[9/14] bg-white/5 m-1.5 rounded-xl flex items-center justify-center">
                <Play className="h-8 w-8 text-white/20" />
              </div>
              <div className="p-3 space-y-1.5">
                <p className="text-xs font-medium text-foreground line-clamp-2">Video Card Title</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> 1.2M</span>
                  <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" /> 45K</span>
                  <span className="flex items-center gap-0.5"><MessageCircle className="h-3 w-3" /> 890</span>
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl p-4 border border-primary/20 space-y-3"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), transparent)" }}
            >
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-foreground">Trending Card</h3>
              </div>
              <p className="text-sm text-muted-foreground">Card with neon accent gradient</p>
              <Badge className="bg-primary/20 text-primary border-primary/30">
                <Zap className="h-3 w-3 mr-1" /> Hot
              </Badge>
            </div>
          </div>
        </Section>

        {/* ─── Navigation Patterns ─── */}
        <Section title="🧭 Navigation">
          <div className="space-y-6">
            {/* Category tabs */}
            <div>
              <p className="text-xs text-muted-foreground mb-3">Category Tabs (Trends page)</p>
              <div className="flex items-center gap-4">
                {["Для тебя", "Бизнес", "Развлечения"].map((cat, i) => (
                  <button
                    key={cat}
                    className={`text-sm font-bold pb-0.5 border-b-2 transition-all ${
                      i === 0
                        ? "text-primary border-primary"
                        : "text-white/70 border-transparent hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom nav */}
            <div>
              <p className="text-xs text-muted-foreground mb-3">Bottom Navigation (Mobile)</p>
              <div
                className="flex items-center justify-around rounded-2xl py-3 px-4 border border-border"
                style={{ background: "rgba(10,10,10,0.9)" }}
              >
                {[
                  { icon: Home, label: "Главная" },
                  { icon: TrendingUp, label: "Тренды", active: true },
                  { icon: Search, label: "Поиск" },
                  { icon: Bookmark, label: "Избранное" },
                  { icon: User, label: "Профиль" },
                ].map(({ icon: Icon, label, active }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-white/40"}`} />
                    <span className={`text-[10px] ${active ? "text-primary font-medium" : "text-white/40"}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section header */}
            <div>
              <p className="text-xs text-muted-foreground mb-3">Section Header (Niche row)</p>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Красота 💄</h3>
                <button className="flex items-center gap-0.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                  Все <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── Glassmorphism ─── */}
        <Section title="🪟 Glassmorphism & Effects">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className="rounded-2xl p-4 border border-white/10"
              style={{ background: "rgba(10,10,10,0.4)", backdropFilter: "blur(12px)" }}
            >
              <p className="text-sm font-medium text-foreground">Light Glass</p>
              <p className="text-xs text-muted-foreground mt-1">rgba(10,10,10,0.4) + blur(12px)</p>
            </div>
            <div
              className="rounded-2xl p-4 border border-white/10"
              style={{ background: "rgba(10,10,10,0.85)", backdropFilter: "blur(12px)" }}
            >
              <p className="text-sm font-medium text-foreground">Dark Glass</p>
              <p className="text-xs text-muted-foreground mt-1">rgba(10,10,10,0.85) + blur(12px)</p>
            </div>
            <div
              className="rounded-2xl p-4 border border-primary/30"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))",
                boxShadow: "0 0 30px hsl(var(--neon) / 0.15)",
              }}
            >
              <p className="text-sm font-medium text-foreground">Neon Glow</p>
              <p className="text-xs text-muted-foreground mt-1">primary gradient + box-shadow glow</p>
            </div>
          </div>
        </Section>

        {/* ─── Icons ─── */}
        <Section title="🔣 Icons (Lucide)">
          <div className="flex flex-wrap gap-4">
            {[
              TrendingUp, Heart, Search, Play, Star, Bell, Settings, User,
              Home, Bookmark, Eye, MessageCircle, Share2, Flame, Zap, Crown,
            ].map((Icon, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <span className="text-[9px] text-muted-foreground">{Icon.displayName || Icon.name}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ─── Spacing & Radius ─── */}
        <Section title="📐 Spacing & Border Radius">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Border Radius</p>
              <div className="flex items-end gap-4">
                {[
                  { label: "sm", cls: "rounded-sm", size: "h-12 w-12" },
                  { label: "md", cls: "rounded-md", size: "h-12 w-12" },
                  { label: "lg", cls: "rounded-lg", size: "h-12 w-12" },
                  { label: "xl", cls: "rounded-xl", size: "h-12 w-12" },
                  { label: "2xl", cls: "rounded-2xl", size: "h-12 w-12" },
                  { label: "full", cls: "rounded-full", size: "h-12 w-12" },
                ].map((r) => (
                  <div key={r.label} className="flex flex-col items-center gap-1">
                    <div className={`${r.size} ${r.cls} bg-primary/20 border border-primary/40`} />
                    <span className="text-[10px] text-muted-foreground">{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ─── Tabs Component ─── */}
        <Section title="📑 Tabs">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Overview tab content</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="analytics" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Analytics tab content</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Section>

        {/* ─── CSS Tokens Reference ─── */}
        <Section title="🔧 CSS Token Reference">
          <div className="rounded-xl bg-card border border-border p-4 overflow-x-auto">
            <pre className="text-xs text-muted-foreground font-mono whitespace-pre leading-6">{`/* Core tokens (index.css) */
--background:        0 0% 4%       /* #0a0a0a */
--foreground:        0 0% 95%      /* #f2f2f2 */
--primary (neon):    72 100% 50%   /* #c8ff00 */
--primary-foreground: 0 0% 0%     /* #000000 */
--secondary:         0 0% 12%     /* #1f1f1f */
--muted:             0 0% 12%     /* #1f1f1f */
--muted-foreground:  0 0% 55%     /* #8c8c8c */
--card:              0 0% 8%      /* #141414 */
--destructive:       0 72% 55%    /* #e03838 */
--border:            0 0% 16%     /* #292929 */
--radius:            0.75rem

/* Special */
--neon:              72 100% 50%
--neon-foreground:   0 0% 0%`}</pre>
          </div>
        </Section>

        <div className="text-center py-8 text-muted-foreground text-xs">
          trendme.kz · Design System v1.0
        </div>
      </div>
    </div>
  );
}
