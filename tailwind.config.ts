import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // Emergency-specific colors
        emergency: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          glow: "hsl(346.8 77.2% 49.8%)",
        },
        safety: {
          safe: "hsl(142.1 76.2% 36.3%)",
          caution: "hsl(43.3 96.4% 56.3%)",
          danger: "hsl(346.8 77.2% 49.8%)",
          critical: "hsl(0 84.2% 60.2%)",
        },
        guardian: {
          online: "hsl(142.1 76.2% 36.3%)",
          offline: "hsl(215.4 16.3% 46.9%)",
          responding: "hsl(43.3 96.4% 56.3%)",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "pulse-ring": {
          "0%": {
            transform: "scale(0.8)",
            opacity: "1",
          },
          "80%, 100%": {
            transform: "scale(2.5)",
            opacity: "0",
          },
        },
        "heartbeat": {
          "0%, 100%": {
            transform: "scale(1)",
          },
          "50%": {
            transform: "scale(1.1)",
          },
        },
        "voice-pulse": {
          "0%": {
            opacity: "0.6",
            transform: "scale(0.95)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1.05)",
          },
        },
        "emergency-flash": {
          "0%, 100%": {
            backgroundColor: "hsl(346.8 77.2% 49.8%)",
          },
          "50%": {
            backgroundColor: "hsl(346.8 77.2% 39.8%)",
          },
        },
        "guardian-ping": {
          "0%": {
            boxShadow: "0 0 0 0 hsl(142.1 76.2% 36.3% / 0.7)",
          },
          "70%": {
            boxShadow: "0 0 0 10px hsl(142.1 76.2% 36.3% / 0)",
          },
          "100%": {
            boxShadow: "0 0 0 0 hsl(142.1 76.2% 36.3% / 0)",
          },
        },
        "loading-shimmer": {
          "0%": {
            backgroundPosition: "-200% 0",
          },
          "100%": {
            backgroundPosition: "200% 0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite",
        "heartbeat": "heartbeat 1.5s ease-in-out infinite",
        "voice-pulse": "voice-pulse 0.8s ease-in-out infinite alternate",
        "emergency-flash": "emergency-flash 1s ease-in-out infinite",
        "guardian-ping": "guardian-ping 2s infinite",
        "loading-shimmer": "loading-shimmer 1.5s infinite",
      },
      boxShadow: {
        "emergency": "0 0 20px hsl(346.8 77.2% 49.8%), 0 0 40px hsl(346.8 77.2% 49.8%), 0 0 80px hsl(346.8 77.2% 49.8%)",
        "safety-glow": "0 0 15px hsl(142.1 76.2% 36.3% / 0.3)",
        "warning-glow": "0 0 15px hsl(43.3 96.4% 56.3% / 0.3)",
      }
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
