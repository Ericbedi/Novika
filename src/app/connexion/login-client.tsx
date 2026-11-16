"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  UserPlus,
  KeyRound,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";

export function LoginClient() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notVerifiedEmail, setNotVerifiedEmail] = useState<string | null>(null);
  const [accountNotFound, setAccountNotFound] = useState(false);

  // Sécurité & Limitation de débit (Prompt 05-A)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Décompte de verrouillage temporaire après 5 échecs consécutifs
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
          setError("Trop de tentatives échouées consécutives. Votre compte est temporairement verrouillé pour des raisons de sécurité.");
          return;
        }

        if (res.status === 404 || data.code === "ACCOUNT_NOT_FOUND") {
          setAccountNotFound(true);
          setError("Aucun compte associé à cette adresse e-mail. Veuillez d'abord vous inscrire.");
          return;
        }

        if (res.status === 403 || data.code === "EMAIL_NOT_VERIFIED") {
          setNotVerifiedEmail(email.trim().toLowerCase());
          setError("Votre adresse e-mail n'a pas encore été validée. Veuillez saisir le code à 6 chiffres reçu lors de votre inscription.");
          return;
        }

        setError(data.error || "E-mail ou mot de passe incorrect.");
        return;
      }

      // Connexion réussie : Enregistrement de session vérifiée
      if (typeof window !== "undefined") {
        window.localStorage.setItem("novika_user_verified", "true");
        window.localStorage.setItem("novika_user_email", data.user.email);
        window.localStorage.setItem("novika_user_fullname", data.user.fullName || "");
        window.localStorage.setItem("novika_active_role", data.user.role || "owner");

        // Si l'utilisateur a ses propres boutiques créées dans Supabase
        if (data.user.stores && Array.isArray(data.user.stores) && data.user.stores.length > 0) {
          window.localStorage.setItem(`novika_user_stores_${data.user.email}`, JSON.stringify(data.user.stores));
        }
      }

      // Redirection selon le rôle et l'existence de boutiques
      const user = data.user;
      if (user.role === "closer") {
        router.push("/app/lome-glow/commandes");
      } else if (user.role === "rider") {
        router.push("/app/lome-glow/livraisons");
      } else if (user.role === "agency") {
        router.push("/app/lome-glow/commandes?view=agency");
      } else {
        // Pour un propriétaire (owner) :
        if (user.isDemo) {
          // Administrateur démo -> dashboard avec données démo
          router.push("/app/lome-glow");
        } else if (!user.hasStores) {
          // Nouveau marchand inscrit sans boutique -> assistant de création de première boutique
          router.push("/demarrer");
        } else {
          // Marchand ayant déjà au moins une boutique
          const firstSlug = user.stores[0]?.slug || "lome-glow";
          router.push(`/app/${firstSlug}`);
        }
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : "Erreur de connexion au serveur";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EFE6] text-[#111111] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-emerald-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <Logo variant="full" tone="light" size={32} />
        </Link>
        <h1 className="text-2xl font-black text-[#111111] tracking-tight">
          Connexion à votre espace
        </h1>
        <p className="text-xs text-[#666660]">
          Plateforme e-commerce spécialisée pour le paiement à la livraison en Afrique.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-black/[0.08] shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Champ E-mail */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@maboutique.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/[0.12]"
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#111111]">
                  Mot de passe
                </label>
                <Link
                  href="/auth/mot-de-passe-oublie"
                  className="text-[11px] font-semibold text-[#888880] hover:text-[#111111] hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/[0.12]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888880] hover:text-[#111111]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Message d'erreur standard ou alertes guidées */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>

                {/* Si compte non vérifié : bouton direct vers saisie du code */}
                {notVerifiedEmail && (
                  <div className="pt-2 border-t border-rose-200/60 flex justify-end">
                    <Link
                      href={`/auth/verifier-email?email=${encodeURIComponent(notVerifiedEmail)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-700 text-white font-bold text-xs hover:bg-rose-800 transition-colors"
                    >
                      <span>Valider mon e-mail par code</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}

                {/* Si compte introuvable : bouton direct vers inscription */}
                {accountNotFound && (
                  <div className="pt-2 border-t border-rose-200/60 flex justify-end">
                    <Link
                      href="/inscription"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black text-white font-bold text-xs hover:bg-neutral-800 transition-colors"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Créer mon compte maintenant</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Avertissement de verrouillage temporaire */}
            {lockoutSeconds > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Verrouillage de sécurité actif : réessayez dans <strong>{lockoutSeconds}s</strong>
                </span>
              </div>
            )}

            {/* Bouton Se connecter */}
            <button
              type="submit"
              disabled={isLoading || lockoutSeconds > 0}
              className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl bg-[#111111] text-[#FAF8F5] text-xs font-black tracking-wide hover:bg-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Vérification des identifiants...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>Se connecter</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          {/* Lien vers inscription */}
          <div className="border-t border-black/[0.06] pt-4 text-center">
            <p className="text-xs text-[#666660]">
              Pas encore de compte ?{" "}
              <Link href="/inscription" className="font-bold text-[#111111] underline hover:text-black">
                Créer un compte vendeur
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
