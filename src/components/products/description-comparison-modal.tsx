"use client";

import React, { useState } from "react";
import { X, ShieldCheck, AlertTriangle, CheckCircle, Code, Eye, ExternalLink, Calendar, Sparkles } from "lucide-react";
import { Product } from "@/server/data/types";
import { ProductDescription } from "./product-description";
import { HtmlSanitizeReport } from "@/lib/server-html-sanitizer";
import { cn } from "@/lib/utils";

interface DescriptionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onEditInForm?: (product: Product) => void;
}

/**
 * Modale de comparaison Avant / Après de la description produit (Prompt 17-F, 4).
 * Affiche côte à côte :
 * - À gauche : Description brute d'origine (conservée 30 jours)
 * - À droite : Description assainie et mise en forme Novika
 * - Rapport honnête sur les modifications (sécurité vs mise en forme simplifiée)
 */
export function DescriptionComparisonModal({
  isOpen,
  onClose,
  product,
  onEditInForm,
}: DescriptionComparisonModalProps) {
  const [activeTab, setActiveTab] = useState<"visual" | "raw">("visual");

  if (!isOpen || !product) return null;

  const rawOriginal = product.originalRawDescription || product.description;
  const cleanedNovika = product.description;
  const report = product.sanitizationReport;

  // Calcul du délai restant sur les 30 jours de conservation
  const importedDate = product.importedAt ? new Date(product.importedAt) : new Date(product.createdAt);
  const expirationDate = new Date(importedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const daysLeft = Math.max(0, Math.ceil((expirationDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

  return (
    <div
      data-testid="description-comparison-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200"
    >
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-[#E6E0D4] overflow-hidden">
        {/* En-tête */}
        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E6E0D4] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-[#111111]">
                Contrôle de la description : {product.title || product.name}
              </h3>
              {report?.status === "clean" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>Sans changement</span>
                </span>
              )}
              {report?.status === "simplified" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  <AlertTriangle className="w-3 h-3 text-blue-600" />
                  <span>Mise en forme simplifiée</span>
                </span>
              )}
              {report?.status === "sanitized" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <ShieldCheck className="w-3 h-3 text-amber-700" />
                  <span>Éléments retirés par sécurité</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#7A7A7A] mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#7A7A7A]" />
              <span>
                Version brute d'origine archivée en lecture seule pour encore <strong>{daysLeft} jour(s)</strong>.
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "visual" ? "raw" : "visual")}
              className="px-3 py-1.5 rounded-xl border border-[#E6E0D4] hover:bg-white text-xs font-semibold text-[#111111] flex items-center gap-1.5 transition-colors"
            >
              {activeTab === "visual" ? (
                <>
                  <Code className="w-3.5 h-3.5 text-[#7A7A7A]" />
                  <span>Voir code source brut</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-[#7A7A7A]" />
                  <span>Voir rendu visuel</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#7A7A7A] hover:text-black hover:bg-black/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Rapport synthétique honnête */}
        {report && (report.removedSecurityElements.length > 0 || report.simplifiedStyles.length > 0) && (
          <div className="px-6 py-2.5 bg-amber-50/70 border-b border-amber-200/80 text-xs text-amber-950 flex flex-wrap items-center gap-4 shrink-0">
            {report.removedSecurityElements.length > 0 && (
              <div className="flex items-center gap-1.5 font-medium">
                <span className="font-bold text-rose-700">Sécurité neutralisée :</span>
                <span>{report.removedSecurityElements.join(" • ")}</span>
              </div>
            )}
            {report.simplifiedStyles.length > 0 && (
              <div className="flex items-center gap-1.5 font-medium">
                <span className="font-bold text-amber-800">Styles adaptés :</span>
                <span>{report.simplifiedStyles.join(" • ")}</span>
              </div>
            )}
          </div>
        )}

        {/* Corps : Comparateur Avant / Après côte à côte */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E6E0D4] overflow-y-auto min-h-[350px]">
          {/* Colonne Gauche : Description d'origine */}
          <div className="p-6 flex flex-col space-y-3 bg-[#FCFBF8]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E0D4]/70">
              <span className="text-xs font-black uppercase tracking-wider text-[#7A7A7A]">
                Description d'origine (Source brute)
              </span>
              <span className="text-[11px] font-semibold text-[#8C827A] bg-[#F0EBE0] px-2 py-0.5 rounded-md">
                Lecture seule (30 jours)
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[460px] p-3 rounded-2xl bg-white border border-[#E6E0D4] text-xs">
              {activeTab === "raw" ? (
                <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-[#4A4A4A] select-all">
                  {rawOriginal}
                </pre>
              ) : (
                <div
                  className="prose prose-xs max-w-none text-[#4A4A4A] overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: rawOriginal }}
                />
              )}
            </div>
          </div>

          {/* Colonne Droite : Rendu Novika Assaini */}
          <div className="p-6 flex flex-col space-y-3 bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E0D4]/70">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Rendu Novika sécurisé (Vitrine)</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Style standardisé & Responsive
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[460px] p-4 rounded-2xl bg-[#FAF8F5]/50 border border-[#E6E0D4]">
              {activeTab === "raw" ? (
                <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-[#111111] select-all">
                  {cleanedNovika}
                </pre>
              ) : (
                <ProductDescription
                  html={cleanedNovika}
                  productTitle={product.title || product.name}
                  isStorefront={true}
                />
              )}
            </div>
          </div>
        </div>

        {/* Pied de modale avec actions */}
        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E6E0D4] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-[#7A7A7A]">
            La description nettoyée garantit une conformité totale, un temps de chargement optimal et l'absence de failles XSS.
          </span>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onEditInForm && (
              <button
                type="button"
                id="btn-edit-description-in-form"
                onClick={() => {
                  onClose();
                  onEditInForm(product);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#111111] hover:bg-black/5 text-[#111111] text-xs font-bold transition-colors"
              >
                Modifier dans l'éditeur
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-black shadow-xs transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
