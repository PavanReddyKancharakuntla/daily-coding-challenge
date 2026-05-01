/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular"],
        display: ["Space Grotesk", "sans-serif"],
      },
      colors: {
        indigo: {
          500: "#6366f1",
          600: "#4f46e5",
        },
        slate: {
          900: "#0f172a",
          950: "#020617",
        },
      },
    },
  },
  plugins: [],
}