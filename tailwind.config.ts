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
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: { DEFAULT: '#0A1628', 2: '#1E3A5F', 3: '#152238', 4: '#0C1F3F' },
        brand: { gold: '#C9A84C', 'gold-light': '#F5EFD7', 'gold-dark': '#A88B3D', sky: '#3A8ED0', teal: '#0A8870' },
        sec: { grammar: '#3B82F6', reading: '#16A34A', writing: '#7C3AED', speaking: '#DC2626', listening: '#F59E0B' },
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
