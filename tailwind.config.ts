import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        arena: {
          green: "#16a34a",
          amber: "#f59e0b",
          ink: "#111827",
          sand: "#f8fafc",
        },
      },
      boxShadow: {
        soft: "0 20px 60px -32px rgba(15, 23, 42, 0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
