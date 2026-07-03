import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        glass: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.14)",
          border: "rgba(255,255,255,0.18)",
        },
        accent: {
          DEFAULT: "#7c5cff",
          soft: "#a78bfa",
          green: "#34d399",
          red: "#fb7185",
          amber: "#fbbf24",
          blue: "#38bdf8",
        },
      },
      borderRadius: {
        xl2: "1.75rem",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        fadeup: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        floaty: "floaty 8s ease-in-out infinite",
        fadeup: "fadeup 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
