export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                ink: '#0f172a',
                canvas: '#f4f7fb',
                card: '#ffffff',
                accent: '#0f766e',
                accentSoft: '#dff7f1',
                gold: '#eab308',
                coral: '#fb7185',
                mist: '#e2e8f0'
            },
            fontFamily: {
                sans: ['Manrope', 'ui-sans-serif', 'system-ui'],
                display: ['Fraunces', 'serif'],
                script: ['Great Vibes', 'cursive']
            },
            boxShadow: {
                panel: '0 20px 45px rgba(15, 23, 42, 0.08)',
                soft: '0 10px 30px rgba(15, 118, 110, 0.10)'
            },
            animation: {
                floatIn: 'floatIn 0.6s ease-out both'
            },
            keyframes: {
                floatIn: {
                    '0%': { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                }
            }
        }
    },
    plugins: []
};
