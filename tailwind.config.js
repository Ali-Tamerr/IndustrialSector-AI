/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-now)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      colors: {
        cyber: {
          bg: "#06080c",
          card: "#0c0f17",
          border: "#182030",
          accent: "#2563eb",
          "accent-glow": "rgba(37, 99, 235, 0.15)",
          green: "#10b981",
          yellow: "#f59e0b",
          red: "#ef4444",
          slate: "#94a3b8",
        },
      },
      animation: {
        "pulse-slow": "pulseSlow 15s ease-in-out infinite",
        "pulse-slow-alt": "pulseSlowAlt 20s ease-in-out infinite",
        "grid-move": "gridMove 25s linear infinite",
        "fadeIn": "fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "glow-pulse": "glow 2s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%, 100%": { opacity: "0.4", filter: "drop-shadow(0 0 2px rgba(245, 158, 11, 0.5))" },
          "50%": { opacity: "1", filter: "drop-shadow(0 0 12px rgba(245, 158, 11, 0.95))" },
        },
        pulseSlow: {
          "0%, 100%": { transform: "scale(1) translate(0px, 0px)", opacity: "0.3" },
          "50%": { transform: "scale(1.1) translate(20px, -20px)", opacity: "0.5" },
        },
        pulseSlowAlt: {
          "0%, 100%": { transform: "scale(1) translate(0px, 0px)", opacity: "0.3" },
          "50%": { transform: "scale(1.15) translate(-30px, 15px)", opacity: "0.55" },
        },
        gridMove: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "64px 64px" },
        },
        fadeIn: {
          "from": { opacity: "0", transform: "translateY(16px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
