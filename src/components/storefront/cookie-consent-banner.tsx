"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Cookie, Check, X } from "lucide-react";

interface CookieConsentBannerProps {
  storeSlug: string;
}

export function CookieConsentBanner({ storeSlug }: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("afribuilder_consent_choice");
      if (!stored) {
        // Afficher le bandeau si aucun choix n'a été fait
        setIsVisible(true);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("afribuilder_consent_choice", "accepted_all");
      window.localStorage.setItem("afribuilder_consent_marketing", "true");
      window.dispatchEvent(new Event("afribuilder:consent_updated"));
    }
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("afribuilder_consent_choice", "rejected_marketing");
      window.localStorage.setItem("afribuilder_consent_marketing", "false");
      window.dispatchEvent(new Event("afribuilder:consent_updated"));
    }
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("afribuilder_consent_choice", "custom");
      window.localStorage.setItem(
        "afribuilder_consent_marketing",
        marketingEnabled ? "true" : "false"
      );
      window.dispatchEvent(new Event("afribuilder:consent_updated"));
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      id="storefront-cookie-consent-banner"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-white/95 backdrop-blur-md border-t border-black/[0.1] shadow-2xl transition-all"
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 pr-4">
          <div className="flex items-center gap-2">
            <Cookie className="h-4 w-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-[#111111]">
              Respect de votre vie privée &amp; Cookies
            </h3>
          </div>
          <p className="text-[11px] text-[#666660] leading-relaxed">
            Nous utilisons des cookies indispensables au fonctionnement de la commande COD, et des outils de mesure
            d'audience et d'optimisation publicitaire (Meta Pixel / Conversions API) pour améliorer nos offres. Aucun pixel publicitaire n'est exécuté sans votre consentement préalable.
          </p>
          <div className="text-[10px] text-[#888880]">
            Consultez notre{" "}
            <Link
              href={`/boutique/${storeSlug}/pages/confidentialite`}
              className="underline text-[#111111] hover:text-black font-semibold"
            >
              Politique de Confidentialité
            </Link>{" "}
            pour en savoir plus sur l'usage des données anonymisées.
          </div>
        </div>

        {showPreferences ? (
          <div className="w-full md:w-auto p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.08] space-y-3">
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between gap-4 cursor-not-allowed opacity-80">
                <span className="font-semibold text-[#111111]">Cookies nécessaires (Panier, sécurité COD)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  Toujours actif
                </span>
              </label>
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <span className="font-semibold text-[#111111] block">Cookies Marketing (Meta Pixel & CAPI)</span>
                  <span className="text-[10px] text-[#666660]">Optimisation des campagnes et mesure des conversions</span>
                </div>
                <input
                  type="checkbox"
                  id="checkbox-consent-marketing"
                  checked={marketingEnabled}
                  onChange={(e) => setMarketingEnabled(e.target.checked)}
                  className="h-4 w-4 accent-[#111111] cursor-pointer"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.06]">
              <button
                type="button"
                id="btn-save-cookie-preferences"
                onClick={handleSavePreferences}
                className="px-3.5 py-1.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black cursor-pointer"
              >
                Enregistrer mes choix
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              id="btn-reject-cookies"
              onClick={handleRejectAll}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-black/[0.12] bg-[#FAF8F5] text-[#111111] text-xs font-bold hover:bg-white transition-all cursor-pointer"
            >
              Refuser tout
            </button>
            <button
              type="button"
              id="btn-customize-cookies"
              onClick={() => setShowPreferences(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-black/[0.08] text-[#666660] text-xs font-semibold hover:text-[#111111] transition-all cursor-pointer"
            >
              Personnaliser
            </button>
            <button
              type="button"
              id="btn-accept-all-cookies"
              onClick={handleAcceptAll}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer"
            >
              Tout accepter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
