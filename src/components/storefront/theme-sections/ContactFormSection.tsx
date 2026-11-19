"use client";

import React, { useState } from "react";
import { MessageSquare, Mail, Clock, Send, CheckCircle2 } from "lucide-react";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { ContactFormSettings } from "@/lib/theme-engine/schemas";
import { cn } from "@/lib/utils";

interface ContactFormSectionProps {
  settings: ContactFormSettings;
  palette: ThemeColorPalette;
  cardRadius?: BorderRadiusOption;
  buttonRadius?: BorderRadiusOption;
}

export function ContactFormSection({
  settings,
  palette,
  cardRadius = "md",
  buttonRadius = "md",
}: ContactFormSectionProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Redirection directe vers WhatsApp avec message pré-rempli
    if (settings.whatsappNumber) {
      const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, "");
      const fullText = `*Message de ${name || "Client"} (${phone || "Numéro non précisé"}) :*\n\n${message}`;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullText)}`, "_blank");
    }
    setSubmitted(true);
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
      className={cn("p-6 sm:p-10 border shadow-2xs max-w-3xl mx-auto space-y-8", radiusClass)}
      style={{
        backgroundColor: palette.cardBackground || palette.background,
        borderColor: palette.borderColor || "transparent",
      }}
    >
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
          {settings.title}
        </h2>
        {settings.subtitle && (
          <p className="text-xs sm:text-sm font-medium opacity-80 max-w-lg mx-auto">
            {settings.subtitle}
          </p>
        )}
      </div>

      {submitted ? (
        <div className="p-8 text-center space-y-3 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-black">Message transmis avec succès !</h3>
          <p className="text-xs text-emerald-700">
            Notre équipe vous recontactera dans les plus brefs délais.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70">
                Votre nom complet
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex : Aminata Touré"
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 bg-white text-xs font-semibold focus:outline-hidden focus:border-black"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70">
                Numéro WhatsApp
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex : +225 07 12 34 56 78"
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 bg-white text-xs font-semibold focus:outline-hidden focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70">
              Votre message ou question
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écrivez votre message ici..."
              className="w-full px-4 py-2.5 rounded-xl border border-black/15 bg-white text-xs font-semibold focus:outline-hidden focus:border-black"
            />
          </div>

          {settings.openingHours && (
            <div className="flex items-center gap-2 text-[11px] opacity-70">
              <Clock className="w-3.5 h-3.5" />
              <span>Horaires du support : {settings.openingHours}</span>
            </div>
          )}

          <button
            type="submit"
            className={cn(
              "w-full py-3.5 text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md cursor-pointer",
              btnRadiusClass
            )}
            style={{
              backgroundColor: palette.button,
              color: palette.buttonText,
            }}
          >
            <Send className="w-4 h-4" />
            <span>Envoyer le message</span>
          </button>
        </form>
      )}
    </div>
  );
}
