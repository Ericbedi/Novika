"use client";

import React, { useState } from "react";
import {
  X,
  Store as StoreIcon,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Globe,
  Info,
  ArrowRight,
  ArrowLeft,
  Search,
  Check,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { ALL_CURRENCIES, AFRICAN_CURRENCIES } from "@/mock-data/currencies";
import { CountryFlag } from "@/components/ui/country-flag";
import {
  ALL_54_AFRICAN_COUNTRIES,
  getSortedAfricanCountries,
  searchAfricanCountries,
  getCountryByCode,
  AfricanCountryConfig,
} from "@/config/countries";

interface CreateStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStore: (newStore: {
    name: string;
    slug: string;
    country: string;
    currency: string;
    servedCountries?: string[];
    whatsapp?: string;
  }) => void;
}

export function CreateStoreModal({
  isOpen,
  onClose,
  onCreateStore,
}: CreateStoreModalProps) {
  // Assistant en 5 étapes
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Étape 1 : Pays principal
  const [selectedCountryCode, setSelectedCountryCode] = useState("TG");
  const [countrySearch, setCountrySearch] = useState("");

  // Étape 2 : Devise
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState("XOF");
  const [allowInternational, setAllowInternational] = useState(false);

  // Étape 3 : Pays desservis
  const [servedCountryCodes, setServedCountryCodes] = useState<string[]>(["TG"]);

  // Étape 4 : Coordonnées
  const [storeName, setStoreName] = useState("");
  const [whatsappLocal, setWhatsappLocal] = useState("");
  const [deliveryDelay, setDeliveryDelay] = useState("24h à 48h");

  const [error, setError] = useState<string | null>(null);

  // Vérification de la règle 1 compte = 1 seule boutique
  const [hasExistingStore, setHasExistingStore] = useState(false);
  const [existingStoreName, setExistingStoreName] = useState("");
  const [existingStoreSlug, setExistingStoreSlug] = useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const email = localStorage.getItem("novika_user_email") || "";
      if (email && email !== "admin@novika.com" && email !== "demo@novika.com") {
        const savedStores = localStorage.getItem(`novika_user_stores_${email}`);
        if (savedStores) {
          try {
            const list = JSON.parse(savedStores);
            if (Array.isArray(list) && list.length >= 1) {
              setHasExistingStore(true);
              setExistingStoreName(list[0].name);
              setExistingStoreSlug(list[0].slug);
            }
          } catch {}
        }
      }
    }
  }, []);

  if (!isOpen) return null;

  if (hasExistingStore) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      >
        <div className="relative w-full max-w-md rounded-3xl bg-[#FAF8F5] border border-black/10 p-6 shadow-2xl text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-800">
            <Lock className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#111111]">Limite de boutique atteinte</h3>
            <p className="text-xs text-[#666660] mt-1.5 leading-relaxed">
              Sur Kelio, un e-mail / compte marchand a le droit de créer <strong>une seule boutique unique</strong> dans une devise donnée.
            </p>
            <p className="text-xs text-[#111111] font-bold mt-2">
              Votre boutique active : {existingStoreName}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href={`/app/${existingStoreSlug}`}
              className="w-full py-2.5 rounded-xl bg-[#1F3A26] text-white text-xs font-bold shadow-xs hover:bg-[#162B1C] transition-colors"
            >
              Accéder à ma boutique
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 rounded-xl text-xs font-semibold text-[#666660] hover:bg-black/[0.04] cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCountry = getCountryByCode(selectedCountryCode) || ALL_54_AFRICAN_COUNTRIES[0];
  const currencyInfo = ALL_CURRENCIES.find((c) => c.code === selectedCurrencyCode) || ALL_CURRENCIES[0];

  // Pays partageant la même zone monétaire
  const sharedZoneCountries = ALL_54_AFRICAN_COUNTRIES.filter(
    (c) => c.currency === selectedCurrencyCode
  );

  const handleSelectCountry = (country: AfricanCountryConfig) => {
    if (!country.platformEligible) return; // Non encore ouvert
    setSelectedCountryCode(country.code);
    setSelectedCurrencyCode(country.currency);
    setServedCountryCodes([country.code]);
    setError(null);
  };

  const toggleServedCountry = (code: string) => {
    if (code === selectedCountryCode) return; // Le pays principal est toujours inclus
    const country = ALL_54_AFRICAN_COUNTRIES.find((c) => c.code === code);
    if (!country || country.currency !== selectedCurrencyCode) {
      setError(`Vous ne pouvez vendre que dans les pays utilisant la même devise (${selectedCurrencyCode}).`);
      return;
    }
    setServedCountryCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleNext = () => {
    setError(null);
    if (step === 4) {
      if (!storeName.trim()) {
        setError("Veuillez saisir le nom de votre boutique.");
        return;
      }
    }
    setStep((prev) => (Math.min(prev + 1, 5) as 1 | 2 | 3 | 4 | 5));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => (Math.max(prev - 1, 1) as 1 | 2 | 3 | 4 | 5));
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasExistingStore) {
      setError("Un compte marchand est limité à la création d'une seule boutique unique.");
      return;
    }
    if (!storeName.trim()) {
      setError("Le nom de la boutique est obligatoire.");
      return;
    }
    const slug = storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const fullWhatsapp = `${currentCountry.dialCode}${whatsappLocal.replace(/\D/g, "")}`;

    onCreateStore({
      name: storeName.trim(),
      slug: slug || "boutique-" + Date.now(),
      country: selectedCountryCode,
      currency: selectedCurrencyCode,
      servedCountries: servedCountryCodes,
      whatsapp: fullWhatsapp,
    });
    onClose();
  };

  // Filtrage des 54 pays par recherche alphabétique française (Prompt 05-P2)
  const allSortedCountries = getSortedAfricanCountries();
  const filteredCountries = searchAfricanCountries(countrySearch, allSortedCountries);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-store-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-[#FAF8F5] border border-black/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-black/[0.08] flex items-center justify-between bg-white/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#C2410C]/10 text-[#C2410C] flex items-center justify-center font-bold">
              <StoreIcon className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="create-store-title"
                className="text-base sm:text-lg font-black text-[#111111] tracking-tight leading-tight"
              >
                Créer une nouvelle boutique
              </h2>
              <p className="text-xs text-[#666660]">
                Étape {step} sur 5 · {step === 1 && "Pays principal"}
                {step === 2 && "Devise officielle ISO 4217"}
                {step === 3 && "Pays desservis (zone monétaire)"}
                {step === 4 && "Nom & WhatsApp commercial"}
                {step === 5 && "Récapitulatif & Validation"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 rounded-xl text-[#888880] hover:text-[#111111] hover:bg-black/[0.04] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barre de progression des 5 étapes */}
        <div className="w-full bg-black/[0.05] h-1.5 flex">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-full flex-1 transition-all duration-300 ${
                s <= step ? "bg-[#C2410C]" : "bg-transparent"
              }`}
            />
          ))}
        </div>

        {/* Corps de l'étape */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-700 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 1 : Pays principal d'opération (54 pays africains) */}
          {/* ======================================================== */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                  1. Choisissez le pays principal d'opération (54 pays africains)
                </label>
                <p className="text-xs text-[#666660]">
                  Ce pays déterminera la devise de référence, le format téléphonique et les règles fiscales.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
                <input
                  type="text"
                  placeholder="Rechercher par pays, code ou capitale..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-black/10 bg-white text-[#111111] placeholder:text-[#888880] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-1 border border-black/[0.08] rounded-2xl bg-white">
                {filteredCountries.map((c) => {
                  const isSelected = selectedCountryCode === c.code;
                  const isEligible = c.platformEligible;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      disabled={!isEligible}
                      onClick={() => handleSelectCountry(c)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? "border-[#C2410C] bg-[#C2410C]/5 text-[#C2410C] font-black shadow-2xs cursor-pointer"
                          : isEligible
                            ? "border-black/[0.06] hover:bg-black/[0.02] text-[#222220] cursor-pointer"
                            : "border-black/[0.04] bg-black/[0.02] text-[#888880] cursor-not-allowed opacity-60"
                      }`}
                    >
                      <CountryFlag code={c.code} width={24} height={16} />
                      <div className="truncate min-w-0 flex-1">
                        <span className="block truncate leading-tight">{c.name}</span>
                        <span className="text-[10px] text-[#666660] block font-mono">
                          {c.currency} {!isEligible && "· Bientôt disponible"}
                        </span>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-[#C2410C]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 2 : Devise officielle ISO 4217 */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                  2. Devise principale officielle (ISO 4217)
                </label>
                <p className="text-xs text-[#666660]">
                  Déterminée automatiquement à partir du pays sélectionné :{" "}
                  <strong>{currentCountry.name}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center font-black text-sm">
                      {currencyInfo.code}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#111111]">{currencyInfo.name}</h4>
                      <p className="text-xs text-[#666660]">Symbole officiel : {currencyInfo.symbol}</p>
                    </div>
                  </div>
                  <span className="text-base font-black text-[#C2410C]">{currencyInfo.symbol}</span>
                </div>

                <div className="pt-2 border-t border-black/[0.06] grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-black/[0.03]">
                    <span className="text-[10px] text-[#666660] block">Décimales comptables :</span>
                    <strong className="text-[#111111]">{currencyInfo.decimals}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-black/[0.03]">
                    <span className="text-[10px] text-[#666660] block">Plus petite unité :</span>
                    <strong className="text-[#111111]">{currencyInfo.smallestUnitName}</strong>
                  </div>
                </div>
              </div>

              {/* Avertissement de séparation stricte XOF vs XAF */}
              {(currencyInfo.code === "XOF" || currencyInfo.code === "XAF") && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong>Règle de séparation monétaire :</strong> Bien que nommés tous deux « Franc CFA », le Franc CFA UEMOA (XOF) et le Franc CFA CEMAC (XAF) sont deux devises distinctes non interchangeables. Chaque boutique est isolée dans sa zone d'émission.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 3 : Pays desservis (Zone monétaire partagée) */}
          {/* ======================================================== */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                  3. Pays desservis dans la même zone monétaire
                </label>
                <p className="text-xs text-[#666660]">
                  Les clients de ces pays pourront commander avec la devise{" "}
                  <strong>{currencyInfo.code}</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-2 rounded-xl bg-black/[0.03] text-xs font-bold text-[#666660] flex items-center justify-between">
                  <span>Zone {currencyInfo.code} ({sharedZoneCountries.length} pays éligibles)</span>
                  <span className="text-[11px] font-normal">
                    {servedCountryCodes.length} sélectionné(s)
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                  {sharedZoneCountries.map((c) => {
                    const isPrincipal = c.code === selectedCountryCode;
                    const isChecked = servedCountryCodes.includes(c.code);
                    return (
                      <label
                        key={c.code}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          isChecked
                            ? "bg-white border-[#C2410C]/40 shadow-2xs"
                            : "bg-white/60 border-black/[0.06] opacity-70"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            disabled={isPrincipal}
                            checked={isChecked}
                            onChange={() => toggleServedCountry(c.code)}
                            className="rounded text-[#C2410C] focus:ring-[#C2410C]"
                          />
                          <CountryFlag code={c.code} width={22} height={15} />
                          <span className="font-semibold text-[#111111]">{c.name}</span>
                          {isPrincipal && (
                            <span className="text-[10px] font-bold text-[#C2410C] bg-orange-100 px-1.5 py-0.2 rounded">
                              Pays principal
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-[#666660]">
                          {c.dialCode}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 4 : Nom de la boutique & WhatsApp commercial */}
          {/* ======================================================== */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                  Nom de la boutique <span className="text-[#C2410C]">*</span>
                </label>
                <input
                  type="text"
                  required
                  data-testid="new-store-name"
                  value={storeName}
                  onChange={(e) => {
                    setStoreName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Ex: Lomé Glow, Abidjan Élégance, Dakar Vital..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-black/10 bg-white text-[#111111] placeholder:text-[#888880] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                  Numéro WhatsApp commercial
                </label>
                <div className="flex gap-2">
                  <div className="w-24 px-3 py-2.5 rounded-xl border border-black/10 bg-[#FAF8F5] text-xs font-bold text-[#111111] flex items-center gap-1.5 shrink-0">
                    <CountryFlag code={currentCountry.code} width={20} height={14} />
                    <span>{currentCountry.dialCode}</span>
                  </div>
                  <input
                    type="tel"
                    value={whatsappLocal}
                    onChange={(e) => setWhatsappLocal(e.target.value)}
                    placeholder="Ex: 90 12 34 56"
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-black/10 bg-white text-[#111111] placeholder:text-[#888880] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                  Délai de livraison indicatif
                </label>
                <select
                  value={deliveryDelay}
                  onChange={(e) => setDeliveryDelay(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 bg-white text-[#111111] font-semibold focus:outline-none"
                >
                  <option value="24h à 48h">24h à 48h (Recommandé en ville)</option>
                  <option value="12h à 24h">Express (12h à 24h)</option>
                  <option value="3 à 5 jours">Interurbain / Régions (3 à 5 jours)</option>
                </select>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 5 : Récapitulatif, Règle Livraison Gratuite & Lock */}
          {/* ======================================================== */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
                  <span className="text-[#666660]">Nom de la boutique :</span>
                  <strong className="text-sm font-black text-[#111111]">{storeName}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#666660]">Pays principal :</span>
                  <div className="flex items-center gap-1.5 font-bold text-[#111111]">
                    <CountryFlag code={currentCountry.code} width={20} height={14} />
                    <span>{currentCountry.name}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#666660]">Devise officielle :</span>
                  <strong className="text-[#C2410C] font-mono font-black">
                    {currencyInfo.code} ({currencyInfo.symbol})
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#666660]">Zone monétaire desservie :</span>
                  <span className="font-semibold text-[#111111]">
                    {servedCountryCodes.length} pays ({servedCountryCodes.join(", ")})
                  </span>
                </div>
              </div>

              {/* Règle absolue de la plateforme : Livraison gratuite */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                <Truck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-emerald-900 block mb-0.5">
                    Règle AfriBuilder : Livraison 100% Gratuite pour vos clients
                  </strong>
                  <p className="text-[11px] leading-relaxed text-emerald-800">
                    Vos clients ne paient aucun frais d'expédition. Les coûts de vos livreurs et transporteurs sont gérés dans vos dépenses vendeur sans impacter le prix facturé au client.
                  </p>
                </div>
              </div>

              {/* Verrouillage irréversible de la devise */}
              <div className="p-3.5 rounded-2xl border border-black/10 bg-white flex items-start gap-2.5 text-xs">
                <Lock className="h-4 w-4 text-[#C2410C] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#555550] leading-relaxed">
                  <strong className="text-[#111111] block mb-0.5 font-bold">
                    Verrouillage comptable définitif après la 1ère commande
                  </strong>
                  Dès la première commande enregistrée, la devise {currencyInfo.code} sera définitivement verrouillée pour préserver l'intégrité de vos livres comptables.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pied de navigation */}
        <div className="px-6 py-3.5 border-t border-black/[0.08] flex items-center justify-between bg-white/70">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-black/10 text-xs font-bold text-[#666660] hover:bg-black/[0.04] transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Précédent</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-black/10 text-xs font-bold text-[#666660] hover:bg-black/[0.04] transition-colors cursor-pointer"
            >
              Annuler
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1F3A26] text-white text-xs font-bold hover:bg-[#162B1C] transition-all cursor-pointer shadow-xs"
            >
              <span>Suivant</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              data-testid="submit-create-store"
              onClick={handleFinalSubmit}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C2410C] text-white text-xs font-bold hover:bg-[#9A3412] transition-all shadow-md cursor-pointer"
            >
              <span>Confirmer et créer la boutique</span>
              <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
