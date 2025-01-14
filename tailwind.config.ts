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
            fontSize: {
                'scoreboard': '15rem',
                'scoreboard-xl': '30rem',
                'time': '10rem',
                'time-xl': '17rem'
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
