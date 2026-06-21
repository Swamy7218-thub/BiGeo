import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: { 500: "#ff6600", 600: "#e05a00" },
        surface: "#0b0f1a",
        border: "#1f2737",
      },
    },
  },
  plugins: [],
};

export default config;
