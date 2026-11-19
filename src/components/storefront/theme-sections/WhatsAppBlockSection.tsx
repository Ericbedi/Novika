"use client";

import React from "react";
import Link from "next/link";
import { MessageCircle, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { WhatsAppBlockSettings } from "@/lib/theme-engine/schemas";
import { buildStoreWhatsAppLink } from "@/lib/storefront-security";
import { cn } from "@/lib/utils";

interface WhatsAppBlockSectionProps {
  settings: WhatsAppBlockSettings;
  palette: ThemeColorPalette;
  cardRadius?: BorderRadiusOption;
  buttonRadius?: BorderRadiusOption;
}

export function WhatsAppBlockSection({
  settings,
  palette,
  cardRadius = "md",
  buttonRadius = "md",
}: WhatsAppBlockSectionProps) {
  const {
    title = "Besoin d'aide ou d'un conseil ?",
    subtitle,
    phoneNumber,
    defaultMessage,
    buttonLabel = "Discuter sur WhatsApp",
    openingHours = "Lun - Sam : 08h00 - 19h00",
  } = settings;

  if (!phoneNumber?.trim()) return null;

  const whatsappLink = buildStoreWhatsAppLink(phoneNumber, defaultMessage);

  const radiusClass =
    cardRadius === "none"
      ? "rounded-none"
      : cardRadius === "sm"
      ? "rounded-xl"
      : cardRadius === "lg"
      ? "rounded-3xl"
      : cardRadius === "full"
      ? "rounded-[32px]"
      : "rounded-2xl";

  const btnRadiusClass =
    buttonRadius === "none"
      ? "rounded-none"
      : buttonRadius === "sm"
      ? "rounded-lg"
      : buttonRadius === "lg"
      ? "rounded-2xl"
      : buttonRadius === "full"
      ? "rounded-full"
      : "rounded-xl";

  return (
    <div
      className={cn(
        "p-6 sm:p-8 border shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto transition-all",
        radiusClass
      )}
      style={{
        backgroundColor: palette.cardBackground || palette.background,
        color: palette.text,
        borderColor: palette.borderColor || "transparent",
      }}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
          <MessageCircle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs sm:text-sm font-medium opacity-80 max-w-lg leading-relaxed">
              {subtitle}
            </p>
          )}
          {openingHours && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold opacity-70 pt-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{openingHours}</span>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 w-full sm:w-auto">
        <Link
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs sm:text-sm font-black transition-all shadow-md hover:scale-105 active:scale-95 bg-emerald-600 text-white hover:bg-emerald-500",
            btnRadiusClass
          )}
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>{buttonLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
