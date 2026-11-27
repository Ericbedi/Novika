"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Store,
  KeyRound,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { betaStore } from "@/server/data/beta-store";
import { maskEmail } from "@/lib/email-canonical";

interface InvitationClientProps {
  token: string;
}

export function InvitationClient({ token }: InvitationClientProps) {
  const router = useRouter();
  const invitation = betaStore.getInvitationByToken(token);

  // Étape 1 : 'welcome' (anti-scanner), Étape 2 : 'otp', Étape 3 : 'profile'
  const [step, setStep] = useState<"welcome" | "otp" | "profile">("welcome");
  const [maskedEmail, setMaskedEmail] = useState(
    invitation ? maskEmail(invitation.originalEmail) : "inconnu@domain.com"
  );
  const [demoOtp, setDemoOtp] = useState<string>("592184");
  const [inputOtp, setInputOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);

  // Formulaire profil
  const [fullName, setFullName] = useState(invitation?.fullName || "");
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  if (!invitation) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#111111] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-[480px] w-full border border-black/[0.08] shadow-sm text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black text-[#111111]">Invitation Invalide ou Révoquée</h1>
          <p className="text-xs text-[#666660]">
            Ce lien d'invitation à la bêta privée n'existe pas ou a expiré. Veuillez contacter l'administrateur Kelio qui vous a invité.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black"
          >
            Retour au site public
          </Link>
        </div>
      </div>
    );
  }

  const handleRequestOtp = () => {
    const res = betaStore.requestActivationOtp(token);
    if (!res.success) {
      setOtpError(res.error || "Impossible d'envoyer le code.");
      return;
    }
    setMaskedEmail(res.maskedEmail);
    if (res.demoCode) setDemoOtp(res.demoCode);
    setStep("otp");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    const res = betaStore.verifyActivationOtp(token, inputOtp);
    if (!res.success) {
      setOtpError(res.error || "Code incorrect.");
      return;
    }

    setStep("profile");
  };

  const handleFinalize = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!acceptTerms) {
      setFormError("Veuillez accepter les conditions de la bêta.");
      return;
    }

    setIsFinalizing(true);
    const res = betaStore.finalizeActivation(token, { fullName, storeName, phone });
    if (!res.success) {
      setFormError(res.error || "Erreur d'activation.");
      setIsFinalizing(false);
      return;
    }

    setTimeout(() => {
      router.push(`/bienvenue?store=${res.storeSlug}`);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111111] flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-[500px] w-full mx-auto my-auto">
        <div className="text-center mb-6">
          <Logo variant="full" tone="light" size={32} />
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.08] shadow-sm">
          {/* ÉTAPE 1 : ACCUEIL SÉCURISÉ (PROTECTION ANTI-SCANNERS & ROBOTS MAIL) */}
          {step === "welcome" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/10 text-[#16A34A] border border-[#22C55E]/20">
                  <ShieldCheck className="h-3 w-3" />
                  <span>INVITATION BÊTA VALIDÉE</span>
                </span>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight mb-1">
                  Activer votre accès vendeur
                </h1>
                <p className="text-xs text-[#666660]">
                  Invitation officielle réservée à <span className="font-bold text-[#111111]">{maskedEmail}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] text-xs text-[#666660] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#111111]">
                  <Lock className="h-4 w-4 text-[#C2410C]" />
                  <span>Protection contre les analyseurs automatiques de liens</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Afin d'éviter que les scanners d'antivirus ou d'aperçus de votre messagerie n'activent votre compte par inadvertance, cliquez sur le bouton ci-dessous pour recevoir votre code à 6 chiffres.
                </p>
              </div>

              <button
                type="button"
                id="request-activation-code-btn"
                onClick={handleRequestOtp}
                className="w-full h-11 rounded-xl bg-[#111111] text-[#FAF8F5] font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition-all shadow-sm cursor-pointer"
              >
                <Mail className="h-4 w-4" />
                <span>Recevoir mon code d'activation</span>
              </button>
            </div>
          )}

          {/* ÉTAPE 2 : SAISIE OTP BOÎTE MAIL */}
          {step === "otp" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C2410C]/10 text-[#C2410C] border border-[#C2410C]/20">
                  <KeyRound className="h-3 w-3" />
                  <span>ÉTAPE 2 SUR 3 · BOÎTE E-MAIL</span>
                </span>
              </div>

              <div>
                <h1 className="text-xl font-black text-[#111111] tracking-tight mb-1">
                  Confirmez votre boîte e-mail
                </h1>
                <p className="text-xs text-[#666660]">
                  Un code secret à 6 chiffres a été envoyé à <span className="font-bold text-[#111111]">{maskedEmail}</span>
                </p>
              </div>

              {/* Notice Bêta Démo */}
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-black/[0.06] text-xs">
                <span className="font-bold text-[#111111] block mb-0.5">
                  [Bêta Démo] Code d'activation :
                </span>
                <span className="font-mono font-black text-base text-[#C2410C] tracking-widest">
                  {demoOtp}
                </span>
                <span className="text-[10px] text-[#888880] block mt-0.5">
                  Durée de validité : 10 minutes (5 essais maximum)
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
                    Code à 6 chiffres
                  </label>
                  <input
                    type="text"
                    required
                    id="activation-otp-input"
                    maxLength={6}
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ex : 592184"
                    className="w-full h-12 text-center text-lg font-mono font-bold tracking-widest rounded-xl border border-black/[0.1] bg-[#FAF8F5] focus:bg-white focus:outline-hidden focus:border-black"
                  />
                </div>

                <button
                  type="submit"
                  id="submit-activation-otp-btn"
                  disabled={inputOtp.length < 6}
                  className="w-full h-11 rounded-xl bg-[#111111] text-[#FAF8F5] font-bold text-xs flex items-center justify-center gap-2 hover:bg-black disabled:opacity-40 transition-all shadow-sm cursor-pointer"
                >
                  <span>Confirmer le code</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}

          {/* ÉTAPE 3 : FINALISATION DU COMPTE (AVEC E-MAIL VERROUILLÉ) */}
          {step === "profile" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/10 text-[#16A34A] border border-[#22C55E]/20">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>E-MAIL VÉRIFIÉ · IDENTIFIANTS</span>
                </span>
              </div>

              <div>
                <h1 className="text-xl font-black text-[#111111] tracking-tight mb-1">
                  Créez vos identifiants vendeur
                </h1>
                <p className="text-xs text-[#666660]">
                  Configurez votre compte administrateur et le nom de votre boutique COD.
                </p>
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleFinalize} className="space-y-3.5 text-xs">
                {/* Champ E-MAIL STRICTEMENT VERROUILLÉ (Règle non négociable Prompt G) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#111111]">
                      Adresse e-mail du compte
                    </label>
                    <span className="text-[10px] font-bold text-[#C2410C]">
                      Verrouillée à l'invitation
                    </span>
                  </div>
                  <input
                    type="email"
                    id="locked-email-input"
                    disabled
                    value={invitation.originalEmail}
                    className="w-full h-10 px-3 rounded-xl border border-black/[0.1] bg-black/[0.04] text-[#888880] text-xs font-bold cursor-not-allowed"
                  />
                  <span className="text-[10px] text-[#888880] mt-1 block">
                    Conformément aux règles de sécurité de la bêta privée, l'adresse ne peut être modifiée.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Nom et prénom du propriétaire *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aminata Diallo"
                    className="w-full h-10 px-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-medium focus:bg-white focus:outline-hidden focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Nom de votre boutique principale *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Ex : Glow Lomé Cosmétiques"
                    className="w-full h-10 px-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-medium focus:bg-white focus:outline-hidden focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Numéro WhatsApp joignable *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+228 90 12 34 56"
                    className="w-full h-10 px-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-medium focus:bg-white focus:outline-hidden focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Mot de passe sécurisé *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-10 px-3 rounded-xl border border-black/[0.1] bg-[#FAF8F5] text-xs font-medium focus:bg-white focus:outline-hidden focus:border-black"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer text-[11px] text-[#666660]">
                    <input
                      type="checkbox"
                      id="accept-beta-terms-checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-black/[0.1] accent-[#111111] mt-0.5 cursor-pointer"
                    />
                    <span>
                      J'accepte la charte des bêta-testeurs Kelio et la politique de paiement à la livraison.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  id="finalize-account-btn"
                  disabled={isFinalizing}
                  className="w-full h-11 rounded-xl bg-[#111111] text-[#FAF8F5] font-bold text-xs flex items-center justify-center gap-2 hover:bg-black disabled:opacity-40 transition-all shadow-sm cursor-pointer mt-3"
                >
                  <span>{isFinalizing ? "Création du compte..." : "Activer mon compte et démarrer"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center py-4 text-[11px] text-[#888880]">
        Kelio · Infrastructure e-commerce COD pour l'Afrique de l'Ouest & Centrale
      </footer>
    </div>
  );
}
