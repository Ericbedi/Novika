import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display, Poppins, Montserrat, Plus_Jakarta_Sans } from "next/font/google";
import { brandConfig } from "@/config/brand";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap" });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], display: "swap" });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], display: "swap" });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${brandConfig.name} — Plateforme COD pour vendeurs africains`,
    template: `%s · ${brandConfig.name}`,
  },
  description: brandConfig.description,
  icons: {
    icon: brandConfig.paths.favicon,
    shortcut: brandConfig.paths.favicon,
    apple: brandConfig.paths.icon,
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: brandConfig.colors.navy900,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable} ${poppins.variable} ${montserrat.variable} ${jakarta.variable} font-sans h-full`} suppressHydrationWarning>
      <body className="min-h-full font-sans antialiased bg-[#F8F7F2] text-slate-900" suppressHydrationWarning>{children}</body>
    </html>
  );
}
