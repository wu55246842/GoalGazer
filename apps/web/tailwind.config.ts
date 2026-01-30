import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                gemini: {
                    blue: '#4c8bf5',
                    purple: '#9d67e6',
                }
            },
            fontFamily: {
                serif: ['"Playfair Display"', 'Georgia', "serif"],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
};
export default config;
