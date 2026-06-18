import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary: #E36A6A (coral)
        "primary":                    "#E36A6A",
        "primary-container":          "#FFB2B2",
        "primary-fixed":              "#FFF2D0",
        "primary-fixed-dim":          "#FFB2B2",
        "on-primary":                 "#ffffff",
        "on-primary-container":       "#7A0000",
        "on-primary-fixed":           "#5C0000",
        "on-primary-fixed-variant":   "#B84545",
        "inverse-primary":            "#FFB2B2",
        // Secondary: #C45252 (deep coral)
        "secondary":                  "#C45252",
        "secondary-container":        "#FFD0D0",
        "secondary-fixed":            "#FFF2D0",
        "secondary-fixed-dim":        "#FFB2B2",
        "on-secondary":               "#ffffff",
        "on-secondary-container":     "#7A0000",
        "on-secondary-fixed":         "#5C0000",
        "on-secondary-fixed-variant": "#9E3838",
        // Tertiary: warm amber
        "tertiary":                   "#C8882A",
        "tertiary-container":         "#FFE0A0",
        "tertiary-fixed":             "#FFF5D5",
        "tertiary-fixed-dim":         "#FFE0A0",
        "on-tertiary":                "#ffffff",
        "on-tertiary-container":      "#5C3800",
        "on-tertiary-fixed":          "#3A2200",
        "on-tertiary-fixed-variant":  "#A06A20",
        // Surface & neutral — warm cream palette
        "surface":                    "#FFFBF1",
        "surface-dim":                "#F0E4D0",
        "surface-bright":             "#FFFBF1",
        "surface-container-lowest":   "#ffffff",
        "surface-container-low":      "#FFFBF1",
        "surface-container":          "#FFF5E4",
        "surface-container-high":     "#FFF2D0",
        "surface-container-highest":  "#FFE9B5",
        "surface-variant":            "#F5E4D8",
        "surface-tint":               "#E36A6A",
        "inverse-surface":            "#3D2020",
        "inverse-on-surface":         "#FFF2D0",
        "on-surface":                 "#2D1515",
        "on-surface-variant":         "#6B4545",
        "on-background":              "#2D1515",
        "background":                 "#FFFBF1",
        "outline":                    "#9E7070",
        "outline-variant":            "#E8D0C8",
        "error":                      "#ba1a1a",
        "error-container":            "#ffdad6",
        "on-error":                   "#ffffff",
        "on-error-container":         "#93000a",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body:     ["Inter", "sans-serif"],
        label:    ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
