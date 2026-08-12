/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        discord: {
          bg: '#313338',
          sidebar: '#1e1f22',
          channels: '#2b2d31',
          hover: '#404249',
          active: '#404249',
          input: '#383a40',
          green: '#23a559',
          yellow: '#f0b132',
          red: '#f23f43',
          blurple: '#5865f2',
          text: '#f2f3f5',
          muted: '#949ba4',
          divider: '#3f4147'
        }
      }
    }
  },
  plugins: []
}
