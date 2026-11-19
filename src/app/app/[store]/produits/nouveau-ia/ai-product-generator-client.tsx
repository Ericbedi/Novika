"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Calculator,
  RefreshCw,
  Eye,
  Check,
  ShieldAlert,
  ChevronRight,
  Info,
  Layers,
  Save,
  Globe,
  Tag,
  Clock,
  Truck,
  RotateCcw,
  CheckSquare,
  Square,
  Wand2,
} from "lucide-react";
import { useApp } from "@/components/layout/app-shell";
import { canUseAiProductGenerator } from "@/config/permissions";
import { validateProductSheet, ProductSheetContent, ValidationIssue } from "@/lib/product-sheet-validator";
import { calculateScalingMetrics } from "@/lib/scaling";
import { formatFcfa } from "@/lib/money";
import { cn } from "@/lib/utils";

interface AiProductGeneratorClientProps {
  storeSlug: string;
}

export function AiProductGeneratorClient({ storeSlug }: AiProductGeneratorClientProps) {
  const router = useRouter();
  const { activeRole } = useApp();

  // 1. Contrôle strict des permissions : Réservé à l'Admin propriétaire (owner)
  const isOwner = canUseAiProductGenerator(activeRole);

  // État du parcours en 4 étapes
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Étape 1 : Images et Source
  const [images, setImages] = useState<Array<{ name: string; size: number; type?: string; previewUrl: string }>>([]);
  const [productPageUrl, setProductPageUrl] = useState("");
  const [confirmedRights, setConfirmedRights] = useState(false);
  const [isExtractingFacts, setIsExtractingFacts] = useState(false);
  const [extractedFacts, setExtractedFacts] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  // Étape 2 : Analyse de l'image (Détection IA)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedFacts, setDetectedFacts] = useState<{
    probableName: string;
    category: string;
    visibleElements: string[];
    visibleVariants: string[];
  }>({
    probableName: "",
    category: "",
    visibleElements: [],
    visibleVariants: [],
  });

  // Étape 3 : Fiche Produit (Champs saisis par l'admin)
  const [productName, setProductName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [category, setCategory] = useState("");
  const [sellingPrice, setSellingPrice] = useState<number>(15000);
  const [comparePrice, setComparePrice] = useState<number | undefined>(25000);
  const [targetMarket, setTargetMarket] = useState("Lomé, Togo");
  const [targetAvatar, setTargetAvatar] = useState("");
  const [mainProblem, setMainProblem] = useState("");
  const [keyBenefits, setKeyBenefits] = useState<string[]>([
    "Efficacité visible dès les premières utilisations",
    "Facile d'utilisation au quotidien",
    "Qualité supérieure et durable",
    "Rapport qualité-prix imbattable",
  ]);
  const [specs, setSpecs] = useState("");
  const [objections, setObjections] = useState("");
  const [alternativeSolutions, setAlternativeSolutions] = useState("");
  const [realProofs, setRealProofs] = useState("aucune");
  const [brandTone, setBrandTone] = useState("Professionnel & Rassurant");
  const [customTone, setCustomTone] = useState("");

  // Réassurance réelle saisie par l'admin
  const [deliveryDelay, setDeliveryDelay] = useState("24h à 48h");
  const [warrantyPeriod, setWarrantyPeriod] = useState("14 jours satisfait ou remboursé");
  const [supportHours, setSupportHours] = useState("Lundi au Samedi de 08h à 18h");

  // Calculateur de rentabilité facultatif (ne va jamais à l'IA)
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcBuyPrice, setCalcBuyPrice] = useState(4000);
  const [calcDeliveryCost, setCalcDeliveryCost] = useState(1500);
  const [calcClosingRate, setCalcClosingRate] = useState(0.5);
  const [calcDesiredProfit, setCalcDesiredProfit] = useState(3000);

  // Étape 4 : Génération, relecture et révision
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSheet, setGeneratedSheet] = useState<ProductSheetContent | null>(null);
  const [selectedHeadlineIndex, setSelectedHeadlineIndex] = useState(0);
  const [internalNotes, setInternalNotes] = useState<{
    visualBriefs: string[];
    verificationPoints: string[];
  }>({ visualBriefs: [], verificationPoints: [] });
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [canPublish, setCanPublish] = useState(false);
  const [regeneratingBlockKey, setRegeneratingBlockKey] = useState<string | null>(null);
  const [blockInstruction, setBlockInstruction] = useState("");
  const [remainingQuota, setRemainingQuota] = useState(50);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Si l'utilisateur n'est pas Admin propriétaire (owner), affichage du 403
  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="p-8 rounded-[24px] border border-rose-200 bg-rose-50/50 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-rose-950">Accès Refusé (403)</h1>
          <p className="text-xs text-rose-800 leading-relaxed max-w-md mx-auto">
            Seul l'<strong>ADMIN propriétaire (owner)</strong> de la boutique est autorisé à utiliser
            le générateur automatique de fiches produits par IA Gemini. Les rôles co-admin, manager,
            closeur, livreur et agence en sont exclus par politique de sécurité.
          </p>
          <div className="pt-2">
            <Link
              href={`/app/${storeSlug}/produits`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-rose-200 text-xs font-bold text-rose-900 hover:bg-rose-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à la liste des produits</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fonctions de l'Étape 1
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 6) {
      setImageError("Maximum 6 images par produit.");
      return;
    }

    const newImgs: Array<{ name: string; size: number; type?: string; previewUrl: string }> = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setImageError(`Le fichier ${file.name} dépasse la limite de 5 Mo.`);
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setImageError(`Format invalide pour ${file.name}. Seuls JPG, PNG et WebP sont acceptés.`);
        return;
      }
      newImgs.push({
        name: file.name,
        size: file.size,
        type: file.type || "image/jpeg",
        previewUrl: URL.createObjectURL(file),
      });
    }

    setImages((prev) => [...prev, ...newImgs]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExtractFactsFromUrl = async () => {
    if (!productPageUrl.trim()) return;
    setIsExtractingFacts(true);
    try {
      const res = await fetch("/api/products/ai/extract-facts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: productPageUrl }),
      });
      const data = await res.json();
      if (data.success && data.facts) {
        setExtractedFacts(data.facts);
        setToastMessage(`${data.facts.length} caractéristiques techniques extraites sans copie textuelle.`);
      } else {
        setImageError(data.error || "Impossible d'extraire les faits de cette page.");
      }
    } catch {
      setImageError("Erreur de connexion lors de l'analyse de l'URL.");
    } finally {
      setIsExtractingFacts(false);
    }
  };

  // Passer à l'Étape 2 (Analyse IA de l'image)
  const handleAnalyzeImages = async () => {
    if (images.length === 0) {
      setImageError("Veuillez importer au moins 1 image du produit.");
      return;
    }
    if (!confirmedRights) {
      setImageError("Veuillez confirmer avoir le droit d'utiliser ces images.");
      return;
    }

    setIsAnalyzing(true);
    setImageError(null);

    try {
      const res = await fetch("/api/products/ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug,
          userRole: activeRole,
          confirmedRights: true,
          images: images.map((img) => ({
            name: img.name,
            size: img.size,
            type: img.type || "image/jpeg",
            previewUrl: img.previewUrl,
          })),
        }),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setDetectedFacts(data.analysis);
        // Pré-remplir les champs du formulaire sans imposer
        if (data.analysis.probableName && !productName) {
          setProductName(data.analysis.probableName);
        }
        if (data.analysis.category && !category) {
          setCategory(data.analysis.category);
        }
        setCurrentStep(2);
      } else {
        setImageError(data.error || "Erreur lors de l'analyse par l'IA.");
      }
    } catch {
      setImageError("Erreur lors de la communication avec l'API d'analyse.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculateur de rentabilité
  const calcMetrics = calculateScalingMetrics({
    productId: "calc_preview",
    productName: productName || "Produit",
    acquisitionPrice: calcBuyPrice,
    sellingPrice: sellingPrice || 15000,
    deliveryCost: calcDeliveryCost,
    desiredProfit: calcDesiredProfit,
    dollarRate: 600,
    closingRate: calcClosingRate,
    adSpendDollars: 50,
    deliveredUnits: 10,
    pendingUnits: 2,
    ordersCount: 20,
    campaignDays: 7,
    phase: "testing",
  });

  // Génération de la fiche complète (Étape 4)
  const handleGenerateSheet = async () => {
    if (!productName.trim() || !sellingPrice || !targetMarket.trim() || !brandTone.trim()) {
      alert("Veuillez remplir tous les champs obligatoires (Nom, Prix, Marché cible, Ton).");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/products/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug,
          userRole: activeRole,
          confirmedRights: true,
          productName,
          brandName,
          category,
          sellingPrice: Number(sellingPrice),
          currency: "FCFA",
          comparePrice: comparePrice ? Number(comparePrice) : undefined,
          targetMarket,
          targetAvatar,
          mainProblem,
          keyBenefits,
          specs,
          objections,
          realProofs,
          brandTone: customTone ? `${brandTone} (${customTone})` : brandTone,
          deliveryDelay,
          warrantyPeriod,
          supportHours,
          detectedVisualFacts: detectedFacts.visibleElements,
        }),
      });

      const data = await res.json();
      if (data.success && data.sheet) {
        setGeneratedSheet(data.sheet);
        if (data.internalNotes) {
          setInternalNotes(data.internalNotes);
        }
        if (data.validation) {
          setValidationIssues(data.validation.issues || []);
          setCanPublish(data.validation.canPublish);
        }
        if (data.quota) {
          setRemainingQuota(data.quota.remaining);
        }
        setCurrentStep(4);
      } else {
        alert(data.error || "Erreur lors de la génération de la fiche produit.");
      }
    } catch {
      alert("Erreur de connexion lors de la génération.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Régénérer un bloc particulier
  const handleRegenerateBlock = async (blockKey: string) => {
    if (!generatedSheet) return;
    setRegeneratingBlockKey(blockKey);

    try {
      const res = await fetch("/api/products/ai/regenerate-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug,
          userRole: activeRole,
          blockKey,
          productName,
          sellingPrice: Number(sellingPrice),
          targetMarket,
          brandTone,
          customInstruction: blockInstruction,
        }),
      });

      const data = await res.json();
      if (data.success && data.regeneratedText) {
        setGeneratedSheet((prev) => {
          if (!prev) return prev;
          const updatedBlocks = { ...prev.blocks, [blockKey]: data.regeneratedText };
          const updatedSheet = { ...prev, blocks: updatedBlocks };

          // Revalider avec le texte mis à jour
          const val = validateProductSheet(updatedSheet, {
            realProofs,
            category,
            sellingPrice: Number(sellingPrice),
            comparePrice: comparePrice ? Number(comparePrice) : undefined,
          });
          setValidationIssues(val.issues);
          setCanPublish(val.canPublish);

          return updatedSheet;
        });
        setBlockInstruction("");
        setToastMessage(`Bloc "${blockKey}" régénéré avec succès !`);
      } else {
        alert(data.error || "Impossible de régénérer ce bloc.");
      }
    } catch {
      alert("Erreur réseau lors de la régénération.");
    } finally {
      setRegeneratingBlockKey(null);
    }
  };

  // Enregistrer comme brouillon dans le catalogue
  const handleSaveDraft = (publishNow: boolean = false) => {
    if (!generatedSheet) return;

    if (publishNow && !canPublish) {
      alert("Impossible de publier : veuillez résoudre les alertes bloquantes signalées ci-dessous.");
      return;
    }

    const storageKey = `novika_store_products_${storeSlug}`;
    const saved = localStorage.getItem(storageKey);
    let list = [];
    if (saved) {
      try {
        list = JSON.parse(saved);
      } catch {}
    }

    const selectedHeadline =
      generatedSheet.headlines[selectedHeadlineIndex] || generatedSheet.selectedHeadline || productName;

    const newProduct = {
      id: `prod_ai_${Date.now()}`,
      name: productName,
      description: generatedSheet.blocks.solutionPresentation || "",
      sellingPrice: Number(sellingPrice),
      comparePrice: comparePrice ? Number(comparePrice) : undefined,
      category: category || "Général",
      images: images.map((i) => i.previewUrl),
      stock: 50,
      availableStock: 50,
      physicalStock: 50,
      reservedStock: 0,
      status: publishNow ? "active" : "draft",
      productStatus: publishNow ? "active" : "draft",
      hiddenFromCatalog: false,
      stockStatus: "in_stock",
      seo: {
        title: generatedSheet.seoTitle,
        description: generatedSheet.metaDescription,
        slug: productName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      },
      createdAt: new Date().toISOString(),
      aiGenerated: true,
      selectedHeadline,
    };

    localStorage.setItem(storageKey, JSON.stringify([newProduct, ...list]));
    setToastMessage(
      publishNow
        ? "Produit publié avec succès sur votre boutique !"
        : "Produit enregistré en BROUILLON dans votre catalogue."
    );

    setTimeout(() => {
      router.push(`/app/${storeSlug}/produits`);
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-28 max-w-5xl mx-auto">
      {/* Barre supérieure */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/app/${storeSlug}/produits`}
            className="p-2 rounded-xl bg-white border border-[#E6E0D4] hover:bg-[#F3EFE6] transition-colors text-[#111111]"
            title="Retour à la liste des produits"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Prompt 07 • IA Gemini
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#111111]/[0.05] text-[#111111]">
                Quota : {remainingQuota} / 50 restantes ce mois-ci
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
              Créer une fiche produit avec l'IA
            </h1>
          </div>
        </div>

        {/* Indicateur d'étape */}
        <div className="flex items-center gap-1 text-xs font-bold text-[#666660]">
          <span className={cn("px-2.5 py-1 rounded-lg", currentStep === 1 ? "bg-[#111111] text-white" : "bg-black/5")}>
            1. Images
          </span>
          <ChevronRight className="w-3 h-3 text-[#999990]" />
          <span className={cn("px-2.5 py-1 rounded-lg", currentStep === 2 ? "bg-[#111111] text-white" : "bg-black/5")}>
            2. Détection
          </span>
          <ChevronRight className="w-3 h-3 text-[#999990]" />
          <span className={cn("px-2.5 py-1 rounded-lg", currentStep === 3 ? "bg-[#111111] text-white" : "bg-black/5")}>
            3. Fiche
          </span>
          <ChevronRight className="w-3 h-3 text-[#999990]" />
          <span className={cn("px-2.5 py-1 rounded-lg", currentStep === 4 ? "bg-[#111111] text-white" : "bg-black/5")}>
            4. Relecture
          </span>
        </div>
      </div>

      {/* Toast de confirmation */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#111111] text-white text-xs font-bold shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ÉTAPE 1 : TÉLÉVERSEMENT DES IMAGES ET EXTRACTION DE FAITS */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-5">
            <div>
              <h2 className="text-base font-black text-[#111111] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <span>Étape 1 : Image(s) du produit et source</span>
              </h2>
              <p className="text-xs text-[#666660] mt-1">
                Téléversez de 1 à 6 images (JPG, PNG, WebP, max 5 Mo). Les métadonnées EXIF (comme la géolocalisation GPS)
                sont automatiquement supprimées pour garantir votre confidentialité.
              </p>
            </div>

            {/* Zone de Dropzone */}
            <div className="border-2 border-dashed border-[#E6E0D4] hover:border-[#111111] rounded-2xl p-6 text-center transition-colors bg-white/60">
              <input
                type="file"
                id="file-input-product-images"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="file-input-product-images"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-[#111111]">
                  Cliquez pour choisir vos images ou glissez-déposez ici
                </div>
                <div className="text-[11px] text-[#888880]">JPG, PNG ou WebP • 5 Mo max chacune • 1 à 6 photos</div>
              </label>
            </div>

            {/* Affichage des vignettes */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-black/10 aspect-square bg-stone-100">
                    <img src={img.previewUrl} alt={img.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-black/70 text-white hover:bg-black transition-colors"
                      title="Supprimer cette image"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-black/60 text-white">
                      Photo {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Lien facultatif vers une page produit */}
            <div className="pt-4 border-t border-black/[0.06] space-y-2">
              <label className="block text-xs font-bold text-[#111111]">
                Lien facultatif vers une page produit (Extraction de FAITS uniquement)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={productPageUrl}
                  onChange={(e) => setProductPageUrl(e.target.value)}
                  placeholder="https://exemple.com/produit-reference"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-xs font-medium text-[#111111] focus:outline-none focus:border-[#111111]"
                />
                <button
                  type="button"
                  onClick={handleExtractFactsFromUrl}
                  disabled={isExtractingFacts || !productPageUrl.trim()}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#E6E0D4] hover:bg-[#F3EFE6] text-xs font-bold text-[#111111] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isExtractingFacts ? "Extraction..." : "Extraire les faits"}
                </button>
              </div>
              <p className="text-[11px] text-[#888880]">
                Protection anti-SSRF active. Le serveur lit uniquement la page pour en dégager des faits techniques
                (dimensions, matière, contenu du pack), sans copier de textes ou d'images protégées.
              </p>

              {extractedFacts.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Faits techniques extraits :
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-800">
                    {extractedFacts.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Case à cocher obligatoire */}
            <div className="pt-4 border-t border-black/[0.06]">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="chk-copyright-confirm"
                  checked={confirmedRights}
                  onChange={(e) => setConfirmedRights(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#111111] focus:ring-[#111111]"
                />
                <span className="text-xs font-bold text-[#111111]">
                  Je confirme avoir le droit d'utiliser ces images et informations.
                </span>
              </label>
            </div>

            {imageError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                id="btn-analyze-ai"
                onClick={handleAnalyzeImages}
                disabled={isAnalyzing || images.length === 0 || !confirmedRights}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Analyse multimodale en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Analyser l'image avec l'IA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ÉTAPE 2 : PROPOSITION DE L'IA (À CONFIRMER) */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Détecté par l'IA — à confirmer
                </span>
              </div>
              <h2 className="text-base font-black text-[#111111] mt-1">
                Étape 2 : Éléments visuels détectés par Gemini
              </h2>
              <p className="text-xs text-[#666660] mt-1">
                Voici ce que l'IA a identifié sur vos photos. <strong>Règle stricte :</strong> l'IA ne devine JAMAIS un prix,
                une matière non visible, des dimensions, un taux, une certification ni un usage médical.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#888880]">
                  Nom probable détecté
                </span>
                <p className="text-sm font-black text-[#111111]">
                  {detectedFacts.probableName || "Produit sans étiquette lisible"}
                </p>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Détecté par l'IA — à confirmer
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#888880]">
                  Catégorie probable
                </span>
                <p className="text-sm font-black text-[#111111]">
                  {detectedFacts.category || "À déterminer"}
                </p>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Détecté par l'IA — à confirmer
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#888880]">
                  Éléments & Accessoires visibles
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {detectedFacts.visibleElements.map((el, i) => (
                    <span key={i} className="text-xs font-semibold px-2 py-1 rounded-lg bg-stone-100 text-stone-800">
                      {el}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#888880]">
                  Variantes apparentes
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {detectedFacts.visibleVariants.map((v, i) => (
                    <span key={i} className="text-xs font-semibold px-2 py-1 rounded-lg bg-stone-100 text-stone-800">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Information de conformité :</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  L'IA s'interdit d'inventer des matières non vérifiables ou des promesses miraculeuses.
                  C'est à vous de renseigner votre prix de vente, vos délais de livraison et vos garanties réelles à l'étape suivante.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl bg-white border border-[#E6E0D4] text-xs font-bold text-[#111111] hover:bg-[#F3EFE6] transition-colors"
              >
                ← Changer les photos
              </button>
              <button
                type="button"
                id="btn-confirm-detection"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer"
              >
                <span>Valider et compléter la fiche</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ÉTAPE 3 : FORMULAIRE COMPLET & CALCULATEUR DE RENTABILITÉ */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base font-black text-[#111111] flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600" />
                <span>Étape 3 : Informations de la fiche produit</span>
              </h2>
              <p className="text-xs text-[#666660] mt-1">
                Complétez les champs obligatoires (*). Vous pouvez cliquer sur « Proposer » pour laisser l'IA suggérer
                des bénéfices ou des réponses aux objections à valider.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Nom du produit <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="input-product-name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Café Bio Champignon Vitality"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Nom de la marque ou boutique
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ex: Vitality Nature"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Prix de vente client (FCFA) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  id="input-selling-price"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  placeholder="15000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Prix barré de référence authentique (FCFA)
                </label>
                <input
                  type="number"
                  id="input-compare-price"
                  value={comparePrice || ""}
                  onChange={(e) => setComparePrice(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="25000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Pays ou ville cible principale <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="input-target-market"
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  placeholder="Ex: Lomé, Togo ou Abidjan, Côte d'Ivoire"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Ton de la marque <span className="text-rose-500">*</span>
                </label>
                <select
                  value={brandTone}
                  onChange={(e) => setBrandTone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                >
                  <option value="Professionnel & Rassurant">Professionnel & Rassurant</option>
                  <option value="Direct & Percutant">Direct & Percutant (Style COD Vente Rapide)</option>
                  <option value="Chaleureux & Bienveillant">Chaleureux & Bienveillant</option>
                  <option value="Élégant & Premium">Élégant & Premium</option>
                  <option value="Énergique & Motivant">Énergique & Motivant</option>
                </select>
              </div>
            </div>

            {/* Réassurance réelle obligatoire pour éviter les [à préciser] */}
            <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                Informations réelles de réassurance client (COD)
              </h3>
              <p className="text-[11px] text-[#888880]">
                Ces données réelles évitent d'afficher des repères « [à préciser] » qui bloqueraient la publication.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#666660] mb-1">Délai de livraison réel</label>
                  <input
                    type="text"
                    value={deliveryDelay}
                    onChange={(e) => setDeliveryDelay(e.target.value)}
                    placeholder="Ex: 24h à 48h à domicile"
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-stone-50 text-xs font-medium text-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666660] mb-1">Garantie réelle</label>
                  <input
                    type="text"
                    value={warrantyPeriod}
                    onChange={(e) => setWarrantyPeriod(e.target.value)}
                    placeholder="Ex: 14 jours satisfait ou remboursé"
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-stone-50 text-xs font-medium text-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666660] mb-1">Horaires service client</label>
                  <input
                    type="text"
                    value={supportHours}
                    onChange={(e) => setSupportHours(e.target.value)}
                    placeholder="Ex: Lun - Sam de 08h à 18h"
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-stone-50 text-xs font-medium text-[#111111]"
                  />
                </div>
              </div>
            </div>

            {/* Preuves réelles */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Preuves réelles attestées (défaut : "aucune")
              </label>
              <input
                type="text"
                value={realProofs}
                onChange={(e) => setRealProofs(e.target.value)}
                placeholder="Ex: aucune, ou Rapport labo certifié ISO, Brevet n°..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-xs font-medium text-[#111111]"
              />
              <p className="text-[11px] text-[#888880] mt-1">
                Si vous laissez « aucune », l'IA s'interdit formellement d'inventer des pourcentages ("98%"), des notes ("4.9/5")
                ou des nombres de clients ("+10 000 clients satisfaits").
              </p>
            </div>

            {/* Accordéon Calculateur de Rentabilité (Facultatif - Jamais envoyé à l'IA) */}
            <div className="border border-black/[0.06] rounded-2xl bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCalculator(!showCalculator)}
                className="w-full px-4 py-3 text-left font-bold text-xs text-[#111111] flex items-center justify-between hover:bg-black/[0.02]"
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>Calculateur de rentabilité produit (Optionnel • Données strictement confidentielles)</span>
                </div>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  {showCalculator ? "Fermer" : "Ouvrir le simulateur"}
                </span>
              </button>

              {showCalculator && (
                <div className="p-4 border-t border-black/[0.06] bg-stone-50/50 space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#666660] mb-1">Prix d'achat (FCFA)</label>
                      <input
                        type="number"
                        value={calcBuyPrice}
                        onChange={(e) => setCalcBuyPrice(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#666660] mb-1">Frais livraison (FCFA)</label>
                      <input
                        type="number"
                        value={calcDeliveryCost}
                        onChange={(e) => setCalcDeliveryCost(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#666660] mb-1">Taux closing (%)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={calcClosingRate}
                        onChange={(e) => setCalcClosingRate(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#666660] mb-1">Bénéfice visé / pièce</label>
                      <input
                        type="number"
                        value={calcDesiredProfit}
                        onChange={(e) => setCalcDesiredProfit(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border bg-white font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-white border border-black/[0.06] text-center">
                    <div>
                      <span className="text-[10px] text-[#888880] block font-bold uppercase">Marge brute</span>
                      <span className="text-sm font-black text-[#111111]">
                        {formatFcfa(calcMetrics.marginBeforeAds)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#888880] block font-bold uppercase">CPA Breakeven ($)</span>
                      <span className="text-sm font-black text-amber-600">
                        ${calcMetrics.cpaBreakevenDollars.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#888880] block font-bold uppercase">CPA Cible ($)</span>
                      <span className="text-sm font-black text-emerald-600">
                        ${calcMetrics.cpaTargetDollars ? calcMetrics.cpaTargetDollars.toFixed(2) : "0.00"}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#888880] italic">
                    Ces calculs utilisent le moteur <code>src/lib/scaling.ts</code>. Ces chiffres de rentabilité ne sont
                    JAMAIS transmis à l'IA ni intégrés à la fiche publique.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2.5 rounded-xl bg-white border border-[#E6E0D4] text-xs font-bold text-[#111111] hover:bg-[#F3EFE6] transition-colors"
              >
                ← Retour
              </button>
              <button
                type="button"
                id="btn-generate-full-sheet"
                onClick={handleGenerateSheet}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Génération de la fiche (13 blocs)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Générer la fiche produit complète</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ÉTAPE 4 : RÉSULTAT, RELECTURE BLOC PAR BLOC & ENREGISTREMENT */}
      {/* ========================================================================= */}
      {currentStep === 4 && generatedSheet && (
        <div className="space-y-6 animate-in fade-in">
          {/* Bannière de relecture obligatoire */}
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-950 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-700" />
              <span className="text-xs font-black">Texte généré par IA : relisez avant de publier.</span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
              13 blocs rédigés
            </span>
          </div>

          {/* Panneau de validation des garde-fous */}
          <div className="p-5 rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Contrôle automatique de conformité & Garde-fous (Prompt 07)
            </h3>

            {validationIssues.length === 0 ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Tous les garde-fous sont respectés. La fiche est prête pour la publication.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {validationIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-3 rounded-xl text-xs font-medium flex items-start gap-2.5",
                      issue.type === "error"
                        ? "bg-rose-50 border border-rose-200 text-rose-900"
                        : "bg-amber-50 border border-amber-200 text-amber-900"
                    )}
                  >
                    {issue.type === "error" ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold">
                        {issue.blockingForPublish ? "[BLOQUANT POUR PUBLICATION] " : "[AVERTISSEMENT] "}
                      </span>
                      {issue.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Choix des 3 variantes de Headline */}
          <div className="p-5 rounded-[20px] border border-black/[0.08] bg-white space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#888880]">
              Choisissez votre accroche principale (Headline) :
            </span>
            <div className="space-y-2">
              {generatedSheet.headlines.map((headline, idx) => (
                <label
                  key={idx}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-xs font-bold",
                    selectedHeadlineIndex === idx
                      ? "border-[#111111] bg-stone-50 text-[#111111] shadow-2xs"
                      : "border-black/[0.06] text-[#666660] hover:bg-stone-50/50"
                  )}
                >
                  <input
                    type="radio"
                    name="selected-headline"
                    checked={selectedHeadlineIndex === idx}
                    onChange={() => setSelectedHeadlineIndex(idx)}
                    className="h-4 w-4 text-[#111111] focus:ring-[#111111]"
                  />
                  <span>Variante {idx + 1} : {headline}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Blocs de contenu modifiables */}
          <div className="space-y-4">
            {/* Bloc Titre SEO & Meta Description */}
            <div className="p-5 rounded-[20px] border border-black/[0.08] bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#111111]">Référencement & Titre SEO</span>
                <span className="text-[11px] text-[#888880]">
                  {generatedSheet.seoTitle.length} / 60 car.
                </span>
              </div>
              <input
                type="text"
                value={generatedSheet.seoTitle}
                onChange={(e) => setGeneratedSheet({ ...generatedSheet, seoTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-black/[0.08] text-xs font-bold text-[#111111]"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-black text-[#111111]">Méta description</span>
                <span className="text-[11px] text-[#888880]">
                  {generatedSheet.metaDescription.length} / 150 car.
                </span>
              </div>
              <textarea
                rows={2}
                value={generatedSheet.metaDescription}
                onChange={(e) => setGeneratedSheet({ ...generatedSheet, metaDescription: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-black/[0.08] text-xs font-medium text-[#111111]"
              />
            </div>

            {/* Blocs éditoriaux */}
            {Object.entries(generatedSheet.blocks).map(([key, val]) => {
              if (key === "faq") return null;
              const textVal = Array.isArray(val) ? val.join("\n• ") : String(val || "");
              return (
                <div key={key} className="p-5 rounded-[20px] border border-black/[0.08] bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#111111] uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRegenerateBlock(key)}
                      disabled={regeneratingBlockKey === key}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <RefreshCw className={cn("w-3 h-3", regeneratingBlockKey === key && "animate-spin")} />
                      <span>Régénérer ce bloc</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={textVal}
                    onChange={(e) =>
                      setGeneratedSheet({
                        ...generatedSheet,
                        blocks: { ...generatedSheet.blocks, [key]: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
              );
            })}
          </div>

          {/* Notes internes (Briefs visuels & Points à vérifier) */}
          <div className="p-5 rounded-[20px] border border-stone-300 bg-stone-100/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-stone-600" />
                Notes internes pour votre équipe (Non publiées sur la boutique)
              </h3>
              <span className="text-[10px] font-bold bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full">
                Privé admin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-2">
                <span className="font-bold text-stone-900 block">Briefs visuels recommandés :</span>
                <ul className="list-disc list-inside space-y-1 text-stone-700 text-[11px]">
                  {internalNotes.visualBriefs.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-2">
                <span className="font-bold text-stone-900 block">Points de vérification indispensables :</span>
                <ul className="list-disc list-inside space-y-1 text-stone-700 text-[11px]">
                  {internalNotes.verificationPoints.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Actions finales */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2.5 rounded-xl bg-white border border-[#E6E0D4] text-xs font-bold text-[#111111] hover:bg-[#F3EFE6] transition-colors"
            >
              ← Modifier les paramètres
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                id="btn-save-as-draft"
                onClick={() => handleSaveDraft(false)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-black/15 text-[#111111] text-xs font-bold hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#888880]" />
                <span>Enregistrer comme brouillon</span>
              </button>

              <button
                type="button"
                id="btn-publish-now"
                onClick={() => handleSaveDraft(true)}
                disabled={!canPublish}
                title={!canPublish ? "Publication bloquée tant qu'il reste un repère [à préciser]" : "Publier directement"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all shadow-sm disabled:opacity-40 cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Publier sur la boutique</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
