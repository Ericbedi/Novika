import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { brandConfig } from "@/config/brand";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${poppins.variable} font-sans h-full`}>
      <body className="min-h-full font-sans antialiased bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
