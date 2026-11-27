"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getAuthMessage } from "@/content";
import { sanitizeInternalRedirect } from "@/config/spaces";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlEmail = searchParams.get("email");
  const isJustVerified = searchParams.get("verified") === "true";
  const messageKey = searchParams.get("message");
  const statusMessage = getAuthMessage(messageKey);

  const [email, setEmail] = useState(urlEmail || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Étape Double Authentification (2FA) (Prompt 18)
  const [is2faRequired, setIs2faRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [temp2faEmail, setTemp2faEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  // Compte à rebours 60s pour le bouton "Renvoyer le code"
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (is2faRequired && resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [is2faRequired, resendCooldown]);

  // Sécurité & Limitation de débit
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  useEffect(() => {
    if (urlEmail) {
      setEmail(urlEmail);
    }
  }, [urlEmail]);

  // Redirection automatique si session valide déjà existante (sans message de déconnexion)
  useEffect(() => {
    if (typeof window !== "undefined" && !messageKey) {
      const userEmail = localStorage.getItem("novika_user_email");
      const userVerified = localStorage.getItem("novika_user_verified");
      const userRole = localStorage.getItem("novika_active_role") || "owner";
      if (userEmail && userVerified === "true") {
        const rawRedirect = searchParams.get("redirect");
        const target = sanitizeInternalRedirect(rawRedirect, userRole);
        router.replace(target);
      }
    }
  }, [messageKey, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (lockoutSeconds > 0) {
      setError(`Trop de tentatives échouées. Veuillez patienter ${lockoutSeconds} secondes.`);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Veuillez renseigner votre adresse e-mail et votre mot de passe.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.retryAfterSeconds) {
          setLockoutSeconds(data.retryAfterSeconds);
        }
        setError(data.error || "Identifiants incorrects.");
        setIsLoading(false);
        return;
      }

      // Si double authentification (2FA) requise pour le propriétaire ou l'administrateur
      if (data.require2FA) {
        setIs2faRequired(true);
        setTemp2faEmail(data.email || email.trim().toLowerCase());
        setResendCooldown(60);
        setResendSuccess(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      // Connexion réussie
      handleSuccessLogin(data.user);
    } catch {
      setError("Une erreur de communication est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    setResendSuccess(null);

    try {
      const res = await fetch("/api/auth/resend-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: temp2faEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Impossible d'envoyer un nouveau code 2FA.");
      } else {
        setResendSuccess("Un nouveau code a été envoyé par e-mail.");
        setResendCooldown(60);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur de connexion";
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!twoFactorCode.trim() || twoFactorCode.trim().length !== 6) {
      setError("Veuillez saisir le code de sécurité à 6 chiffres.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: temp2faEmail,
          code: twoFactorCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Code de validation incorrect.");
        setIsLoading(false);
        return;
      }

      handleSuccessLogin(data.user);
    } catch {
      setError("Une erreur de vérification 2FA est survenue.");
      setIsLoading(false);
    }
  };

  const handleSuccessLogin = (user: any) => {
    localStorage.setItem("novika_user_email", user.email);
    localStorage.setItem("novika_active_role", user.role);
    localStorage.setItem("novika_user_verified", "true");

    const rawRedirect = searchParams.get("redirect");
    const target = sanitizeInternalRedirect(rawRedirect, user.role);
    router.replace(target);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4 selection:bg-[#F26522]/20">
      <div className="w-full max-w-sm rounded-3xl bg-white border border-black/[0.08] p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5">
        {/* En-tête sobre : Logo Kelio & Titre */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo variant="full" tone="light" size={32} />
          <h1 className="text-base font-bold text-[#111111] tracking-tight">
            {is2faRequired ? "Double authentification (2FA)" : "Connexion"}
          </h1>
          <p className="text-xs text-[#777770]">
            {is2faRequired
              ? "Entrez le code à 6 chiffres pour valider votre identité."
              : "Accès réservé au propriétaire et à l'équipe."}
          </p>
        </div>

        {/* Message d'état de session / déconnexion (masqué sur l'écran 2FA pour éviter d'afficher "déconnecté" en vert) */}
        {statusMessage && !is2faRequired && (
          <div
            id="auth-session-status-message"
            className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5"
          >
            <CheckCircle2 className="h-4 w-4 text-amber-700 shrink-0" />
            <p className="font-semibold">{statusMessage}</p>
          </div>
        )}

        {isJustVerified && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="font-bold">E-mail validé avec succès. Vous pouvez vous connecter.</p>
          </div>
        )}

        {/* ÉTAPE 1 : FORMULAIRE IDENTIFIANTS */}
        {!is2faRequired ? (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <div className="relative flex items-center rounded-2xl bg-white border border-black/[0.1] focus-within:border-[#111111] focus-within:ring-1 focus-within:ring-[#111111] px-3.5 py-1.5 transition-all">
                <Mail className="h-4 w-4 text-[#888880] shrink-0 mr-2.5" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Adresse e-mail"
                  className="w-full text-xs font-semibold text-[#111111] bg-transparent focus:outline-none placeholder:text-[#999990] py-2"
                />
              </div>
            </div>

            <div>
              <div className="relative flex items-center rounded-2xl bg-white border border-black/[0.1] focus-within:border-[#111111] focus-within:ring-1 focus-within:ring-[#111111] px-3.5 py-1.5 transition-all">
                <Lock className="h-4 w-4 text-[#888880] shrink-0 mr-2.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full text-xs font-semibold text-[#111111] bg-transparent focus:outline-none placeholder:text-[#999990] py-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-[#888880] hover:text-[#111111] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {lockoutSeconds > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Sécurité active : réessayez dans <strong>{lockoutSeconds}s</strong>
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || lockoutSeconds > 0}
              className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Vérification...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>Se connecter</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>
        ) : (
          /* ÉTAPE 2 : CODE 2FA */
          <form onSubmit={handle2faSubmit} className="space-y-4">
            <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] text-center space-y-1">
              <ShieldCheck className="h-6 w-6 text-[#111111] mx-auto" />
              <p className="text-xs font-bold text-[#111111]">Code envoyé par e-mail</p>
              <p className="text-[11px] text-[#777770]">
                Un code à 6 chiffres a été généré pour <strong>{temp2faEmail}</strong>
              </p>
            </div>

            <div>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full text-center text-lg font-black tracking-widest text-[#111111] bg-[#FAF8F5] border border-black/[0.1] rounded-2xl py-3 focus:outline-none focus:border-[#111111]"
              />
            </div>

            {resendSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{resendSuccess}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || twoFactorCode.length !== 6}
              className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? "Validation du code..." : "Confirmer l'accès"}
            </button>

            {/* Bouton Renvoyer le code avec délai 60s */}
            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                id="btn-resend-2fa"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || isResending}
                className="text-xs font-semibold text-[#111111] hover:underline disabled:text-[#888880] disabled:no-underline transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3 w-3 ${isResending ? "animate-spin" : ""}`} />
                <span>
                  {resendCooldown > 0
                    ? `Renvoyer le code (${resendCooldown}s)`
                    : "Renvoyer le code"}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setIs2faRequired(false);
                setTwoFactorCode("");
                setError(null);
                setResendSuccess(null);
              }}
              className="w-full text-center text-xs text-[#777770] hover:text-[#111111] transition-colors pt-2"
            >
              Retour à la saisie du mot de passe
            </button>
          </form>
        )}

        {/* Accès direct à la vitrine publique */}
        <div className="pt-3 border-t border-black/[0.06] text-center">
          <p className="text-[11px] text-[#777770]">
            Accéder à la vitrine publique :{" "}
            <a
              href="/boutique/kelio"
              className="text-[#111111] font-bold hover:underline"
            >
              Kelio
            </a>
            {" · "}
            <a
              href="/boutique/lome-glow"
              className="text-[#111111] font-bold hover:underline"
            >
              Lomé Glow
            </a>
          </p>
        </div>
      </div>

      {/* Mention sobre et discrète en bas */}
      <div className="text-center text-[11px] text-[#999990] mt-6">
        Kelio &copy; {new Date().getFullYear()} &middot; Accès restreint
      </div>
    </div>
  );
}
