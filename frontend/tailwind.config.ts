const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // <-- scanne les fichiers dans /app/
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // <-- si tu as un dossier /components/
    // "./pages/**/*.{js,ts,jsx,tsx,mdx}", // <-- si tu utilises encore le /pages/ Router
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
    },
  },
  plugins: [],
};

export default config;
