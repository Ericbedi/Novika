"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  UserCheck,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Phone,
  User,
  ShieldAlert,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";

export function JoinClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<{
    email: string;
    role: string;
    country?: string;
    expiresAt: string;
  } | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setTokenError("Aucun jeton d'invitation fourni dans le lien.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/team/invitations/accept?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) {
          setTokenError(data.error || "Lien d'invitation invalide ou expiré.");
        } else {
          setInvitationData(data.invitation);
        }
      } catch {
        setTokenError("Erreur réseau lors de la vérification de l'invitation.");
      } finally {
        setIsLoading(false);
      }
    }

    verify();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < 10) {
      setSubmitError("Le mot de passe doit comporter au moins 10 caractères.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/team/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: name.trim(),
          phone: phone.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Impossible d'activer le compte.");
        setIsSubmitting(false);
        return;
      }

      // Redirection vers la page de connexion avec confirmation
      router.push(`/connexion?verified=true&email=${encodeURIComponent(invitationData?.email || "")}`);
    } catch {
      setSubmitError("Une erreur est survenue lors de l'activation.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center text-xs text-[#777770]">
        Vérification de l'invitation...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4 selection:bg-[#F26522]/20">
      <div className="w-full max-w-sm rounded-3xl bg-white border border-black/[0.08] p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo variant="full" tone="light" size={32} />
          <h1 className="text-base font-bold text-[#111111] tracking-tight">
            Invitation d'équipe Kelio
          </h1>
          <p className="text-xs text-[#777770]">
            Activez votre accès pour rejoindre votre espace collaborateur.
          </p>
        </div>

        {tokenError ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Lien inaccessible</p>
                <p className="mt-1 leading-relaxed">{tokenError}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-rose-200/60 flex justify-end">
              <Link
                href="/connexion"
                className="px-3 py-1.5 rounded-xl bg-[#111111] text-white text-[11px] font-bold hover:bg-black transition-colors"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* E-mail invité (lecture seule) */}
            <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[#777770] font-bold uppercase tracking-wider">
                  Adresse invitée
                </p>
                <p className="text-xs font-semibold text-[#111111] truncate max-w-[190px]">
                  {invitationData?.email}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-black text-white capitalize">
                {invitationData?.role}
              </span>
            </div>

            {/* Nom complet */}
            <div>
              <div className="relative flex items-center rounded-2xl bg-white border border-black/[0.1] focus-within:border-[#111111] focus-within:ring-1 focus-within:ring-[#111111] px-3.5 py-1.5 transition-all">
                <User className="h-4 w-4 text-[#888880] shrink-0 mr-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom complet"
                  className="w-full text-xs font-semibold text-[#111111] bg-transparent focus:outline-none placeholder:text-[#999990] py-2"
                />
              </div>
            </div>

            {/* Téléphone WhatsApp */}
            <div>
              <div className="relative flex items-center rounded-2xl bg-white border border-black/[0.1] focus-within:border-[#111111] focus-within:ring-1 focus-within:ring-[#111111] px-3.5 py-1.5 transition-all">
                <Phone className="h-4 w-4 text-[#888880] shrink-0 mr-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Numéro WhatsApp (ex: +22890001122)"
                  className="w-full text-xs font-semibold text-[#111111] bg-transparent focus:outline-none placeholder:text-[#999990] py-2"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <div className="relative flex items-center rounded-2xl bg-white border border-black/[0.1] focus-within:border-[#111111] focus-within:ring-1 focus-within:ring-[#111111] px-3.5 py-1.5 transition-all">
                <Lock className="h-4 w-4 text-[#888880] shrink-0 mr-2.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={10}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe (10 car. min)"
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
              <p className="text-[10px] text-[#888880] mt-1 pl-1">
                Au moins 10 caractères avec lettres et chiffres/symboles.
              </p>
            </div>

            {submitError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || password.length < 10 || !name.trim()}
              className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Activation du compte...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  <span>Activer mon compte</span>
                </span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
