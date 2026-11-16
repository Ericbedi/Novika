"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import {
  AfricanCountryConfig,
  getSortedAfricanCountries,
  getCountryByCode,
  searchAfricanCountries,
} from "@/config/countries";
import { CountryFlag } from "@/components/ui/country-flag";

interface SearchableCountrySelectProps {
  selectedCountryCode: string;
  onSelectCountry: (country: AfricanCountryConfig) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableCountrySelect({
  selectedCountryCode,
  onSelectCountry,
  id = "searchable-country-select",
  className = "",
  disabled = false,
}: SearchableCountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allCountries = getSortedAfricanCountries();
  const selectedCountry = getCountryByCode(selectedCountryCode) || allCountries[0];
  const filteredCountries = searchAfricanCountries(searchQuery, allCountries);

  // Focus automatique sur le champ de recherche à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Fermeture automatique au clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Fermeture avec la touche Échap
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Bouton déclencheur principal */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] hover:bg-white text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-black/[0.12]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 flex items-center">
            <CountryFlag code={selectedCountry.code} width={20} height={14} />
          </div>
          <span className="truncate font-bold text-[#111111]">{selectedCountry.name}</span>
          <span className="shrink-0 text-[11px] font-mono font-semibold text-[#666660]">
            {selectedCountry.dialCode}
          </span>
          <span className="shrink-0 px-1.5 py-0.2 rounded text-[10px] font-bold bg-black/[0.04] text-[#888880]">
            {selectedCountry.currency}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-[#888880] shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Menu déroulant avec barre de recherche intégrée */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[280px] max-w-full sm:max-w-md bg-white rounded-2xl border border-black/[0.1] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Barre de recherche avec loupe */}
          <div className="p-2.5 border-b border-black/[0.06] bg-[#FAF8F5]/80">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888880]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un pays (ex: Togo, Sénégal, Côte d'Ivoire...)"
                className="w-full h-9 pl-8 pr-7 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] placeholder:text-[#888880] focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-[#888880] hover:text-[#111111] hover:bg-black/[0.05]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-[#888880]">
              <span>54 pays d'Afrique</span>
              <span>{filteredCountries.length} résultat{filteredCountries.length > 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Liste déroulante des pays filtrés */}
          <div className="max-h-60 overflow-y-auto divide-y divide-black/[0.03] p-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => {
                const isSelected = country.code === selectedCountry.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      onSelectCountry(country);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-black/[0.06] font-bold text-[#111111]"
                        : "hover:bg-black/[0.03] text-[#333330]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0 flex items-center">
                        <CountryFlag code={country.code} width={20} height={14} />
                      </div>
                      <span className="truncate">{country.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-[#666660]">
                        {country.dialCode}
                      </span>
                      <span className="text-[10px] font-semibold text-[#888880] bg-black/[0.04] px-1.5 py-0.2 rounded">
                        {country.currency}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-[#888880]">
                Aucun pays trouvé pour « <span className="font-semibold text-[#111111]">{searchQuery}</span> »
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
