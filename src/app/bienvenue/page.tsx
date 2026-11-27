"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function BienvenuePage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [sector, setSector] = useState("cosmetics");
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    router.push("/demarrer");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111111] flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-[500px] w-full mx-auto my-auto">
        <div className="flex justify-center mb-6">
          <Logo variant="full" tone="light" size={32} />
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.08] shadow-sm">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-3">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Compte vérifié avec succès</span>
          </div>

          <h1 className="text-2xl font-black text-[#0B1521] tracking-tight mb-2">
            Bienvenue dans la bêta Kelio
          </h1>
          <p className="text-xs sm:text-sm text-[#666660] mb-6 leading-relaxed">
            Vous avez accès à l'ensemble des modules : closing, flotte de livreurs, preuves de remise et suivi de caisse.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Nom de votre première boutique *
              </label>
              <input
                type="text"
                required
                placeholder="Ex. Lomé Glow / Abidjan Elegance"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-black/[0.12] bg-[#FAF8F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Secteur d'activité principal
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-black/[0.12] bg-[#FAF8F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]"
              >
                <option value="cosmetics">Cosmétique & Soins</option>
                <option value="fashion">Mode & Chaussures</option>
                <option value="electronics">Électronique & Gadgets</option>
                <option value="health">Santé & Bien-être</option>
                <option value="home">Maison & Décoration</option>
                <option value="other">Autre commerce</option>
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs space-y-1.5 mt-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <ShieldCheck className="h-4 w-4" />
                <span>Règles de bonne conduite en Bêta</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Kelio s'engage à protéger vos données financières. En retour, les membres s'engagent à traiter des commandes réelles et à respecter leurs clients.
              </p>
            </div>

            <label className="flex items-start gap-2.5 pt-2 text-xs text-[#555550] cursor-pointer">
              <input
                type="checkbox"
                required
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded border-black/[0.2] text-[#D35400] focus:ring-[#D35400]"
              />
              <span>J'accepte les conditions de la bêta et je souhaite configurer ma boutique.</span>
            </label>

            <button
              type="submit"
              id="start-onboarding-btn"
              disabled={!agreed}
              className="w-full h-12 rounded-xl font-bold bg-[#D35400] text-white hover:bg-[#B84700] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              <span>Continuer vers l'installation</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
