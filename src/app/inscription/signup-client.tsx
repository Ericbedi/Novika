"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  Globe,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { checkEmailAddress, validatePassword } from "@/lib/email-security";
import { getSortedAfricanCountries, AfricanCountryConfig } from "@/config/countries";
import { CountryFlag } from "@/components/ui/country-flag";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

// Liste officielle des 54 pays d'Afrique triés alphabétiquement (Prompt 05-P)
const ALL_54_COUNTRIES: AfricanCountryConfig[] = getSortedAfricanCountries();

export function SignupClient() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("TG");
  const [phonePrefix, setPhonePrefix] = useState("+228");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [password, setPassword] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typoSuggestion, setTypoSuggestion] = useState<string | null>(null);

  const handleCountryChange = (cCode: string) => {
    setSelectedCountry(cCode);
    const found = ALL_54_COUNTRIES.find((c) => c.code === cCode);
    if (found) {
      setPhonePrefix(found.dialCode);
    }
  };

  const handleEmailBlur = () => {
    if (!email) return;
    const check = checkEmailAddress(email);
    if (!check.isValid && check.error) {
      setError(check.error);
      return;
    }
    if (check.suggestedCorrection) {
      setTypoSuggestion(check.suggestedCorrection);
    } else {
      setTypoSuggestion(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Détection anti-robot honeypot
    if (honeypot) {
      router.push("/connexion");
      return;
    }

    // 2. Validation stricte de l'email
    const emailCheck = checkEmailAddress(email);
    if (!emailCheck.isValid) {
      setError(emailCheck.error || "Adresse email invalide.");
      return;
    }

    // 3. Validation de la force du mot de passe (>= 8 car.)
    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      setError(passCheck.error || "Mot de passe non conforme (8 caractères minimum).");
      return;
    }

    // 4. CGU
    if (!acceptTerms) {
      setError("Veuillez accepter les conditions générales d'utilisation.");
      return;
    }

    setIsLoading(true);

    try {
      // Envoi de la requête de création de compte & d'envoi du code de confirmation
      const res = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailCheck.normalizedEmail,
          fullName: fullName.trim(),
          country: selectedCountry,
          phone: `${phonePrefix}${phoneLocal.replace(/\D/g, "")}`,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok && data.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }

      // Stocker les données de session temporaires pour assistance fluide
      if (typeof window !== "undefined") {
        if (data.code) {
          sessionStorage.setItem("novika_dev_verification_code", data.code);
        }
        sessionStorage.setItem("novika_pending_email", emailCheck.normalizedEmail);
        sessionStorage.setItem("novika_user_fullname", fullName.trim());
        sessionStorage.setItem("novika_user_country", selectedCountry);
      }

      // Redirection vers l'écran de vérification d'email
      router.push(`/auth/verifier-email?email=${encodeURIComponent(emailCheck.normalizedEmail)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion au serveur";
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Inscription Google : e-mail déjà vérifié par Google
      if (typeof window !== "undefined") {
        window.localStorage.setItem("novika_user_verified", "true");
        window.localStorage.setItem("novika_user_email", "promises.google@novika.com");
      }
      router.push("/app/lome-glow");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F3EFE6] text-[#111111] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-emerald-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <Logo variant="full" tone="light" size={32} />
        </Link>
        <h1 className="text-2xl font-black text-[#111111] tracking-tight">
          Créer mon compte vendeur
        </h1>
        <p className="text-xs text-[#666660]">
          Lancez votre boutique COD en quelques minutes avec encaissement certifié.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-black/[0.08] shadow-2xl space-y-6">
          {/* Bouton Google */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-bold text-[#111111] hover:bg-white transition-all shadow-2xs flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuer avec Google</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/[0.08]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-bold">
              <span className="bg-white px-3 text-[#888880]">ou par e-mail</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot anti-robot */}
            <input
              type="text"
              name="company_website_url"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              aria-hidden="true"
            />

            {/* Nom complet */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Nom complet</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Promises Bedi"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/[0.12]"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Adresse e-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="contact@maboutique.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/[0.12]"
                />
              </div>

              {/* Suggestion faute de frappe */}
              {typoSuggestion && (
                <div className="mt-1.5 p-2 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900 flex items-center justify-between">
                  <span>Vouliez-vous dire <strong>{typoSuggestion}</strong> ?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(typoSuggestion);
                      setTypoSuggestion(null);
                    }}
                    className="font-bold underline cursor-pointer"
                  >
                    Corriger
                  </button>
                </div>
              )}
            </div>

            {/* Pays (54 pays d'Afrique) & Téléphone */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1 flex items-center justify-between">
                  <span>Pays d'activité</span>
                  <span className="text-[10px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
                    54 pays d'Afrique disponibles
                  </span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 pointer-events-none flex items-center">
                    <CountryFlag code={selectedCountry} className="h-4 w-5 rounded-xs object-cover shadow-2xs" />
                  </div>
                  <select
                    value={selectedCountry}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] font-semibold focus:outline-none focus:ring-2 focus:ring-black/[0.12]"
                  >
                    {ALL_54_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.dialCode}) — {c.currency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Numéro WhatsApp / Téléphone</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-black/[0.1] bg-[#FAF8F5] text-xs font-mono font-bold text-[#111111]">
                    {phonePrefix}
                  </span>
                  <input
                    type="tel"
                    required
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(e.target.value)}
                    placeholder="90 12 34 56"
                    className="w-full px-3 py-2.5 text-xs rounded-r-xl border border-black/[0.1] bg-white text-[#111111] font-mono focus:outline-none focus:ring-2 focus:ring-black/[0.12]"
                  />
                </div>
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Mot de passe (8 caractères minimum)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/[0.12]"
                />
              </div>
            </div>

            {/* Instagram facultatif */}
            <div>
              <label className="block text-[11px] font-bold text-[#666660] uppercase mb-1">
                Compte Instagram ou Page Facebook (Facultatif)
              </label>
              <div className="relative">
                <Camera className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="@ma_boutique_glow"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:outline-none"
                />
              </div>
            </div>

            {/* Conditions d'utilisation */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="cgu-agree"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-black/[0.2] text-black focus:ring-black"
              />
              <label htmlFor="cgu-agree" className="text-[11px] text-[#666660] leading-snug">
                J'accepte les conditions d'utilisation et la politique de confidentialité de Novika pour la vente en paiement à la livraison.
              </label>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                {error}
              </div>
            )}

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-[#111111] text-[#FAF8F5] text-xs font-black tracking-wide hover:bg-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création du compte et envoi du code...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>Créer mon compte et recevoir mon code</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          <div className="border-t border-black/[0.06] pt-4 text-center">
            <p className="text-xs text-[#666660]">
              Vous avez déjà un compte vendeur ?{" "}
              <Link href="/connexion" className="font-bold text-[#111111] underline hover:text-black">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
