"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, LogIn, Store, Home, AlertTriangle } from "lucide-react";
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

  useEffect(() => {
    console.error("[Application Error]:", error);
    try {
      const email =
        localStorage.getItem("novika_user_email") ||
        localStorage.getItem("afribuilder_user_email");
      const verified =
        localStorage.getItem("novika_user_verified") ||
        localStorage.getItem("afribuilder_user_verified");
      const activeStore = localStorage.getItem("novika_active_store") || "lome-glow";

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
  }, [error]);

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
          Plateforme Novika • Assistance & Monitoring automatique
        </p>
      </div>
    </main>
  );
}
