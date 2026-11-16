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
  RotateCcw,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { normalizeEmail } from "@/lib/email-canonical";
import { betaStore } from "@/server/data/beta-store";

const COUNTRIES = [
  { code: "TG", name: "Togo", flag: "🇹🇬", prefix: "+228" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", prefix: "+225" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", prefix: "+229" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", prefix: "+221" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", prefix: "+237" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", prefix: "+226" },
  { code: "ML", name: "Mali", flag: "🇲🇱", prefix: "+223" },
  { code: "NE", name: "Niger", flag: "🇳🇪", prefix: "+227" },
];

export default function AccessRequestPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("TG");
  const [dailyOrders, setDailyOrders] = useState("10-50");
  const [productType, setProductType] = useState("Cosmétique & Beauté");
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Étape 2 : Modal OTP
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [generatedDemoOtp, setGeneratedDemoOtp] = useState("");
  const [canonicalEmail, setCanonicalEmail] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const val = normalizeEmail(email);
    if (!val.isValid) {
      setFormError(val.error || "Adresse e-mail non valide.");
      return;
    }

    if (val.typoSuggestion) {
      setFormError(`Vouliez-vous dire ${val.typoSuggestion} ? Veuillez vérifier l'orthographe du domaine.`);
      return;
    }

    const res = betaStore.createAccessRequest({
      fullName,
      email,
      country,
      whatsapp,
      productType,
      monthlyOrdersEstimated: dailyOrders,
    });

    if (res.error) {
      setFormError(res.error);
      return;
    }

    setCanonicalEmail(val.canonicalEmail);
    setGeneratedDemoOtp(res.otpCode);
    setShowOtpModal(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setIsVerifying(true);

    const check = betaStore.verifyRequestOtp(canonicalEmail, otpCode);
    if (!check.success) {
      setOtpError(check.error || "Code incorrect.");
      setIsVerifying(false);
      return;
    }

    window.location.href = "/acces/merci";
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111111] flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-[540px] w-full mx-auto">
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
              <span>BÊTA PRIVÉE · ACCÈS SUR INVITATION</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#111111] mb-2">
            Demander mon accès à Novika
          </h1>
          <p className="text-xs text-[#666660] mb-6 leading-relaxed">
            Pour garantir une délivrabilité optimale et préserver la qualité de nos serveurs en Afrique, chaque candidature nécessite une vérification stricte de votre boîte e-mail.
          </p>

          {formError && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Nom complet ou nom commercial *
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
                placeholder="Ex : contact@maboutique.com"
                className="w-full h-10 px-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-medium focus:bg-white focus:outline-hidden focus:border-black"
              />
              <span className="text-[10px] text-[#888880] mt-1 block">
                Un code à 6 chiffres vous sera envoyé à cette adresse. Les e-mails jetables sont rejetés.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Pays principal d'activité *
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-medium focus:bg-white focus:outline-hidden focus:border-black"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.prefix})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Numéro WhatsApp joignable *
                </label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+228 90 12 34 56"
                  className="w-full h-10 px-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-medium focus:bg-white focus:outline-hidden focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Type de produits vendus
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-medium focus:bg-white focus:outline-hidden focus:border-black"
                >
                  <option value="Cosmétique & Beauté">Cosmétique & Beauté</option>
                  <option value="Santé & Compléments">Santé & Compléments</option>
                  <option value="Mode, Chaussures & Sacs">Mode, Chaussures & Sacs</option>
                  <option value="Électronique & High-Tech">Électronique & High-Tech</option>
                  <option value="Maison & Gadgets">Maison & Gadgets</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Volume mensuel estimé
                </label>
                <select
                  value={dailyOrders}
                  onChange={(e) => setDailyOrders(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-medium focus:bg-white focus:outline-hidden focus:border-black"
                >
                  <option value="1-50">1 à 50 commandes / mois</option>
                  <option value="50-200">50 à 200 commandes / mois</option>
                  <option value="200-1000">200 à 1 000 commandes / mois</option>
                  <option value="1000+">Plus de 1 000 commandes / mois</option>
                </select>
              </div>
            </div>

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
                  J'accepte les conditions de la bêta privée Novika et consens à être contacté par e-mail et WhatsApp pour la validation de mon compte.
                </span>
              </label>
            </div>

            <button
              type="submit"
              id="submit-access-request-btn"
              className="w-full h-11 rounded-xl bg-[#111111] text-[#FAF8F5] font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition-all shadow-sm cursor-pointer mt-4"
            >
              <span>Vérifier mon e-mail & Postuler</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* MODAL STRICT OTP (Vérification réelle de la boîte e-mail) */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-[460px] w-full p-6 sm:p-8 border border-black/[0.1] shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#C2410C]/10 flex items-center justify-center text-[#C2410C]">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-[#111111]">
                  Confirmez votre boîte e-mail
                </h3>
                <p className="text-[11px] text-[#666660]">
                  Code envoyé à <span className="font-bold text-[#111111]">{email}</span>
                </p>
              </div>
            </div>

            {/* Notice d'aide Bêta Démo */}
            <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-black/[0.06] text-[11px] text-[#666660]">
              <span className="font-bold text-[#111111] block mb-0.5">
                [Bêta Démo] Code de vérification :
              </span>
              <span id="request-demo-otp-code" className="font-mono font-black text-sm text-[#C2410C] tracking-widest">
                {generatedDemoOtp}
              </span>
              <span className="text-[10px] text-[#888880] block mt-0.5">
                Valable 10 minutes (5 essais maximum).
              </span>
            </div>

            {otpError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Saisissez le code à 6 chiffres
                </label>
                <input
                  type="text"
                  required
                  id="request-otp-input"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ex : 123456"
                  className="w-full h-12 text-center text-lg font-mono font-bold tracking-widest rounded-xl border border-black/[0.1] bg-[#FAF8F5] focus:bg-white focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 h-10 rounded-xl bg-black/[0.04] text-[#111111] text-xs font-bold hover:bg-black/[0.08] cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  id="verify-request-otp-btn"
                  disabled={otpCode.length < 6 || isVerifying}
                  className="flex-2 h-10 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4 text-[#22C55E]" />
                  <span>{isVerifying ? "Vérification..." : "Valider mon e-mail"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="text-center py-4 text-[11px] text-[#888880]">
        Plateforme Novika · Paiement à la livraison pour l'Afrique de l'Ouest & Centrale
      </footer>
    </div>
  );
}
