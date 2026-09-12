import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F7F6F3",
        panel: "#EFEDE9",
        ink: "#101012",
        silver: {
          light: "#E6E8EA",
          DEFAULT: "#B9BEC4",
          dim: "#8B8F95",
          dark: "#5B5E63",
        },
        line: "rgba(16,16,18,0.10)",
        lineStrong: "rgba(16,16,18,0.20)",
      },
      fontFamily: {
        display: ["var(--font-amiri)", "serif"],
        body: ["var(--font-plex-arabic)", "sans-serif"],
      },
      backgroundImage: {
        chrome:
          "linear-gradient(135deg, #F2F3F4 0%, #C7CBCF 35%, #8B8F95 60%, #D6D9DC 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
