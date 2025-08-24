/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Named after your palette
        midnight: "#031C26",   // navbar background
        pine: "#2A7E6D",       // active underline / primary actions
        rosebrown: "#B18988",  // accent

        // Aliases to keep existing code working
        primary: "#2A7E6D",    // use as brand green
        accent2: "#031C26",    // deep ink text
        accent: "#B18988",

        // Optional neutrals you can use anywhere
        ink: "#031C26",
      },
    },
  },
  plugins: [],
};
