"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Truck, Phone, Mail, MapPin } from "lucide-react";
import { ThemeColorPalette } from "@/lib/theme-engine/types";
import { FooterSettings } from "@/lib/theme-engine/schemas";
import { cn } from "@/lib/utils";

interface FooterSectionProps {
  settings: FooterSettings;
  palette: ThemeColorPalette;
  storeName?: string;
}

export function FooterSection({
  settings,
  palette,
  storeName = "Kelio",
}: FooterSectionProps) {
  const {
    aboutText,
    links = [],
    showPaymentBadges = true,
    copyrightText,
  } = settings;

  const validLinks = links.filter((l) => l && l.label?.trim() && l.url?.trim());

  return (
    <footer
      className="border-t pt-12 pb-16 transition-colors"
      style={{
        backgroundColor: palette.background,
        color: palette.text,
        borderColor: palette.borderColor || "rgba(0,0,0,0.08)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Colonne 1 : À propos */}
          <div className="space-y-3">
            <h3 className="text-base font-black tracking-tight">{storeName}</h3>
            <p className="text-xs font-medium opacity-75 leading-relaxed">
              {aboutText ||
                `${storeName} est votre boutique en ligne de référence avec garantie exclusive de paiement en espèces à la livraison (COD).`}
            </p>
          </div>

          {/* Colonne 2 : Navigation */}
          {validLinks.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider opacity-60">Navigation</h4>
              <ul className="space-y-2 text-xs font-bold">
                {validLinks.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.url}
                      className="hover:underline opacity-80 hover:opacity-100 transition-opacity"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Colonne 3 : Sécurité & Paiement COD */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider opacity-60">
              Garantie & Règlements
            </h4>
            <div className="space-y-2 text-xs font-medium opacity-80">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Paiement à la livraison après inspection</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Colis garanti ou échangé sous 48h</span>
              </div>
            </div>

            {/* Badges de paiement acceptés en Afrique */}
            {showPaymentBadges && (
              <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-black">
                <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Espèces COD
                </span>
                <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 border border-blue-300">
                  Wave
                </span>
                <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                  Orange Money
                </span>
                <span className="px-2.5 py-1 rounded-md bg-yellow-100 text-yellow-900 border border-yellow-300">
                  MTN MoMo
                </span>
                <span className="px-2.5 py-1 rounded-md bg-teal-100 text-teal-900 border border-teal-300">
                  T-Money
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Ligne inférieure : Copyright et mentions */}
        <div className="pt-8 border-t border-black/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium opacity-60 text-center sm:text-left">
          <p>{copyrightText || `© ${new Date().getFullYear()} ${storeName}. Tous droits réservés.`}</p>
          <p className="text-[11px]">
            Propulsé par <span className="font-bold">Kelio</span> — E-commerce COD en Afrique
          </p>
        </div>
      </div>
    </footer>
  );
}
