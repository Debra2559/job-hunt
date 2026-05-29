import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  // 生产环境保留所有章节/关卡用到的动态渐变与光晕色（chapters 数组里以字符串拼接给 cn() 用，
  // Tailwind 解析器有时会把这些当作未使用类剔除，导致发布后颜色变浅或消失）
  safelist: [
    { pattern: /^(from|via|to)-(emerald|teal|cyan|sky|blue|violet|purple|fuchsia|rose|pink|orange|amber)-(300|400|500|600)$/ },
    { pattern: /^bg-(emerald|teal|cyan|sky|blue|violet|purple|fuchsia|rose|pink|orange|amber)-(100|200|300|400|500)(\/\d{1,3})?$/ },
    { pattern: /^shadow-(emerald|teal|cyan|sky|blue|violet|purple|fuchsia|rose|pink|orange|amber)-(200|300|400)(\/\d{1,3})?$/ },
    { pattern: /^ring-(emerald|teal|cyan|sky|blue|violet|purple|fuchsia|rose|pink|orange|amber)-(200|300|400)$/ },
    { pattern: /^text-(emerald|teal|cyan|sky|blue|violet|purple|fuchsia|rose|pink|orange|amber)-(500|600|700|800)$/ },
    { pattern: /^border-(emerald|teal|cyan|sky|blue|violet|purple|fuchsia|rose|pink|orange|amber)-(200|300|400|500)(\/\d{1,3})?$/ },
    'bg-gradient-to-r', 'bg-gradient-to-br', 'bg-gradient-to-b', 'bg-gradient-to-tr',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        display: ['"Noto Sans SC"', '"PingFang SC"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.6' }],
        'base': ['1rem', { lineHeight: '1.75' }],
        'lg': ['1.125rem', { lineHeight: '1.7' }],
        'xl': ['1.25rem', { lineHeight: '1.6' }],
        '2xl': ['1.5rem', { lineHeight: '1.5' }],
        '3xl': ['1.875rem', { lineHeight: '1.4' }],
      },
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
        normal: '0.02em',
        wide: '0.04em',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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
        chat: {
          user: "hsl(var(--chat-bubble-user))",
          ai: "hsl(var(--chat-bubble-ai))",
        },
        quicktag: {
          DEFAULT: "hsl(var(--quick-tag-bg))",
          border: "hsl(var(--quick-tag-border))",
          hover: "hsl(var(--quick-tag-hover))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-10px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.9) translateY(10px)" },
          "50%": { transform: "scale(1.02) translateY(-2px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "bounce-dot": {
          "0%, 80%, 100%": { transform: "translateY(0)" },
          "40%": { transform: "translateY(-6px)" },
        },
        "mascot-walk": {
          "0%, 100%": { transform: "translateY(0) rotate(-4deg)" },
          "50%": { transform: "translateY(-3px) rotate(4deg)" },
        },
        "soundwave": {
          "0%, 100%": { height: "40%" },
          "50%": { height: "100%" },
        },
        "placeholder-scroll-up": {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "15%": { opacity: "1", transform: "translateY(0)" },
          "85%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-100%)" },
        },
        "claim-burst": {
          "0%": { opacity: "0", transform: "scale(0.6) translateY(0)" },
          "30%": { opacity: "1", transform: "scale(1.1) translateY(-4px)" },
          "100%": { opacity: "0", transform: "scale(1) translateY(-28px)" },
        },
        "ring-sweep": {
          from: { strokeDashoffset: "var(--ring-from, 100)" },
          to: { strokeDashoffset: "var(--ring-to, 0)" },
        },
        "progress-shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "pulse-soft": "pulse-soft 1.5s ease-in-out infinite",
        "pop-in": "pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "bounce-dot": "bounce-dot 1.2s infinite ease-in-out",
        "soundwave": "soundwave 0.6s ease-in-out infinite",
        "placeholder-scroll-up": "placeholder-scroll-up 8s ease-in-out",
        "claim-burst": "claim-burst 1s ease-out forwards",
        "progress-shimmer": "progress-shimmer 1.6s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
