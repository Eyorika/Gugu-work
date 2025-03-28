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
        'text-dark': '#0c0c0c',
        'text-light': '#ffffff',
        'bg-light': '#f8f9fa',
        ringWidth: ['focus'],
        ringColor: ['focus'],
        ringOpacity: ['focus']
      }
    }
  }
}