/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          500: "#3b5bdb",
          600: "#2f4bc0",
          700: "#26399e",
        },
        danger: "#dc2626",
        warn: "#d97706",
        safe: "#16a34a",
      },
    },
  },
  plugins: [],
};
