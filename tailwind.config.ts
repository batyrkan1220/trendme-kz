import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Tighter display sizes for hero
        "display-2xl": ["clamp(3rem, 6vw, 5rem)", { lineHeight: "1.02", letterSpacing: "-0.035em", fontWeight: "700" }],
        "display-xl":  ["clamp(2.5rem, 4.5vw, 3.75rem)", { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "700" }],
        "display-lg":  ["clamp(2rem, 3.5vw, 2.75rem)",  { lineHeight: "1.1",  letterSpacing: "-0.025em", fontWeight: "700" }],
      },
      colors: {
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        "background-subtle": "hsl(var(--background-subtle))",
        "background-muted":  "hsl(var(--background-muted))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover:   "hsl(var(--primary-hover))",
          soft:    "hsl(var(--primary-soft))",
          foreground: "hsl(var(--primary-foreground))",
        },
        viral: {
          DEFAULT: "hsl(var(--viral))",
          soft: "hsl(var(--viral-soft))",
          foreground: "hsl(var(--viral-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        // Alias for backward compatibility — legacy neon color now maps to "viral"
        neon: {
          DEFAULT: "hsl(var(--viral))",
          foreground: "hsl(var(--viral-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "calc(var(--radius) + 6px)",
      },
      backgroundImage: {
        "gradient-brand": "var(--gradient-brand)",
        "gradient-viral": "var(--gradient-viral)",
        "gradient-mesh":  "var(--gradient-mesh)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0", opacity: "0" }, to: { height: "var(--radix-accordion-content-height)", opacity: "1" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)", opacity: "1" }, to: { height: "0", opacity: "0" } },
        "fade-in":        { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-out":       { "0%": { opacity: "1", transform: "translateY(0)" },    "100%": { opacity: "0", transform: "translateY(10px)" } },
        "scale-in":       { "0%": { transform: "scale(0.95)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        "slide-in-right": { "0%": { transform: "translateX(100%)" }, "100%": { transform: "translateX(0)" } },
        "slide-in-left":  { from: { opacity: "0", transform: "translateX(-12px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        "bounce-soft":    { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-4px)" } },
        "shimmer":        { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "viral-pulse":    { "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--viral) / 0.55)" }, "50%": { boxShadow: "0 0 0 8px hsl(var(--viral) / 0)" } },
        "slide-in-from-right": { "0%": { opacity: "0", transform: "translateX(40px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        "slide-in-from-left":  { "0%": { opacity: "0", transform: "translateX(-40px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 0.4s ease-out",
        "fade-out":       "fade-out 0.3s ease-out",
        "scale-in":       "scale-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-left":  "slide-in-left 0.3s ease-out",
        "bounce-soft":    "bounce-soft 2s ease-in-out infinite",
        "shimmer":        "shimmer 2s linear infinite",
        "viral-pulse":    "viral-pulse 2s ease-in-out infinite",
        "enter":          "fade-in 0.3s ease-out, scale-in 0.2s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.25s ease-out",
        "slide-in-from-left":  "slide-in-from-left 0.25s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
