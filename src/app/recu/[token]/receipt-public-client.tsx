"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Printer,
  Download,
  MessageCircle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  HeartHandshake,
  Star,
  ExternalLink,
  ChevronRight,
  Package,
} from "lucide-react";
import { Receipt } from "@/server/data/receipt-types";
import { recordReceiptView } from "@/lib/receipts-engine";
import { formatFcfa } from "@/lib/money";

interface ReceiptPublicClientProps {
  initialReceipt: Receipt;
}

export function ReceiptPublicClient({ initialReceipt }: ReceiptPublicClientProps) {
  const [receipt, setReceipt] = useState<Receipt>(initialReceipt);

  // Enregistrement de consultation SANS enregistrement d'IP ni de device ID
  useEffect(() => {
    // Appel du moteur pour incrémenter les vues
    const updated = recordReceiptView(initialReceipt);
    if (updated) {
      setReceipt(updated);
    }
  }, [initialReceipt]);

  const isRtl = receipt.items.some((it) => it.receiptContent?.language === "ar");

  // Formatage de la date de livraison
  const formattedDeliveryDate = new Date(receipt.deliveredAt).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Lien direct WhatsApp vers la boutique
  const storeWhatsAppClean = (receipt.storeSnapshot.whatsapp || receipt.storeSnapshot.phone || "").replace(
    /[^0-9]/g,
    ""
  );
  const waContactUrl = `https://wa.me/${storeWhatsAppClean}?text=${encodeURIComponent(
    `Bonjour ${receipt.storeSnapshot.name}, j'ai une question concernant mon reçu ${receipt.receiptNumber} (Commande ${receipt.orderNumber}).`
  )}`;

  return (
    <div
      id="receipt-public-container"
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-[#FAF8F5] text-[#111111] antialiased py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Barre d'action rapide (masquée à l'impression) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-black/[0.08] shadow-2xs print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Reçu officiel • Commande payée et livrée</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              id="btn-print-receipt"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-black/5 text-[#111111] text-xs font-bold border border-black/10 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer / PDF</span>
            </button>

            <a
              href={waContactUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="btn-receipt-whatsapp-help"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Aide WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Fiche principale du reçu (imprimable) */}
        <div className="bg-white rounded-3xl border border-black/[0.08] shadow-sm overflow-hidden print:border-none print:shadow-none">
          {/* En-tête de la boutique */}
          <div className="p-6 sm:p-8 border-b border-black/[0.06] bg-gradient-to-b from-[#FAF8F5] to-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-[#111111] text-white flex items-center justify-center font-black text-xl shadow-inner">
                    {receipt.storeSnapshot.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-[#111111]">
                      {receipt.storeSnapshot.name}
                    </h1>
                    <p className="text-xs text-[#666660]">
                      {receipt.storeSnapshot.phone && <span>Tél : {receipt.storeSnapshot.phone} • </span>}
                      {receipt.storeSnapshot.email}
                    </p>
                  </div>
                </div>

                {receipt.storeSnapshot.legalMentions && (
                  <p className="text-[10px] text-[#888880] font-mono">
                    {receipt.storeSnapshot.legalMentions}
                  </p>
                )}
              </div>

              {/* Numéro et Date */}
              <div className="text-left sm:text-right space-y-1">
                <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Reçu de livraison
                </span>
                <p id="receipt-number" className="text-sm font-black font-mono text-[#111111]">
                  {receipt.receiptNumber}
                </p>
                <p className="text-xs text-[#666660]">
                  Réf. <span className="font-mono font-medium">{receipt.orderNumber}</span>
                </p>
                <p className="text-xs text-[#888880] capitalize">
                  Livré le {formattedDeliveryDate}
                </p>
              </div>
            </div>

            {/* Carte client (Prénom & Ville uniquement, sans adresse complète ni téléphone) */}
            <div className="mt-6 p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.05] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#888880] uppercase tracking-wider">
                  Destinataire
                </span>
                <p id="receipt-customer-name" className="text-sm font-black text-[#111111]">
                  {receipt.customerFirstName}
                </p>
                <p id="receipt-customer-city" className="text-xs text-[#666660]">
                  {receipt.customerCity}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold text-[#888880] uppercase tracking-wider">
                  Mode de règlement
                </span>
                <p className="text-xs font-bold text-[#111111]">{receipt.paymentMethod}</p>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" />
                  Réglé en totalité
                </span>
              </div>
            </div>
          </div>

          {/* Liste des articles livrés */}
          <div className="p-6 sm:p-8 space-y-6">
            <h2 className="text-xs font-bold text-[#888880] uppercase tracking-wider">
              {receipt.scope === "single_item" ? "Article livré" : "Articles livrés"}
            </h2>

            <div className="divide-y divide-black/[0.06]">
              {receipt.items.map((item, idx) => (
                <div key={item.orderItemId || idx} className="py-5 first:pt-0 last:pb-0 space-y-4">
                  {/* Ligne produit financière */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-[#FAF8F5] border border-black/10 flex items-center justify-center shrink-0 overflow-hidden">
                        <Package className="w-6 h-6 text-[#888880]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#111111]">{item.productName}</h3>
                        {item.variantName && (
                          <p className="text-xs text-[#666660]">Option : {item.variantName}</p>
                        )}
                        <p className="text-xs text-[#888880] mt-0.5">
                          Quantité : <strong className="text-[#111111]">{item.quantity}</strong> ×{" "}
                          {formatFcfa(item.unitPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[#111111]">
                        {formatFcfa(item.finalPrice)}
                      </p>
                      {item.discountShare > 0 && (
                        <p className="text-[11px] text-emerald-700 font-medium">
                          Remise incluse : -{formatFcfa(item.discountShare)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bloc spécifique du reçu : Conseils, Précautions, Garantie, Entretien */}
                  {item.receiptContent && (
                    <div className="mt-3 p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] space-y-3.5 text-xs text-[#111111]">
                      {item.receiptContent.usageInstructions && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-[#111111]">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>Conseils d'utilisation :</span>
                          </div>
                          <p className="text-xs text-[#666660] leading-relaxed whitespace-pre-line pl-5">
                            {item.receiptContent.usageInstructions}
                          </p>
                        </div>
                      )}

                      {item.receiptContent.precautions && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-[#111111]">
                            <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Précautions d'emploi :</span>
                          </div>
                          <p className="text-xs text-[#666660] leading-relaxed whitespace-pre-line pl-5">
                            {item.receiptContent.precautions}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-black/[0.05]">
                        {item.receiptContent.warranty && (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-[#111111]">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Garantie :</span>
                            </div>
                            <p className="text-[11px] text-[#666660] pl-5 leading-normal">
                              {item.receiptContent.warranty}
                            </p>
                          </div>
                        )}

                        {item.receiptContent.returnTerms && (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-[#111111]">
                              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                              <span>Retour / Échange :</span>
                            </div>
                            <p className="text-[11px] text-[#666660] pl-5 leading-normal">
                              {item.receiptContent.returnTerms}
                            </p>
                          </div>
                        )}
                      </div>

                      {item.receiptContent.careAdvice && (
                        <div className="pt-1 border-t border-black/[0.05]">
                          <span className="font-bold text-[#111111]">Entretien : </span>
                          <span className="text-[#666660]">{item.receiptContent.careAdvice}</span>
                        </div>
                      )}

                      {item.receiptContent.thankYouNote && (
                        <div className="pt-2 border-t border-black/[0.05] flex items-start gap-2 text-[#666660] italic">
                          <HeartHandshake className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <span>« {item.receiptContent.thankYouNote} »</span>
                        </div>
                      )}

                      {item.receiptContent.includeReviewLink && (
                        <div className="pt-2 print:hidden flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#111111]">
                            Votre avis compte beaucoup pour nous
                          </span>
                          <a
                            href={receipt.reviewLink || `#avis`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-black transition-colors"
                          >
                            <Star className="w-3 h-3 fill-black text-black" />
                            <span>Donner mon avis</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Récapitulatif financier */}
            <div className="pt-6 border-t border-black/[0.08] space-y-2">
              <div className="flex justify-between text-xs text-[#666660]">
                <span>Sous-total articles</span>
                <span className="font-medium text-[#111111]">{formatFcfa(receipt.subtotal)}</span>
              </div>

              {receipt.discountTotal > 0 && (
                <div className="flex justify-between text-xs text-emerald-700 font-medium">
                  <span>Remise déduite</span>
                  <span>− {formatFcfa(receipt.discountTotal)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-[#666660]">
                <span>Frais de livraison</span>
                <span className="font-bold text-emerald-700">
                  {receipt.shippingFee === 0 ? "Gratuite" : formatFcfa(receipt.shippingFee)}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-3 border-t border-black/[0.08]">
                <span className="text-sm font-black text-[#111111]">Montant total payé</span>
                <span id="receipt-total-paid" className="text-lg font-black text-emerald-700">
                  {formatFcfa(receipt.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Pied du reçu : Mention légale personnalisable */}
          <div className="p-6 sm:p-8 bg-[#FAF8F5] border-t border-black/[0.06] text-center space-y-2">
            <p className="text-xs text-[#666660] max-w-md mx-auto leading-relaxed">
              {receipt.legalNotice}
            </p>
            <p className="text-[10px] text-[#888880]">
              Émis de manière numérique et sécurisée par la plateforme AfriBuilder.
            </p>
          </div>
        </div>

        {/* Liens utiles additionnels (masqués à l'impression) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#666660] print:hidden px-2">
          <Link
            href={`/suivi/${receipt.token}`}
            className="hover:text-[#111111] font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Historique de la commande {receipt.orderNumber}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <a
            href={waContactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#111111] font-semibold flex items-center gap-1 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Service client {receipt.storeSnapshot.name}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
