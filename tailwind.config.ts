import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'od-black':    '#080808',
        'od-dark':     '#111111',
        'od-gray':     '#1A1A1A',
        'od-border':   '#2A2A2A',
        'od-muted':    '#666666',
        'od-silver':   '#9CA3AF',
        'od-gold':     '#C9A84C',
        'od-gold-lt':  '#E5C169',
        'od-gold-dk':  '#8B6914',
        'od-red':      '#CC0000',
        'od-red-lt':   '#FF2222',
      },
      fontFamily: {
        bebas:  ['var(--font-bebas)', 'Impact', 'Arial Narrow', 'sans-serif'],
        space:  ['var(--font-space)', 'system-ui', 'sans-serif'],
        mono:   ['var(--font-mono)', 'Courier New', 'monospace'],
      },
      animation: {
        'glitch':       'glitch 4s infinite',
        'glitch-2':     'glitch-2 4s infinite 0.05s',
        'scanline':     'scanline 6s linear infinite',
        'noise':        'noise 0.4s steps(1) infinite',
        'glow-gold':    'glow-gold 2.5s ease-in-out infinite',
        'glow-red':     'glow-red 2s ease-in-out infinite',
        'float':        'float 7s ease-in-out infinite',
        'ticker':       'ticker 30s linear infinite',
        'ticker-rev':   'ticker-rev 30s linear infinite',
        'pulse-slow':   'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':    'spin 20s linear infinite',
        'fade-in':      'fadeIn 1s ease forwards',
        'fade-up':      'fadeUp 0.8s ease forwards',
        'reveal-text':  'revealText 1s ease forwards',
      },
      keyframes: {
        glitch: {
          '0%,100%': { transform: 'translate(0)', filter: 'none' },
          '2%':      { transform: 'translate(-3px, 0)',  clipPath: 'inset(40% 0 61% 0)' },
          '4%':      { transform: 'translate(3px, 0)',   clipPath: 'inset(10% 0 80% 0)' },
          '6%':      { transform: 'translate(0)' },
          '62%':     { transform: 'translate(0)', filter: 'none' },
          '63%':     { transform: 'translate(2px, 0)',   filter: 'hue-rotate(90deg)' },
          '64%':     { transform: 'translate(-2px, 0)',  filter: 'hue-rotate(-90deg)' },
          '65%':     { transform: 'translate(0)', filter: 'none' },
        },
        'glitch-2': {
          '0%,100%': { transform: 'translate(0)', opacity: '0' },
          '2%':      { transform: 'translate(3px, 0)', clipPath: 'inset(61% 0 10% 0)', opacity: '0.8' },
          '4%':      { transform: 'translate(-3px, 0)', clipPath: 'inset(80% 0 2% 0)', opacity: '0.8' },
          '6%':      { transform: 'translate(0)', opacity: '0' },
          '62%':     { opacity: '0' },
          '63%':     { transform: 'translate(-2px, 0)', opacity: '0.6' },
          '64%':     { transform: 'translate(2px, 0)', opacity: '0.6' },
          '65%':     { transform: 'translate(0)', opacity: '0' },
        },
        scanline: {
          '0%':   { transform: 'translateY(-100vh)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        noise: {
          '0%,100%': { backgroundPosition: '0 0' },
          '10%':     { backgroundPosition: '-5% -10%' },
          '20%':     { backgroundPosition: '-15% 5%' },
          '30%':     { backgroundPosition: '7% -25%' },
          '40%':     { backgroundPosition: '20% 25%' },
          '50%':     { backgroundPosition: '-25% 10%' },
          '60%':     { backgroundPosition: '15% 5%' },
          '70%':     { backgroundPosition: '0 15%' },
          '80%':     { backgroundPosition: '25% 35%' },
          '90%':     { backgroundPosition: '-10% 10%' },
        },
        'glow-gold': {
          '0%,100%': { boxShadow: '0 0 20px rgba(201,168,76,0.2), 0 0 40px rgba(201,168,76,0.1)' },
          '50%':     { boxShadow: '0 0 40px rgba(201,168,76,0.5), 0 0 80px rgba(201,168,76,0.2)' },
        },
        'glow-red': {
          '0%,100%': { boxShadow: '0 0 15px rgba(204,0,0,0.2)' },
          '50%':     { boxShadow: '0 0 35px rgba(204,0,0,0.5)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-18px)' },
        },
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'ticker-rev': {
          '0%':   { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        revealText: {
          from: { clipPath: 'inset(0 100% 0 0)' },
          to:   { clipPath: 'inset(0 0% 0 0)' },
        },
      },
      backgroundImage: {
        'grid-pattern':   "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        'gold-gradient':  'linear-gradient(135deg, #C9A84C 0%, #E5C169 40%, #8B6914 70%, #C9A84C 100%)',
        'noise-texture':  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")",
      },
      backgroundSize: {
        'grid-md': '40px 40px',
        'grid-lg': '80px 80px',
        'noise':   '256px 256px',
      },
    },
  },
  plugins: [],
};

export default config;
