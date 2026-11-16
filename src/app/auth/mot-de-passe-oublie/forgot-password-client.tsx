"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F3EFE6] text-[#111111] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-emerald-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <Logo variant="full" tone="light" size={32} />
        </Link>
        <h1 className="text-2xl font-black text-[#111111] tracking-tight">
          Réinitialisation du mot de passe
        </h1>
        <p className="text-xs text-[#666660]">
          Recevez un lien sécurisé à usage unique valable 30 minutes.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-black/[0.08] shadow-2xl space-y-6">
          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in fade-in duration-200">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <h2 className="text-sm font-bold text-emerald-950">
                Demande prise en compte
              </h2>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Si un compte actif existe pour <strong>{email}</strong>, un lien sécurisé de réinitialisation valable 30 minutes vient de vous être envoyé par e-mail.
              </p>
              <div className="pt-2">
                <Link
                  href="/connexion"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#111111] hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Retour à la page de connexion</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Votre adresse e-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
                  <input
                    type="email"
                    id="input-forgot-email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="direction@lome-glow.com"
                    className="w-full pl-10 pr-3.5 py-3 text-base sm:text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/[0.12] min-h-[44px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-forgot-password"
                disabled={isLoading}
                className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-[#111111] text-[#FAF8F5] text-xs font-black tracking-wide hover:bg-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Envoi en cours...</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>M'envoyer le lien de réinitialisation</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>

              <div className="pt-2 text-center text-xs">
                <Link
                  href="/connexion"
                  className="inline-flex items-center gap-1 text-[#666660] hover:text-[#111111] font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Retour à la connexion</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
