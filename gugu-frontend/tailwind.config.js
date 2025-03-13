module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: '#004AAD',
          secondary: '#FFCC00',
          accent: '#F4F4F4',
          'text-dark': '#1a1a1a',
          'text-light': '#ffffff',
          'bg-light': '#f8f9fa'
        },
        fontFamily: {
          montserrat: ['Montserrat', 'sans-serif'],
          sans: ['Open Sans', 'sans-serif']
        },

      },
    },
    plugins: [],
  }