import type { Config } from "tailwindcss";

export default {
    theme: {
        extend: {
        fontFamily: {
            sans: ["var(--font-inter)"],
            heading: ["var(--font-space-grotesk)"],
        },
        },
    },
} satisfies Config;