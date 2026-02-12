import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#5b13ec",
        "background-light": "#f6f6f8",
        "background-dark": "#161022",
      },
      fontFamily: {
        display: ["var(--font-plus-jakarta)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-plus-jakarta)", "ui-sans-serif", "system-ui"],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;

