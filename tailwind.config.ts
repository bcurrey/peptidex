import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        peptidex: {
          black: "#060807",
          charcoal: "#141916",
          green: "#9fd6a2",
        },
      },
      borderRadius: {
        glass: "26px",
      },
    },
  },
  plugins: [],
} satisfies Config;
