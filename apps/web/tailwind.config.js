/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "var(--text-primary)",
        sidebar: "var(--sidebar-bg)",
        card: "var(--card-bg)",
        border: "var(--border)",
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        textMuted: "var(--text-muted)",
        accent: {
          DEFAULT: "var(--accent)",
          light: "var(--accent-light)",
          hover: "var(--accent-hover)",
        },
      },
      fontFamily: {
        sans: ['var(--font)', 'sans-serif'],
        mono: ['var(--mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
