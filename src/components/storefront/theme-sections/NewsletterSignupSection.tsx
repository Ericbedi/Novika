"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2, ShieldCheck } from "lucide-react";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { NewsletterSignupSettings } from "@/lib/theme-engine/schemas";
import { cn } from "@/lib/utils";

interface NewsletterSignupSectionProps {
  settings: NewsletterSignupSettings;
  palette: ThemeColorPalette;
  cardRadius?: BorderRadiusOption;
  buttonRadius?: BorderRadiusOption;
}

export function NewsletterSignupSection({
  settings,
  palette,
  cardRadius = "md",
  buttonRadius = "md",
}: NewsletterSignupSectionProps) {
  const [contact, setContact] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim() || !consentGiven) return;
    setSubscribed(true);
  };

  const radiusClass =
    cardRadius === "none"
      ? "rounded-none"
      : cardRadius === "sm"
      ? "rounded-xl"
      : cardRadius === "lg"
      ? "rounded-3xl"
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
      className={cn("p-8 sm:p-12 border shadow-2xs max-w-2xl mx-auto text-center space-y-6", radiusClass)}
      style={{
        backgroundColor: palette.cardBackground || palette.background,
        borderColor: palette.borderColor || "transparent",
      }}
    >
      <div className="space-y-2">
        <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
          {settings.title}
        </h2>
        {settings.subtitle && (
          <p className="text-xs sm:text-sm font-medium opacity-80 max-w-md mx-auto">
            {settings.subtitle}
          </p>
        )}
      </div>

      {subscribed ? (
        <div className="p-6 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-black">Bienvenue dans le club privilégié !</h3>
          <p className="text-xs text-emerald-700">
            Votre inscription a bien été enregistrée. Vous recevrez nos meilleures offres en avant-première.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Numéro WhatsApp ou Email"
              className="flex-1 px-4 py-3 rounded-xl border border-black/15 bg-white text-xs font-semibold focus:outline-hidden focus:border-black"
            />
            <button
              type="submit"
              disabled={!consentGiven}
              className={cn(
                "px-6 py-3 text-xs font-black transition-transform active:scale-95 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                btnRadiusClass
              )}
              style={{
                backgroundColor: palette.button,
                color: palette.buttonText,
              }}
            >
              {settings.buttonLabel || "S'inscrire"}
            </button>
          </div>

          <label className="flex items-start gap-2 text-left cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 rounded border-black/20 text-[#111111] focus:ring-0 cursor-pointer"
            />
            <span className="text-[10px] opacity-70 leading-snug">
              {settings.consentText ||
                "En vous inscrivant, vous acceptez de recevoir nos offres promotionnelles par message. Désinscription possible en un clic."}
            </span>
          </label>
        </form>
      )}
    </div>
  );
}
