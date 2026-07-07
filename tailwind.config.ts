import type { Config } from "tailwindcss";

export default {
    theme: {
        extend: {
            colors: {
                purple: {
                    50: '#F0FDF4',   // Very soft mint white
                    100: '#DCFCE7',  // Soft light green tint
                    200: '#BBF7D0',  // Muted light green
                    300: '#86EFAC',  // Warm mint green
                    400: '#4ADE80',  // Active brand green
                    500: '#22C55E',  // Primary green
                    600: '#16A34A',  // Rich brand green (optimal contrast for white text buttons)
                    700: '#15803D',  // Deep forest green
                    800: '#166534',  // Dark green accent
                    900: '#14532D',  // Deep pine green
                    950: '#052E16',  // Midnight forest green
                }
            },
            fontFamily: {
                sans: ["var(--font-inter)"],
                heading: ["var(--font-space-grotesk)"],
            },
        },
    },
} satisfies Config;