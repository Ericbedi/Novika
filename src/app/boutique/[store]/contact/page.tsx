"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Truck,
  ShieldCheck,
  Send,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { MOCK_STORES } from "@/mock-data/stores";
import { MOCK_STOREFRONT_LOME } from "@/mock-data/storefront-data";
import { formatFcfa } from "@/lib/money";
import { getLiveStoreOpenStatus } from "@/lib/storefront-security";
import { resolveStorefrontData } from "@/lib/storefront-resolver";

export default function ContactPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store: storeSlug } = use(params);
  const resolved = resolveStorefrontData(storeSlug);
  const store = resolved.store;
  const storefront = resolved.storefront;
  const openStatus = getLiveStoreOpenStatus(0, 8, 19);

  // Formulaire de message
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Champ piège anti-robot
  const [isSent, setIsSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Vérification de sécurité anti-robot
    if (honeypot) {
      console.warn("Spam robot bloqué par honeypot.");
      setIsSent(true);
      return;
    }

    if (!senderName.trim() || !senderPhone.trim() || !message.trim()) {
      setErrorMsg("Veuillez renseigner votre nom, téléphone et message.");
      return;
    }

    if (message.length > 1000) {
      setErrorMsg("Le message ne peut pas dépasser 1 000 caractères.");
      return;
    }

    setIsSent(true);
    setSenderName("");
    setSenderPhone("");
    setMessage("");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      {/* Fil d'Ariane */}
      <div className="flex items-center gap-2 text-xs text-[#666660]">
        <Link href={`/boutique/${storeSlug}`} className="hover:text-[#111111]">
          Accueil
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-bold text-[#111111]">Contact & Délais de livraison</span>
      </div>

      <div className="border-b border-black/[0.08] pb-6">
        <h1 className="text-2xl sm:text-4xl font-black text-[#111111] tracking-tight">
          Contactez-Nous & Zones de Livraison
        </h1>
        <p className="text-xs sm:text-sm text-[#666660] mt-1">
          Notre équipe vous répond sous quelques minutes. Toutes nos livraisons s'effectuent avec paiement en espèces à réception.
        </p>
      </div>

      {/* GRILLE 2 COLONNES (COORDONNÉES & WHATSAPP À GAUCHE, FORMULAIRE À DROITE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLONNE GAUCHE (INFOS & WHATSAPP) : 5 colonnes */}
        <div className="lg:col-span-5 space-y-6">
          {/* Bouton WhatsApp en avant */}
          <div className="p-6 rounded-3xl bg-[#25D366]/10 border border-[#25D366]/30 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1e9d4d]">
                  Le plus rapide
                </span>
                <h3 className="text-sm font-black text-[#111111]">Support WhatsApp Direct</h3>
              </div>
            </div>
            <p className="text-xs text-[#444440] leading-relaxed">
              Discutez directement avec une conseillère commerciale de {store.name} pour poser vos questions, vérifier le stock ou suivre votre colis.
            </p>
            <a
              href={`https://wa.me/${storefront.contact.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `Bonjour ${store.name}, je souhaite avoir des renseignements sur vos produits et les livraisons.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20bd5a] transition-all shadow-sm cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Ouvrir WhatsApp ({storefront.contact.whatsappNumber})</span>
            </a>
          </div>

          {/* Coordonnées détaillées */}
          <div className="p-6 rounded-3xl bg-white border border-black/10 space-y-4 text-xs shadow-2xs">
            <h3 className="text-sm font-black text-[#111111]">Coordonnées de l'Entreprise</h3>

            <div className="space-y-3 text-[#444440]">
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-[#111111] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#111111] block">Téléphone Vendeur</span>
                  <span>{storefront.contact.phone}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-[#111111] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#111111] block">Courriel</span>
                  <span>{storefront.contact.email}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[#111111] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#111111] block">Adresse & Entrepôt</span>
                  <span>{storefront.contact.address}, {storefront.contact.city} ({storefront.contact.country})</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-[#111111] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#111111]">Horaires de Traitement</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${openStatus.isOpen
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-black/[0.06] text-[#666660]"
                        }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${openStatus.isOpen ? "bg-emerald-600 animate-pulse" : "bg-gray-400"
                          }`}
                      />
                      <span>{openStatus.statusLabel}</span>
                    </span>
                  </div>
                  <span className="block">{storefront.contact.openingHours}</span>
                  <span className="text-[10px] text-[#888880] block">{openStatus.nextOpenLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE (FORMULAIRE DE MESSAGE SÉCURISÉ) : 7 colonnes */}
        <div className="lg:col-span-7 rounded-3xl bg-white border border-black/10 p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-[#111111]">Envoyez-nous un Message</h2>
            <p className="text-xs text-[#666660] mt-1">
              Remplissez ce formulaire et notre service client vous recontactera par téléphone ou WhatsApp dans les 2 heures.
            </p>
          </div>

          {isSent ? (
            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-black text-emerald-950">Message transmis avec succès !</h3>
              <p className="text-xs text-emerald-900 leading-relaxed max-w-sm mx-auto">
                Merci ! Une conseillère de {store.name} a bien reçu votre demande et vous répondra très rapidement.
              </p>
              <button
                type="button"
                onClick={() => setIsSent(false)}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Champ Honeypot Anti-Robot (Caché pour piéger les scripts malveillants) */}
              <input
                type="text"
                name="website_url_honey"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Votre Nom et Prénom *</label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Ex : Koffi Mensah"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-white font-medium text-[#111111] focus:outline-hidden focus:border-black shadow-2xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">
                    Numéro de Téléphone (WhatsApp direct) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="Ex : +228 90 12 34 56"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-white font-medium text-[#111111] focus:outline-hidden focus:border-black shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Votre Message ou Question *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Posez votre question sur nos produits, un conseil personnalisé ou un suivi de commande..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-white font-medium text-[#111111] focus:outline-hidden focus:border-black shadow-2xs"
                />
                <span className="text-[10px] text-[#888880] block text-right">
                  {message.length} / 1 000 caractères
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                <span>Envoyer mon message</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* TABLEAU DES ZONES DE LIVRAISON ET TARIFS */}
      <div className="space-y-4 pt-6">
        <div>
          <h2 className="text-xl font-black text-[#111111]">Zones Desservies & Délais de Livraison</h2>
          <p className="text-xs text-[#666660] mt-0.5">
            Tarifs transparents par ville. Les frais de livraison sont réglés au livreur en même temps que votre colis.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-black/10 bg-white shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black/[0.08] bg-[#FAF8F5] text-[11px] font-bold uppercase tracking-wider text-[#666660]">
                <th className="p-4">Pays</th>
                <th className="p-4">Ville / Secteur</th>
                <th className="p-4">Délai Estimé</th>
                <th className="p-4">Frais de Livraison</th>
                <th className="p-4">Mode de Paiement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06] text-[#444440]">
              {storefront.contact.deliveryZones.map((z, idx) => (
                <tr key={idx} className="hover:bg-black/[0.02] transition-colors">
                  <td className="p-4 font-bold text-[#111111]">{z.country}</td>
                  <td className="p-4">{z.city}</td>
                  <td className="p-4 font-semibold text-emerald-800">{z.delayDays}</td>
                  <td className="p-4 font-black text-[#111111]">{formatFcfa(z.fee)}</td>
                  <td className="p-4">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Paiement Cash au Livreur
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
