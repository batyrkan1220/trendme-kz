import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TrendMeWordmark } from "@/components/TrendMeWordmark";
import { ArrowRight, Sparkles, Flame, TrendingUp, Heart, Check } from "lucide-react";

const SURFACES = [
  { name: "Background",        token: "--background",        cls: "bg-background",        hex: "#FFFFFF" },
  { name: "Background Subtle", token: "--background-subtle", cls: "bg-background-subtle", hex: "#FAFAFA" },
  { name: "Background Muted",  token: "--background-muted",  cls: "bg-background-muted",  hex: "#F4F4F5" },
  { name: "Card",              token: "--card",              cls: "bg-card",              hex: "#FFFFFF" },
  { name: "Muted",             token: "--muted",             cls: "bg-muted",             hex: "#F4F4F5" },
  { name: "Border",            token: "--border",            cls: "bg-border",            hex: "#E4E4E7" },
];

const BRAND = [
  { name: "Primary (Indigo)", token: "--primary",       cls: "bg-primary",       hex: "#5E6AD2", fg: "text-primary-foreground" },
  { name: "Primary Hover",    token: "--primary-hover", cls: "bg-primary-hover", hex: "#3F4EC5", fg: "text-white" },
  { name: "Primary Soft",     token: "--primary-soft",  cls: "bg-primary-soft",  hex: "#EEF0FE", fg: "text-primary" },
  { name: "Viral Lime",       token: "--viral",         cls: "bg-viral",         hex: "#C8F23A", fg: "text-viral-foreground" },
  { name: "Viral Soft",       token: "--viral-soft",    cls: "bg-viral-soft",    hex: "#F2FBDC", fg: "text-foreground" },
  { name: "Foreground",       token: "--foreground",    cls: "bg-foreground",    hex: "#09090B", fg: "text-background" },
];

const STATUS = [
  { name: "Success",     cls: "bg-success",          hex: "#16A34A" },
  { name: "Warning",     cls: "bg-warning",          hex: "#F59E0B" },
  { name: "Destructive", cls: "bg-destructive",      hex: "#DC2626" },
  { name: "Muted FG",    cls: "bg-muted-foreground", hex: "#71717A" },
];

function Section({ id, title, kicker, children }: { id: string; title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-6">
        {kicker && <span className="eyebrow mb-2 block">{kicker}</span>}
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, token, cls, hex, fg }: { name: string; token?: string; cls: string; hex: string; fg?: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-soft bg-card">
      <div className={`${cls} h-24 flex items-end p-3 ${fg ?? "text-foreground"}`}>
        <span className="text-xs font-semibold opacity-90">{hex}</span>
      </div>
      <div className="px-3 py-2.5 border-t border-border">
        <p className="text-sm font-semibold text-foreground leading-tight">{name}</p>
        {token && <code className="text-[11px] text-muted-foreground font-mono">{token}</code>}
      </div>
    </div>
  );
}

export default function StyleGuide() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 glass-strong border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendMeWordmark size="lg" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.14em] hidden sm:inline">
              Design System
            </span>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary-soft">
            v2.0 · Light Premium
          </Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-20">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <div className="absolute inset-0 gradient-mesh opacity-60 pointer-events-none" />
          <div className="relative px-8 md:px-14 py-14 md:py-20">
            <span className="eyebrow mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Design System
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
              <span className="gradient-text">Indigo × Viral Lime</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-8">
              Жарық премиум дизайн жүйесі. Stripe-style shadows, Linear-inspired tokens, TikTok viral lime accent.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="shadow-glow-primary">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline">View Tokens</Button>
            </div>
          </div>
        </section>

        <Section id="surfaces" kicker="Foundation" title="Surfaces">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {SURFACES.map((c) => <Swatch key={c.token} {...c} />)}
          </div>
        </Section>

        <Section id="brand" kicker="Color" title="Brand & Accents">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {BRAND.map((c) => <Swatch key={c.token} {...c} />)}
          </div>
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border overflow-hidden shadow-soft">
              <div className="h-32 gradient-brand" />
              <div className="p-4 bg-card">
                <p className="font-semibold">Gradient Brand</p>
                <code className="text-xs text-muted-foreground">--gradient-brand</code>
              </div>
            </div>
            <div className="rounded-2xl border border-border overflow-hidden shadow-soft">
              <div className="h-32 gradient-mesh" />
              <div className="p-4 bg-card">
                <p className="font-semibold">Gradient Mesh</p>
                <code className="text-xs text-muted-foreground">--gradient-mesh</code>
              </div>
            </div>
          </div>
        </Section>

        <Section id="status" kicker="Semantic" title="Status Colors">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATUS.map((c) => <Swatch key={c.name} {...c} />)}
          </div>
        </Section>

        <Section id="type" kicker="Typography" title="Type Scale">
          <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-soft">
            <div>
              <span className="text-[11px] text-muted-foreground font-mono">display-2xl</span>
              <p className="text-display-2xl">Trend faster.</p>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-mono">display-xl</span>
              <p className="text-display-xl">Виральные идеи за секунды</p>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-mono">display-lg</span>
              <p className="text-display-lg">Premium analytics platform</p>
            </div>
            <div className="border-t border-border pt-6 space-y-3">
              <div>
                <span className="text-[11px] text-muted-foreground font-mono">text-2xl · 24px</span>
                <p className="text-2xl font-semibold">Heading section</p>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground font-mono">text-base · Inter 16px</span>
                <p className="text-base">Основной текст. Inter с включёнными OpenType features cv11, ss01, ss03 и tracking -0.011em для премиум читаемости.</p>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground font-mono">text-sm · 14px (muted)</span>
                <p className="text-sm text-muted-foreground">Вторичный текст для подписей и подсказок.</p>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground font-mono">eyebrow · uppercase 12px</span>
                <p className="eyebrow">Trending now · Live</p>
              </div>
            </div>
          </div>
        </Section>

        <Section id="shadows" kicker="Depth" title="Premium Shadows">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "shadow-soft",         cls: "shadow-soft",         desc: "Тонкая подсветка" },
              { name: "shadow-card",         cls: "shadow-card",         desc: "Stripe-style карточка" },
              { name: "shadow-card-hover",   cls: "shadow-card hover-lift shadow-card-hover", desc: "При наведении" },
              { name: "shadow-glow-primary", cls: "shadow-glow-primary", desc: "Indigo свечение" },
            ].map((s) => (
              <div key={s.name} className={`rounded-2xl bg-card border border-border p-6 transition-all ${s.cls}`}>
                <p className="text-sm font-semibold mb-1">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="buttons" kicker="Components" title="Button Variants">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft space-y-8">
            <div>
              <p className="text-xs font-mono text-muted-foreground mb-3">variant</p>
              <div className="flex flex-wrap gap-3">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>
            <div>
              <p className="text-xs font-mono text-muted-foreground mb-3">size</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Heart className="h-4 w-4" /></Button>
              </div>
            </div>
            <div>
              <p className="text-xs font-mono text-muted-foreground mb-3">premium · branded</p>
              <div className="flex flex-wrap gap-3">
                <Button className="gradient-brand text-primary-foreground border-0 shadow-glow-primary">
                  <Sparkles className="mr-2 h-4 w-4" /> Gradient CTA
                </Button>
                <Button className="bg-viral text-viral-foreground hover:bg-viral/90 shadow-glow-viral">
                  <Flame className="mr-2 h-4 w-4" /> Viral
                </Button>
                <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary-soft">
                  <ArrowRight className="mr-2 h-4 w-4" /> Outline Brand
                </Button>
              </div>
            </div>
          </div>
        </Section>

        <Section id="badges" kicker="Components" title="Badges & Pills">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge className="bg-viral text-viral-foreground hover:bg-viral/90">
                <Flame className="mr-1 h-3 w-3" /> Viral
              </Badge>
              <Badge className="bg-primary-soft text-primary hover:bg-primary-soft/80">
                <TrendingUp className="mr-1 h-3 w-3" /> Trending
              </Badge>
              <Badge className="bg-success/15 text-success hover:bg-success/20">
                <Check className="mr-1 h-3 w-3" /> Live
              </Badge>
            </div>
          </div>
        </Section>

        <Section id="inputs" kicker="Components" title="Form Controls">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Email</label>
              <Input type="email" placeholder="you@trendme.kz" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Password</label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Disabled</label>
              <Input disabled placeholder="Disabled input" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">With error</label>
              <Input className="border-destructive focus-visible:ring-destructive" placeholder="Invalid value" />
              <p className="text-xs text-destructive">Это поле обязательно</p>
            </div>
          </div>
        </Section>

        <Section id="cards" kicker="Components" title="Cards">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="shadow-soft hover-lift shadow-card-hover">
              <CardHeader><CardTitle>Plain</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Basic card with soft shadow and hover lift.</p>
              </CardContent>
            </Card>
            <Card className="shadow-card border-primary/20 bg-primary-soft/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Highlighted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70">Indigo accent card for premium content.</p>
              </CardContent>
            </Card>
            <Card className="bg-foreground text-background border-foreground shadow-card">
              <CardHeader>
                <CardTitle className="text-background flex items-center gap-2">
                  <Flame className="h-4 w-4 text-viral" /> Dark CTA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-background/70">Inverted card for high-contrast call to action.</p>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section id="glass" kicker="Effects" title="Glass & Backdrop">
          <div className="relative h-64 rounded-3xl overflow-hidden gradient-mesh border border-border">
            <div className="absolute inset-0 flex items-center justify-center gap-4 p-8">
              <div className="glass rounded-2xl px-6 py-4">
                <p className="text-sm font-semibold">.glass</p>
                <p className="text-xs text-muted-foreground">backdrop-blur 20</p>
              </div>
              <div className="glass-strong rounded-2xl px-6 py-4 shadow-card">
                <p className="text-sm font-semibold">.glass-strong</p>
                <p className="text-xs text-muted-foreground">backdrop-blur 24</p>
              </div>
            </div>
          </div>
        </Section>

        <Section id="radius" kicker="Foundation" title="Radius">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "sm", cls: "rounded-sm" },
              { name: "md", cls: "rounded-md" },
              { name: "lg (--radius)", cls: "rounded-lg" },
              { name: "2xl", cls: "rounded-2xl" },
            ].map((r) => (
              <div key={r.name} className="text-center">
                <div className={`h-24 bg-primary-soft border border-primary/20 ${r.cls} mb-2`} />
                <p className="text-xs font-mono text-muted-foreground">{r.name}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="tokens" kicker="Reference" title="Token Cheatsheet">
          <div className="rounded-2xl border border-border bg-foreground text-background p-6 overflow-x-auto shadow-card">
            <pre className="text-[12px] font-mono whitespace-pre leading-6">{`/* ─── Surfaces ─── */
--background:          0 0% 100%        #FFFFFF
--background-subtle:   240 5% 98%       #FAFAFA
--background-muted:    240 5% 96%       #F4F4F5
--foreground:          240 10% 4%       #09090B
--card:                0 0% 100%        #FFFFFF
--border:              240 6% 90%       #E4E4E7
--muted-foreground:    240 4% 46%       #71717A

/* ─── Brand ─── */
--primary:             243 75% 59%      #5E6AD2  (Indigo)
--primary-hover:       243 70% 52%      #3F4EC5
--primary-soft:        243 85% 96%      #EEF0FE

/* ─── Viral accent ─── */
--viral:               75 95% 55%       #C8F23A  (Lime)
--viral-foreground:    240 10% 4%       #09090B
--viral-soft:          75 90% 94%       #F2FBDC

/* ─── Status ─── */
--success:             142 71% 45%      #16A34A
--warning:             38 92% 50%       #F59E0B
--destructive:         0 72% 51%        #DC2626

/* ─── Radius ─── */
--radius:              0.75rem          (12px)`}</pre>
          </div>
        </Section>

        <footer className="border-t border-border pt-8 pb-4 text-center space-y-3">
          <div className="flex justify-center">
            <TrendMeWordmark size="md" />
          </div>
          <p className="text-xs text-muted-foreground">
            Design System v2.0 · Light Premium · Indigo × Viral Lime
          </p>
        </footer>
      </main>
    </div>
  );
}
