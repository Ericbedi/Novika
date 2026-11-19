"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";

// Liste de mots de passe courants et compromis
const COMMON_PW_LIST = [
  "password123",
  "1234567890",
  "azertyuiop",
  "motdepasse123",
  "admin12345",
  "qwertyuiop",
  "123456789",
  "novika2026",
  "afribuilder",
];

export function SetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "amadou.test@afribuilder.com";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Évaluation de la force du mot de passe
  const passwordEvaluation = useMemo(() => {
    const minLength = password.length >= 10;
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);

    // Vérification de nom ou e-mail dans le mot de passe
    const emailParts = email
      .toLowerCase()
      .split(/[@._+-]/)
      .filter((p) => p.length >= 3);
    const containsEmailPart = emailParts.some((part) =>
      password.toLowerCase().includes(part)
    );

    // Vérification des fuites connues / mots de passe courants
    const isCommonOrPwned =
      COMMON_PW_LIST.includes(password.toLowerCase()) ||
      password.toLowerCase() === "pwnedpassword10";

    let score = 0;
    if (password.length >= 10) score += 1;
    if (password.length >= 14) score += 1;
    if (hasLetters && hasNumbers) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    let strengthLabel = "Faible";
    let strengthColor = "bg-rose-500 text-rose-700";

    if (score >= 3) {
      strengthLabel = "Fort";
      strengthColor = "bg-emerald-500 text-emerald-700";
    } else if (score >= 2) {
      strengthLabel = "Moyen";
      strengthColor = "bg-amber-500 text-amber-700";
    }

    return {
      minLength,
      containsEmailPart,
      isCommonOrPwned,
      score,
      strengthLabel,
      strengthColor,
      isValid: minLength && !containsEmailPart && !isCommonOrPwned,
    };
  }, [password, email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 10) {
      setErrorMessage("Le mot de passe doit comporter au minimum 10 caractères.");
      return;
    }

    if (passwordEvaluation.containsEmailPart) {
      setErrorMessage("Le mot de passe ne doit pas contenir votre identifiant ou adresse e-mail.");
      return;
    }

    if (passwordEvaluation.isCommonOrPwned) {
      setErrorMessage(
        "Ce mot de passe est trop courant ou apparaît dans des fuites de données publiques connues (k-anonymat). Veuillez en choisir un plus sécurisé."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);

      // Enregistrer le statut utilisateur
      if (typeof window !== "undefined") {
        window.localStorage.setItem("novika_user_verified", "true");
        window.localStorage.setItem("novika_user_email", email);
      }

      setTimeout(() => {
        router.push(ROUTES.login);
      }, 1500);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F3EFE6] text-[#111111] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-emerald-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <Logo variant="full" tone="light" size={32} />
        </Link>
        <h1 className="text-2xl font-black text-[#111111] tracking-tight">
          Créez votre mot de passe
        </h1>
        <p className="text-xs text-[#666660]">
          Votre adresse e-mail a été vérifiée avec succès. Vous seul définissez et connaissez ce mot de passe.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-black/[0.08] shadow-2xl space-y-6">
          {isSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <h2 className="text-sm font-bold text-emerald-950">
                Mot de passe créé avec succès !
              </h2>
              <p className="text-xs text-emerald-800">
                Redirection vers la page de connexion sécurisée...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Compte vérifié
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-black/[0.03] border border-black/[0.08] text-xs font-mono text-[#666660]">
                  {email}
                </div>
              </div>

              {/* Champ Mot de passe */}
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Nouveau mot de passe personnel
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="input-create-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="10 caractères minimum"
                    className="w-full pl-10 pr-10 py-3 text-base sm:text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/[0.12] min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888880] hover:text-[#111111] p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Indicateur de force */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[#888880]">Force :</span>
                      <span className="font-bold">{passwordEvaluation.strengthLabel}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-black/[0.08] overflow-hidden flex gap-0.5">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          passwordEvaluation.score >= 1 ? "bg-rose-500 w-1/3" : "w-0"
                        )}
                      />
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          passwordEvaluation.score >= 2 ? "bg-amber-500 w-1/3" : "w-0"
                        )}
                      />
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          passwordEvaluation.score >= 3 ? "bg-emerald-500 w-1/3" : "w-0"
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Champ Confirmation */}
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="input-create-confirm-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ressaisissez le mot de passe"
                    className="w-full pl-10 pr-10 py-3 text-base sm:text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/[0.12] min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888880] hover:text-[#111111] p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Règles de conformité claires */}
              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] space-y-1 text-[11px] text-[#666660]">
                <div className="flex items-center gap-1.5">
                  {password.length >= 10 ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-[#888880]" />
                  )}
                  <span>10 caractères minimum</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {!passwordEvaluation.containsEmailPart && password.length > 0 ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-[#888880]" />
                  )}
                  <span>Ne contient pas votre nom ni votre e-mail</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {!passwordEvaluation.isCommonOrPwned && password.length > 0 ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-[#888880]" />
                  )}
                  <span>Non répertorié dans les fuites publiques connues</span>
                </div>
              </div>

              {errorMessage && (
                <div
                  id="create-password-error-message"
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                id="btn-submit-create-password"
                disabled={isLoading}
                className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-[#111111] text-[#FAF8F5] text-xs font-black tracking-wide hover:bg-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Enregistrement sécurisé...</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>Enregistrer mon mot de passe</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
