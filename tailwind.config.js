/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./pages/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0d1117",
        bone: "#f2efe7",
        brass: "#b08a3e",
        garnet: "#7a0f26",
        sage: "#5d7b6f"
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Garamond", "Times New Roman", "serif"],
        mono: ["IBM Plex Mono", "Menlo", "Monaco", "monospace"],
        sans: ["Work Sans", "Verdana", "sans-serif"]
      },
      boxShadow: {
        "soft": "0 10px 30px rgba(0,0,0,0.12)"
      }
    }
  },
  plugins: []
};
