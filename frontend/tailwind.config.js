/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#14B8A6',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
