/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1F2430",
        paper: "#FBFAF7",
        "marker-blue": "#2F6FEB",
        "marker-orange": "#F5843B",
        mint: "#2BB673",
        "soft-gray": "#E9E7E1",
        "alert-red": "#D64545",
      },
      fontFamily: {
        heading: ["Nunito", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        btn: "12px",
        card: "16px",
      },
    },
  },
  plugins: [],
};
