"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Send,
  RefreshCw,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  Check,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { MOCK_PRODUCTS } from "@/mock-data/products";
import { MOCK_ORDERS } from "@/mock-data/orders";
import { MOCK_MESSAGE_TEMPLATES } from "@/mock-data/vague1-data";
import {
  parseWhatsAppOrderText,
  checkRecentDuplicateOrder,
  QuickOrderExtractedData,
} from "@/lib/quick-order-parser";
import { Money } from "@/components/app/money";
import { cn } from "@/lib/utils";

interface QuickOrderClientProps {
  storeSlug: string;
}

const SAMPLE_CONVERSATIONS: Array<{ title: string; text: string }> = [];

export function QuickOrderClient({ storeSlug }: QuickOrderClientProps) {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [isExtracted, setIsExtracted] = useState(false);
  const [extractedData, setExtractedData] = useState<QuickOrderExtractedData | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<any>(MOCK_PRODUCTS[0] || null);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<string>("confirmation");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExtract = () => {
    if (!rawText.trim()) {
      showToast("Veuillez coller le texte de la conversation d'abord.");
      return;
    }

    const { extracted, matchedProduct: prod, confidenceScore: score } = parseWhatsAppOrderText(
      rawText,
      MOCK_PRODUCTS
    );

    setExtractedData(extracted);
    if (prod) setMatchedProduct(prod);
    setConfidenceScore(score);

    // Vérification de doublon récent
    const dupCheck = checkRecentDuplicateOrder(
      extracted.customerPhone,
      extracted.productName,
      MOCK_ORDERS
    );
    if (dupCheck.isDuplicate) {
      setDuplicateWarning(dupCheck.details || "Commande similaire récente détectée.");
    } else {
      setDuplicateWarning(null);
    }

    setIsExtracted(true);
    showToast("Conversation analysée avec succès ! Vérifiez le brouillon.");
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractedData) return;

    // Simulation de création officielle de commande AfriBuilder
    showToast("Commande AfriBuilder validée et enregistrée !");
    setTimeout(() => {
      router.push(`/app/${storeSlug}/commandes`);
    }, 1200);
  };

  // Modèles de messages avec variables interpolées
  const activeTemplate = useMemo(() => {
    const tpl = MOCK_MESSAGE_TEMPLATES.find((t) => t.category === activeTemplateCategory) || MOCK_MESSAGE_TEMPLATES[0];
    if (!tpl) return { id: "none", name: "Modèle", category: activeTemplateCategory, bodyTemplate: "", interpolated: "" };
    const client = extractedData?.customerName || "Cher client";
    const prodName = matchedProduct ? ((matchedProduct as any).title || matchedProduct.name || "Produit") : "Produit";
    const prodPrice = matchedProduct ? ((matchedProduct as any).price || matchedProduct.salePrice || 0) : 0;
    const produit = extractedData?.productName || prodName;
    const montant = `${(prodPrice * (extractedData?.quantity || 1) + 2000).toLocaleString("fr-FR")} XOF`;
    const ville = extractedData?.city || "votre ville";
    const lien = "https://afribuilder.com";

    const interpolated = tpl.bodyTemplate
      .replace("{client}", client)
      .replace("{produit}", produit)
      .replace("{montant}", montant)
      .replace("{ville}", ville)
      .replace("{boutique}", storeSlug)
      .replace("{lien_suivi}", lien);

    return { ...tpl, interpolated };
  }, [activeTemplateCategory, extractedData, matchedProduct]);

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#1F3A26] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/app/${storeSlug}/commandes`}
            className="p-2 rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-[#111111] hover:bg-white transition-all shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#111111] flex items-center gap-2">
              <span>Nouvelle commande rapide (WhatsApp)</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                IA Assistée (K3)
              </span>
            </h1>
            <p className="text-xs text-[#666660] mt-0.5">
              Collez une conversation WhatsApp : l&apos;IA extrait le brouillon, que vous validez avant création.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche (7 cols) : Zone de texte & Brouillon généré */}
        <div className="lg:col-span-7 space-y-6">
          {/* Bloc de collage de conversation */}
          <div className="rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                1. Coller la conversation du client
              </span>
              <span className="text-[10px] text-[#888880] flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Protection injection active
              </span>
            </div>

            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Collez ici le message ou la conversation WhatsApp du client..."
              className="w-full p-3.5 text-xs rounded-2xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/[0.12] font-mono leading-relaxed placeholder:text-[#888880]"
            />

            {/* Raccourcis exemples */}
            {SAMPLE_CONVERSATIONS.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-[#888880] mr-1">Exemples rapides :</span>
                {SAMPLE_CONVERSATIONS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRawText(sample.text)}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-white border border-black/[0.08] text-[#111111] hover:bg-[#162B1C] hover:text-[#FAF8F5] transition-all cursor-pointer shadow-2xs"
                  >
                    {sample.title}
                  </button>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleExtract}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1F3A26] text-[#FAF8F5] text-xs font-bold hover:bg-[#162B1C] transition-all shadow-md cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Extraire avec l&apos;IA (Créer le brouillon)</span>
              </button>
            </div>
          </div>

          {/* Formulaire de validation du brouillon (Human-in-the-loop) */}
          {isExtracted && extractedData && (
            <form onSubmit={handleCreateOrder} className="rounded-3xl border border-black/[0.08] bg-white p-6 shadow-xl space-y-5 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#111111]">2. Brouillon extrait à vérifier</h3>
                    <p className="text-[11px] text-[#666660]">Validation humaine obligatoire avant enregistrement</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900">
                    Confiance : {Math.round(confidenceScore * 100)}%
                  </span>
                </div>
              </div>

              {/* Alerte Doublon Récent si détecté */}
              {duplicateWarning && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Alerte doublon potentiel :</span>
                    <p className="text-[11px] mt-0.5 leading-relaxed">{duplicateWarning}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Nom */}
                <div>
                  <label className="block text-[10px] font-bold text-[#666660] uppercase mb-1">Nom du client</label>
                  <input
                    type="text"
                    required
                    data-testid="quick-customer-name"
                    value={extractedData.customerName}
                    onChange={(e) => setExtractedData({ ...extractedData, customerName: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-[#111111] font-bold focus:outline-none"
                  />
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-[10px] font-bold text-[#666660] uppercase mb-1">Téléphone (WhatsApp)</label>
                  <input
                    type="text"
                    required
                    data-testid="quick-customer-phone"
                    value={extractedData.customerPhone}
                    onChange={(e) => setExtractedData({ ...extractedData, customerPhone: e.target.value })}
                    className="w-full p-2.5 text-xs font-mono rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-[#111111] font-bold focus:outline-none"
                  />
                </div>

                {/* Produit du catalogue */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-[#666660] uppercase mb-1">
                    Article associé au catalogue :
                  </label>
                  <select
                    value={matchedProduct.id}
                    onChange={(e) => {
                      const p = MOCK_PRODUCTS.find((prod) => prod.id === e.target.value);
                      if (p) setMatchedProduct(p);
                    }}
                    className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-[#111111] font-semibold focus:outline-none"
                  >
                    {MOCK_PRODUCTS.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {(prod as any).title || prod.name} — {((prod as any).price || prod.salePrice || 0).toLocaleString("fr-FR")} XOF
                      </option>
                    ))}
                  </select>
                </div>

                {/* Variante */}
                <div>
                  <label className="block text-[10px] font-bold text-[#666660] uppercase mb-1">Variante / Pack</label>
                  <input
                    type="text"
                    value={extractedData.variantName || ""}
                    onChange={(e) => setExtractedData({ ...extractedData, variantName: e.target.value })}
                    placeholder="Ex: Pack 2 boîtes / Taille L"
                    className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-[#111111] focus:outline-none"
                  />
                </div>

                {/* Quantité */}
                <div>
                  <label className="block text-[10px] font-bold text-[#666660] uppercase mb-1">Quantité</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={extractedData.quantity}
                    onChange={(e) => setExtractedData({ ...extractedData, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2.5 text-xs font-mono rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-[#111111] font-bold focus:outline-none"
                  />
                </div>

                {/* Ville */}
                <div>
                  <label className="block text-[10px] font-bold text-[#666660] uppercase mb-1">Ville & Commune</label>
                  <input
                    type="text"
                    required
                    data-testid="quick-city"
                    value={extractedData.city}
                    onChange={(e) => setExtractedData({ ...extractedData, city: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-[#111111] focus:outline-none"
                  />
                </div>

                {/* Adresse / Repère */}
                <div>
                  <label className="block text-[10px] font-bold text-[#666660] uppercase mb-1">Adresse ou Repère</label>
                  <input
                    type="text"
                    value={extractedData.address}
                    onChange={(e) => setExtractedData({ ...extractedData, address: e.target.value })}
                    placeholder="Carrefour, pharmacie, villa..."
                    className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              {/* Total prévisionnel */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#111111]">Montant total à encaisser (COD)</span>
                  <p className="text-[10px] text-[#888880]">Articles + 2 000 XOF livraison</p>
                </div>
                <div className="text-base font-black text-[#111111]">
                  <Money value={((matchedProduct as any).price || matchedProduct.salePrice || 0) * extractedData.quantity + 2000} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#1F3A26] text-[#FAF8F5] text-xs font-bold hover:bg-[#162B1C] transition-all shadow-md cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Valider et créer la commande officielle</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Colonne Droite (5 cols) : Modèles de Réponses Rapides WhatsApp */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-[#25D366]" />
                Modèles de réponses rapides
              </span>
              <span className="text-[10px] text-[#888880]">WhatsApp 1-clic</span>
            </div>

            {/* Onglets catégories */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {[
                { id: "confirmation", label: "Confirmation" },
                { id: "pricing", label: "Tarif & Offre" },
                { id: "delivery_tracking", label: "Lien de suivi" },
                { id: "followup", label: "Relance" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTemplateCategory(tab.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer",
                    activeTemplateCategory === tab.id
                      ? "bg-[#1F3A26] text-[#FAF8F5] shadow-2xs"
                      : "bg-white text-[#666660] border border-black/[0.06] hover:bg-white"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Aperçu du message avec variables automatiquement insérées */}
            <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-2">
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                <span className="text-xs font-bold text-[#111111]">{(activeTemplate as any).title || (activeTemplate as any).name}</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Variables auto
                </span>
              </div>
              <p className="text-xs text-[#111111] leading-relaxed whitespace-pre-wrap font-sans">
                {activeTemplate.interpolated}
              </p>
            </div>

            {/* Boutons d'action pour la réponse */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeTemplate.interpolated);
                  showToast("Modèle copié dans le presse-papier !");
                }}
                className="flex-1 py-2 px-3 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copier</span>
              </button>
              <a
                href={`https://wa.me/${(extractedData?.customerPhone || "+2250748291102").replace(/\D/g, "")}?text=${encodeURIComponent(
                  activeTemplate.interpolated
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#1EBE5D] transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Envoyer WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
