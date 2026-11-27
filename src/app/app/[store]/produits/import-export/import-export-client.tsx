"use client";

import { publishActiveProducts } from "@/lib/publish-products";
import React, { useState } from "react";
import { Download, Upload, FileSpreadsheet, ArrowDownUp, CheckCircle2, AlertCircle } from "lucide-react";
import { ProductsNavTabs } from "@/components/products/products-nav-tabs";
import { CsvImportModal } from "@/components/products/csv-import-modal";
import { CSV_SAMPLE_TEMPLATE, sanitizeCellForCsv } from "@/lib/csv-import-engine";
import { useApp } from "@/components/layout/app-shell";
import { canImportProducts } from "@/config/permissions";
import { getShopProductsRaw } from "@/lib/products-store";

interface ImportExportClientProps {
  storeSlug: string;
}

export function ImportExportClient({ storeSlug }: ImportExportClientProps) {
  const { activeRole } = useApp();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canImport = canImportProducts(activeRole);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadSampleCsv = () => {
    const blob = new Blob([CSV_SAMPLE_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `modele_import_produits_novika.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Modèle CSV téléchargé.");
  };

  const handleExportProductsCsv = () => {
    const products = getShopProductsRaw(storeSlug).filter((p) => !p.deletedAt);

    if (products.length === 0) {
      showToast("Aucun produit à exporter.");
      return;
    }

    const headers = [
      "ID",
      "Nom",
      "Slug",
      "Statut",
      "Prix Vente (FCFA)",
      "Prix Revient (FCFA)",
      "Stock Disponible",
      "Suivi Stock",
      "Catégorie",
      "Collection",
      "Fournisseur",
      "SKU",
      "Balises",
      "Date Création",
    ];

    const rows = products.map((p) => [
      sanitizeCellForCsv(p.id),
      sanitizeCellForCsv(p.name || p.title || ""),
      sanitizeCellForCsv(p.slug || ""),
      sanitizeCellForCsv(p.productStatus || "active"),
      sanitizeCellForCsv(p.salePrice ?? p.price ?? 0),
      sanitizeCellForCsv(p.costPrice ?? 0),
      sanitizeCellForCsv(p.trackQuantity === false ? "Non suivi" : p.availableStock ?? p.stock ?? 0),
      sanitizeCellForCsv(p.trackQuantity === false ? "NON" : "OUI"),
      sanitizeCellForCsv(p.category || ""),
      sanitizeCellForCsv(p.collection || ""),
      sanitizeCellForCsv(p.supplierName || ""),
      sanitizeCellForCsv(p.sku || ""),
      sanitizeCellForCsv((p.tags || []).join("; ")),
      sanitizeCellForCsv(p.createdAt || ""),
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `catalogue_produits_${storeSlug}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`${products.length} produit(s) exporté(s) en CSV.`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 text-[#111111]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <ProductsNavTabs storeSlug={storeSlug} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
              Import / Export de Produits
            </h1>
            <p className="text-sm text-[#7A7A7A] mt-1">
              Gérez votre catalogue en masse via des fichiers CSV compatibles Excel et Google Sheets.
            </p>
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#1F3A26] text-white px-4 py-3 rounded-xl shadow-xl text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Carte Import */}
          <div className="bg-white rounded-2xl border border-[#E6E0D4] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-700">
                <Upload className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#111111] mb-2">Importer des produits (CSV)</h2>
              <p className="text-sm text-[#4A4A4A] mb-4">
                Ajoutez de nouveaux produits ou mettez à jour votre inventaire en important un fichier CSV avec glisser-déposer et prévisualisation instantanée.
              </p>
              <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#E6E0D4] mb-4 text-xs text-[#555555] space-y-1">
                <p className="font-semibold text-[#111111]">Colonnes acceptées :</p>
                <p>Nom, Prix de vente, Prix de revient, Stock, Catégorie, Images, SKU, Tags...</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#E6E0D4]">
              {canImport ? (
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F3A26] text-white font-medium hover:bg-[#162B1C] transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Lancer l'importation</span>
                </button>
              ) : (
                <div className="flex-1 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Droit d'importation réservé aux administrateurs.</span>
                </div>
              )}
              <button
                onClick={handleDownloadSampleCsv}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E6E0D4] text-[#111111] font-medium hover:bg-[#F3EFE6] transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger le modèle</span>
              </button>
            </div>
          </div>

          {/* Carte Export */}
          <div className="bg-white rounded-2xl border border-[#E6E0D4] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-4 text-blue-700">
                <Download className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#111111] mb-2">Exporter le catalogue (CSV)</h2>
              <p className="text-sm text-[#4A4A4A] mb-4">
                Téléchargez l'intégralité de vos produits actifs et archivés dans un fichier CSV encodé en UTF-8 avec point-virgule, prêt pour Excel et la comptabilité.
              </p>
              <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#E6E0D4] mb-4 text-xs text-[#555555] space-y-1">
                <p className="font-semibold text-[#111111]">Données exportées :</p>
                <p>Identifiants, prix, marges, stock réel, statut du suivi, collections et balises.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E6E0D4]">
              <button
                onClick={handleExportProductsCsv}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#111111] text-[#111111] font-medium hover:bg-[#F3EFE6] transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exporter tous les produits</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal d'importation CSV */}
        <CsvImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          storeSlug={storeSlug}
          activeRole={activeRole}
          existingProducts={getShopProductsRaw(storeSlug)}
          onImportSuccess={(importedProducts) => {
            setIsImportModalOpen(false);
            showToast(`${importedProducts.length} produit(s) importé(s) avec succès !`);
            publishActiveProducts(storeSlug, activeRole).then((r) => {
              if (r.ok && r.count > 0) showToast(`${r.count} produit(s) mis en ligne sur la vitrine !`);
            });
          }}
        />
      </div>
    </div>
  );
}
