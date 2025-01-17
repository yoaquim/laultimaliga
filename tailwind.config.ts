import defaultTheme from 'tailwindcss/defaultTheme'
import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            screens: {
                '3xl': '2000px',
            },
            fontSize: {
                '2.5xl': '1.65rem',
                '3.5xl': '2rem',
                '4.5xl': '2.75rem',
                '10xl': '9rem',
                '11xl': '10rem',
                'scoreboard': '15rem',
                'scoreboard-xl': '20rem',
                'scoreboard-3xl': '45rem',
                'timer': '10rem',
                'timer-xl': '11.5rem',
                'timer-3xl': '22rem'
            },
            gridTemplateColumns: {
                '13': 'repeat(13, minmax(0, 1fr))',
            },
            borderWidth: {
                '0.5': '0.25px'
            },
            colors: {
                'lul-red': '#ff1654',
                'lul-blue': '#008fff',
                'lul-green': '#23c723',
                'lul-yellow': '#ffc400',
                'lul-orange': '#f9922d',
                'lul-muted-red': '#FF6666',
                'lul-muted-blue': '#6666FF',
                'lul-muted-green': '#66FF66',
                'lul-muted-yellow': '#FFFF66',
                'lul-muted-orange': '#FFB266',
                'lul-light-grey': '#afafaf',
                'lul-grey': '#404040',
                'lul-dark-grey': '#2a2a2a',
                'lul-black': '#1A1A1A',
            },
        },
        animation: {
            ...defaultTheme.animation,
            shimmer: 'shimmer 2s infinite',
        },
        keyframes: {
            ...defaultTheme.keyframes,
            shimmer: {
                '0%': {transform: 'translateX(-100%)'},
                '100%': {
                    transform: 'translateX(100%)',
                },
            },
        },
    },
    plugins: [require('@tailwindcss/forms')],
}
export default config
