"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertTriangle,
  Clock,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AuthDeliveryIllustration } from "@/components/auth/auth-delivery-illustration";
import { createClient } from "@/lib/supabase/client";
import { getAuthMessage } from "@/content";
import { getDefaultSpaceForRole, sanitizeInternalRedirect } from "@/config/spaces";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlEmail = searchParams.get("email");
  const isJustVerified = searchParams.get("verified") === "true";
  const messageKey = searchParams.get("message");
  const statusMessage = getAuthMessage(messageKey);

  const [email, setEmail] = useState(urlEmail || "");
  const [password, setPassword] = useState("");

  // Redirection automatique si l'utilisateur est déjà authentifié (sans message de déconnexion)
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

  useEffect(() => {
    if (urlEmail) {
      setEmail(urlEmail);
    }
  }, [urlEmail]);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notVerifiedEmail, setNotVerifiedEmail] = useState<string | null>(null);
  const [accountNotFound, setAccountNotFound] = useState(false);

  // Sécurité & Limitation de débit
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotVerifiedEmail(null);
    setAccountNotFound(false);

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
      setIsLoading(false);

      if (!res.ok) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= 5) {
          setLockoutSeconds(30);
          setError("Trop de tentatives consécutives. Votre compte est temporairement sécurisé.");
          return;
        }

        if (res.status === 404 || data.code === "ACCOUNT_NOT_FOUND" || res.status === 401) {
          setError("E-mail ou mot de passe incorrect.");
          return;
        }

        if (res.status === 403 || data.code === "EMAIL_NOT_VERIFIED") {
          setNotVerifiedEmail(email.trim().toLowerCase());
          setError("Votre adresse e-mail n'a pas encore été validée. Saisissez votre code ou réessayez avec votre mot de passe.");
          return;
        }

        setError(data.error || "E-mail ou mot de passe incorrect.");
        return;
      }

      // Connexion réussie : Enregistrement de session
      if (typeof window !== "undefined") {
        window.localStorage.setItem("novika_user_verified", "true");
        window.localStorage.setItem("novika_user_email", data.user.email);
        window.localStorage.setItem("novika_user_fullname", data.user.fullName || "");
        window.localStorage.setItem("novika_active_role", data.user.role || "owner");

        if (data.user.stores && Array.isArray(data.user.stores) && data.user.stores.length > 0) {
          window.localStorage.setItem(`novika_user_stores_${data.user.email}`, JSON.stringify(data.user.stores));
        }
      }

      // Redirection selon le profil avec validation stricte anti-redirection ouverte (Prompt 06-L)
      const user = data.user;
      const rawRedirect = searchParams.get("redirect");
      const firstSlug = (user.stores && user.stores[0]?.slug) || "lome-glow";

      if (rawRedirect) {
        const safeRedirect = sanitizeInternalRedirect(rawRedirect, user.role, firstSlug);
        router.push(safeRedirect);
      } else {
        const defaultSpace = getDefaultSpaceForRole(user.role, firstSlug);
        router.push(defaultSpace);
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : "Erreur de connexion au serveur";
      setError(msg);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      const supabase = createClient();
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/demarrer` : "/demarrer";
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (oauthError) {
        setError(oauthError.message || "Connexion avec Google temporairement indisponible.");
        setIsGoogleLoading(false);
      }
    } catch {
      setIsGoogleLoading(false);
      setError("Connexion avec Google temporairement indisponible.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111111] flex flex-col justify-center items-center py-8 px-4 sm:px-6 selection:bg-[#FED7AA]">
      {/* Container de style carte mobile / application avec bordures très douces */}
      <div className="w-full max-w-[430px] bg-white rounded-[38px] p-6 sm:p-8 border border-black/[0.06] shadow-[0_25px_70px_rgba(0,0,0,0.06)] space-y-5">
        
        {/* Entête avec Logo de marque aligné à gauche */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <Logo variant="full" tone="light" size={28} />
            </Link>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-[#C2410C] border border-orange-200/60">
              Espace Vendeur
            </span>
          </div>

          <div>
            <h1 className="text-[26px] font-black text-[#111111] leading-[1.15] tracking-tight">
              Propulsez votre commerce <br />
              <span className="text-[#C2410C]">en Afrique</span>
            </h1>
            <p className="text-xs text-[#888880] font-medium mt-1">
              Connectez-vous pour continuer sur Nomika
            </p>
          </div>
        </div>

        {/* Illustration centrale stylisée avec sac kraft, colis et badge livraison */}
        <div className="bg-[#FAF8F5]/80 rounded-3xl p-3 border border-black/[0.04]">
          <AuthDeliveryIllustration />
        </div>

        {/* Message d'état de session / déconnexion (Prompt 06-L) */}
        {statusMessage && (
          <div
            id="auth-session-status-message"
            className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2.5 shadow-2xs"
          >
            <CheckCircle2 className="h-4 w-4 text-amber-700 shrink-0" />
            <p className="font-semibold">{statusMessage}</p>
          </div>
        )}

        {/* Alerte e-mail tout juste validé */}
        {isJustVerified && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">E-mail vérifié avec succès !</p>
              <p className="text-[11px] text-emerald-700">Entrez votre mot de passe pour commencer à configurer votre boutique.</p>
            </div>
          </div>
        )}

        {/* Formulaire de connexion */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Champ Email sous forme de pilule douce */}
          <div>
            <div className="relative flex items-center rounded-2xl bg-white border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.02)] px-3.5 py-1.5 focus-within:border-[#C2410C] focus-within:ring-2 focus-within:ring-[#C2410C]/15 transition-all">
              <div className="h-8 w-8 rounded-xl bg-orange-50 text-[#C2410C] flex items-center justify-center shrink-0 mr-3">
                <Mail className="h-4 w-4" />
              </div>
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

          {/* Champ Mot de passe sous forme de pilule douce */}
          <div>
            <div className="relative flex items-center rounded-2xl bg-white border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.02)] px-3.5 py-1.5 focus-within:border-[#C2410C] focus-within:ring-2 focus-within:ring-[#C2410C]/15 transition-all">
              <div className="h-8 w-8 rounded-xl bg-orange-50 text-[#C2410C] flex items-center justify-center shrink-0 mr-3">
                <Lock className="h-4 w-4" />
              </div>
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
                className="p-1.5 text-[#888880] hover:text-[#111111] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Lien Mot de passe oublié à droite */}
            <div className="flex justify-end mt-1.5">
              <Link
                href="/auth/mot-de-passe-oublie"
                className="text-[11px] font-semibold text-[#888880] hover:text-[#C2410C] transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          {/* Message d'erreur et guidages */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>

              {notVerifiedEmail && (
                <div className="pt-2 border-t border-rose-200/60 flex justify-end">
                  <Link
                    href={`/auth/verifier-email?email=${encodeURIComponent(notVerifiedEmail)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C2410C] text-white font-bold text-[11px] hover:bg-[#9A3412] transition-colors"
                  >
                    <span>Valider mon e-mail par code</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {accountNotFound && (
                <div className="pt-2 border-t border-rose-200/60 flex justify-end">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111111] text-white font-bold text-[11px] hover:bg-black transition-colors"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Créer un compte maintenant</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Verrouillage temporaire */}
          {lockoutSeconds > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                Sécurité active : réessayez dans <strong>{lockoutSeconds}s</strong>
              </span>
            </div>
          )}

          {/* Bouton Se connecter en pilule Terracotta avec flèche vers la droite */}
          <button
            type="submit"
            disabled={isLoading || lockoutSeconds > 0}
            className="w-full min-h-[50px] py-3 px-5 rounded-full bg-[#C2410C] text-white text-xs font-black tracking-wide hover:bg-[#9A3412] active:scale-[0.99] transition-all shadow-[0_10px_25px_-5px_rgba(194,65,12,0.4)] hover:shadow-[0_12px_30px_-5px_rgba(194,65,12,0.5)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connexion en cours...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Se connecter</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        </form>

        {/* Séparateur "Ou" */}
        <div className="relative flex items-center justify-center pt-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/[0.08]" />
          </div>
          <span className="relative px-3 bg-white text-[11px] font-bold text-[#888880] uppercase tracking-wider">
            Ou
          </span>
        </div>

        {/* Bouton Continuer avec Google en pilule blanche avec logo officiel */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full min-h-[48px] py-2.5 px-4 rounded-full bg-white border border-black/[0.1] hover:bg-[#FAF8F5] text-[#111111] text-xs font-bold transition-all shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <span className="h-4 w-4 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
          )}
          <span>Continuer avec Google</span>
        </button>

        {/* Pied de page du formulaire avec lien vers inscription */}
        <div className="text-center pt-2">
          <p className="text-xs text-[#666660]">
            Vous n'avez pas de compte ?{" "}
            <Link
              href="/inscription"
              className="font-bold text-[#111111] hover:text-[#C2410C] hover:underline transition-colors"
            >
              Créer un compte
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
