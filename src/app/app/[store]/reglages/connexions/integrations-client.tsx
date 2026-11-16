"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  ShoppingBag,
  Webhook,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Clock,
  ArrowRight,
  Copy,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Download,
  Trash2,
  Settings,
  HelpCircle,
  RefreshCw,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
  Sliders,
} from "lucide-react";
import {
  OrderSourceConfig,
  ImportBatchReport,
  ColumnMappingConfig,
  InitialImportChoice,
  SyncFrequencyMinutes,
} from "@/server/data/integration-types";
import {
  MOCK_ORDER_SOURCES,
  MOCK_IMPORT_REPORTS,
  MOCK_SHEET_SAMPLE_CSV,
} from "@/mock-data/integrations";
import {
  validateGoogleSheetUrl,
  autoDetectColumns,
  processRawSheetData,
  parseCsvRows,
  RECOMMENDED_COLUMNS_ORDER,
  sanitizeCellValue,
} from "@/lib/google-sheets-parser";
import { MOCK_ORDERS } from "@/mock-data/orders";
import { useApp } from "@/components/layout/app-shell";
import { formatFcfa } from "@/lib/money";

interface IntegrationsClientProps {
  storeSlug: string;
}

export function IntegrationsClient({ storeSlug }: IntegrationsClientProps) {
  const { activeStore, activeRole } = useApp();
  const isCloser = activeRole === "closer";
  const isRider = activeRole === "rider";
  const isRestricted = isCloser || isRider;

  // Intégrations et rapports
  const [sources, setSources] = useState<OrderSourceConfig[]>(MOCK_ORDER_SOURCES);
  const [reports, setReports] = useState<ImportBatchReport[]>(MOCK_IMPORT_REPORTS);
  const [activeSource, setActiveSource] = useState<OrderSourceConfig>(MOCK_ORDER_SOURCES[0]);

  // Modales & Vues
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastImportClickTime, setLastImportClickTime] = useState<number>(0);

  // Assistant de connexion : champs
  const [inputUrl, setInputUrl] = useState(
    "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0"
  );
  const [urlValidation, setUrlValidation] = useState(validateGoogleSheetUrl(inputUrl));
  const [dryRunResult, setDryRunResult] = useState<{
    tested: boolean;
    recognized: string[];
    missing: string[];
    sampleRows: any[];
    errorsCount: number;
    warnings: string[];
  } | null>(null);

  // Réglages détaillés
  const [sheetName, setSheetName] = useState(activeSource.sheetName);
  const [defaultCountry, setDefaultCountry] = useState(activeSource.defaultCountry);
  const [dateFormat, setDateFormat] = useState(activeSource.dateFormat);
  const [syncFreq, setSyncFreq] = useState<SyncFrequencyMinutes>(activeSource.autoSyncMinutes);
  const [initialChoice, setInitialChoice] = useState<InitialImportChoice>(activeSource.initialImportChoice);
  const [initialDate, setInitialDate] = useState("2026-08-01");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // RLS : Closeuse et Livreur interdits
  if (isRestricted) {
    return (
      <div className="space-y-6 pb-20">
        <div className="rounded-[24px] border border-rose-200 bg-rose-50/50 p-12 text-center shadow-2xs space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-rose-950">Accès Restreint (Sécurité RLS)</h2>
            <p className="text-xs text-rose-700 max-w-md mx-auto mt-1">
              Votre rôle ({activeRole}) ne vous autorise pas à gérer ou afficher les intégrations de commandes externes ni les liaisons Google Sheets.
            </p>
          </div>
          <Link
            href={`/app/${storeSlug}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all shadow-sm"
          >
            <span>Retour au Tableau de Bord</span>
          </Link>
        </div>
      </div>
    );
  }

  // Copier la liste des colonnes recommandées
  const handleCopyColumns = () => {
    navigator.clipboard.writeText(RECOMMENDED_COLUMNS_ORDER.join("\t"));
    showToast("Noms des colonnes copiés dans le presse-papier !");
  };

  // Test à blanc de la feuille (Dry-run sans créer de commande)
  const handleTestConnection = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsTesting(true);

    const check = validateGoogleSheetUrl(inputUrl);
    setUrlValidation(check);

    if (!check.isValid) {
      setIsTesting(false);
      return;
    }

    setTimeout(() => {
      // Parser le CSV fictif d'exemple
      const rawRows = parseCsvRows(MOCK_SHEET_SAMPLE_CSV);
      const headers = Object.keys(rawRows[0] || {});
      const colDetection = autoDetectColumns(headers);

      const processed = processRawSheetData(rawRows, colDetection.mapping, defaultCountry);

      setDryRunResult({
        tested: true,
        recognized: colDetection.recognized,
        missing: colDetection.missingRequired,
        sampleRows: processed.parsedRows.slice(0, 5),
        errorsCount: processed.errorsCount,
        warnings: [
          "Format de date jj/mm/aaaa détecté.",
          "Regroupement multi-produits automatique actif (CMD-1043 a 2 lignes).",
        ],
      });

      setIsTesting(false);
      showToast("Test de lecture réussi ! 5 lignes interprétées.");
    }, 600);
  };

  // Exécution d'un import immédiat (« Importer maintenant »)
  const handleImportNow = () => {
    const now = Date.now();
    // Délai minimal anti-spam (5 secondes entre deux clics)
    if (now - lastImportClickTime < 5000) {
      alert("Veuillez patienter quelques secondes entre deux imports manuels.");
      return;
    }
    setLastImportClickTime(now);
    setIsImporting(true);

    setTimeout(() => {
      setIsImporting(false);

      const rawRows = parseCsvRows(MOCK_SHEET_SAMPLE_CSV);
      const headers = Object.keys(rawRows[0] || {});
      const colDetection = autoDetectColumns(headers);
      const processed = processRawSheetData(rawRows, colDetection.mapping, defaultCountry);

      const newBatch: ImportBatchReport = {
        id: `batch_${Date.now()}`,
        sourceId: activeSource.id,
        storeSlug,
        startedAt: new Date().toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        completedAt: new Date().toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        status: processed.errorsCount > 0 ? "partial_error" : "success",
        totalRowsRead: processed.parsedRows.length,
        importedOrdersCount: processed.groupedOrders.length,
        skippedDuplicatesCount: 1, // Détection d'un doublon simulé
        rejectedRowsCount: processed.errorsCount,
        rejectedDetails: processed.parsedRows
          .filter((r) => !r.isValid)
          .map((r) => ({
            rowNumber: r.rowNumber,
            sourceOrderId: r.idCommande,
            reason: r.errors.join(" ; "),
            rawSnippet: Object.values(r.raw).slice(0, 4).join(", "),
          })),
        warnings: [
          `Importation de ${processed.groupedOrders.length} nouvelles commandes au statut « À traiter ».`,
          "1 ligne déjà importée précédemment a été ignorée (anti-doublon strict).",
        ],
      };

      setReports([newBatch, ...reports]);
      setSources((prev) =>
        prev.map((s) =>
          s.id === activeSource.id
            ? {
                ...s,
                status: "connected",
                lastSyncAt: "À l'instant",
                totalOrdersImported: s.totalOrdersImported + newBatch.importedOrdersCount,
              }
            : s
        )
      );

      showToast(`Import terminé : ${newBatch.importedOrdersCount} commandes importées, ${newBatch.rejectedRowsCount} refusées.`);
    }, 1200);
  };

  // Télécharger le rapport d'erreurs en CSV (avec neutralisation de formule)
  const handleDownloadErrorReport = (report: ImportBatchReport) => {
    if (report.rejectedDetails.length === 0) {
      alert("Aucune erreur à exporter pour ce lot d'import.");
      return;
    }

    const headers = "Numero_Ligne,ID_Commande_Feuille,Motif_Refus,Extrait_Ligne\n";
    const rows = report.rejectedDetails
      .map(
        (r) =>
          `"${r.rowNumber}","${sanitizeCellValue(r.sourceOrderId || "")}","${sanitizeCellValue(
            r.reason
          )}","${sanitizeCellValue(r.rawSnippet)}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `erreurs_import_${report.id}_${storeSlug}.csv`;
    link.click();
    showToast("Fichier d'erreurs CSV téléchargé !");
  };

  // Basculer l'état (Mettre en pause / Reprendre)
  const handleTogglePause = () => {
    const newStatus = activeSource.status === "paused" ? "connected" : "paused";
    setSources((prev) =>
      prev.map((s) => (s.id === activeSource.id ? { ...s, status: newStatus } : s))
    );
    setActiveSource((prev) => ({ ...prev, status: newStatus }));
    showToast(newStatus === "paused" ? "Intégration mise en pause." : "Intégration réactivée.");
  };

  // Enregistrer les réglages
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSources((prev) =>
      prev.map((s) =>
        s.id === activeSource.id
          ? {
              ...s,
              sheetName,
              defaultCountry,
              dateFormat,
              autoSyncMinutes: syncFreq,
              initialImportChoice: initialChoice,
            }
          : s
      )
    );
    setIsSettingsOpen(false);
    showToast("Réglages de l'intégration enregistrés !");
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#111111] text-white text-xs font-bold shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Fil d'Ariane & En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#666660]">
            <Link href={`/app/${storeSlug}/reglages`} className="hover:text-[#111111]">
              Paramètres
            </Link>
            <span>/</span>
            <span className="font-bold text-[#111111]">Connexions & Intégrations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight mt-1">
            Sources de Commandes Externes
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Synchronisez vos commandes issues de Google Sheets, Shopify ou Webhooks directement vers le moteur COD d'AfriBuilder.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setWizardStep(1);
            setIsWizardOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Relier une Google Sheet</span>
        </button>
      </div>

      {/* BANDEAU DE PRINCIPE AFFICHÉ AU VENDEUR */}
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 sm:p-6 shadow-2xs space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
            Principe d'intégration en lecture seule
          </span>
        </div>
        <p className="text-xs text-emerald-900 leading-relaxed font-medium">
          « Votre site est ailleurs, mais vous voulez les livreurs, le stock et la comptabilité d'AfriBuilder ? Reliez la feuille où arrivent vos commandes. Chaque ligne devient une vraie commande AfriBuilder : vous l'appelez, vous l'attribuez à un livreur, et à la livraison l'argent est encaissé et le stock diminue. AfriBuilder lit votre feuille en lecture seule et n'écrit jamais dedans. »
        </p>
      </div>

      {/* GRILLE DES CARTES D'INTÉGRATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Carte Google Sheets */}
        <div className="rounded-3xl border border-black/10 bg-[#FAF8F5] p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-2xl bg-[#0F9D58] text-white flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  activeSource.status === "connected"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : activeSource.status === "paused"
                    ? "bg-amber-100 text-amber-800 border-amber-200"
                    : "bg-slate-100 text-slate-800 border-slate-200"
                }`}
              >
                {activeSource.status === "connected"
                  ? "Connectée"
                  : activeSource.status === "paused"
                  ? "En pause"
                  : "Non reliée"}
              </span>
            </div>

            <div>
              <h2 className="text-sm font-black text-[#111111]">Google Sheets</h2>
              <p className="text-xs text-[#666660] mt-0.5">
                Feuille : <span className="font-semibold text-[#111111]">{activeSource.sheetName}</span>
              </p>
              <p className="text-[11px] text-[#888880] mt-0.5">
                Dernière lecture : {activeSource.lastSyncAt || "Jamais"}
              </p>
              <p className="text-[11px] font-bold text-emerald-800 mt-1">
                {activeSource.totalOrdersImported} commandes synchronisées
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-black/[0.06]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="flex-1 py-2 px-3 rounded-xl border border-black/15 bg-white text-xs font-bold text-[#111111] hover:bg-black/5 transition-all text-center shadow-2xs cursor-pointer"
              >
                Configurer
              </button>
              <button
                type="button"
                onClick={handleImportNow}
                disabled={isImporting || activeSource.status === "paused"}
                className="py-2 px-3 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                title="Déclencher un import manuel immédiat"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isImporting ? "animate-spin" : ""}`} />
                <span>Importer</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Carte Shopify */}
        <div className="rounded-3xl border border-black/10 bg-white/70 p-5 shadow-2xs space-y-4 flex flex-col justify-between opacity-80">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-2xl bg-[#96bf48] text-white flex items-center justify-center">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 text-[#666660]">
                Prochainement
              </span>
            </div>
            <div>
              <h2 className="text-sm font-black text-[#111111]">Shopify</h2>
              <p className="text-xs text-[#666660] mt-0.5">
                Import automatique des commandes créées sur votre boutique Shopify externe.
              </p>
            </div>
          </div>
          <button
            disabled
            className="w-full py-2 px-3 rounded-xl bg-black/5 text-xs font-bold text-[#888880] cursor-not-allowed"
          >
            Même mécanisme d'import
          </button>
        </div>

        {/* 3. Carte WooCommerce */}
        <div className="rounded-3xl border border-black/10 bg-white/70 p-5 shadow-2xs space-y-4 flex flex-col justify-between opacity-80">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-2xl bg-[#9B5C8F] text-white flex items-center justify-center">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 text-[#666660]">
                Prochainement
              </span>
            </div>
            <div>
              <h2 className="text-sm font-black text-[#111111]">WooCommerce</h2>
              <p className="text-xs text-[#666660] mt-0.5">
                Passerelle webhook pour sites WordPress existants.
              </p>
            </div>
          </div>
          <button
            disabled
            className="w-full py-2 px-3 rounded-xl bg-black/5 text-xs font-bold text-[#888880] cursor-not-allowed"
          >
            Même mécanisme d'import
          </button>
        </div>

        {/* 4. Carte Webhook Universel */}
        <div className="rounded-3xl border border-black/10 bg-white/70 p-5 shadow-2xs space-y-4 flex flex-col justify-between opacity-80">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center">
                <Webhook className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 text-[#666660]">
                Prochainement
              </span>
            </div>
            <div>
              <h2 className="text-sm font-black text-[#111111]">Webhook Universel</h2>
              <p className="text-xs text-[#666660] mt-0.5">
                API JSON sécurisée par clé secrète pour applications sur mesure.
              </p>
            </div>
          </div>
          <button
            disabled
            className="w-full py-2 px-3 rounded-xl bg-black/5 text-xs font-bold text-[#888880] cursor-not-allowed"
          >
            Même mécanisme d'import
          </button>
        </div>
      </div>

      {/* RAPPORTS D'IMPORTATION (HISTORIQUE DES LOTS) */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-[#111111]">Rapports d'Importation & Synchronisation</h2>
            <p className="text-xs text-[#666660]">
              Traçabilité des lots d'import, commandes générées, lignes ignorées et rejets. Les anciens rapports sont automatiquement purgés après 30 jours.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-black/10 bg-white shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black/[0.08] bg-[#FAF8F5] text-[11px] font-bold uppercase tracking-wider text-[#666660]">
                <th className="p-4">Date & Heure</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Lignes Lues</th>
                <th className="p-4">Commandes Créées</th>
                <th className="p-4">Doublons Ignorés</th>
                <th className="p-4">Lignes Refusées</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06] text-[#444440]">
              {reports.map((rep) => (
                <tr key={rep.id} className="hover:bg-black/[0.02] transition-colors">
                  <td className="p-4 font-bold text-[#111111]">{rep.startedAt}</td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rep.status === "success"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {rep.status === "success" ? "Succès Total" : "Succès avec Rejets"}
                    </span>
                  </td>
                  <td className="p-4 font-bold">{rep.totalRowsRead}</td>
                  <td className="p-4 font-black text-emerald-700">+{rep.importedOrdersCount} créées</td>
                  <td className="p-4 text-[#888880]">{rep.skippedDuplicatesCount} déjà présentes</td>
                  <td className="p-4">
                    {rep.rejectedRowsCount > 0 ? (
                      <span className="font-bold text-rose-600">{rep.rejectedRowsCount} refusée(s)</span>
                    ) : (
                      <span className="text-[#888880]">0</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {rep.rejectedRowsCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleDownloadErrorReport(rep)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 transition-all text-xs cursor-pointer shadow-2xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Télécharger erreurs (CSV)</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#888880]">Aucune anomalie</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1 : ASSISTANT DE CONNEXION (3 ÉTAPES) */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-[#FAF8F5] border border-black/10 p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#0F9D58] text-white flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Assistant de liaison
                  </span>
                  <h3 className="text-lg font-black text-[#111111]">Connecter une Google Sheet</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWizardOpen(false)}
                className="text-[#666660] hover:text-[#111111] p-1.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Barre de navigation des 3 étapes */}
            <div className="flex items-center justify-between border-y border-black/[0.08] py-3 text-xs font-bold text-[#666660]">
              <span className={wizardStep === 1 ? "text-[#111111] font-black" : ""}>
                1. Préparer la feuille
              </span>
              <span>→</span>
              <span className={wizardStep === 2 ? "text-[#111111] font-black" : ""}>
                2. Rendre lisible (CSV)
              </span>
              <span>→</span>
              <span className={wizardStep === 3 ? "text-[#111111] font-black" : ""}>
                3. Coller le lien & Tester
              </span>
            </div>

            {/* ÉTAPE 1 : PRÉPARER LA FEUILLE */}
            {wizardStep === 1 && (
              <div className="space-y-4 text-xs animate-in fade-in">
                <p className="text-[#444440] leading-relaxed">
                  Pour qu'AfriBuilder lise vos commandes sans erreur, la première ligne de votre feuille doit contenir les noms des colonnes.
                  <span className="font-bold text-[#111111]"> L'ordre n'a aucune importance</span>, et AfriBuilder reconnaît automatiquement les variantes habituelles (« Tel », « Phone », « Order ID », « Nom », « Qty », etc.).
                </p>

                <div className="p-4 rounded-2xl bg-white border border-black/10 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111111]">En-têtes recommandés (19 colonnes reconnues) :</span>
                    <button
                      type="button"
                      onClick={handleCopyColumns}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111111] text-white text-[11px] font-bold hover:bg-black transition-all cursor-pointer shadow-2xs"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copier les colonnes</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-black/[0.06] text-[11px] font-mono text-[#444440] break-words">
                    {RECOMMENDED_COLUMNS_ORDER.join(", ")}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer"
                  >
                    <span>Étape suivante : Publication</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ÉTAPE 2 : RENDRE LA FEUILLE LISIBLE */}
            {wizardStep === 2 && (
              <div className="space-y-4 text-xs animate-in fade-in">
                <p className="text-[#444440] leading-relaxed">
                  Dans Google Sheets, suivez ces étapes pour générer l'adresse de lecture :
                </p>

                <ol className="list-decimal list-inside space-y-2 rounded-2xl bg-white border border-black/10 p-4 font-medium text-[#111111]">
                  <li>Ouvrez votre document Google Sheets.</li>
                  <li>Cliquez sur <span className="font-bold">Fichier → Partager → Publier sur le web</span>.</li>
                  <li>Sélectionnez l'onglet souhaité et choisissez le format <span className="font-bold text-emerald-800">« Valeurs séparées par des virgules (.csv) »</span>.</li>
                  <li>Cliquez sur Publier et copiez le lien généré.</li>
                  <li className="text-[#666660]">
                    (Alternative : Partagez le document en lecture seule « Toute personne disposant du lien »).
                  </li>
                </ol>

                {/* Avertissement de Confidentialité Obligatoire */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Avertissement de Confidentialité</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    « Une feuille publiée est accessible à toute personne qui possède le lien et contient les coordonnées de vos clients. Ne partagez ce lien avec personne d'autre qu'AfriBuilder. »
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="text-xs font-bold text-[#666660] hover:text-[#111111]"
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer"
                  >
                    <span>Étape suivante : Coller le lien</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : COLLER LE LIEN & TESTER À BLANC */}
            {wizardStep === 3 && (
              <div className="space-y-4 text-xs animate-in fade-in">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">
                    Lien de votre Google Sheet *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      required
                      value={inputUrl}
                      onChange={(e) => {
                        setInputUrl(e.target.value);
                        setUrlValidation(validateGoogleSheetUrl(e.target.value));
                      }}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-black/15 bg-white font-medium text-[#111111] focus:outline-hidden focus:border-black shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleTestConnection()}
                      disabled={isTesting}
                      className="px-4 py-2.5 rounded-xl bg-[#111111] text-white font-bold hover:bg-black transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? "animate-spin" : ""}`} />
                      <span>Tester</span>
                    </button>
                  </div>
                  {!urlValidation.isValid && urlValidation.error && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1">{urlValidation.error}</p>
                  )}
                  {urlValidation.isValid && urlValidation.maskedUrl && (
                    <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                      Identifiant extrait : {urlValidation.sheetId} (Lien chiffré au repos)
                    </p>
                  )}
                </div>

                {/* RÉSULTAT DU TEST À BLANC */}
                {dryRunResult && (
                  <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-3 shadow-2xs animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                      <span className="font-bold text-[#111111] flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Lecture simulée sans création de commande</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                        {dryRunResult.sampleRows.length} lignes analysées
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-[#111111] block">Colonnes reconnues :</span>
                      <div className="flex flex-wrap gap-1.5">
                        {dryRunResult.recognized.map((col, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-black/10 text-[#444440]"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Aperçu des 5 premières lignes interprétées */}
                    <div className="space-y-1.5 pt-1">
                      <span className="font-bold text-[#111111] block">
                        Aperçu des 5 premières commandes interprétées :
                      </span>
                      <div className="overflow-x-auto rounded-xl border border-black/10 text-[10px]">
                        <table className="w-full text-left">
                          <thead className="bg-[#FAF8F5] font-bold text-[#666660]">
                            <tr>
                              <th className="p-2">Ligne</th>
                              <th className="p-2">ID</th>
                              <th className="p-2">Client</th>
                              <th className="p-2">Téléphone</th>
                              <th className="p-2">Produit</th>
                              <th className="p-2">Total</th>
                              <th className="p-2">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/[0.06]">
                            {dryRunResult.sampleRows.map((r, i) => (
                              <tr key={i} className="hover:bg-black/[0.02]">
                                <td className="p-2 font-mono">#{r.rowNumber}</td>
                                <td className="p-2 font-bold">{r.idCommande}</td>
                                <td className="p-2">{r.client}</td>
                                <td className="p-2 font-mono text-emerald-800">{r.telephone}</td>
                                <td className="p-2">{r.produit || r.sku}</td>
                                <td className="p-2 font-bold">
                                  {r.total ? formatFcfa(r.total) : "Catalogue"}
                                </td>
                                <td className="p-2">
                                  {r.isValid ? (
                                    <span className="text-emerald-700 font-bold">Valide ✓</span>
                                  ) : (
                                    <span className="text-rose-600 font-bold">Rejeté</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="text-xs font-bold text-[#666660] hover:text-[#111111]"
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWizardOpen(false);
                      setIsSettingsOpen(true);
                      showToast("Feuille testée et validée ! Définissez vos options de synchronisation.");
                    }}
                    disabled={!dryRunResult?.tested}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <span>Valider et configurer la synchronisation</span>
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2 : PANNEAU DE RÉGLAGES COMPLETS DE L'INTÉGRATION */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-[#FAF8F5] border border-black/10 p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#111111]" />
                <h3 className="text-base font-black text-[#111111]">
                  Réglages de l'Intégration Google Sheets
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-[#666660] hover:text-[#111111]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              {/* Onglet feuille */}
              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Nom de l'onglet (feuille) à synchroniser *
                </label>
                <input
                  type="text"
                  required
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="Ex : Commandes COD ou Feuille 1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-white font-medium text-[#111111] focus:outline-hidden"
                />
              </div>

              {/* Pays par défaut & Format de date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Pays par défaut *</label>
                  <select
                    value={defaultCountry}
                    onChange={(e) => setDefaultCountry(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-black/15 bg-white font-bold text-[#111111] focus:outline-hidden"
                  >
                    <option value="CI">🇨🇮 Côte d'Ivoire (+225 / XOF)</option>
                    <option value="TG">🇹🇬 Togo (+228 / XOF)</option>
                    <option value="SN">🇸🇳 Sénégal (+221 / XOF)</option>
                    <option value="BJ">🇧🇯 Bénin (+229 / XOF)</option>
                    <option value="CM">🇨🇲 Cameroun (+237 / XAF)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Format de date *</label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-black/15 bg-white font-bold text-[#111111] focus:outline-hidden"
                  >
                    <option value="DD/MM/YYYY">jj/mm/aaaa (ex : 20/08/2026)</option>
                    <option value="YYYY-MM-DD">aaaa-mm-jj (ex : 2026-08-20)</option>
                  </select>
                </div>
              </div>

              {/* Fréquence de lecture automatique */}
              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Fréquence de lecture automatique *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 1, label: "Toutes les 1 min" },
                    { val: 5, label: "Toutes les 5 min (Recommandé)" },
                    { val: 15, label: "Toutes les 15 min" },
                  ].map((f) => (
                    <button
                      key={f.val}
                      type="button"
                      onClick={() => setSyncFreq(f.val as any)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                        syncFreq === f.val
                          ? "border-[#111111] bg-[#111111] text-white"
                          : "border-black/10 bg-white text-[#666660]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Choix obligatoire au premier lancement (a, b, c) */}
              <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-2.5">
                <span className="font-bold text-[#111111] block">
                  Comportement initial pour les commandes existantes *
                </span>
                <div className="space-y-2">
                  {[
                    {
                      id: "only_new",
                      title: "Ignorer les lignes déjà présentes",
                      desc: "N'importer que les futures commandes ajoutées à la feuille à partir de maintenant.",
                    },
                    {
                      id: "from_date",
                      title: "Importer à partir d'une date spécifique",
                      desc: "Importer les commandes enregistrées à partir de la date choisie.",
                    },
                    {
                      id: "all",
                      title: "Tout importer depuis le début",
                      desc: "Toutes les lignes valides seront transformées en commandes AfriBuilder.",
                    },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        initialChoice === opt.id
                          ? "border-[#111111] bg-[#FAF8F5] font-bold"
                          : "border-black/[0.06] hover:bg-black/[0.02]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="initial_choice"
                        checked={initialChoice === opt.id}
                        onChange={() => setInitialChoice(opt.id as any)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-bold text-[#111111]">{opt.title}</p>
                        <p className="text-[11px] text-[#666660]">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Boutons d'Action */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTogglePause}
                    className="px-3 py-2 rounded-xl border border-black/15 bg-white text-xs font-bold text-[#111111] hover:bg-black/5"
                  >
                    {activeSource.status === "paused" ? "Reprendre la synchronisation" : "Mettre en pause"}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-[#666660] hover:text-[#111111]"
                  >
                    Fermer
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black shadow-sm"
                  >
                    Enregistrer les réglages
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
