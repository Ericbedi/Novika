"use client";

import React, { useState } from "react";
import { Sparkles, Store, Globe2, Layers, CheckCircle2, X, ArrowRight } from "lucide-react";
import { validateSubdomain } from "@/mock-data/storefront-data";

interface InitialSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: { name: string; country: string; category: string; subdomain: string }) => void;
  initialStoreName?: string;
  initialCountry?: string;
}

export function InitialSetupWizard({
  isOpen,
  onClose,
  onComplete,
  initialStoreName = "Lomé Glow Cosmétiques",
  initialCountry = "TG",
}: InitialSetupWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [storeName, setStoreName] = useState(initialStoreName);
  const [country, setCountry] = useState(initialCountry);
  const [category, setCategory] = useState("Beauté & Cosmétiques");
  const [subdomain, setSubdomain] = useState(
    initialStoreName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
  const [subdomainError, setSubdomainError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setStoreName(val);
    const derived = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSubdomain(derived);
    const check = validateSubdomain(derived);
    setSubdomainError(check.isValid ? null : check.error || null);
  };

  const handleSubdomainChange = (val: string) => {
    setSubdomain(val);
    const check = validateSubdomain(val);
    setSubdomainError(check.isValid ? null : check.error || null);
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateSubdomain(subdomain);
    if (!check.isValid) {
      setSubdomainError(check.error || "Sous-domaine invalide");
      return;
    }
    onComplete({ name: storeName, country, category, subdomain });
    onClose();
  };

  const categories = [
    { label: "Beauté & Cosmétiques", icon: "✨", desc: "Soins visage, cheveux, maquillage, parfums" },
    { label: "Santé, Bien-être & Compléments", icon: "🌿", desc: "Vitamines, café santé, tisanes, minceur" },
    { label: "Mode, Chaussures & Maroquinerie", icon: "👗", desc: "Vêtements, sacs, sneakers, accessoires" },
    { label: "Électronique & High-Tech", icon: "⚡", desc: "Gadgets utiles, écouteurs, montres connectées" },
    { label: "Maison, Cuisine & Décoration", icon: "🏡", desc: "Ustensiles malins, déco tendance, entretien" },
  ];

  const countries = [
    { code: "TG", name: "Togo (Lomé)", flag: "🇹🇬", currency: "XOF" },
    { code: "CI", name: "Côte d'Ivoire (Abidjan)", flag: "🇨🇮", currency: "XOF" },
    { code: "SN", name: "Sénégal (Dakar)", flag: "🇸🇳", currency: "XOF" },
    { code: "BJ", name: "Bénin (Cotonou)", flag: "🇧🇯", currency: "XOF" },
    { code: "CM", name: "Cameroun (Douala/Yaoundé)", flag: "🇨🇲", currency: "XAF" },
    { code: "BF", name: "Burkina Faso (Ouagadougou)", flag: "🇧🇫", currency: "XOF" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#FAF8F5] border border-black/10 shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Bouton Fermer */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-[#666660] hover:text-[#111111] hover:bg-black/5 transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        {/* En-tête Wizard */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#111111] text-[#FAF8F5] flex items-center justify-center font-bold shadow-sm">
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Assistant d'installation rapide
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
              Bienvenue sur AfriBuilder !
            </h2>
          </div>
        </div>

        {/* Étapes du Wizard */}
        <div className="mt-5 flex items-center justify-between gap-2 border-y border-black/[0.08] py-3 text-xs font-bold text-[#666660]">
          <span className={step >= 1 ? "text-[#111111] font-black" : ""}>1. Nom & Adresse</span>
          <span>→</span>
          <span className={step >= 2 ? "text-[#111111] font-black" : ""}>2. Pays d'opération</span>
          <span>→</span>
          <span className={step >= 3 ? "text-[#111111] font-black" : ""}>3. Catégorie</span>
        </div>

        <form onSubmit={handleFinish} className="mt-6 space-y-6">
          {/* Étape 1 : Nom et Sous-domaine */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-150">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#666660] block mb-1.5">
                  Quel est le nom de votre boutique ? *
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex : Lomé Glow Cosmétiques"
                  className="w-full px-4 py-3 rounded-xl border border-black/15 bg-white text-sm font-semibold text-[#111111] focus:outline-hidden focus:border-black shadow-2xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#666660] block mb-1.5">
                  Adresse web gratuite (sous-domaine AfriBuilder) *
                </label>
                <div className="flex items-center rounded-xl border border-black/15 bg-white px-3 py-2.5 focus-within:border-black shadow-2xs">
                  <span className="text-xs text-[#888880] select-none">https://</span>
                  <input
                    type="text"
                    required
                    value={subdomain}
                    onChange={(e) => handleSubdomainChange(e.target.value)}
                    placeholder="lome-glow"
                    className="flex-1 px-1 text-xs font-bold text-[#111111] focus:outline-hidden bg-transparent"
                  />
                  <span className="text-xs font-bold text-[#666660] select-none">.afribuilder.store</span>
                </div>
                {subdomainError ? (
                  <p className="text-[11px] font-bold text-rose-600 mt-1">{subdomainError}</p>
                ) : (
                  <p className="text-[11px] text-[#888880] mt-1">
                    Vous pourrez également connecter votre propre domaine .com ou .africa plus tard.
                  </p>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!storeName.trim() || Boolean(subdomainError)}
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <span>Continuer</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Étape 2 : Pays d'opération */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-150">
              <label className="text-xs font-bold uppercase tracking-wider text-[#666660] block">
                Dans quel pays opérez-vous principalement ? *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {countries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCountry(c.code)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      country === c.code
                        ? "border-[#111111] bg-white shadow-2xs font-black text-[#111111]"
                        : "border-black/[0.08] bg-[#FAF8F5] hover:bg-white text-[#444440]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{c.flag}</span>
                      <div>
                        <p className="text-xs font-bold text-[#111111]">{c.name}</p>
                        <p className="text-[10px] text-[#888880]">Devise : {c.currency}</p>
                      </div>
                    </div>
                    {country === c.code && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  </button>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-[#666660] hover:text-[#111111] cursor-pointer"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer"
                >
                  <span>Continuer</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 : Catégorie de produits */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-150">
              <label className="text-xs font-bold uppercase tracking-wider text-[#666660] block">
                Quelle est votre catégorie de produits principale ? *
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setCategory(cat.label)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      category === cat.label
                        ? "border-[#111111] bg-white shadow-2xs font-black text-[#111111]"
                        : "border-black/[0.08] bg-[#FAF8F5] hover:bg-white text-[#444440]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-[#111111]">{cat.label}</p>
                        <p className="text-[10px] text-[#888880]">{cat.desc}</p>
                      </div>
                    </div>
                    {category === cat.label && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-[#666660] hover:text-[#111111] cursor-pointer"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-md cursor-pointer"
                >
                  <span>Terminer et accéder à mon tableau de bord</span>
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
