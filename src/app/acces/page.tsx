"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Mail,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Check,
  Plus,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { normalizeEmail } from "@/lib/email-canonical";
import { getSortedAfricanCountries } from "@/config/countries";
import { CountryFlag } from "@/components/ui/country-flag";

const POPULAR_NICHES = [
  { id: "cosmetique", label: "Cosmétiques, Soins & Beauté", icon: "💄" },
  { id: "mode", label: "Mode, Vêtements & Chaussures", icon: "👗" },
  { id: "hightech", label: "Téléphones, High-Tech & Gadgets", icon: "📱" },
  { id: "maison", label: "Maison, Cuisine & Décoration", icon: "🍳" },
  { id: "sante", label: "Santé, Compléments & Minceur", icon: "🌿" },
  { id: "bijoux", label: "Bijoux, Montres & Lunettes", icon: "⌚" },
  { id: "bebe", label: "Bébé, Maternité & Enfants", icon: "👶" },
  { id: "auto", label: "Auto, Moto & Équipements", icon: "🚗" },
  { id: "fitness", label: "Fitness, Sport & Bien-être", icon: "🏋️" },
  { id: "bricolage", label: "Quincaillerie & Bricolage", icon: "🛠️" },
];

export default function AccessRequestPage() {
  const router = useRouter();
  const africanCountries = getSortedAfricanCountries();

  // Coordonnées de base
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("TG");
  const selectedCountry = africanCountries.find((c) => c.code === selectedCountryCode) || africanCountries[0];
  const [phonePrefix, setPhonePrefix] = useState(selectedCountry.dialCode);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Niches e-commerce multiples
  const [selectedNiches, setSelectedNiches] = useState<string[]>(["Cosmétiques, Soins & Beauté"]);
  const [customNiche, setCustomNiche] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [dailyOrders, setDailyOrders] = useState("10-50");

  // Création du mot de passe
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);

  // État de chargement et erreurs
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code);
    const c = africanCountries.find((item) => item.code === code);
    if (c) {
      setPhonePrefix(c.dialCode);
    }
  };

  const toggleNiche = (nicheLabel: string) => {
    setSelectedNiches((prev) => {
      if (prev.includes(nicheLabel)) {
        if (prev.length === 1) return prev; // Au moins une niche
        return prev.filter((n) => n !== nicheLabel);
      } else {
        return [...prev, nicheLabel];
      }
    });
  };

  const handleAddCustomNiche = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customNiche.trim();
    if (trimmed && !selectedNiches.includes(trimmed)) {
      setSelectedNiches((prev) => [...prev, trimmed]);
      setCustomNiche("");
      setShowCustomInput(false);
    }
  };

  // Calcul visuel de la force du mot de passe
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "Requis (min 10 caractères)", color: "bg-gray-200" };
    let score = 0;
    if (pwd.length >= 10) score += 1;
    if (pwd.length >= 14) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: "Trop court / Faible", color: "bg-red-500" };
    if (score === 2) return { score: 2, label: "Moyen", color: "bg-amber-500" };
    if (score === 3 || score === 4) return { score: 3, label: "Fort", color: "bg-emerald-500" };
    return { score: 4, label: "Très fort", color: "bg-emerald-600" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Validation de l'e-mail canonique
    const val = normalizeEmail(email);
    if (!val.isValid) {
      setFormError(val.error || "Adresse e-mail non valide.");
      return;
    }
    if (val.typoSuggestion) {
      setFormError(`Vouliez-vous dire ${val.typoSuggestion} ? Veuillez vérifier l'orthographe.`);
      return;
    }

    // 2. Validation du mot de passe créé
    if (password.length < 10) {
      setFormError("Votre mot de passe doit comporter au moins 10 caractères pour sécuriser votre boutique.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Les deux mots de passe ne correspondent pas. Veuillez vérifier votre saisie.");
      return;
    }

    // 3. Validation des niches
    if (selectedNiches.length === 0) {
      setFormError("Veuillez sélectionner au moins une niche e-commerce pour votre boutique.");
      return;
    }

    setIsSubmitting(true);

    try {
      const fullPhone = `${phonePrefix} ${phoneNumber}`.trim();
      const res = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: val.canonicalEmail,
          fullName: fullName.trim(),
          phone: fullPhone,
          country: selectedCountryCode,
          password: password,
          niches: selectedNiches,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || !data.success) {
        setFormError(data.error || "Une erreur est survenue lors de l'enregistrement.");
        return;
      }

      // Stocker le code de test en session pour assistance immédiate
      if (typeof window !== "undefined" && data.code) {
        sessionStorage.setItem("novika_dev_verification_code", data.code);
      }

      // Redirection immédiate vers la vérification d'e-mail
      router.push(`/auth/verifier-email?email=${encodeURIComponent(val.canonicalEmail)}`);
    } catch {
      setIsSubmitting(false);
      setFormError("Impossible de joindre le serveur d'authentification. Veuillez vérifier votre connexion.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111111] flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-[620px] w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#666660] hover:text-[#111111]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour à l'accueil</span>
          </Link>
          <Logo variant="full" tone="light" size={28} />
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.08] shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C2410C]/10 text-[#C2410C] border border-[#C2410C]/20">
              <Sparkles className="h-3 w-3" />
              <span>BÊTA PRIVÉE · ACCÈS AFRIQUE (54 PAYS)</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#111111] mb-2">
            Demander mon accès à Novika
          </h1>
          <p className="text-xs text-[#666660] mb-6 leading-relaxed">
            Créez votre compte, choisissez vos niches e-commerce et validez le code à 6 chiffres envoyé dans votre boîte e-mail pour accéder à votre espace vendeur.
          </p>

          {formError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Nom & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Nom complet ou entreprise *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex : Aminata Diallo / Glow Dakar"
                  className="w-full h-10 px-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-medium focus:bg-white focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Adresse e-mail professionnelle *
                </label>
                <input
                  type="email"
                  required
                  id="request-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@maboutique.com"
                  className="w-full h-10 px-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-medium focus:bg-white focus:outline-hidden focus:border-black"
                />
              </div>
            </div>

            {/* Pays (54 pays d'Afrique) & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1 flex items-center justify-between">
                  <span>Pays d'activité (54 pays) *</span>
                  <span className="text-[10px] text-[#C2410C] font-semibold">{selectedCountry.currency}</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCountryCode}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-medium focus:bg-white focus:outline-hidden focus:border-black appearance-none cursor-pointer"
                  >
                    {africanCountries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.dialCode} · {c.currency})
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <CountryFlag code={selectedCountryCode} width={18} height={12} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Numéro WhatsApp (Paiement COD) *
                </label>
                <div className="flex gap-1.5">
                  <span className="h-10 px-2.5 rounded-xl border border-black/[0.1] bg-black/[0.03] text-xs font-mono font-bold flex items-center text-[#111111]">
                    {phonePrefix}
                  </span>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9\s]/g, ""))}
                    placeholder="90 12 34 56"
                    className="flex-1 h-10 px-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-medium focus:bg-white focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>
            </div>

            {/* SÉLECTION MULTIPLE DES NICHES E-COMMERCE */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#111111]">
                  Niches e-commerce de votre boutique (Choix multiple) *
                </label>
                <span className="text-[11px] text-[#C2410C] font-semibold">
                  {selectedNiches.length} sélectionnée{selectedNiches.length > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-[11px] text-[#888880] mb-2.5">
                Sélectionnez toutes les catégories de produits que vous vendez ou prévoyez de vendre :
              </p>

              <div className="flex flex-wrap gap-1.5">
                {POPULAR_NICHES.map((niche) => {
                  const isSelected = selectedNiches.includes(niche.label);
                  return (
                    <button
                      key={niche.id}
                      type="button"
                      onClick={() => toggleNiche(niche.label)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#111111] text-[#FAF8F5] border-black shadow-2xs"
                          : "bg-[#FAF8F5] text-[#444440] border-black/[0.08] hover:border-black/[0.2] hover:bg-white"
                      }`}
                    >
                      <span>{niche.icon}</span>
                      <span>{niche.label}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400 ml-0.5" />}
                    </button>
                  );
                })}

                {/* Option Autre niche personnalisée */}
                {!showCustomInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-black/20 text-[#666660] hover:text-[#111111] hover:border-black/40 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Autre niche...</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={customNiche}
                      onChange={(e) => setCustomNiche(e.target.value)}
                      placeholder="Nom de la niche..."
                      className="h-8 px-2.5 text-xs rounded-lg border border-black/20 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomNiche}
                      className="h-8 px-2.5 bg-[#111111] text-white text-xs font-bold rounded-lg hover:bg-black cursor-pointer"
                    >
                      Ajouter
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Volume mensuel estimé */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Volume de commandes mensuelles estimé
              </label>
              <select
                value={dailyOrders}
                onChange={(e) => setDailyOrders(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-medium focus:bg-white focus:outline-hidden focus:border-black"
              >
                <option value="1-50">Démarrage : 1 à 50 commandes / mois</option>
                <option value="50-200">Croissance : 50 à 200 commandes / mois</option>
                <option value="200-1000">Établi : 200 à 1 000 commandes / mois</option>
                <option value="1000+">Grand compte : Plus de 1 000 commandes / mois</option>
              </select>
            </div>

            {/* CRÉATION DU MOT DE PASSE PAR L'UTILISATEUR */}
            <div className="pt-3 border-t border-black/[0.06] space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#111111]">
                <Lock className="h-4 w-4 text-[#C2410C]" />
                <span>Création de votre mot de passe personnel</span>
              </div>
              <p className="text-[11px] text-[#666660]">
                Vous définissez vous-même votre mot de passe. Aucun mot de passe par défaut n'est généré.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Mot de passe (10 car. min) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-10 pl-3 pr-10 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-medium focus:bg-white focus:outline-hidden focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888880] hover:text-[#111111]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Confirmez le mot de passe *
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-10 px-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-medium focus:bg-white focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              {/* Indicateur visuel de force */}
              {password && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#666660]">Force du mot de passe :</span>
                    <span className="font-bold text-[#111111]">{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/[0.06] rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 transition-all ${strength.score >= 1 ? strength.color : "bg-transparent"}`} />
                    <div className={`h-full flex-1 transition-all ${strength.score >= 2 ? strength.color : "bg-transparent"}`} />
                    <div className={`h-full flex-1 transition-all ${strength.score >= 3 ? strength.color : "bg-transparent"}`} />
                    <div className={`h-full flex-1 transition-all ${strength.score >= 4 ? strength.color : "bg-transparent"}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Conditions */}
            <div className="pt-2">
              <label className="flex items-start gap-2 cursor-pointer text-[11px] text-[#666660]">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="h-4 w-4 rounded border-black/[0.1] accent-[#111111] mt-0.5 cursor-pointer"
                />
                <span>
                  J'accepte les conditions d'accès Novika et certifie que je suis le propriétaire légitime de cette adresse e-mail.
                </span>
              </label>
            </div>

            <button
              type="submit"
              id="submit-access-request-btn"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-[#111111] text-[#FAF8F5] font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition-all shadow-sm cursor-pointer disabled:opacity-50 mt-4"
            >
              <span>{isSubmitting ? "Envoi du code..." : "Recevoir mon code de confirmation par e-mail"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <footer className="text-center py-4 text-[11px] text-[#888880]">
        Plateforme Novika · Paiement à la livraison pour les 54 pays d'Afrique
      </footer>
    </div>
  );
}
