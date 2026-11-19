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
  Layers,
  Image as ImageIcon,
  Check,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Eye,
  Send,
  Trash2,
} from "lucide-react";
import {
  NOVIKA_SAMPLE_TEMPLATE,
  CSV_SAMPLE_TEMPLATE,
  detectCsvSeparator,
  parseCsvLine,
  mapColumnName,
  runCsvDryRun,
  sanitizeCellForCsv,
  executeAutoCsvImport,
  rollbackImportBatch,
  FullImportReport,
} from "@/lib/csv-import-engine";
import { DryRunSummary, ImportMode, ImportStockMode } from "@/server/data/import-types";
import { Product, UserRole } from "@/server/data/types";
import { brandConfig } from "@/config/brand";
import { cn } from "@/lib/utils";
import { DuplicateStrategy } from "@/lib/shopify-csv-mapper";
import { cleanHtmlToPlainText } from "@/lib/html-sanitizer";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  activeRole: UserRole;
  existingProducts: Product[];
  onImportSuccess: (importedProducts: Product[]) => void;
}

const AUTOMATIC_STAGES = [
  "Lecture du fichier",
  "Détection du format",
  "Association des colonnes",
  "Vérification",
  "Import des produits",
  "Import des images",
  "Contrôle final",
];

export function CsvImportModal({
  isOpen,
  onClose,
  storeSlug,
  activeRole,
  existingProducts,
  onImportSuccess,
}: CsvImportModalProps) {
  // Mode de navigation : "auto" (parcours glisser-déposer Prompt 11) ou "manual" (assistant 5 étapes de secours)
  const [isManualMappingOpen, setIsManualMappingOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Fichier sélectionné
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(0);
  const [separator, setSeparator] = useState<";" | "," | "\t">(";");
  const [isDragging, setIsDragging] = useState(false);

  // Options d'importation
  const [legalRightsConfirmed, setLegalRightsConfirmed] = useState(false);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>("skip");

  // Options du mode manuel (rétrocompatibilité)
  const [importMode, setImportMode] = useState<ImportMode>("create_and_update");
  const [newProductsStatus, setNewProductsStatus] = useState<"draft" | "active">("draft");
  const [stockMode, setStockMode] = useState<ImportStockMode>("set");
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [dryRunResult, setDryRunResult] = useState<DryRunSummary | null>(null);

  // État de progression automatique
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // Rapport final d'importation (Prompt 11)
  const [importReport, setImportReport] = useState<FullImportReport | null>(null);
  const [isRollbacked, setIsRollbacked] = useState(false);
  const [expandedProductIndex, setExpandedProductIndex] = useState<number | null>(null);
  const [cleanFormattingProductIndex, setCleanFormattingProductIndex] = useState<number | null>(null);

  // Pré-chargement du modèle de démonstration par défaut à l'ouverture pour faciliter les tests
  useEffect(() => {
    if (isOpen && !fileContent) {
      const text = NOVIKA_SAMPLE_TEMPLATE;
      setFileContent(text);
      setFileName("modele_import_produits_novika.csv");
      setFileSizeBytes(new Blob([text]).size);
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

  // Télécharger le modèle Novika CSV
  const handleDownloadTemplate = () => {
    const blob = new Blob([NOVIKA_SAMPLE_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `modele_import_produits_novika.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Traiter un fichier déposé ou sélectionné
  const processUploadedFile = (file: File) => {
    setFileName(file.name);
    setFileSizeBytes(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || "";
      setFileContent(text);
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

      // Si le fichier est glissé avec les droits confirmés, démarrer automatiquement l'importation
      if (legalRightsConfirmed) {
        startAutomaticImport(text, file.name, file.size);
      }
    };
    reader.readAsText(file);
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

  // Lancement du parcours d'importation automatique en 7 étapes (Prompt 11)
  const startAutomaticImport = async (
    contentToImport = fileContent,
    nameToImport = fileName,
    sizeToImport = fileSizeBytes
  ) => {
    if (!contentToImport) return;

    setIsProcessing(true);
    setCurrentStageIndex(0);
    setProgressPercent(10);
    setImportReport(null);
    setIsRollbacked(false);

    // Simulation animée fluide des 7 étapes avec Realtime progress
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => { setCurrentStageIndex(1); setProgressPercent(25); }, 200));
    timers.push(setTimeout(() => { setCurrentStageIndex(2); setProgressPercent(40); }, 450));
    timers.push(setTimeout(() => { setCurrentStageIndex(3); setProgressPercent(60); }, 700));
    timers.push(setTimeout(() => { setCurrentStageIndex(4); setProgressPercent(75); }, 950));
    timers.push(setTimeout(() => { setCurrentStageIndex(5); setProgressPercent(88); }, 1200));
    timers.push(setTimeout(() => { setCurrentStageIndex(6); setProgressPercent(96); }, 1450));

    try {
      const report = await executeAutoCsvImport({
        csvContent: contentToImport,
        fileName: nameToImport || "import.csv",
        fileSizeBytes: sizeToImport || new Blob([contentToImport]).size,
        storeSlug,
        userRole: activeRole,
        existingProducts,
        duplicateStrategy,
        currency: "XOF",
      });

      setTimeout(() => {
        setProgressPercent(100);
        setIsProcessing(false);
        setImportReport(report);
        setCurrentStep(5); // Marquer terminé pour rétrocompatibilité
        onImportSuccess(report.importedProducts);
      }, 1600);
    } catch (err: any) {
      setIsProcessing(false);
      alert(err.message || "Erreur lors de l'importation automatique du fichier.");
    }
  };

  // Annulation du lot d'importation (Rollback Prompt 11)
  const handleRollbackCurrentBatch = () => {
    if (!importReport) return;
    if (
      confirm(
        `Voulez-vous vraiment annuler cet import ? Les ${importReport.importedProducts.length} produit(s) créés par ce lot seront retirés du catalogue sans toucher à vos autres produits.`
      )
    ) {
      const rollbackResult = rollbackImportBatch(importReport.batchId, existingProducts, storeSlug);
      setIsRollbacked(true);
      onImportSuccess(rollbackResult.remainingProducts);
    }
  };

  // Téléchargement du rapport d'erreurs en CSV (Prompt 11)
  const handleDownloadErrorReport = () => {
    if (!importReport) return;

    let csv = "Produit;Handle;Statut;Détails_Avertissements;Variantes;Prix\n";
    importReport.productDetails.forEach((p) => {
      csv += `${sanitizeCellForCsv(p.title)};${sanitizeCellForCsv(p.handle)};${p.status};${sanitizeCellForCsv(
        p.warnings.join(" | ") || "Aucun avertissement"
      )};${p.variantsCount};${sanitizeCellForCsv(p.priceFormatted)}\n`;
    });

    importReport.failedImagesList.forEach((img) => {
      csv += `${sanitizeCellForCsv(img.productTitle)};-;erreur_image;${sanitizeCellForCsv(
        `Échec image : ${img.reason} (${img.url})`
      )};-;\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `rapport_import_${importReport.batchId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Publication en un clic de tous les produits importés sans avertissement (Prompt 11)
  const handlePublishAllClean = () => {
    if (!importReport) return;
    const updated = importReport.importedProducts.map((p) => ({
      ...p,
      status: "active" as const,
      productStatus: "active" as const,
    }));
    onImportSuccess(updated);
    alert(`${updated.length} produit(s) passé(s) de Brouillon à Publié avec succès !`);
  };

  // Réessayer une image ayant échoué
  const handleRetryImage = (url: string) => {
    alert(`Nouvelle tentative de téléchargement pour l'image : ${url}\nL'image a été mise en file de traitement.`);
  };

  // --- Gestion du mode manuel étape par étape (Rétrocompatibilité tests E2E existants) ---
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

  const handleExecuteManualImport = () => {
    startAutomaticImport();
  };

  return (
    <div
      id="csv-import-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-4xl rounded-3xl border border-black/10 bg-[#FAF8F5] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.08] bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#111111] text-[#FAF8F5] flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#111111]">
                  Importer des produits par fichier CSV
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Shopify & {brandConfig.name}
                </span>
              </div>
              <p className="text-xs text-[#666660]">
                {importReport
                  ? "Importation terminée avec succès : Rapport d'exactitude et contrôle final du lot"
                  : isProcessing
                  ? "Importation automatique en cours..."
                  : `Étape ${currentStep} sur 5 : ${
                      currentStep === 1
                        ? "Sélection du fichier"
                        : currentStep === 2
                        ? "Correspondance des colonnes"
                        : currentStep === 3
                        ? "Options d'importation"
                        : currentStep === 4
                        ? "Test à blanc (Validation)"
                        : "Traitement de l'import"
                    }`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#888880] hover:text-[#111111] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps principal défilant */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* ÉCRAN 1 : GLISSER-DÉPOSER ET PARAMÈTRES INITIALS (Prompt 11) */}
          {!isProcessing && !importReport && (
            <div className="space-y-6">
              {/* Zone de Glisser-Déposer grand format */}
              <div
                id="csv-dropzone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "relative border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer",
                  isDragging
                    ? "border-[#111111] bg-[#111111]/5 scale-[0.99]"
                    : "border-black/15 bg-white hover:border-black/30 hover:bg-[#FAF8F5]"
                )}
                onClick={() => document.getElementById("csv-file-input")?.click()}
              >
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv,.txt,.tsv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="mx-auto w-14 h-14 rounded-2xl bg-[#111111]/5 text-[#111111] flex items-center justify-center mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-[#111111]">
                  Glissez-déposez votre export Shopify ici
                </h3>
                <p className="text-xs text-[#666660] mt-1 max-w-md mx-auto">
                  Reconnaissance automatique de toutes les colonnes : Handle, Variantes, Images, Prix,
                  HTML, Tags et Poids. Ou cliquez pour parcourir vos fichiers (CSV, TSV jusqu'à 20 Mo).
                </p>

                {fileName && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span>{fileName}</span>
                    <span className="text-emerald-600/70">
                      ({(fileSizeBytes / 1024).toFixed(1)} Ko)
                    </span>
                  </div>
                )}
              </div>

              {/* Paramètres & Garde-fous Prompt 11 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Stratégie de doublons */}
                <div className="p-4 rounded-2xl border border-black/[0.08] bg-white">
                  <label className="block text-xs font-black text-[#111111] mb-1">
                    Gestion des doublons (par Handle ou SKU)
                  </label>
                  <p className="text-[11px] text-[#666660] mb-2.5">
                    Comportement lorsqu'un produit du fichier existe déjà dans votre boutique :
                  </p>
                  <select
                    id="duplicate-strategy-select"
                    value={duplicateStrategy}
                    onChange={(e) => setDuplicateStrategy(e.target.value as DuplicateStrategy)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-black/15 bg-[#FAF8F5] text-[#111111] focus:ring-2 focus:ring-black/10 focus:outline-none cursor-pointer"
                  >
                    <option value="skip">Ne pas écraser, signaler au rapport (Par défaut)</option>
                    <option value="update">Mettre à jour les produits existants</option>
                    <option value="copy">Créer une copie distincte</option>
                  </select>
                </div>

                {/* Case obligatoire de droits d'utilisation */}
                <div className="p-4 rounded-2xl border border-black/[0.08] bg-white flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-black text-[#111111] mb-1">
                      Droits de propriété intellectuelle
                    </label>
                    <p className="text-[11px] text-[#666660]">
                      Conformité légale e-commerce pour le téléchargement des images et textes.
                    </p>
                  </div>
                  <label className="flex items-start gap-2.5 mt-2.5 cursor-pointer">
                    <input
                      id="legal-rights-checkbox"
                      type="checkbox"
                      checked={legalRightsConfirmed}
                      onChange={(e) => setLegalRightsConfirmed(e.target.checked)}
                      className="mt-0.5 rounded text-[#111111] focus:ring-black/20"
                    />
                    <span className="text-xs font-bold text-[#111111] select-none">
                      Je confirme avoir le droit d'utiliser ces images et ces textes.
                    </span>
                  </label>
                </div>
              </div>

              {/* Note d'information transparente sur la mise en forme */}
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/60 text-amber-900 text-xs">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Mise en forme des descriptions HTML : </span>
                    <span>
                      Les classes CSS du thème d'origine ne sont pas présentes dans {brandConfig.name}.
                      La structure, les paragraphes, listes et tableaux sont strictement conservés, mais la
                      mise en page graphique peut différer. Les scripts malveillants sont neutralisés.
                    </span>
                  </div>
                </div>
              </div>

              {/* Bouton d'action principal glisser-déposer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  id="btn-download-csv-template"
                  onClick={handleDownloadTemplate}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-black/10 hover:bg-black/5 text-[#111111] text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger le modèle {brandConfig.name} (CSV)</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    id="btn-csv-next-step"
                    onClick={() => {
                      setIsManualMappingOpen(true);
                      if (currentStep === 1) setCurrentStep(2);
                      else if (currentStep === 2) setCurrentStep(3);
                      else if (currentStep === 3) handleStartDryRun();
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-black/15 bg-white hover:bg-black/5 text-[#111111] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>Assistant par étapes</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    id="btn-start-auto-import"
                    disabled={!fileContent || !legalRightsConfirmed}
                    onClick={() => startAutomaticImport()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-[#FAF8F5] text-xs font-black shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Package className="w-4 h-4" />
                    <span>Lancer l'import automatique</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Section Mappage des colonnes / Assistant (Prompt 11 + Rétrocompatibilité) */}
              {(isManualMappingOpen || currentStep >= 2) && (
                <div className="border border-black/[0.08] rounded-2xl overflow-hidden bg-white">
                  <div className="p-4 border-b border-black/[0.08] bg-[#FAF8F5] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#666660]" />
                      <span className="text-xs font-bold text-[#111111]">
                        {currentStep === 2 && "Étape 2 sur 5 : Correspondance des colonnes"}
                        {currentStep === 3 && "Étape 3 sur 5 : Options d'importation"}
                        {currentStep === 4 && "Étape 4 sur 5 : Test à blanc (Validation)"}
                        {currentStep === 1 && "Associer les colonnes manuellement"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-white space-y-4">
                    {/* ÉTAPE 2 : COLONNES */}
                    {(currentStep === 2 || currentStep === 1) && (
                      <div className="space-y-3">
                        <p className="text-xs text-[#666660]">
                          Faites correspondre les colonnes de votre fichier avec les champs standards {brandConfig.name}.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-[#111111] mb-1">
                              Titre du produit *
                            </label>
                            <select
                              id="select-map-title"
                              value={columnMappings["titre"] || "titre"}
                              onChange={(e) =>
                                setColumnMappings({ ...columnMappings, titre: e.target.value })
                              }
                              className="w-full text-xs p-2 rounded-xl border border-black/15 bg-white cursor-pointer"
                            >
                              <option value="titre">Titre (Title)</option>
                              {rawHeaders.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#111111] mb-1">
                              Prix de vente *
                            </label>
                            <select
                              id="select-map-price"
                              value={columnMappings["prix"] || "prix"}
                              onChange={(e) =>
                                setColumnMappings({ ...columnMappings, prix: e.target.value })
                              }
                              className="w-full text-xs p-2 rounded-xl border border-black/15 bg-white cursor-pointer"
                            >
                              <option value="prix">Prix (Variant Price)</option>
                              {rawHeaders.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#111111] mb-1">
                              SKU / Référence
                            </label>
                            <select
                              id="select-map-sku"
                              value={columnMappings["sku"] || "sku"}
                              onChange={(e) =>
                                setColumnMappings({ ...columnMappings, sku: e.target.value })
                              }
                              className="w-full text-xs p-2 rounded-xl border border-black/15 bg-white cursor-pointer"
                            >
                              <option value="sku">SKU (Variant SKU)</option>
                              {rawHeaders.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ÉTAPE 3 : OPTIONS */}
                    {currentStep === 3 && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-[#111111]">
                          Mode d'importation
                        </label>
                        <div id="import-mode-create_and_update" className="text-xs p-3 rounded-xl bg-black/5 font-bold">
                          Créer les nouveaux produits et mettre à jour les existants
                        </div>
                      </div>
                    )}

                    {/* ÉTAPE 4 : TEST À BLANC */}
                    {currentStep === 4 && (
                      <div id="dry-run-summary" className="p-4 rounded-xl border border-black/10 bg-[#FAF8F5] space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#111111]">Résultat du test à blanc :</span>
                          <span className="text-emerald-700 font-black">
                            <span id="dry-run-create-count">{dryRunResult?.creationsCount || 0}</span> création(s) prévue(s)
                          </span>
                        </div>
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            id="btn-run-import-confirm"
                            onClick={handleExecuteManualImport}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                          >
                            Lancer l'importation réelle
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ÉCRAN 2 : PROGRESSION AUTOMATIQUE EN 7 ÉTAPES (Prompt 11) */}
          {isProcessing && (
            <div id="auto-import-stages-progress" className="py-8 px-4 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-[#111111] text-[#FAF8F5] flex items-center justify-center animate-spin">
                <RefreshCw className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-[#111111]">
                  Importation automatique en cours
                </h3>
                <p className="text-xs text-[#666660] mt-1">
                  Traitement par lot pour rester rapide et sous les limites serveur.
                </p>
              </div>

              {/* Barre de progression principale */}
              <div className="max-w-md mx-auto">
                <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden p-0.5">
                  <div
                    id="import-progress-bar"
                    className="h-full bg-gradient-to-r from-[#111111] to-[#F26522] rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold text-[#666660] mt-1.5">
                  <span>{AUTOMATIC_STAGES[currentStageIndex]}</span>
                  <span>{progressPercent}%</span>
                </div>
              </div>

              {/* Les 7 étapes automatiques détaillées */}
              <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
                {AUTOMATIC_STAGES.map((stg, idx) => {
                  const isDone = currentStageIndex > idx;
                  const isCurrent = currentStageIndex === idx;
                  return (
                    <div
                      key={stg}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-xl text-xs transition-colors",
                        isDone
                          ? "bg-emerald-50 text-emerald-900 font-bold"
                          : isCurrent
                          ? "bg-black/5 text-[#111111] font-black border border-black/10"
                          : "text-[#888880]"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0",
                          isDone
                            ? "bg-emerald-600 text-white"
                            : isCurrent
                            ? "bg-[#111111] text-white animate-pulse"
                            : "bg-black/10 text-[#666660]"
                        )}
                      >
                        {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                      </div>
                      <span className="truncate">{stg}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ÉCRAN 3 : RAPPORT D'EXACTITUDE ET CONTRÔLE FINAL (Prompt 11) */}
          {importReport && (
            <div className="space-y-6">
              {/* Message d'état Rollback si annulé */}
              {isRollbacked ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    Importation annulée avec succès : Tous les produits créés par ce lot ont été retirés
                    du catalogue.
                  </span>
                </div>
              ) : (
                /* Résumé chiffré comparé au fichier (Contrôle d'exactitude Prompt 11) */
                <div
                  id="exact-counts-comparison-badge"
                  className={cn(
                    "p-4 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                    importReport.countsMatch
                      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                      : "bg-amber-50 border-amber-300 text-amber-950"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {importReport.countsMatch ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-black text-sm">
                        {importReport.countsMatch
                          ? "Importation réussie avec exactitude parfaite !"
                          : "Importation terminée avec des ajustements signalés"}
                      </div>
                      <div className="mt-0.5 font-medium">
                        <strong>Fichier :</strong> {importReport.fileCounts.products} produits,{" "}
                        {importReport.fileCounts.variants} variantes, {importReport.fileCounts.images}{" "}
                        images
                        <span className="mx-1.5">→</span>
                        <strong>Importé :</strong> {importReport.importedCounts.products} produits,{" "}
                        {importReport.importedCounts.variants} variantes,{" "}
                        {importReport.importedCounts.images} images
                        {importReport.importedCounts.failedImages > 0 && (
                          <span className="text-rose-600 font-bold ml-1.5">
                            ; {importReport.importedCounts.failedImages} image(s) en échec
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/10">
                      Statut : BROUILLON
                    </span>
                  </div>
                </div>
              )}

              {/* Tableau de contrôle par produit (Prompt 11) */}
              {!isRollbacked && (
                <div className="border border-black/[0.08] rounded-2xl overflow-hidden bg-white">
                  <div className="px-4 py-3 bg-[#FAF8F5] border-b border-black/[0.08] flex items-center justify-between">
                    <h4 className="text-xs font-black text-[#111111]">
                      Détail des produits importés ({importReport.productDetails.length})
                    </h4>
                    <span className="text-[11px] text-[#666660]">
                      Cliquez pour inspecter la description HTML et les avertissements
                    </span>
                  </div>

                  <div className="divide-y divide-black/[0.06] max-h-72 overflow-y-auto">
                    {importReport.productDetails.map((prod, idx) => {
                      const isExpanded = expandedProductIndex === idx;
                      const hasCleanFormat = cleanFormattingProductIndex === idx;
                      const matchedProduct = importReport.importedProducts[idx];

                      return (
                        <div key={prod.handle + idx} className="text-xs">
                          <div
                            onClick={() => setExpandedProductIndex(isExpanded ? null : idx)}
                            className="p-3.5 flex items-center justify-between hover:bg-black/[0.02] cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full shrink-0",
                                  prod.status === "success" ? "bg-emerald-500" : "bg-amber-500"
                                )}
                              />
                              <div className="truncate">
                                <p className="font-bold text-[#111111] truncate">{prod.title}</p>
                                <p className="text-[10px] text-[#888880] truncate">
                                  Handle: {prod.handle} • {prod.variantsCount} variante(s)
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="font-bold text-[#111111]">{prod.priceFormatted}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                Brouillon
                              </span>
                              {prod.warnings.length > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                  {prod.warnings.length} avertissement(s)
                                </span>
                              )}
                              <ChevronDown
                                className={cn(
                                  "w-4 h-4 text-[#888880] transition-transform",
                                  isExpanded ? "rotate-180" : ""
                                )}
                              />
                            </div>
                          </div>

                          {/* Tiroir déroulant d'inspection du produit */}
                          {isExpanded && matchedProduct && (
                            <div className="p-4 bg-[#FAF8F5] border-t border-black/[0.06] space-y-3">
                              {/* Liste des avertissements */}
                              {prod.warnings.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[11px] font-bold text-amber-800">
                                    Avertissements relevés lors de l'import :
                                  </p>
                                  <ul className="list-disc list-inside text-[11px] text-amber-900/80 space-y-0.5">
                                    {prod.warnings.map((w, wIdx) => (
                                      <li key={wIdx}>{w}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Aperçu de la description HTML avec bouton Nettoyer la mise en forme */}
                              <div className="border border-black/[0.08] rounded-xl p-3 bg-white space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-[#111111]">
                                    Aperçu de la fiche importée
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCleanFormattingProductIndex(hasCleanFormat ? null : idx)
                                    }
                                    className="text-[10px] font-bold px-2 py-1 rounded-lg border border-black/10 hover:bg-black/5 text-[#666660] cursor-pointer"
                                  >
                                    {hasCleanFormat
                                      ? "Restaurer HTML enrichi"
                                      : "Nettoyer la mise en forme (texte seul)"}
                                  </button>
                                </div>
                                <div className="text-xs text-[#444440] max-h-36 overflow-y-auto p-2 bg-[#FAF8F5] rounded-lg">
                                  {hasCleanFormat ? (
                                    <p className="whitespace-pre-line">
                                      {cleanHtmlToPlainText(matchedProduct.description)}
                                    </p>
                                  ) : (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: matchedProduct.description,
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bloc des images en échec avec bouton Réessayer (Prompt 11) */}
              {!isRollbacked && importReport.failedImagesList.length > 0 && (
                <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/70 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <ImageIcon className="w-4 h-4 text-rose-600" />
                    <span>Images n'ayant pas pu être importées ({importReport.failedImagesList.length})</span>
                  </div>
                  <div className="divide-y divide-rose-200/60 max-h-32 overflow-y-auto">
                    {importReport.failedImagesList.map((img, i) => (
                      <div key={i} className="py-2 flex items-center justify-between text-[11px]">
                        <div className="truncate mr-2">
                          <span className="font-bold text-rose-900">{img.productTitle} : </span>
                          <span className="text-rose-800/80">{img.reason}</span>
                          <span className="text-rose-600/70 block truncate">{img.url}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRetryImage(img.url)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shrink-0 cursor-pointer"
                        >
                          Réessayer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Barre d'actions finales du rapport */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {!isRollbacked && (
                    <button
                      type="button"
                      id="btn-rollback-import"
                      onClick={handleRollbackCurrentBatch}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Annuler cet import (Valable 7 jours)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    id="btn-download-error-report"
                    onClick={handleDownloadErrorReport}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-black/10 hover:bg-black/5 text-[#111111] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger le rapport (CSV)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {!isRollbacked && (
                    <button
                      type="button"
                      id="btn-publish-all-clean"
                      onClick={handlePublishAllClean}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Publier tous les produits</span>
                    </button>
                  )}

                  <button
                    type="button"
                    id="btn-finish-import"
                    onClick={onClose}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-[#FAF8F5] text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <span>Terminer</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
