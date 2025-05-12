const plugin = require('tailwindcss/plugin');

module.exports = {
  mode: "jit",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",

    // Ensure wallet-adapter UI classes aren't purged
    "./node_modules/@solana/wallet-adapter-react-ui/**/*.js",
  ],
  safelist: [
    // Wallet Adapter classes that are injected at runtime
    'wallet-adapter-button',
    'wallet-adapter-button-start-icon',
    'wallet-adapter-dropdown',
    'wallet-adapter-dropdown-list',
    'wallet-adapter-dropdown-item',
    'wallet-adapter-dropdown-item-detail',
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        glass: "rgba(255, 255, 255, 0.05)",
        teal: { 400: "#00BFA6" },
        gray: { 900: "#111827", 800: "#1F2937", 300: "#D1D5DB" },
        slate: { 50: "#F5F7FA" },
      },
      borderRadius: {
        xl: "1.25rem",
      },
      boxShadow: {
        glass: "0 0 30px rgba(0, 0, 0, 0.6)",
      },
      backdropBlur: {
        xs: "10px",
        sm: "20px",
      },
      spacing: {
        6: "1.5rem",
      },
    },
  },
  plugins: [
    require('daisyui'),
    require('@tailwindcss/typography'),

    // Custom glassmorphic components
    plugin(function ({ addComponents, theme }) {
      addComponents({
        ".glass-card": {
          backgroundColor: theme("colors.glass"),
          border: `1px solid rgba(255,255,255,0.15)`,
          backdropFilter: `blur(${theme("backdropBlur.sm")})`,
          borderRadius: theme("borderRadius.xl"),
          padding: theme("spacing.6"),
          boxShadow: theme("boxShadow.glass"),
        },
        ".glass-btn": {
          backgroundColor: theme("colors.glass"),
          border: `1px solid rgba(255,255,255,0.1)`,
          backdropFilter: `blur(${theme("backdropBlur.xs")})`,
          borderRadius: theme("borderRadius.lg"),
          padding: `${theme("spacing.3")} ${theme("spacing.4")}`,
          fontWeight: theme("fontWeight.medium"),
          transition: `background-color ${theme("transitionDuration.200")} ease`,
        },
      });
    }),
  ],
  daisyui: {
    styled: true,
    themes: [
      {
        customglass: {
          fontFamily: {
            display: ["PT Mono, monospace"],
            body: ["Inter, sans-serif"],
          },
          primary: "#00BFA6",
          "primary-focus": "#009e8f",
          "primary-content": "#ffffff",

          secondary: "#6B7280",
          "secondary-focus": "#4B5563",
          "secondary-content": "#ffffff",

          accent: "#F5F7FA",
          "accent-focus": "#E5E7EB",
          "accent-content": "#111827",

          neutral: "#1F2937",
          "neutral-focus": "#111827",
          "neutral-content": "#D1D5DB",

          "base-100": "#0B0B0B",
          "base-200": "#111827",
          "base-300": "#1F2937",
          "base-content": "#D1D5DB",

          info: "#3ABFF8",
          success: "#00BFA6",
          warning: "#FACC15",
          error: "#F87171",
        },
      },
    ],
    base: true,
    utils: true,
    logs: true,
    rtl: false,
  },
};
