"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  LayoutGrid,
  List,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Download,
  Filter,
  TrendingUp,
  Clock,
  Layers,
  ArrowUpDown,
  Lock,
  Truck,
  RotateCcw,
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  FileSpreadsheet,
  Upload,
  ChevronDown,
  X,
  Sparkles,
} from "lucide-react";
import { canUseAiProductGenerator } from "@/config/permissions";
import { MOCK_PRODUCTS } from "@/mock-data/products";
import { MOCK_COLLECTIONS } from "@/mock-data/collections";
import { MOCK_SUPPLIERS } from "@/mock-data/suppliers";
import { Product, ProductStatus } from "@/server/data/types";
import { formatFcfa } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/layout/app-shell";
import { ProductsNavTabs } from "@/components/products/products-nav-tabs";
import { CsvImportModal } from "@/components/products/csv-import-modal";
import { CSV_SAMPLE_TEMPLATE, sanitizeCellForCsv } from "@/lib/csv-import-engine";

interface ProductsListClientProps {
  storeSlug: string;
}

export function ProductsListClient({ storeSlug }: ProductsListClientProps) {
  const { activeRole } = useApp();
  const isFounderDemoStore = storeSlug === "lome-glow";

  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`novika_store_products_${storeSlug}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.filter((p) => p && typeof p === "object");
          }
        } catch {}
      }
      if (!isFounderDemoStore) return [];
    }
    return isFounderDemoStore ? MOCK_PRODUCTS : [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`novika_store_products_${storeSlug}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setProducts(parsed.filter((p) => p && typeof p === "object"));
            return;
          }
        } catch {}
      }
      if (!isFounderDemoStore) {
        setProducts([]);
      } else {
        setProducts(MOCK_PRODUCTS);
      }
    }
  }, [storeSlug, isFounderDemoStore]);

  useEffect(() => {
    if (typeof window !== "undefined" && !isFounderDemoStore) {
      localStorage.setItem(`novika_store_products_${storeSlug}`, JSON.stringify(products));
    }
  }, [products, storeSlug, isFounderDemoStore]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "archived">("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Modale & Menu d'import CSV
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [visibilityConfirmTarget, setVisibilityConfirmTarget] = useState<Product | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isCloser = activeRole === "closer";
  const isRider = activeRole === "rider";
  const isRestricted = isCloser || isRider;

  // Filtrage combiné
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      if (!prod || typeof prod !== "object") return false;
      const prodName = prod.name || prod.title || "";
      const prodCategory = prod.category || "";
      const prodSku = prod.sku || "";
      const prodType = prod.productType || prod.type || "";

      const matchSearch =
        searchQuery === "" ||
        prodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prodCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prodSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prodType.toLowerCase().includes(searchQuery.toLowerCase());

      const currentStatus = prod.productStatus || ((prod.stock || 0) > 0 ? "active" : "draft");
      const matchStatus = statusFilter === "all" || currentStatus === statusFilter;

      const currentStockStatus =
        prod.stockStatus || ((prod.stock || 0) === 0 ? "out_of_stock" : (prod.stock || 0) <= 10 ? "low_stock" : "in_stock");
      const matchStock = stockFilter === "all" || currentStockStatus === stockFilter;

      const matchCollection = collectionFilter === "all" || prod.collection === collectionFilter;
      const matchSupplier = supplierFilter === "all" || prod.supplierId === supplierFilter;

      return matchSearch && matchStatus && matchStock && matchCollection && matchSupplier;
    });
  }, [products, searchQuery, statusFilter, stockFilter, collectionFilter, supplierFilter]);

  // Indicateurs globaux
  const kpis = useMemo(() => {
    const validProds = products.filter((p) => p && typeof p === "object");
    if (validProds.length === 0) {
      return {
        avgVelocity: "0.0",
        criticalStockCount: 0,
        warningStockCount: 0,
        healthyStockCount: 0,
        outOfStockCount: 0,
        classA: 0,
        classB: 0,
        classC: 0,
      };
    }

    const totalVelocity = validProds.reduce((sum, p) => sum + (p.salesVelocity || 0), 0);
    const avgVelocity = (totalVelocity / validProds.length).toFixed(1);

    const criticalStockCount = validProds.filter((p) => (p.daysOfStock || 0) < 7 && (p.stock || 0) > 0).length;
    const warningStockCount = validProds.filter((p) => (p.daysOfStock || 0) >= 7 && (p.daysOfStock || 0) <= 15).length;
    const healthyStockCount = validProds.filter((p) => (p.daysOfStock || 0) > 15).length;
    const outOfStockCount = validProds.filter((p) => (p.stock || 0) === 0).length;

    const classA = validProds.filter((p) => p.abcClass === "A");
    const classB = validProds.filter((p) => p.abcClass === "B");
    const classC = validProds.filter((p) => p.abcClass === "C");

    return {
      avgVelocity,
      criticalStockCount,
      warningStockCount,
      healthyStockCount,
      outOfStockCount,
      classA: classA.length,
      classB: classB.length,
      classC: classC.length,
    };
  }, [products]);

  // Actions groupées
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = (newStatus: ProductStatus) => {
    setProducts((prev) =>
      prev.map((p) => (selectedProductIds.includes(p.id) ? { ...p, productStatus: newStatus } : p))
    );
    setSelectedProductIds([]);
  };

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
    setIsImportMenuOpen(false);
  };

  // Exporter la liste des produits en CSV sécurisé contre l'injection de formules
  const handleExportCsv = () => {
    let csv =
      "identifiant;titre;prix;prix_barre;cout;statut;stock;sku;categorie;collection\n";

    products.forEach((p) => {
      const pId = sanitizeCellForCsv(p.slug || p.id);
      const pTitle = sanitizeCellForCsv(p.name);
      const pPrice = sanitizeCellForCsv(p.salePrice);
      const pCompare = sanitizeCellForCsv(p.compareAtPrice || "");
      const pCost = sanitizeCellForCsv(p.costPrice);
      const pStatus = sanitizeCellForCsv(p.productStatus || "active");
      const pStock = sanitizeCellForCsv(p.stock);
      const pSku = sanitizeCellForCsv(p.sku || "");
      const pCat = sanitizeCellForCsv(p.category || "");
      const pCol = sanitizeCellForCsv(p.collection || "");

      csv += `${pId};${pTitle};${pPrice};${pCompare};${pCost};${pStatus};${pStock};${pSku};${pCat};${pCol}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `catalogue_produits_${storeSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Catalogue exporté avec succès (cellules protégées contre injection) !");
  };

  // Copier le lien de la page produit
  const handleCopyProductLink = (product: Product) => {
    const isPublic = product.productStatus === "active";
    const path = isPublic
      ? `/boutique/${storeSlug}/produit/${product.id}`
      : `/boutique/${storeSlug}/apercu/produit/${product.id}`;
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    showToast(isPublic ? "Lien public copié !" : "Lien d'aperçu privé copié !");
  };

  // Bascule de la visibilité Actif / Brouillon avec confirmation
  const handleToggleVisibility = (product: Product) => {
    const current = product.productStatus || "active";
    if (current === "active") {
      setVisibilityConfirmTarget(product);
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, productStatus: "active" } : p))
      );
      showToast(`Le produit "${product.name}" est maintenant Actif et visible sur la boutique.`);
    }
  };

  const confirmPassToDraft = () => {
    if (!visibilityConfirmTarget) return;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === visibilityConfirmTarget.id ? { ...p, productStatus: "draft" } : p
      )
    );
    showToast(`Le produit "${visibilityConfirmTarget.name}" est maintenant en Brouillon.`);
    setVisibilityConfirmTarget(null);
  };

  const handleImportSuccess = (importedProducts: Product[]) => {
    setProducts((prev) => [...importedProducts, ...prev]);
    showToast(`${importedProducts.length} produit(s) importé(s) dans le catalogue !`);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Navigation 5 Onglets */}
      <ProductsNavTabs storeSlug={storeSlug} />

      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
              Catalogue & Stocks COD
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#111111]/[0.05] text-[#111111]">
              {products.length} articles référencés
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Produits
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Indicateurs de vente, suivi des jours de stock restants, classification ABC et gestion du catalogue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Menu Déroulant Importer */}
          <div className="relative">
            <button
              type="button"
              id="btn-import-csv"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E6E0D4] hover:bg-[#F3EFE6] text-[#111111] text-xs font-bold transition-all shadow-2xs cursor-pointer min-h-[36px]"
            >
              <Upload className="h-4 w-4 text-[#888880]" />
              <span>Importer (CSV)</span>
            </button>

            {isImportMenuOpen && (
              <div
                id="import-dropdown-menu"
                className="absolute right-0 mt-1.5 w-56 rounded-2xl border border-black/10 bg-[#FAF8F5] p-1.5 shadow-xl z-30 animate-in fade-in"
              >
                <button
                  type="button"
                  id="btn-open-csv-import-modal"
                  onClick={() => {
                    setIsImportMenuOpen(false);
                    setIsImportModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-[#111111] hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span>Importer un fichier CSV</span>
                </button>
                <button
                  type="button"
                  id="btn-menu-download-template"
                  onClick={handleDownloadTemplate}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium text-[#666660] hover:text-[#111111] hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4 text-[#888880]" />
                  <span>Télécharger le modèle CSV</span>
                </button>
              </div>
            )}
          </div>

          {/* Bouton Exporter CSV */}
          <button
            type="button"
            id="btn-export-products-csv"
            onClick={handleExportCsv}
            title="Exporter tous les produits en CSV (cellules neutralisées contre l'injection de formules)"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E6E0D4] hover:bg-[#F3EFE6] text-[#111111] text-xs font-bold transition-all shadow-2xs cursor-pointer min-h-[36px]"
          >
            <Download className="h-4 w-4 text-[#888880]" />
            <span className="hidden sm:inline">Exporter</span>
          </button>

          {/* Bouton Créer une fiche avec l'IA (Réservé Owner Admin - Prompt 07) */}
          {canUseAiProductGenerator(activeRole) && (
            <Link
              href={`/app/${storeSlug}/produits/nouveau-ia`}
              id="btn-create-product-ai"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-amber-600/10 border border-amber-500/30 text-amber-950 hover:bg-amber-500/20 text-xs font-bold transition-all shadow-2xs cursor-pointer min-h-[36px]"
            >
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>Créer une fiche avec l'IA</span>
            </Link>
          )}

          {/* Bouton Nouveau produit */}
          <Link
            href={`/app/${storeSlug}/produits/nouveau`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer min-h-[36px]"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau produit</span>
          </Link>
        </div>
      </div>

      {/* Toast de Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#111111] text-white text-xs font-bold shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3 INDICATEURS EN HAUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1 : Vitesse de Vente Moyenne */}
        <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[#666660] text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Vitesse de Vente Moyenne
            </span>
            <span
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full font-bold",
                products.length === 0
                  ? "bg-black/[0.05] text-[#888880]"
                  : "bg-emerald-100 text-emerald-800"
              )}
            >
              {products.length === 0 ? "Nouveau compte" : "+12.4% vs 30j"}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#111111]">{kpis.avgVelocity}</span>
            <span className="text-xs font-bold text-[#666660]">unités / jour / produit</span>
          </div>
          <p className="mt-2 text-[11px] text-[#666660]">
            Calculé sur les livraisons réelles encaissées des 30 derniers jours à Lomé, Abidjan, Cotonou et Dakar.
          </p>
        </div>

        {/* KPI 2 : Jours de stock restants (Jauge) */}
        <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[#666660] text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Jours de Stock Restants
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {kpis.criticalStockCount + kpis.outOfStockCount} {kpis.criticalStockCount + kpis.outOfStockCount <= 1 ? "alerte" : "alertes"}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-[#EAE4D9]">
                {products.length === 0 ? (
                  <div className="h-full w-full bg-[#EAE4D9]" />
                ) : (
                  <>
                    <div
                      style={{ width: `${(kpis.outOfStockCount / products.length) * 100}%` }}
                      className="bg-rose-500"
                      title={`${kpis.outOfStockCount} Rupture`}
                    />
                    <div
                      style={{ width: `${(kpis.criticalStockCount / products.length) * 100}%` }}
                      className="bg-amber-500"
                      title={`${kpis.criticalStockCount} < 7 jours`}
                    />
                    <div
                      style={{ width: `${(kpis.warningStockCount / products.length) * 100}%` }}
                      className="bg-blue-400"
                      title={`${kpis.warningStockCount} 7-15 jours`}
                    />
                    <div
                      style={{ width: `${(kpis.healthyStockCount / products.length) * 100}%` }}
                      className="bg-emerald-500"
                      title={`${kpis.healthyStockCount} > 15 jours`}
                    />
                  </>
                )}
              </div>
              <div className="flex justify-between text-[10px] text-[#666660] font-semibold pt-1">
                <span className="text-rose-600 font-bold">{kpis.outOfStockCount} rupture</span>
                <span className="text-amber-600">{kpis.criticalStockCount} &lt; 7j</span>
                <span className="text-blue-600">{kpis.warningStockCount} 7-15j</span>
                <span className="text-emerald-700">{kpis.healthyStockCount} &gt; 15j</span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[#666660]">
            Disponible ÷ Vitesse. Prévient les ruptures avant les délais fournisseurs maritimes.
          </p>
        </div>

        {/* KPI 3 : Analyse ABC des produits */}
        <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[#666660] text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#111111]" />
              Analyse ABC du Catalogue
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#111111]/[0.05] text-[#111111] font-bold">
              Loi de Pareto (80/20)
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-2">
              <span className="text-xs font-black text-amber-800">Classe A</span>
              <div className="text-lg font-black text-amber-950">{kpis.classA}</div>
              <span className="text-[10px] text-amber-700 font-medium">80% du CA</span>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2">
              <span className="text-xs font-black text-blue-800">Classe B</span>
              <div className="text-lg font-black text-blue-950">{kpis.classB}</div>
              <span className="text-[10px] text-blue-700 font-medium">15% du CA</span>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-100/70 p-2">
              <span className="text-xs font-black text-stone-700">Classe C</span>
              <div className="text-lg font-black text-stone-900">{kpis.classC}</div>
              <span className="text-[10px] text-stone-600 font-medium">5% du CA</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[#666660]">
            Classe A : produits champions à approvisionner en priorité absolue pour éviter tout arrêt publicitaire.
          </p>
        </div>
      </div>

      {/* Barre de recherche, filtres et actions groupées */}
      <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
            <input
              type="text"
              placeholder="Rechercher par titre, catégorie, SKU, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] placeholder:text-[#999990] focus:outline-none focus:border-[#111111]"
            />
          </div>

          {/* Filtres dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="draft">Brouillon</option>
              <option value="archived">Archivé</option>
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
            >
              <option value="all">Tous les stocks</option>
              <option value="in_stock">En stock</option>
              <option value="low_stock">Stock bas (&lt; 10)</option>
              <option value="out_of_stock">Rupture</option>
            </select>

            {/* Bascule Vue Tableau / Vue Grille */}
            <div className="flex items-center rounded-xl border border-black/[0.08] bg-white p-1">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === "table" ? "bg-[#111111] text-white" : "text-[#888880] hover:text-[#111111]"
                )}
                title="Vue Tableau"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === "grid" ? "bg-[#111111] text-white" : "text-[#888880] hover:text-[#111111]"
                )}
                title="Vue Grille"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Barre d'actions groupées si sélection */}
        {selectedProductIds.length > 0 && (
          <div className="flex items-center justify-between bg-[#111111] text-white px-4 py-2.5 rounded-xl text-xs">
            <span className="font-bold">
              {selectedProductIds.length} produit(s) sélectionné(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkStatusChange("active")}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-medium text-emerald-400"
              >
                Passer en Actif
              </button>
              <button
                onClick={() => handleBulkStatusChange("draft")}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-medium"
              >
                Passer en Brouillon
              </button>
              <button
                onClick={() => handleBulkStatusChange("archived")}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-medium text-amber-300"
              >
                Archiver
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contenu : Tableau ou Grille */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-12 text-center shadow-2xs space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-[#111111]/[0.05] border border-black/[0.08] flex items-center justify-center mx-auto text-[#666660]">
            <Package className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#111111]">
              {products.length === 0 ? "Votre catalogue est vide" : "Aucun produit trouvé"}
            </h3>
            <p className="text-xs text-[#666660] max-w-sm mx-auto mt-1">
              {products.length === 0
                ? "Vous démarrez avec une boutique vierge. Ajoutez vos propres produits ou importez un catalogue CSV pour commencer à vendre."
                : searchQuery
                ? `Aucun produit ne correspond à votre recherche "${searchQuery}". Essayez un autre filtre.`
                : "Vous n'avez aucun article correspondant aux critères sélectionnés."}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href={`/app/${storeSlug}/produits/nouveau`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold shadow-2xs hover:bg-black transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter mon premier produit</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-black/[0.08] text-[#111111] text-xs font-bold shadow-2xs hover:bg-black/[0.04] transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Importer un fichier CSV</span>
            </button>
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* TABLEAU */
        <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/[0.08] bg-black/[0.02] text-[10px] font-bold uppercase tracking-wider text-[#666660]">
                  <th className="py-3.5 pl-5 pr-2 w-8">
                    <input
                      type="checkbox"
                      checked={
                        selectedProductIds.length === filteredProducts.length &&
                        filteredProducts.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 pl-2 pr-3">Produit</th>
                  <th className="py-3.5 px-3">Statut</th>
                  <th className="py-3.5 px-3">Visible</th>
                  <th className="py-3.5 px-3">Stock Dispo</th>
                  <th className="py-3.5 px-3">Jours Restants</th>
                  <th className="py-3.5 px-3">Classe ABC</th>
                  <th className="py-3.5 px-3">Catégorie & Type</th>
                  <th className="py-3.5 px-3">Prix de Vente</th>
                  {!isRestricted && <th className="py-3.5 px-3">Coût / Marge</th>}
                  <th className="py-3.5 pr-6 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] text-xs">
                {filteredProducts.map((product) => {
                  const currentStockStatus =
                    product.stockStatus ||
                    (product.stock === 0 ? "out_of_stock" : product.stock <= 10 ? "low_stock" : "in_stock");
                  const currentStatus = product.productStatus || "active";
                  const days = product.daysOfStock ?? 0;
                  const isSelected = selectedProductIds.includes(product.id);

                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        "hover:bg-black/[0.015] transition-colors group",
                        isSelected && "bg-black/[0.03]"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-5 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(product.id)}
                          className="rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                        />
                      </td>

                      {/* Photo + Titre */}
                      <td className="py-3.5 pl-2 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-xl border border-black/[0.08] bg-[#EFECE6] flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs text-[#666660]">
                            {(product.name || "P").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/app/${storeSlug}/produits/${product.id}`}
                              className="font-bold text-xs text-[#111111] hover:underline block truncate max-w-xs"
                            >
                              {product.name || "Produit sans titre"}
                            </Link>
                            <span className="text-[10px] text-[#888880] block">
                              SKU: {product.sku || "N/A"} · {product.variants ? product.variants.length : 1} variante(s)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Statut Produit (Actif, Brouillon, Archivé) */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col items-start gap-1">
                          {currentStatus === "active" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              Actif
                            </span>
                          )}
                          {currentStatus === "draft" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              Brouillon
                            </span>
                          )}
                          {currentStatus === "archived" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-stone-200 text-stone-700">
                              Archivé
                            </span>
                          )}
                          {product.hiddenFromCatalog && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-purple-100 text-purple-800"
                              title="Masqué du catalogue public (Accessible par lien direct)"
                            >
                              <EyeOff className="w-2.5 h-2.5" />
                              Lien direct
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Colonne Visible : Interrupteur Actif / Brouillon */}
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          id={`toggle-visibility-${product.id}`}
                          onClick={() => handleToggleVisibility(product)}
                          title={
                            currentStatus === "active"
                              ? "Rendre invisible (Passer en Brouillon)"
                              : "Rendre visible (Passer en Actif)"
                          }
                          aria-label={`Bascule visibilité pour ${product.name}`}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-black",
                            currentStatus === "active" ? "bg-emerald-600" : "bg-[#DDD7CD]"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                              currentStatus === "active" ? "translate-x-4" : "translate-x-0"
                            )}
                          />
                        </button>
                      </td>

                      {/* Statut Stock & Dispo */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-[#111111]">
                              {product.availableStock ?? product.stock}
                            </span>
                            <span className="text-[10px] text-[#888880]">
                              (phys: {product.physicalStock ?? product.stock} - rés: {product.reservedStock ?? 0})
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {currentStockStatus === "in_stock" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                En stock
                              </span>
                            )}
                            {currentStockStatus === "low_stock" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                Stock bas
                              </span>
                            )}
                            {currentStockStatus === "out_of_stock" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                Rupture
                              </span>
                            )}
                            {product.hasActivePO && (
                              <span
                                title="Un bon de commande fournisseur est déjà en cours ou expédié"
                                className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800"
                              >
                                <Truck className="w-2.5 h-2.5" />
                                Réappro en cours
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Jours de stock restants */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold",
                              days === 0
                                ? "bg-rose-100 text-rose-800"
                                : days < 7
                                  ? "bg-amber-100 text-amber-900"
                                  : days <= 15
                                    ? "bg-blue-100 text-blue-900"
                                    : "bg-emerald-100 text-emerald-900"
                            )}
                          >
                            {days} j
                          </span>
                          <span className="text-[10px] text-[#888880]">
                            ({product.salesVelocity || 0}/j)
                          </span>
                        </div>
                      </td>

                      {/* Classe ABC */}
                      <td className="py-3.5 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black",
                            product.abcClass === "A" && "bg-amber-400 text-black shadow-2xs",
                            product.abcClass === "B" && "bg-slate-200 text-slate-800",
                            product.abcClass === "C" && "bg-[#EAE4D9] text-[#666660]"
                          )}
                        >
                          {product.abcClass || "B"}
                        </span>
                      </td>

                      {/* Catégorie & Type */}
                      <td className="py-3.5 px-3">
                        <div className="text-xs font-semibold text-[#111111]">{product.category}</div>
                        <div className="text-[10px] text-[#888880]">{product.productType || "Standard"}</div>
                      </td>

                      {/* Prix de Vente */}
                      <td className="py-3.5 px-3">
                        <div className="font-black text-[#111111]">
                          {formatFcfa(product.salePrice)}
                        </div>
                        {product.compareAtPrice && (
                          <div className="text-[10px] text-[#888880] line-through">
                            {formatFcfa(product.compareAtPrice)}
                          </div>
                        )}
                      </td>

                      {/* Coût / Marge (Masqué si Closer) */}
                      {!isRestricted && (
                        <td className="py-3.5 px-3">
                          <div className="text-[11px] font-semibold text-[#666660]">
                            Revient: {formatFcfa(product.costPrice)}
                          </div>
                          <div className="text-[11px] font-bold text-emerald-700">
                            +{formatFcfa(product.salePrice - product.costPrice)} ({Math.round(((product.salePrice - product.costPrice) / product.salePrice) * 100)}%)
                          </div>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-3.5 pr-6 pl-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Icône d'œil : 36px de zone cliquable, focus visible */}
                          <a
                            id={`btn-product-preview-${product.id}`}
                            href={
                              currentStatus === "active"
                                ? `/boutique/${storeSlug}/produit/${product.id}`
                                : `/boutique/${storeSlug}/apercu/produit/${product.id}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            title={
                              currentStatus === "active"
                                ? "Voir sur la boutique"
                                : "Brouillon : l'aperçu est privé"
                            }
                            aria-label={`Voir ${product.name} sur la boutique (s'ouvre dans un nouvel onglet)`}
                            className={cn(
                              "p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black",
                              currentStatus === "active"
                                ? "border-black/[0.08] bg-white text-[#111111] hover:bg-black/5"
                                : "border-dashed border-amber-300 bg-amber-50/50 text-amber-700 hover:bg-amber-100/60"
                            )}
                          >
                            {currentStatus === "active" ? (
                              <Eye className="h-4 w-4 text-[#111111]" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-amber-600" />
                            )}
                          </a>

                          {/* Copier le lien si publié */}
                          {currentStatus === "active" && (
                            <button
                              type="button"
                              id={`btn-copy-product-link-${product.id}`}
                              onClick={() => handleCopyProductLink(product)}
                              title="Copier le lien de la page produit"
                              aria-label={`Copier le lien de ${product.name}`}
                              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[#666660] hover:text-[#111111] hover:bg-black/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          )}

                          {/* Modifier la fiche */}
                          <Link
                            href={`/app/${storeSlug}/produits/${product.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-black/[0.03] transition-colors cursor-pointer min-h-[36px]"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Modifier</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VUE GRILLE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const currentStockStatus =
              product.stockStatus ||
              (product.stock === 0 ? "out_of_stock" : product.stock <= 10 ? "low_stock" : "in_stock");
            const days = product.daysOfStock ?? 0;

            return (
              <div
                key={product.id}
                className="relative rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black",
                        product.abcClass === "A" && "bg-amber-400 text-black",
                        product.abcClass === "B" && "bg-slate-200 text-slate-800",
                        product.abcClass === "C" && "bg-[#EAE4D9] text-[#666660]"
                      )}
                    >
                      {product.abcClass || "B"}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold",
                          product.productStatus === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        {product.productStatus || "Actif"}
                      </span>

                      {/* Icône d'œil coin supérieur droit de la carte grille */}
                      <a
                        id={`btn-product-grid-preview-${product.id}`}
                        href={
                          product.productStatus === "active"
                            ? `/boutique/${storeSlug}/produit/${product.id}`
                            : `/boutique/${storeSlug}/apercu/produit/${product.id}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        title={
                          product.productStatus === "active"
                            ? "Voir sur la boutique"
                            : "Brouillon : l'aperçu est privé"
                        }
                        aria-label={`Voir ${product.name} sur la boutique (s'ouvre dans un nouvel onglet)`}
                        className="p-1 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg border border-black/[0.08] bg-white text-[#111111] hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      >
                        {product.productStatus === "active" ? (
                          <Eye className="h-3.5 w-3.5 text-[#111111]" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                        )}
                      </a>
                    </div>
                  </div>

                  <div className="h-32 w-full rounded-xl bg-[#EFECE6] border border-black/[0.08] flex items-center justify-center font-bold text-2xl text-[#888880] mb-3">
                    {(product.name || "P").charAt(0).toUpperCase()}
                  </div>

                  <Link
                    href={`/app/${storeSlug}/produits/${product.id}`}
                    className="font-bold text-xs text-[#111111] hover:underline block line-clamp-2"
                  >
                    {product.name || "Produit sans titre"}
                  </Link>

                  <div className="text-[10px] text-[#888880] mt-1">
                    {product.category || "Général"} · {product.productType || "Standard"}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#111111]">
                      {formatFcfa(product.salePrice || 0)}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                        days === 0
                          ? "bg-rose-100 text-rose-800"
                          : days < 7
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-emerald-900"
                      )}
                    >
                      {days} jours restants
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#666660]">
                    <span>Dispo: {product.availableStock ?? product.stock}</span>
                    {product.hasActivePO && (
                      <span className="text-blue-700 font-bold flex items-center gap-1 text-[10px]">
                        <Truck className="w-3 h-3" /> Réappro
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/app/${storeSlug}/produits/${product.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-colors min-h-[36px]"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale de Confirmation de passage en Brouillon si commandes ouvertes */}
      {visibilityConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-black/10 bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Passer ce produit en Brouillon ?</h3>
                <p className="text-xs text-[#666660]">{visibilityConfirmTarget.name}</p>
              </div>
            </div>
            <p className="text-xs text-[#666660] leading-relaxed">
              Ce produit a des commandes récentes ou ouvertes en cours de traitement. En le passant en
              Brouillon, il ne sera plus accessible aux visiteurs de la vitrine en ligne, mais les
              commandes existantes resteront traitables.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setVisibilityConfirmTarget(null)}
                className="px-4 py-2 rounded-xl border border-black/10 text-xs font-bold text-[#666660] hover:bg-black/5"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-confirm-pass-draft"
                onClick={confirmPassToDraft}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Confirmer le passage en Brouillon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Assistant Importation CSV en 5 étapes */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        storeSlug={storeSlug}
        activeRole={activeRole}
        existingProducts={products}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
