import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#06090e",
          table: "rgba(10, 16, 26, 0.8)",
          cyan: "#00f0ff",
          emerald: "#10b981",
          amber: "#f59e0b",
          ruby: "#ef4444",
          purple: "#a855f7",
          border: "rgba(0, 240, 255, 0.15)",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
