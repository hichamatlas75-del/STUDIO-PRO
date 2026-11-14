/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './index.html',
        './js/**/*.js'
    ],
    darkMode: 'class',
    theme: {
        extend: {
            screens: {
                xs: '480px',
            },
            colors: {
                idBg: '#18181b',
                idPanel: '#252528',
                idHeader: '#2e2e32',
                idBorder: '#3a3a3f',
                idInput: '#1c1c1f',
                idAccent: '#3b82f6',
                idBleed: '#ef4444',
                idMargin: '#ec4899',
                idFold: '#06b6d4',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
                serif: ['Playfair Display', 'serif'],
                cinzel: ['Cinzel', 'serif'],
                montserrat: ['Montserrat', 'sans-serif'],
                cormorant: ['Cormorant Garamond', 'serif'],
            }
        }
    },
    plugins: [],
};
