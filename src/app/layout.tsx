import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { brandConfig } from "@/config/brand";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

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
    <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable} font-sans h-full`} suppressHydrationWarning>
      <body className="min-h-full font-sans antialiased bg-[#F8F7F2] text-slate-900" suppressHydrationWarning>{children}</body>
    </html>
  );
}
