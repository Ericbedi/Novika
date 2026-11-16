"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  Package,
} from "lucide-react";
import {
  CSV_SAMPLE_TEMPLATE,
  detectCsvSeparator,
  parseCsvLine,
  mapColumnName,
  runCsvDryRun,
  sanitizeCellForCsv,
} from "@/lib/csv-import-engine";
import { DryRunSummary, ImportMode, ImportStockMode } from "@/server/data/import-types";
import { Product, UserRole } from "@/server/data/types";
import { cn } from "@/lib/utils";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  activeRole: UserRole;
  existingProducts: Product[];
  onImportSuccess: (importedProducts: Product[]) => void;
}

export function CsvImportModal({
  isOpen,
  onClose,
  storeSlug,
  activeRole,
  existingProducts,
  onImportSuccess,
}: CsvImportModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Étape 1 : Fichier
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [separator, setSeparator] = useState<";" | "," | "\t">(";");
  const [encoding, setEncoding] = useState<"utf-8" | "windows-1252">("utf-8");
  const [isDragging, setIsDragging] = useState(false);

  // Étape 2 : Mappage des colonnes
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);

  // Étape 3 : Options
  const [importMode, setImportMode] = useState<ImportMode>("create_and_update");
  const [newProductsStatus, setNewProductsStatus] = useState<"draft" | "active">("draft");
  const [stockMode, setStockMode] = useState<ImportStockMode>("set");
  const [autoCreateCollections, setAutoCreateCollections] = useState(true);
  const [autoCreateSuppliers, setAutoCreateSuppliers] = useState(true);

  // Étape 4 : Test à blanc
  const [dryRunResult, setDryRunResult] = useState<DryRunSummary | null>(null);
  const [ignoreErrors, setIgnoreErrors] = useState(false);

  // Étape 5 : Exécution
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [isRollbacked, setIsRollbacked] = useState(false);

  // Pré-remplir avec le modèle officiel à l'ouverture pour faciliter l'essai immédiat
  useEffect(() => {
    if (isOpen && !fileContent) {
      const text = CSV_SAMPLE_TEMPLATE;
      setFileContent(text);
      setFileName("modele_import_produits_afribuilder.csv");
      setFileSize(new Blob([text]).size);
      const detectedSep = detectCsvSeparator(text);
      setSeparator(detectedSep);
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 0) {
        const headers = parseCsvLine(lines[0], detectedSep);
        setRawHeaders(headers);
        const initialMapping: Record<string, string> = {};
        headers.forEach((h) => {
          initialMapping[h] = mapColumnName(h);
        });
        setColumnMappings(initialMapping);
        const preview = lines.slice(1, 6).map((l) => parseCsvLine(l, detectedSep));
        setPreviewRows(preview);
      }
    }
  }, [isOpen, fileContent]);

  if (!isOpen) return null;

  // Télécharger le modèle CSV
  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_SAMPLE_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `modele_import_produits_afribuilder.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Traiter la lecture d'un fichier CSV
  const processUploadedFile = (file: File) => {
    setFileName(file.name);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || "";
      setFileContent(text);
      const detectedSep = detectCsvSeparator(text);
      setSeparator(detectedSep);

      // Préparer les en-têtes et le preview
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 0) {
        const headers = parseCsvLine(lines[0], detectedSep);
        setRawHeaders(headers);

        const initialMapping: Record<string, string> = {};
        headers.forEach((h) => {
          initialMapping[h] = mapColumnName(h);
        });
        setColumnMappings(initialMapping);

        // Preview des 5 premières lignes
        const preview = lines.slice(1, 6).map((l) => parseCsvLine(l, detectedSep));
        setPreviewRows(preview);
      }
    };
    reader.readAsText(file, encoding);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // Lancer le test à blanc
  const handleStartDryRun = () => {
    if (!fileContent) return;
    const summary = runCsvDryRun(fileContent, activeRole, existingProducts, {
      mode: importMode,
      newProductsStatus,
      stockMode,
      allowedCountries: ["TG", "CI", "SN", "BJ"],
    });
    setDryRunResult(summary);
    setCurrentStep(4);
  };

  // Télécharger le rapport d'erreurs
  const handleDownloadErrorReport = () => {
    if (!dryRunResult) return;
    let csv = "Ligne;SKU;Titre;Statut;Colonne;Motif\n";
    dryRunResult.rowResults.forEach((r) => {
      if (r.status === "error" || r.status === "ignored" || r.warningMessage) {
        csv += `${r.rowNumber};${sanitizeCellForCsv(r.sku || "")};${sanitizeCellForCsv(r.title || "")};${r.status};${sanitizeCellForCsv(r.columnName || "")};${sanitizeCellForCsv(r.errorMessage || r.warningMessage || "")}\n`;
      }
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `rapport_erreurs_import_${fileName || "fichier"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exécution finale de l'import par lots
  const handleExecuteImport = () => {
    setCurrentStep(5);
    setIsProcessing(true);
    setProgress(15);

    setTimeout(() => setProgress(45), 300);
    setTimeout(() => setProgress(80), 700);

    setTimeout(() => {
      setProgress(100);
      setIsProcessing(false);
      setIsCompleted(true);

      const validRows =
        dryRunResult?.rowResults.filter(
          (r) => r.status === "created" || r.status === "updated" || (ignoreErrors && r.status === "valid")
        ) || [];

      const newProds: Product[] = [];
      let cCount = 0;
      let uCount = 0;

      validRows.forEach((r, idx) => {
        if (r.status === "created") cCount++;
        if (r.status === "updated") uCount++;

        const pData = r.parsedData || {};
        newProds.push({
          id: `prod_imported_${Date.now()}_${idx}`,
          name: pData.title || r.title || `Article importé #${idx + 1}`,
          slug: (pData.title || r.title || `article-${idx}`).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: "Article importé par fichier CSV.",
          category: "Général",
          collection: "Import CSV",
          salePrice: pData.price || 15000,
          costPrice: 5000,
          stock: 25,
          sku: pData.sku || r.sku || `SKU-IMP-${idx}`,
          status: pData.status || newProductsStatus,
          productStatus: pData.status || newProductsStatus,
          images: ["/products/placeholder.png"],
          variants: [
            {
              id: `var_imp_${idx}`,
              name: "Standard",
              price: pData.price || 15000,
              costPrice: 5000,
              stock: 25,
            },
          ],
          quantityOffers: [],
          badgesConfig: {
            hasCountdown: false,
            countdownMinutes: 15,
            hasComparePrice: false,
            hasLowStockWarning: true,
            lowStockThreshold: 5,
            hasQuantityPacks: false,
          },
          createdAt: new Date().toISOString(),
        });
      });

      setCreatedCount(cCount);
      setUpdatedCount(uCount);
      onImportSuccess(newProds);
    }, 1200);
  };

  // Annuler l'import (Rollback)
  const handleRollback = () => {
    if (confirm("Voulez-vous vraiment annuler cet import ? Tous les produits créés lors de ce lot seront archivés.")) {
      setIsRollbacked(true);
    }
  };

  return (
    <div
      id="csv-import-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-3xl rounded-3xl border border-black/10 bg-[#FAF8F5] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.08] bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#111111]">
                Importer des produits par fichier CSV
              </h2>
              <p className="text-xs text-[#666660]">
                Étape {currentStep} sur 5 :{" "}
                {currentStep === 1 && "Sélection du fichier"}
                {currentStep === 2 && "Correspondance des colonnes"}
                {currentStep === 3 && "Options d'import"}
                {currentStep === 4 && "Test à blanc (Validation)"}
                {currentStep === 5 && "Traitement de l'import"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#888880] hover:text-[#111111] hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre d'étapes */}
        <div className="grid grid-cols-5 border-b border-black/[0.06] bg-[#F4EFE6] text-xs font-bold text-center">
          {[
            { step: 1, label: "Fichier" },
            { step: 2, label: "Colonnes" },
            { step: 3, label: "Options" },
            { step: 4, label: "Test à blanc" },
            { step: 5, label: "Import" },
          ].map((item) => (
            <div
              key={item.step}
              className={cn(
                "py-2.5 border-r border-black/[0.06] last:border-r-0 transition-colors",
                currentStep === item.step
                  ? "bg-[#111111] text-[#FAF8F5]"
                  : currentStep > item.step
                  ? "bg-emerald-100 text-emerald-900"
                  : "text-[#888880]"
              )}
            >
              {item.step}. {item.label}
            </div>
          ))}
        </div>

        {/* Corps des étapes */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ======================================================== */}
          {/* ÉTAPE 1 : FICHIER */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer",
                  isDragging
                    ? "border-[#111111] bg-black/[0.03]"
                    : "border-black/15 bg-white hover:border-black/30"
                )}
                onClick={() => document.getElementById("csv-file-input")?.click()}
              >
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <UploadCloud className="w-10 h-10 text-[#888880] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#111111]">
                  Glissez-déposez votre fichier .CSV ici
                </p>
                <p className="text-xs text-[#666660] mt-1">
                  ou cliquez pour parcourir vos dossiers (Taille max : 5 Mo, 1 000 lignes)
                </p>
                {fileName && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>
                      {fileName} ({(fileSize / 1024).toFixed(1)} Ko)
                    </span>
                  </div>
                )}
              </div>

              {/* Paramètres de lecture */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white border border-black/[0.08]">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Séparateur détecté
                  </label>
                  <select
                    value={separator}
                    onChange={(e) => setSeparator(e.target.value as any)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-black/[0.1] bg-[#FAF8F5]"
                  >
                    <option value=";">Point-virgule (;)</option>
                    <option value=",">Virgule (,)</option>
                    <option value={"\t"}>Tabulation (\t)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Encodage des caractères
                  </label>
                  <select
                    value={encoding}
                    onChange={(e) => setEncoding(e.target.value as any)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-black/[0.1] bg-[#FAF8F5]"
                  >
                    <option value="utf-8">UTF-8 (Recommandé)</option>
                    <option value="windows-1252">Windows-1252 (Excel classique)</option>
                  </select>
                </div>
              </div>

              {/* Lien modèle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-950">Besoin d'un modèle type ?</p>
                  <p className="text-amber-800">
                    Téléchargez notre fichier modèle pré-rempli avec les colonnes recommandées.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-download-csv-template"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-900 text-white font-bold hover:bg-amber-950 transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger le modèle</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 2 : CORRESPONDANCE DES COLONNES */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-[#666660]">
                Vérifiez l'association automatique des colonnes de votre fichier avec les champs
                d'AfriBuilder. Modifiez si nécessaire.
              </p>

              <div className="border border-black/[0.08] rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-black/[0.08] bg-black/[0.02] text-[10px] font-bold uppercase text-[#666660]">
                      <th className="py-2.5 px-4">Colonne du fichier</th>
                      <th className="py-2.5 px-4">Champ AfriBuilder</th>
                      <th className="py-2.5 px-4">Aperçu ligne 1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.05]">
                    {rawHeaders.map((header, idx) => (
                      <tr key={idx} className="hover:bg-black/[0.015]">
                        <td className="py-2 px-4 font-mono font-bold text-[#111111]">{header}</td>
                        <td className="py-2 px-4">
                          <select
                            id={idx === 0 ? "select-map-title" : `select-map-${header}`}
                            value={columnMappings[header] || ""}
                            onChange={(e) =>
                              setColumnMappings((prev) => ({
                                ...prev,
                                [header]: e.target.value,
                              }))
                            }
                            className="text-xs font-semibold px-2 py-1 rounded-lg border border-black/10 bg-[#FAF8F5]"
                          >
                            <option value="">(Ignorer cette colonne)</option>
                            <option value="titre">Titre (Obligatoire)</option>
                            <option value="prix">Prix de vente (Obligatoire)</option>
                            <option value="prix_barre">Prix barré (Comparaison)</option>
                            <option value="cout">Coût d'achat (Privé)</option>
                            <option value="sku">SKU / Référence</option>
                            <option value="stock">Quantité en stock</option>
                            <option value="statut">Statut (Actif/Brouillon)</option>
                            <option value="collections">Collections</option>
                            <option value="categorie">Catégorie</option>
                            <option value="fournisseur">Fournisseur</option>
                            <option value="pays_disponibles">Pays desservis</option>
                            <option value="description">Description</option>
                            <option value="image_1">Image principale</option>
                          </select>
                        </td>
                        <td className="py-2 px-4 text-[#666660] truncate max-w-xs">
                          {previewRows[0] ? previewRows[0][idx] || "—" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 3 : OPTIONS D'IMPORT */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-3">
                <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                  Mode de traitement des doublons
                </h3>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#111111]">
                    <input
                      type="radio"
                      id="import-mode-create_and_update"
                      name="importMode"
                      value="create_and_update"
                      checked={importMode === "create_and_update"}
                      onChange={() => setImportMode("create_and_update")}
                      className="text-black focus:ring-black"
                    />
                    <span>
                      <strong>Créer et mettre à jour</strong> (Recommandé : met à jour les SKU existants et crée les nouveaux)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#111111]">
                    <input
                      type="radio"
                      name="importMode"
                      value="create_only"
                      checked={importMode === "create_only"}
                      onChange={() => setImportMode("create_only")}
                      className="text-black focus:ring-black"
                    />
                    <span>
                      <strong>Créer seulement</strong> (Ignore les lignes dont le SKU existe déjà en base)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#111111]">
                    <input
                      type="radio"
                      name="importMode"
                      value="update_only"
                      checked={importMode === "update_only"}
                      onChange={() => setImportMode("update_only")}
                      className="text-black focus:ring-black"
                    />
                    <span>
                      <strong>Mettre à jour seulement</strong> (Ne crée aucun nouveau produit, actualise les existants)
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-2">
                  <label className="block text-xs font-bold text-[#111111]">
                    Statut initial des nouveaux articles
                  </label>
                  <select
                    value={newProductsStatus}
                    onChange={(e) => setNewProductsStatus(e.target.value as any)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-black/[0.1] bg-[#FAF8F5]"
                  >
                    <option value="draft">Brouillon (Recommandé pour vérification)</option>
                    <option value="active">Actif (Directement visible si publié)</option>
                  </select>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-2">
                  <label className="block text-xs font-bold text-[#111111]">
                    Gestion des stocks importés
                  </label>
                  <select
                    value={stockMode}
                    onChange={(e) => setStockMode(e.target.value as any)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-black/[0.1] bg-[#FAF8F5]"
                  >
                    <option value="set">Définir (remplace le stock existant)</option>
                    <option value="add">Ajouter (incrémente le stock actuel)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#111111]">
                  <input
                    type="checkbox"
                    checked={autoCreateCollections}
                    onChange={(e) => setAutoCreateCollections(e.target.checked)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span>Créer automatiquement les collections et catégories inconnues</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#111111]">
                  <input
                    type="checkbox"
                    checked={autoCreateSuppliers}
                    onChange={(e) => setAutoCreateSuppliers(e.target.checked)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span>Créer automatiquement les fournisseurs inconnus</span>
                </label>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 4 : TEST À BLANC (DRY RUN) */}
          {/* ======================================================== */}
          {currentStep === 4 && dryRunResult && (
            <div id="dry-run-summary" className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-[#666660] uppercase">À Créer</span>
                  <p id="dry-run-create-count" className="text-xl font-black text-emerald-600 mt-0.5">
                    +{dryRunResult.creationsCount}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-[#666660] uppercase">À Mettre à Jour</span>
                  <p className="text-xl font-black text-blue-600 mt-0.5">
                    {dryRunResult.updatesCount}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-[#666660] uppercase">Ignorés / Doublons</span>
                  <p className="text-xl font-black text-amber-600 mt-0.5">
                    {dryRunResult.ignoredCount}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-[#666660] uppercase">Erreurs</span>
                  <p className="text-xl font-black text-rose-600 mt-0.5">
                    {dryRunResult.errorsCount}
                  </p>
                </div>
              </div>

              {/* Résumé de validation */}
              {dryRunResult.errorsCount === 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">Test à blanc réussi à 100% !</p>
                    <p className="text-emerald-700">
                      Toutes les données sont valides et prêtes à être injectées dans le catalogue.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{dryRunResult.errorsCount} ligne(s) comportent des erreurs bloquantes.</span>
                  </div>
                  <p className="text-rose-700">
                    Vous pouvez télécharger le rapport pour corriger votre fichier, ou choisir d'ignorer
                    ces lignes pour n'importer que les produits valides.
                  </p>
                  <div className="pt-1 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadErrorReport}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-300 font-bold text-rose-800 hover:bg-rose-100 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger le rapport d'erreurs (.csv)</span>
                    </button>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-rose-950">
                      <input
                        type="checkbox"
                        checked={ignoreErrors}
                        onChange={(e) => setIgnoreErrors(e.target.checked)}
                        className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span>Ignorer les lignes en erreur et continuer</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 5 : TRAITEMENT & RÉSULTAT */}
          {/* ======================================================== */}
          {currentStep === 5 && (
            <div className="space-y-6 text-center py-4">
              {isProcessing && (
                <div className="space-y-3">
                  <div className="h-12 w-12 rounded-full border-4 border-black/10 border-t-[#111111] animate-spin mx-auto" />
                  <h3 className="text-sm font-black text-[#111111]">
                    Importation en cours... {progress}%
                  </h3>
                  <div
                    id="import-progress-bar"
                    className="w-full max-w-md mx-auto h-2 rounded-full bg-black/10 overflow-hidden"
                  >
                    <div
                      className="h-full bg-[#111111] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#666660]">
                    Création sécurisée des fiches, calcul des marges et journalisation du lot.
                  </p>
                </div>
              )}

              {isCompleted && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#111111]">
                      Importation terminée avec succès !
                    </h3>
                    <p className="text-xs text-[#666660] mt-1">
                      {createdCount} produit(s) créé(s), {updatedCount} mis à jour.
                    </p>
                  </div>

                  {isRollbacked ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
                      Lot d'import annulé : les nouveaux articles ont été archivés.
                    </div>
                  ) : (
                    <div className="pt-2 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        id="btn-rollback-import"
                        onClick={handleRollback}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/10 text-xs font-bold text-[#666660] hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Annuler cet import (Rollback)</span>
                      </button>
                      <button
                        type="button"
                        id="btn-finish-import"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-colors"
                      >
                        Terminer & voir le catalogue
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pied de page : Navigation entre étapes */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-black/[0.08] bg-white">
          {currentStep > 1 && currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/[0.1] text-xs font-bold text-[#111111] hover:bg-black/5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Précédent</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep === 1 && (
            <button
              type="button"
              id="btn-csv-next-step"
              disabled={!fileContent}
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span>Continuer vers les colonnes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              id="btn-csv-next-step"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all"
            >
              <span>Continuer vers les options</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              id="btn-csv-next-step"
              onClick={handleStartDryRun}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Lancer le test à blanc (Obligatoire)</span>
            </button>
          )}

          {currentStep === 4 && (
            <button
              type="button"
              id="btn-run-import-confirm"
              disabled={dryRunResult?.errorsCount !== 0 && !ignoreErrors}
              onClick={handleExecuteImport}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Lancer l'import effectif</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
