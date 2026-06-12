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
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glow 2s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%, 100%": { opacity: "0.4", filter: "drop-shadow(0 0 2px rgba(245, 158, 11, 0.5))" },
          "50%": { opacity: "1", filter: "drop-shadow(0 0 12px rgba(245, 158, 11, 0.95))" },
        },
      },
    },
  },
  plugins: [],
};
