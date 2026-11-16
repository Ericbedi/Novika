"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlEmail = searchParams.get("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(45);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    const effectiveEmail = urlEmail || (typeof window !== "undefined" ? sessionStorage.getItem("novika_pending_email") : null) || "contact@maboutique.com";
    setEmail(effectiveEmail);
  }, [urlEmail]);

  // Masquage de l'e-mail (Ex: c•••••••@maboutique.com)
  const maskedEmail = (() => {
    if (!email) return "votre adresse e-mail";
    const parts = email.split("@");
    if (parts.length < 2) return email;
    const name = parts[0];
    const masked = name.charAt(0) + "•".repeat(Math.max(3, name.length - 2)) + (name.length > 1 ? name.slice(-1) : "");
    return `${masked}@${parts[1]}`;
  })();

  // Compte à rebours de renvoi
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setError("Le code de vérification doit comporter exactement 6 chiffres.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok || !data.success) {
        setError(data.error || "Code invalide ou expiré.");
        return;
      }

      setSuccess(true);

      // Redirection automatique vers la page de connexion pour ressaisir l'e-mail et mot de passe
      setTimeout(() => {
        router.push(`/connexion?email=${encodeURIComponent(email.trim().toLowerCase())}&verified=true`);
      }, 1500);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : "Erreur de connexion";
      setError(msg);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setResendMessage(null);

    try {
      const res = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      setResendCooldown(60);

      setResendMessage("Un nouveau code a été envoyé à votre adresse e-mail.");
      setTimeout(() => setResendMessage(null), 5000);
    } catch {
      setError("Impossible d'envoyer un nouveau code. Veuillez réessayer.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EFE6] text-[#111111] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-emerald-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <Logo variant="full" tone="light" size={32} />
        </Link>
        <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-black text-xl shadow-md border border-emerald-200">
          <Mail className="h-6 w-6 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-black text-[#111111] tracking-tight">
          Vérifiez votre adresse e-mail
        </h1>
        <p className="text-xs text-[#666660]">
          Nous avons envoyé un code de confirmation à 6 chiffres à :
        </p>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-white border border-black/[0.08] text-[#111111]">
          {maskedEmail}
        </span>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-black/[0.08] shadow-2xl space-y-6">
          {success ? (
            <div className="text-center py-6 space-y-3 animate-in fade-in">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-black text-[#111111]">E-mail vérifié avec succès !</h2>
              <p className="text-xs text-[#666660]">
                Votre compte vendeur est activé. Redirection vers la page de connexion pour vous connecter...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Notice d'information sur la réception de l'e-mail */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-black/[0.08] text-xs text-[#666660] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#111111]">
                  <Mail className="h-4 w-4 text-[#C2410C]" />
                  <span>Vérifiez votre boîte de réception</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Un e-mail contenant votre code de confirmation à 6 chiffres a été envoyé à{" "}
                  <strong className="text-[#111111] font-mono">{maskedEmail}</strong>. Veuillez copier le code reçu dans votre boîte de messagerie et le coller ci-dessous.
                </p>
                <p className="text-[10px] text-[#888880] pt-0.5">
                  💡 Astuce : Si vous ne voyez pas l'e-mail dans les 2 minutes, vérifiez vos dossiers <strong>Spams</strong> ou <strong>Courriers indésirables</strong>.
                </p>
              </div>

              <div>
                <label className="block text-center text-xs font-bold text-[#666660] uppercase tracking-wider mb-2">
                  Code de sécurité (6 chiffres)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="w-full text-center font-mono tracking-[0.5em] text-2xl font-black py-3 rounded-2xl border border-black/[0.12] bg-[#FAF8F5] text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/[0.15]"
                />
                <p className="text-[10px] text-center text-[#888880] mt-1.5">
                  Code valable pendant 15 minutes. Vérifiez votre boîte principale et vos spams.
                </p>
              </div>

              {/* Erreur */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                  {error}
                </div>
              )}

              {/* Message renvoi */}
              {resendMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                  {resendMessage}
                </div>
              )}

              {/* Bouton de confirmation */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-[#111111] text-[#FAF8F5] text-xs font-black tracking-wide hover:bg-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Vérification du code...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Confirmer et activer mon compte</span>
                  </span>
                )}
              </button>

              {/* Renvoyer un code */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-semibold transition-colors",
                    resendCooldown > 0
                      ? "text-[#888880] cursor-not-allowed"
                      : "text-[#111111] underline hover:text-black cursor-pointer"
                  )}
                >
                  <RotateCw className="h-3 w-3" />
                  <span>
                    {resendCooldown > 0
                      ? `Renvoyer un nouveau code (${resendCooldown}s)`
                      : "Renvoyer un nouveau code par e-mail"}
                  </span>
                </button>
              </div>
            </form>
          )}

          <div className="border-t border-black/[0.06] pt-4 text-center">
            <Link href="/inscription" className="text-xs text-[#888880] hover:text-[#111111]">
              ← Modifier mon adresse e-mail
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
