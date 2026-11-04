import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Applux brand system — sharp, enterprise-grade
        ink: {
          DEFAULT: "#0A0E1A",
          soft: "#3D4658",
          faint: "#8A93A6",
        },
        grid: "#E4E8EF",
        surface: "#F7F9FC",
        primary: {
          DEFAULT: "#0F62FE",
          dark: "#0043CE",
          soft: "#E8F0FF",
        },
        septo18: "#0F62FE",
        septo16: "#7C3AED",
        ok: "#0E9F6E",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        none: "0px",
        xs: "2px",
        sm: "3px",
      },
      borderWidth: {
        hairline: "1px",
      },
    },
  },
  plugins: [],
};
export default config;
