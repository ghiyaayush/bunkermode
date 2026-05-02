import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bunker: {
          bg: "#0A0E13",
          panel: "#11161D",
          border: "#1F2730",
          text: "#E5E9F0",
          muted: "#7A8392",
          accent: "#10B981",
          danger: "#EF4444",
          warn: "#F59E0B",
          critical: "#DC2626",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
