"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, LogIn, Store, Home, AlertTriangle, Copy, Check } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { Logo } from "@/components/brand/logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [hasSession, setHasSession] = useState(false);
  const [userSpace, setUserSpace] = useState<string>(ROUTES.login);
  const [copied, setCopied] = useState(false);

  const isDev =
    process.env.NODE_ENV !== "production" ||
    (typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"));

  // Identifiant court d'incident (digest Next.js ou code généré lisible)
  const [incidentId] = useState(() => {
    if (error?.digest) return error.digest;
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ERR-${randomSuffix}`;
  });

  useEffect(() => {
    // Journalisation console locale
    console.error(`[Application Error - Incident ${incidentId}]:`, error);

    let email = "";
    let verified = "";
    let activeStore = "lome-glow";

    try {
      email =
        localStorage.getItem("novika_user_email") ||
        localStorage.getItem("afribuilder_user_email") ||
        "";
      verified =
        localStorage.getItem("novika_user_verified") ||
        localStorage.getItem("afribuilder_user_verified") ||
        "";
      activeStore = localStorage.getItem("novika_active_store") || "lome-glow";

      if (email || verified === "true") {
        setHasSession(true);
        setUserSpace(`/app/${activeStore}`);
      } else {
        setHasSession(false);
        setUserSpace(ROUTES.login);
      }
    } catch {
      setHasSession(false);
      setUserSpace(ROUTES.login);
    }

    // Envoi du rapport d'erreur structuré au serveur (Prompt 14-A)
    try {
      const currentRoute = typeof window !== "undefined" ? window.location.pathname : "unknown";
      // Déduire le store depuis le chemin si applicable
      const storeMatch = currentRoute.match(/^\/app\/([^/]+)/);
      const storeSlug = storeMatch ? storeMatch[1] : activeStore;

      fetch("/api/logs/client-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId,
          message: error?.message || "Erreur client non spécifiée",
          route: currentRoute,
          store: storeSlug,
          userId: email ? `usr_${email.replace(/[^a-zA-Z0-9]/g, "_")}` : "anonyme",
          timestamp: new Date().toISOString(),
        }),
      }).catch((logErr) => {
        console.warn("[Error Logging Notice]:", logErr);
      });
    } catch {
      // Ignorer silencieusement pour ne pas sur-échouer
    }
  }, [error, incidentId]);

  const handleCopyIncidentId = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(incidentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <main className="min-h-screen bg-[#F3EFE6] text-[#111111] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <Link href={ROUTES.home}>
            <Logo variant="full" tone="light" size={32} />
          </Link>
        </div>

        <div className="rounded-3xl border border-black/[0.08] bg-white p-8 shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs font-black uppercase tracking-wider text-rose-600">
              Difficulté technique
            </span>
            <h1 className="text-2xl font-black tracking-tight text-[#111111]">
              Une erreur inattendue est survenue
            </h1>
            <p className="text-xs text-[#666660] leading-relaxed">
              Une difficulté temporaire s&apos;est produite. Vos données sont préservées et en sécurité.
            </p>
          </div>

          {/* Bloc Code Incident (Prompt 14-A : Code court sans détail technique ni fuite de donnée sensible) */}
          <div className="rounded-2xl bg-[#FAF8F5] border border-black/[0.06] p-3 text-left space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-[#888880] tracking-wider block">
              Identifiant de l&apos;incident
            </span>
            <div className="flex items-center justify-between gap-2">
              <code
                id="incident-code-badge"
                className="font-mono text-xs font-black text-[#111111] bg-white px-2.5 py-1 rounded-lg border border-black/[0.08] select-all tracking-wider"
              >
                {incidentId}
              </code>
              <button
                type="button"
                id="btn-copy-incident-code"
                onClick={handleCopyIncidentId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-black/[0.08] text-[11px] font-bold text-[#111111] hover:bg-black/[0.04] transition-colors cursor-pointer"
                title="Copier le code de l'incident"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-700">Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-[#666660]" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-[#888880] leading-tight">
              Transmettez ce code à l&apos;équipe Kelio pour un diagnostic immédiat.
            </p>
          </div>

          {/* Détails techniques affichés en mode développement (Prompt 17-P) */}
          {isDev && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-left space-y-2">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                <span>Diagnostic Développeur</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-rose-200 text-rose-950 font-mono text-[11px] break-all select-all leading-relaxed">
                <strong>Erreur :</strong> {error?.message || "Erreur sans message spécifique"}
              </div>
              {error?.digest && (
                <p className="text-[10px] font-mono text-neutral-600">
                  <strong>Digest Next.js :</strong> {error.digest}
                </p>
              )}
              {error?.stack && (
                <details className="pt-1">
                  <summary className="text-[10px] font-bold text-rose-700 cursor-pointer hover:underline">
                    Voir la trace complète (Stack trace)
                  </summary>
                  <pre className="mt-1.5 p-2 bg-neutral-900 text-neutral-100 rounded-lg text-[9px] overflow-x-auto max-h-40 whitespace-pre-wrap font-mono leading-tight">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              id="btn-error-retry"
              onClick={() => reset()}
              className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-[#111111] hover:bg-black text-[#FAF8F5] text-xs font-black tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Réessayer l&apos;action</span>
            </button>

            {hasSession ? (
              <Link
                href={userSpace}
                id="btn-error-space"
                className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl border border-black/[0.08] bg-white hover:bg-[#FAF8F5] text-[#111111] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Store className="h-3.5 w-3.5 text-[#666660]" />
                <span>Aller à mon espace</span>
              </Link>
            ) : (
              <Link
                href={ROUTES.login}
                id="btn-error-login"
                className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl border border-black/[0.08] bg-white hover:bg-[#FAF8F5] text-[#111111] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5 text-[#666660]" />
                <span>Retour à la connexion</span>
              </Link>
            )}

            <Link
              href={ROUTES.home}
              id="btn-error-home"
              className="w-full min-h-[40px] py-2 px-4 rounded-2xl text-xs font-bold text-[#666660] hover:text-[#111111] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Retour à l&apos;accueil</span>
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-[#888880]">
          Plateforme Kelio • Assistance & Monitoring automatique
        </p>
      </div>
    </main>
  );
}
