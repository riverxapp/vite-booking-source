import tailwindcssAnimate from "tailwindcss-animate";
import defaultTheme from "tailwindcss/defaultTheme";

const hsl = (name) => `hsl(var(--${name}) / <alpha-value>)`;

/**
 * Tokens per DESIGN.md. Legacy names are remapped rather than renamed so shadcn
 * primitives pick the system up by cascade:
 *   radius  lg/xl/2xl → 0 (structure), md/sm → 4px (controls)
 *   shadow  sm/DEFAULT → none, md/lg/xl → the single modal shadow
 */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", ...defaultTheme.fontFamily.sans],
        mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
      },
      colors: {
        border: "var(--rule)",
        "rule-strong": "var(--rule-strong)",
        "rule-hard": "var(--rule-hard)",
        input: hsl("input"),
        ring: hsl("ring"),
        background: hsl("background"),
        foreground: hsl("foreground"),
        brand: { DEFAULT: hsl("brand"), soft: "var(--brand-soft)" },
        headline: hsl("headline"),
        warm: "var(--warm)",
        success: hsl("success"),
        primary: {
          DEFAULT: hsl("primary"),
          foreground: hsl("primary-foreground"),
          hover: hsl("primary-hover"),
          press: hsl("primary-press"),
        },
        secondary: { DEFAULT: hsl("secondary"), foreground: hsl("secondary-foreground") },
        muted: { DEFAULT: hsl("muted"), foreground: hsl("muted-foreground") },
        accent: { DEFAULT: hsl("accent"), foreground: hsl("accent-foreground") },
        popover: { DEFAULT: hsl("popover"), foreground: hsl("popover-foreground") },
        destructive: { DEFAULT: hsl("destructive"), foreground: hsl("destructive-foreground") },
        chart: { 1: hsl("chart-1") },
        card: { DEFAULT: hsl("card"), foreground: hsl("card-foreground") },
        sidebar: {
          DEFAULT: hsl("sidebar-background"),
          foreground: hsl("sidebar-foreground"),
          primary: hsl("sidebar-primary"),
          "primary-foreground": hsl("sidebar-primary-foreground"),
          accent: hsl("sidebar-accent"),
          "accent-foreground": hsl("sidebar-accent-foreground"),
          border: "var(--rule)",
          ring: hsl("sidebar-ring"),
        },
      },
      borderRadius: {
        "2xl": "0px",
        xl: "0px",
        lg: "0px",
        md: "4px",
        sm: "4px",
      },
      boxShadow: {
        sm: "none",
        DEFAULT: "none",
        md: "var(--shadow-modal)",
        lg: "var(--shadow-modal)",
        xl: "var(--shadow-modal)",
        modal: "var(--shadow-modal)",
      },
      transitionTimingFunction: { out: "cubic-bezier(0.22, 1, 0.36, 1)" },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
