"use client";

import React, { useState, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { getCountriesInSameCurrencyZone, getCountryByCode, AfricanCountryConfig } from "@/config/countries";
import { cn } from "@/lib/utils";

interface StorefrontCountrySelectorProps {
  storeSlug: string;
  storeCurrency: string; // Ex : "XOF", "XAF", "GNF"
  defaultCountryCode?: string; // Ex : "TG", "CI"
  className?: string;
  onCountryChange?: (country: AfricanCountryConfig) => void;
}

export function StorefrontCountrySelector({
  storeSlug,
  storeCurrency = "XOF",
  defaultCountryCode = "TG",
  className = "",
  onCountryChange,
}: StorefrontCountrySelectorProps) {
  const eligibleCountries = getCountriesInSameCurrencyZone(storeCurrency);

  const [activeCode, setActiveCode] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`novika_dest_country_${storeSlug}`);
      if (saved && eligibleCountries.some((c) => c.code === saved)) {
        return saved;
      }
    }
    return defaultCountryCode;
  });

  const [isOpen, setIsOpen] = useState(false);

  const activeCountry = getCountryByCode(activeCode) || eligibleCountries[0];

  const handleSelect = (country: AfricanCountryConfig) => {
    setActiveCode(country.code);
    if (typeof window !== "undefined") {
      localStorage.setItem(`novika_dest_country_${storeSlug}`, country.code);
    }
    if (onCountryChange) {
      onCountryChange(country);
    }
    setIsOpen(false);
  };

  // Si la devise n'a qu'un seul pays éligible (ex: GNF pour la Guinée), pas besoin d'un menu déroulant complexe
  if (eligibleCountries.length <= 1) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold text-[#666660]", className)}>
        <span className="text-sm">🇬🇳</span>
        <span>Guinée ({storeCurrency})</span>
      </div>
    );
  }

  // Drapeaux basés sur le code pays
  const getFlagEmoji = (code: string) => {
    const flags: Record<string, string> = {
      TG: "🇹🇬",
      CI: "🇨🇮",
      BJ: "🇧🇯",
      SN: "🇸🇳",
      BF: "🇧🇫",
      ML: "🇲🇱",
      NE: "🇳🇪",
      GW: "🇬🇼",
      CM: "🇨🇲",
      GA: "🇬🇦",
      CG: "🇨🇬",
      TD: "🇹🇩",
      CF: "🇨🇫",
      GQ: "🇬🇶",
      GN: "🇬🇳",
    };
    return flags[code] || "🌍";
  };

  return (
    <div className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        id="country-selector-btn"
        data-testid="country-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl border border-black/10 bg-white hover:border-black/25 text-xs font-bold text-[#111111] transition-colors shadow-2xs cursor-pointer shrink-0"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-sm">{getFlagEmoji(activeCountry.code)}</span>
        <span className="hidden sm:inline">{activeCountry.name}</span>
        <span className="text-[10px] text-[#888880] font-semibold">({storeCurrency})</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#888880]" />
      </button>

      {isOpen && (
        <div
          id="country-selector-dropdown"
          data-testid="country-selector-dropdown"
          className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mb-1 sm:mb-0 sm:mt-1.5 w-64 rounded-2xl bg-white border border-black/10 shadow-xl p-2 z-50 space-y-1"
          role="listbox"
        >
          <div className="px-2 py-1.5 border-b border-black/[0.06] mb-1">
            <span className="text-[10px] font-black uppercase text-[#888880] tracking-wider block">
              Zone monétaire {storeCurrency}
            </span>
            <p className="text-[10px] text-[#666660]">
              Paiement en espèces à la livraison disponible dans ces pays.
            </p>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {eligibleCountries.map((c) => {
              const isSelected = c.code === activeCountry.code;

              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer",
                    isSelected
                      ? "bg-[#111111] text-white"
                      : "text-[#333330] hover:bg-black/[0.04]"
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getFlagEmoji(c.code)}</span>
                    <span>{c.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
