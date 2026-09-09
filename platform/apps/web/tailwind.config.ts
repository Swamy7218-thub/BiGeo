import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        green: { 400: "#4ade80", 500: "#22c55e", dim: "#166534" },
        amber: { 400: "#fbbf24", 500: "#f59e0b" },
        surface: "#0d1f14",
        border: "#1a3322",
      },
    },
  },
  plugins: [],
};

export default config;
