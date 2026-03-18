/** @type {import('tailwindcss').Config} */
module.exports = {
  // Add the src folder to the content array!
  content: [
    './App.{js,ts,tsx}', 
    './components/**/*.{js,ts,tsx}',
    './src/**/*.{js,ts,tsx}' 
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};