"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight, RotateCcw } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function VerificationPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newCode = [...code];
    newCode[index] = val.slice(-1);
    setCode(newCode);

    // Auto-focus prochain champ
    if (val && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setError("Veuillez saisir les 6 chiffres du code");
      return;
    }
    // Simulation validation code
    if (typeof window !== "undefined") {
      localStorage.setItem("novika_user_verified", "true");
    }
    router.push("/bienvenue");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111111] flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-[440px] w-full mx-auto my-auto">
        <div className="flex justify-center mb-6">
          <Logo variant="full" tone="light" size={32} />
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.08] shadow-sm text-center">
          <div className="h-12 w-12 rounded-2xl bg-[#0B1521] text-[#F26522] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <h1 className="text-xl font-black text-[#0B1521] mb-2">Vérification de sécurité</h1>
          <p className="text-xs text-[#666660] mb-6">
            Entrez le code à 6 chiffres envoyé sur votre adresse e-mail ou WhatsApp.
          </p>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center gap-2">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  id={`digit-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  className="w-11 h-14 text-center text-xl font-black rounded-xl border border-black/[0.15] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#D35400]"
                />
              ))}
            </div>

            {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}

            <button
              type="submit"
              id="verify-code-btn"
              className="w-full h-11 rounded-xl font-bold bg-[#D35400] text-white hover:bg-[#B84700] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Valider le code</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-black/[0.06] text-xs text-[#888880]">
            {countdown > 0 ? (
              <span>Renvoyer un code dans {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={() => setCountdown(60)}
                className="font-bold text-[#D35400] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Renvoyer le code</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
