"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Truck,
  MessageCircle,
} from "lucide-react";

export default function WaitlistPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("TG");
  const [businessType, setBusinessType] = useState("cosmetique");
  const [ordersEstimate, setOrdersEstimate] = useState("50-200");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F3EFE6] text-[#111111] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-black/[0.08]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#111111] flex items-center justify-center text-[#FAF8F5] font-black text-sm">
            A
          </div>
          <span className="font-black text-base tracking-tight text-[#111111]">
            AfriBuilder
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#C2410C] border border-orange-200">
            Bêta Privée 2026
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto w-full py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-4xl font-black text-[#111111] tracking-tight">
            Rejoindre la Bêta Privée
          </h1>
          <p className="text-xs sm:text-sm text-[#666660] max-w-md mx-auto leading-relaxed">
            La première plateforme e-commerce africaine conçue pour le Cash-on-Delivery, les closeuses WhatsApp et les flottes de livreurs.
          </p>
        </div>

        {submitted ? (
          <div className="p-8 rounded-3xl bg-white border border-black/10 shadow-lg text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-black text-[#111111]">
              Votre candidature a bien été enregistrée !
            </h2>
            <p className="text-xs text-[#666660] leading-relaxed max-w-sm mx-auto">
              Merci {fullName}. Nos équipes examinent votre demande sous 48 heures. Dès qu'une place se libère, vous recevrez votre code d'accès personnel par WhatsApp au {phone}.
            </p>
            <div className="pt-2">
              <Link
                href="/auth/inscription"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black"
              >
                <span>Vous avez déjà un code d'invitation ?</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 rounded-3xl bg-white border border-black/10 shadow-lg space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                Nom complet ou nom commercial <span className="text-[#C2410C]">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Aïcha Diallo - Dakar Prestige"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-black/10 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                  Numéro WhatsApp <span className="text-[#C2410C]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+221 77 123 45 67"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-black/10 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                  E-mail professionnel <span className="text-[#C2410C]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@maboutique.com"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-black/10 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                  Pays d'opération principal
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-black/10 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="TG">Togo (Lomé)</option>
                  <option value="CI">Côte d'Ivoire (Abidjan)</option>
                  <option value="SN">Sénégal (Dakar)</option>
                  <option value="BJ">Bénin (Cotonou)</option>
                  <option value="CM">Cameroun (Douala/Yaoundé)</option>
                  <option value="CD">RD Congo (Kinshasa)</option>
                  <option value="NG">Nigeria (Lagos)</option>
                  <option value="GH">Ghana (Accra)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                  Secteur d'activité
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-black/10 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="cosmetique">Cosmétique & Soins Beauté</option>
                  <option value="mode">Mode, Chaussures & Maroquinerie</option>
                  <option value="electronique">Électronique & Téléphonie</option>
                  <option value="sante">Santé, Minceur & Bien-être</option>
                  <option value="maison">Maison & Décoration</option>
                  <option value="autre">Autre secteur</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                Volume de commandes mensuel estimé
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "1-50", label: "1 à 50" },
                  { id: "50-200", label: "50 à 200" },
                  { id: "200-1000", label: "200 à 1 000" },
                  { id: "1000+", label: "1 000+" },
                ].map((vol) => (
                  <button
                    key={vol.id}
                    type="button"
                    onClick={() => setOrdersEstimate(vol.id)}
                    className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                      ordersEstimate === vol.id
                        ? "border-[#111111] bg-[#111111] text-[#FAF8F5]"
                        : "border-black/10 bg-white text-[#666660] hover:text-[#111111]"
                    }`}
                  >
                    {vol.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#C2410C] text-white text-xs font-bold hover:bg-[#9A3412] transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Envoyer ma candidature pour la bêta</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-[11px] text-[#888880] pt-6 border-t border-black/[0.08]">
        AfriBuilder 2026 · Infrastructure e-commerce COD pour l'Afrique de l'Ouest et Centrale.
      </footer>
    </div>
  );
}
