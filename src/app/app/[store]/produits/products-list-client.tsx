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
  Trash2,
  Archive,
  Undo2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import {
  canUseAiProductGenerator,
  canTrashProduct,
  canArchiveProduct,
  canHardDeleteProduct,
  canBatchManageProducts,
} from "@/config/permissions";
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
import {
  softDeleteProduct,
  restoreProduct,
  archiveProduct,
  hardDeleteProduct,
  emptyTrash,
  batchUpdateProductsStatus,
  getPendingOrdersCountForProduct,
  purgeExpiredTrash,
} from "@/lib/products-store";

interface ProductsListClientProps {
  storeSlug: string;
}

export function ProductsListClient({ storeSlug }: ProductsListClientProps) {
  const { activeRole } = useApp();
  const isFounderDemoStore = storeSlug === "lome-glow";

  const isOwner = activeRole === "owner";
  const isAdmin = activeRole === "admin";
  const isCloser = activeRole === "closer";
  const isRider = activeRole === "rider";
  const isRestricted = isCloser || isRider;

  const canTrash = canTrashProduct(activeRole);
  const canArchive = canArchiveProduct(activeRole);
  const canHardDelete = canHardDeleteProduct(activeRole);
  const canBatch = canBatchManageProducts(activeRole);

  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== "undefined") {
      purgeExpiredTrash(storeSlug, 30);
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
      purgeExpiredTrash(storeSlug, 30);
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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "archived" | "trash">("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Modales
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [visibilityConfirmTarget, setVisibilityConfirmTarget] = useState<Product | null>(null);

  // Undo Toast state (Prompt 14-B)
  const [undoToast, setUndoToast] = useState<{
    productIds: string[];
    message: string;
  } | null>(null);

  // Hard Delete Modal state (Prompt 14-B)
  const [hardDeleteTarget, setHardDeleteTarget] = useState<Product | null>(null);
  const [hardDeleteConfirmInput, setHardDeleteConfirmInput] = useState("");
  const [hardDeleteError, setHardDeleteError] = useState<string | null>(null);

  // Empty Trash Modal state (Prompt 14-B)
  const [isEmptyTrashModalOpen, setIsEmptyTrashModalOpen] = useState(false);
  const [emptyTrashBlockedCount, setEmptyTrashBlockedCount] = useState(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calcul des compteurs par onglet
  const tabCounts = useMemo(() => {
    const valid = products.filter((p) => p && typeof p === "object");
    const trashed = valid.filter((p) => p.deletedAt != null);
    const nonTrashed = valid.filter((p) => !p.deletedAt);

    const active = nonTrashed.filter((p) => (p.productStatus || "active") === "active");
    const draft = nonTrashed.filter((p) => p.productStatus === "draft");
    const archived = nonTrashed.filter((p) => p.productStatus === "archived");

    return {
      all: nonTrashed.length,
      active: active.length,
      draft: draft.length,
      archived: archived.length,
      trash: trashed.length,
    };
  }, [products]);

  // Filtrage combiné (Prompt 14-B)
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      if (!prod || typeof prod !== "object") return false;

      // Gestion stricte de la corbeille
      if (statusFilter === "trash") {
        if (!prod.deletedAt) return false;
      } else {
        // En dehors de l'onglet corbeille, exclure TOUS les produits supprimés
        if (prod.deletedAt) return false;
      }

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
      const matchStatus =
        statusFilter === "all" ||
        statusFilter === "trash" ||
        currentStatus === statusFilter;

      const currentStockStatus =
        prod.stockStatus || ((prod.stock || 0) === 0 ? "out_of_stock" : (prod.stock || 0) <= 10 ? "low_stock" : "in_stock");
      const matchStock = stockFilter === "all" || currentStockStatus === stockFilter;

      const matchCollection = collectionFilter === "all" || prod.collection === collectionFilter;
      const matchSupplier = supplierFilter === "all" || prod.supplierId === supplierFilter;

      return matchSearch && matchStatus && matchStock && matchCollection && matchSupplier;
    });
  }, [products, searchQuery, statusFilter, stockFilter, collectionFilter, supplierFilter]);

  // Indicateurs globaux (basés sur le catalogue non supprimé)
  const kpis = useMemo(() => {
    const validProds = products.filter((p) => p && typeof p === "object" && !p.deletedAt);
    let totalStockValue = 0;
    let outOfStockCount = 0;
    let criticalStockCount = 0;
    let warningStockCount = 0;
    let healthyStockCount = 0;
    let classA = 0;
    let classB = 0;
    let classC = 0;

    validProds.forEach((p) => {
      const stock = p.availableStock ?? p.stock ?? 0;
      const cost = p.costPrice || 0;
      totalStockValue += stock * cost;

      const days = p.daysOfStock ?? 0;
      if (stock === 0) outOfStockCount++;
      else if (days < 7) criticalStockCount++;
      else if (days <= 15) warningStockCount++;
      else healthyStockCount++;

      if (p.abcClass === "A") classA++;
      else if (p.abcClass === "C") classC++;
      else classB++;
    });

    return {
      totalStockValue,
      outOfStockCount,
      criticalStockCount,
      warningStockCount,
      healthyStockCount,
      classA,
      classB,
      classC,
    };
  }, [products]);

  // ==========================================
  // ACTIONS INDIVIDUELLES (Prompt 14-B)
  // ==========================================

  // Soft delete -> Corbeille
  const handleSoftDelete = (product: Product) => {
    const res = softDeleteProduct(storeSlug, product.id, activeRole);
    if (!res.success) {
      showToast(res.error || "Erreur lors de la suppression.");
      return;
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, deletedAt: new Date().toISOString() } : p))
    );
    setSelectedProductIds((prev) => prev.filter((id) => id !== product.id));

    // Déclencher le toast avec bouton Annuler
    setUndoToast({
      productIds: [product.id],
      message: `« ${product.name || product.title} » a été déplacé dans la corbeille.`,
    });
  };

  // Restaurer depuis la corbeille
  const handleRestore = (product: Product) => {
    const res = restoreProduct(storeSlug, product.id, activeRole);
    if (!res.success) {
      showToast(res.error || "Erreur lors de la restauration.");
      return;
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, deletedAt: null } : p))
    );
    setSelectedProductIds((prev) => prev.filter((id) => id !== product.id));
    showToast(`« ${product.name || product.title} » a été restauré avec succès.`);
  };

  // Archiver un produit
  const handleArchive = (product: Product) => {
    const res = archiveProduct(storeSlug, product.id, activeRole);
    if (!res.success) {
      showToast(res.error || "Erreur lors de l'archivage.");
      return;
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, productStatus: "archived" } : p))
    );
    showToast(`« ${product.name || product.title} » a été archivé.`);
  };

  // Annuler la suppression (Undo toast)
  const handleUndo = () => {
    if (!undoToast) return;
    const { productIds } = undoToast;

    batchUpdateProductsStatus(storeSlug, productIds, "restore", activeRole);

    setProducts((prev) =>
      prev.map((p) => (productIds.includes(p.id) ? { ...p, deletedAt: null } : p))
    );
    setUndoToast(null);
    showToast("Suppression annulée : produit(s) restauré(s).");
  };

  // Ouvrir modale de suppression définitive
  const openHardDeleteModal = (product: Product) => {
    setHardDeleteTarget(product);
    setHardDeleteConfirmInput("");
    setHardDeleteError(null);
  };

  // Confirmer suppression définitive
  const handleHardDeleteConfirm = () => {
    if (!hardDeleteTarget) return;

    const res = hardDeleteProduct(storeSlug, hardDeleteTarget.id, hardDeleteConfirmInput, activeRole);
    if (!res.success) {
      setHardDeleteError(res.error || "Erreur lors de la suppression définitive.");
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== hardDeleteTarget.id));
    setSelectedProductIds((prev) => prev.filter((id) => id !== hardDeleteTarget.id));
    showToast(`« ${hardDeleteTarget.name || hardDeleteTarget.title} » a été définitivement supprimé.`);
    setHardDeleteTarget(null);
  };

  // Ouvrir modale Vider la corbeille
  const openEmptyTrashModal = () => {
    const trashed = products.filter((p) => p.deletedAt != null);
    let blocked = 0;
    trashed.forEach((p) => {
      if (getPendingOrdersCountForProduct(storeSlug, p.id) > 0) {
        blocked++;
      }
    });
    setEmptyTrashBlockedCount(blocked);
    setIsEmptyTrashModalOpen(true);
  };

  // Confirmer vider la corbeille
  const handleEmptyTrashConfirm = () => {
    const res = emptyTrash(storeSlug, activeRole);
    if (!res.success) {
      showToast(res.error || "Erreur lors de la vidange de la corbeille.");
      setIsEmptyTrashModalOpen(false);
      return;
    }

    // Garder uniquement les produits non supprimés ou ceux bloqués par des commandes
    setProducts((prev) =>
      prev.filter((p) => {
        if (!p.deletedAt) return true;
        return getPendingOrdersCountForProduct(storeSlug, p.id) > 0;
      })
    );
    setSelectedProductIds([]);
    setIsEmptyTrashModalOpen(false);

    if (res.error) {
      showToast(`${res.purgedCount} produit(s) purgé(s). ${res.error}`);
    } else {
      showToast(`Corbeille vidée avec succès (${res.purgedCount} produit(s) supprimé(s)).`);
    }
  };

  // ==========================================
  // ACTIONS GROUPÉES (Batch Actions - Prompt 14-B)
  // ==========================================
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(filteredProducts.map((p) => p.id).slice(0, 100));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (
    action: "publish" | "unpublish" | "archive" | "trash" | "restore" | "hard_delete"
  ) => {
    if (selectedProductIds.length === 0) return;

    if (action === "hard_delete") {
      // Pour hard_delete en lot : confirmation via modale si un seul ou batch confirm
      const firstTarget = products.find((p) => p.id === selectedProductIds[0]);
      if (selectedProductIds.length === 1 && firstTarget) {
        openHardDeleteModal(firstTarget);
        return;
      }
      // Confirmation forte pour lot > 1
      if (!window.confirm(`Confirmez-vous la SUPPRESSION DÉFINITIVE de ${selectedProductIds.length} produit(s) ? Cette action est irréversible.`)) {
        return;
      }
    }

    const res = batchUpdateProductsStatus(storeSlug, selectedProductIds, action, activeRole);
    if (!res.success) {
      showToast(res.error || "Erreur lors de l'action groupée.");
      return;
    }

    // Mise à jour de l'état local
    const nowIso = new Date().toISOString();
    setProducts((prev) => {
      const targetSet = new Set(selectedProductIds);
      if (action === "hard_delete") {
        return prev.filter((p) => {
          if (!targetSet.has(p.id)) return true;
          return getPendingOrdersCountForProduct(storeSlug, p.id) > 0;
        });
      }
      return prev.map((p) => {
        if (!targetSet.has(p.id)) return p;
        switch (action) {
          case "publish":
            return { ...p, productStatus: "active" as const, deletedAt: null };
          case "unpublish":
            return { ...p, productStatus: "draft" as const };
          case "archive":
            return { ...p, productStatus: "archived" as const };
          case "trash":
            return { ...p, deletedAt: nowIso };
          case "restore":
            return { ...p, deletedAt: null };
          default:
            return p;
        }
      });
    });

    if (action === "trash") {
      setUndoToast({
        productIds: [...selectedProductIds],
        message: `${res.count} produit(s) déplacé(s) dans la corbeille.`,
      });
    } else {
      showToast(
        action === "publish"
          ? `${res.count} produit(s) publié(s) en catalogue.`
          : action === "unpublish"
          ? `${res.count} produit(s) passé(s) en brouillon.`
          : action === "archive"
          ? `${res.count} produit(s) archivé(s).`
          : action === "restore"
          ? `${res.count} produit(s) restauré(s).`
          : `${res.count} produit(s) définitivement supprimé(s).`
      );
    }

    if (res.error) {
      showToast(res.error);
    }

    setSelectedProductIds([]);
  };

  // Bascule directe Visibilité
  const handleToggleVisibility = (product: Product) => {
    const isCurrentlyActive = (product.productStatus || "active") === "active";
    if (isCurrentlyActive) {
      setVisibilityConfirmTarget(product);
    } else {
      const updated = { ...product, productStatus: "active" as const };
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      showToast(`« ${product.name} » est maintenant visible sur la boutique.`);
    }
  };

  const confirmPassToDraft = () => {
    if (!visibilityConfirmTarget) return;
    const updated = { ...visibilityConfirmTarget, productStatus: "draft" as const };
    setProducts((prev) => prev.map((p) => (p.id === visibilityConfirmTarget.id ? updated : p)));
    showToast(`« ${visibilityConfirmTarget.name} » est maintenant en brouillon (masqué du public).`);
    setVisibilityConfirmTarget(null);
  };

  const handleCopyProductLink = (product: Product) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/boutique/${storeSlug}/produit/${product.id}`;
      navigator.clipboard.writeText(url);
      showToast("Lien de la page produit copié !");
    }
  };

  const handleImportSuccess = (importedCount: number) => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`novika_store_products_${storeSlug}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setProducts(parsed.filter((p) => p && typeof p === "object"));
          }
        } catch {}
      }
    }
    showToast(`${importedCount} produit(s) importé(s) en brouillon avec succès !`);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Toast d'action */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#111111] text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Undo Toast : Annulation rapide de mise à la corbeille (Prompt 14-B) */}
      {undoToast && (
        <div
          id="toast-undo-trash"
          className="fixed bottom-6 right-6 z-50 bg-[#111111] text-white px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 border border-white/10"
        >
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{undoToast.message}</span>
          </div>
          <button
            type="button"
            id="btn-undo-trash"
            onClick={handleUndo}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Annuler</span>
          </button>
          <button
            type="button"
            onClick={() => setUndoToast(null)}
            className="text-stone-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* En-tête de section avec onglets de navigation */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
              Produits
            </h1>
            <p className="text-xs text-[#666660] mt-0.5">
              Gestion des fiches produits, niveaux d'alerte entrepôts, alertes de réapprovisionnement et fournisseurs.
            </p>
          </div>

          {/* Boutons d'action principaux */}
          <div className="flex items-center gap-2">
            {canUseAiProductGenerator(activeRole) && (
              <Link
                href={`/app/${storeSlug}/produits/nouveau-ia`}
                id="btn-create-with-ai"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white text-xs font-bold shadow-2xs hover:opacity-95 transition-all"
                title="Générateur IA Gemini de fiches produits à partir d'images (Admin propriétaire uniquement)"
              >
                <Sparkles className="w-4 h-4 text-purple-200 animate-pulse" />
                <span>Créer une fiche avec l'IA</span>
              </Link>
            )}

            {/* Menu Déroulant Import CSV */}
            <div className="relative">
              <button
                type="button"
                id="btn-import-csv-menu"
                onClick={() => setIsImportMenuOpen(!isImportMenuOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] text-xs font-bold shadow-2xs hover:bg-black/[0.04] transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-[#666660]" />
                <span>Importer (CSV)</span>
                <ChevronDown className="w-3 h-3 text-[#666660]" />
              </button>

              {isImportMenuOpen && (
                <div className="absolute right-0 mt-1 w-64 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-2 shadow-xl z-30 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsImportMenuOpen(false);
                      setIsImportModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/[0.05] text-xs font-semibold text-[#111111] flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Lancer l'import automatique</span>
                  </button>
                  <a
                    href="/api/products/import/template"
                    download="modele-catalogue-novika.csv"
                    onClick={() => setIsImportMenuOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/[0.05] text-xs font-semibold text-[#111111] flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Télécharger modèle Novika</span>
                  </a>
                </div>
              )}
            </div>

            <Link
              href={`/app/${storeSlug}/produits/nouveau`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold shadow-2xs hover:bg-black transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau produit</span>
            </Link>
          </div>
        </div>

        {/* Navigation inter-modules */}
        <ProductsNavTabs storeSlug={storeSlug} />
      </div>

      {/* Cartes KPI : Stock financier, Santé & ABC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1 : Valeur du stock */}
        <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[#666660] text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#111111]" />
              Vitesse de Vente Moyenne
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              Prix de revient
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#111111]">
              {!isRestricted ? formatFcfa(kpis.totalStockValue) : "Confidentiel"}
            </div>
            <p className="mt-1 text-[11px] text-[#666660]">
              {tabCounts.all} fiches actives dans le catalogue ({tabCounts.active} visibles, {tabCounts.draft} brouillons).
            </p>
          </div>
        </div>

        {/* KPI 2 : Santé des stocks */}
        <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[#666660] text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#111111]" />
              Jours de Stock Restants
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
              Vitesse de vente
            </span>
          </div>
          <div className="mt-3">
            <div className="space-y-1.5">
              <div className="h-2 w-full rounded-full bg-black/[0.06] overflow-hidden flex">
                {products.length > 0 && (
                  <>
                    <div
                      style={{ width: `${(kpis.outOfStockCount / Math.max(1, tabCounts.all)) * 100}%` }}
                      className="bg-rose-500"
                      title={`${kpis.outOfStockCount} Rupture`}
                    />
                    <div
                      style={{ width: `${(kpis.criticalStockCount / Math.max(1, tabCounts.all)) * 100}%` }}
                      className="bg-amber-500"
                      title={`${kpis.criticalStockCount} < 7 jours`}
                    />
                    <div
                      style={{ width: `${(kpis.warningStockCount / Math.max(1, tabCounts.all)) * 100}%` }}
                      className="bg-blue-400"
                      title={`${kpis.warningStockCount} 7-15 jours`}
                    />
                    <div
                      style={{ width: `${(kpis.healthyStockCount / Math.max(1, tabCounts.all)) * 100}%` }}
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
            Classe A : produits champions à approvisionner en priorité absolue.
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* NOUVEAUX ONGLETS DE FILTRAGE : TOUS / ACTIFS / CORBEILLE */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.08] pb-2">
        <button
          type="button"
          id="btn-tab-all"
          onClick={() => {
            setStatusFilter("all");
            setSelectedProductIds([]);
          }}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
            statusFilter === "all"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-white border border-black/[0.08] text-[#666660] hover:text-[#111111] hover:bg-black/[0.03]"
          )}
        >
          <span>Tous</span>
          <span className={cn(
            "px-1.5 py-0.2 rounded-full text-[10px]",
            statusFilter === "all" ? "bg-white/20 text-white" : "bg-black/[0.06] text-[#666660]"
          )}>
            {tabCounts.all}
          </span>
        </button>

        <button
          type="button"
          id="btn-tab-active"
          onClick={() => {
            setStatusFilter("active");
            setSelectedProductIds([]);
          }}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
            statusFilter === "active"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-white border border-black/[0.08] text-[#666660] hover:text-[#111111] hover:bg-black/[0.03]"
          )}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>Actifs</span>
          <span className={cn(
            "px-1.5 py-0.2 rounded-full text-[10px]",
            statusFilter === "active" ? "bg-white/20 text-white" : "bg-black/[0.06] text-[#666660]"
          )}>
            {tabCounts.active}
          </span>
        </button>

        <button
          type="button"
          id="btn-tab-draft"
          onClick={() => {
            setStatusFilter("draft");
            setSelectedProductIds([]);
          }}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
            statusFilter === "draft"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white border border-black/[0.08] text-[#666660] hover:text-[#111111] hover:bg-black/[0.03]"
          )}
        >
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          <span>Brouillons</span>
          <span className={cn(
            "px-1.5 py-0.2 rounded-full text-[10px]",
            statusFilter === "draft" ? "bg-white/20 text-white" : "bg-black/[0.06] text-[#666660]"
          )}>
            {tabCounts.draft}
          </span>
        </button>

        <button
          type="button"
          id="btn-tab-archived"
          onClick={() => {
            setStatusFilter("archived");
            setSelectedProductIds([]);
          }}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
            statusFilter === "archived"
              ? "bg-stone-700 text-white shadow-xs"
              : "bg-white border border-black/[0.08] text-[#666660] hover:text-[#111111] hover:bg-black/[0.03]"
          )}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Archivés</span>
          <span className={cn(
            "px-1.5 py-0.2 rounded-full text-[10px]",
            statusFilter === "archived" ? "bg-white/20 text-white" : "bg-black/[0.06] text-[#666660]"
          )}>
            {tabCounts.archived}
          </span>
        </button>

        <button
          type="button"
          id="btn-tab-trash"
          onClick={() => {
            setStatusFilter("trash");
            setSelectedProductIds([]);
          }}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ml-auto",
            statusFilter === "trash"
              ? "bg-rose-700 text-white shadow-xs"
              : "bg-white border border-rose-200 text-rose-700 hover:bg-rose-50"
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Corbeille</span>
          <span className={cn(
            "px-1.5 py-0.2 rounded-full text-[10px]",
            statusFilter === "trash" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"
          )}>
            {tabCounts.trash}
          </span>
        </button>
      </div>

      {/* Bannière explicative spécifique à l'onglet Corbeille */}
      {statusFilter === "trash" && (
        <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold block">Articles dans la corbeille (Rétention 30 jours)</span>
              <span className="text-rose-700 text-[11px]">
                Ces produits sont immédiatement masqués de la vitrine, du catalogue et de la recherche. Ils sont définitivement purgés après 30 jours.
              </span>
            </div>
          </div>

          {canHardDelete && tabCounts.trash > 0 && (
            <button
              type="button"
              id="btn-empty-trash"
              onClick={openEmptyTrashModal}
              className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider la corbeille</span>
            </button>
          )}
        </div>
      )}

      {/* Barre de recherche, filtres et sélections */}
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
      </div>

      {/* Contenu : Tableau ou Grille */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-12 text-center shadow-2xs space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-[#111111]/[0.05] border border-black/[0.08] flex items-center justify-center mx-auto text-[#666660]">
            {statusFilter === "trash" ? <Trash2 className="h-7 w-7 text-rose-500" /> : <Package className="h-7 w-7" />}
          </div>
          <div>
            <h3 className="text-base font-black text-[#111111]">
              {statusFilter === "trash"
                ? "La corbeille est vide"
                : products.length === 0
                ? "Votre catalogue est vide"
                : "Aucun produit trouvé"}
            </h3>
            <p className="text-xs text-[#666660] max-w-sm mx-auto mt-1">
              {statusFilter === "trash"
                ? "Aucun produit n'a été placé dans la corbeille. Les produits supprimés y resteront 30 jours avant suppression définitive."
                : products.length === 0
                ? "Vous démarrez avec une boutique vierge. Ajoutez vos propres produits ou importez un catalogue CSV pour commencer à vendre."
                : searchQuery
                ? `Aucun produit ne correspond à votre recherche « ${searchQuery} ».`
                : "Vous n'avez aucun article correspondant aux critères sélectionnés."}
            </p>
          </div>
          {statusFilter !== "trash" && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href={`/app/${storeSlug}/produits/nouveau`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold shadow-2xs hover:bg-black transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter mon premier produit</span>
              </Link>
            </div>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* TABLEAU */
        <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="table-products-list">
              <thead>
                <tr className="border-b border-black/[0.08] bg-black/[0.02] text-[10px] font-bold uppercase tracking-wider text-[#666660]">
                  <th className="py-3.5 pl-5 pr-2 w-8">
                    <input
                      type="checkbox"
                      id="checkbox-select-all"
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
                  {statusFilter !== "trash" && <th className="py-3.5 px-3">Visible</th>}
                  {statusFilter === "trash" && <th className="py-3.5 px-3">Délai Corbeille</th>}
                  <th className="py-3.5 px-3">Stock Dispo</th>
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
                  const isSelected = selectedProductIds.includes(product.id);
                  const isTrashed = product.deletedAt != null;

                  // Calcul jours restants dans la corbeille (30 jours max)
                  const daysInTrash = isTrashed
                    ? Math.floor((Date.now() - new Date(product.deletedAt!).getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                  const daysRemainingInTrash = Math.max(0, 30 - daysInTrash);

                  return (
                    <tr
                      key={product.id}
                      id={`product-row-${product.id}`}
                      className={cn(
                        "hover:bg-black/[0.015] transition-colors group",
                        isSelected && "bg-black/[0.03]",
                        isTrashed && "opacity-90 bg-rose-50/20"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-5 pr-2">
                        <input
                          type="checkbox"
                          id={`checkbox-product-${product.id}`}
                          checked={isSelected}
                          onChange={() => handleSelectOne(product.id)}
                          className="rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                        />
                      </td>

                      {/* Photo + Titre */}
                      <td className="py-3.5 pl-2 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-xl border border-black/[0.08] bg-[#EFECE6] flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs text-[#666660]">
                            {(product.name || product.title || "P").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/app/${storeSlug}/produits/${product.id}`}
                              className="font-bold text-xs text-[#111111] hover:underline block truncate max-w-xs"
                            >
                              {product.name || product.title || "Produit sans titre"}
                            </Link>
                            <span className="text-[10px] text-[#888880] block">
                              SKU: {product.sku || "N/A"} · {product.variants ? product.variants.length : 1} variante(s)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Statut Produit */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col items-start gap-1">
                          {isTrashed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                              <Trash2 className="w-3 h-3" />
                              Corbeille
                            </span>
                          ) : currentStatus === "active" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              Actif
                            </span>
                          ) : currentStatus === "draft" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              Brouillon
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-stone-200 text-stone-700">
                              Archivé
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Colonne Visible OU Délai Corbeille */}
                      {statusFilter !== "trash" ? (
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
                      ) : (
                        <td className="py-3.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 font-bold text-xs text-rose-800">
                              <Clock className="w-3.5 h-3.5 text-rose-600" />
                              {daysRemainingInTrash} j restants
                            </span>
                            <span className="text-[10px] text-[#888880]">
                              avant purge auto
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Statut Stock & Dispo */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-[#111111]">
                            {product.availableStock ?? product.stock}
                          </span>
                          <span className="text-[10px] text-[#888880]">
                            disponible
                          </span>
                        </div>
                      </td>

                      {/* Prix de Vente */}
                      <td className="py-3.5 px-3">
                        <div className="font-black text-[#111111]">
                          {formatFcfa(product.salePrice)}
                        </div>
                      </td>

                      {/* Coût / Marge */}
                      {!isRestricted && (
                        <td className="py-3.5 px-3">
                          <div className="text-[11px] font-semibold text-[#666660]">
                            Revient: {formatFcfa(product.costPrice)}
                          </div>
                          <div className="text-[11px] font-bold text-emerald-700">
                            +{formatFcfa(product.salePrice - product.costPrice)}
                          </div>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-3.5 pr-6 pl-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isTrashed ? (
                            /* ACTIONS EN CORBEILLE */
                            <>
                              <button
                                type="button"
                                id={`btn-restore-${product.id}`}
                                onClick={() => handleRestore(product)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-colors cursor-pointer"
                                title="Restaurer le produit dans son statut d'origine"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restaurer</span>
                              </button>

                              {canHardDelete && (
                                <button
                                  type="button"
                                  id={`btn-hard-delete-${product.id}`}
                                  onClick={() => openHardDeleteModal(product)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer"
                                  title="Supprimer définitivement ce produit"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Supprimer définitivement</span>
                                </button>
                              )}
                            </>
                          ) : (
                            /* ACTIONS NORMALES */
                            <>
                              <a
                                id={`btn-product-preview-${product.id}`}
                                href={
                                  currentStatus === "active"
                                    ? `/boutique/${storeSlug}/produit/${product.id}`
                                    : `/boutique/${storeSlug}/apercu/produit/${product.id}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Voir sur la vitrine"
                                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[#111111] hover:bg-black/5 transition-colors cursor-pointer"
                              >
                                {currentStatus === "active" ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-amber-600" />
                                )}
                              </a>

                              <Link
                                href={`/app/${storeSlug}/produits/${product.id}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-black/[0.03] transition-colors cursor-pointer min-h-[36px]"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                <span>Modifier</span>
                              </Link>

                              {/* Archiver / Désarchiver */}
                              {canArchive && currentStatus !== "archived" && (
                                <button
                                  type="button"
                                  id={`btn-archive-${product.id}`}
                                  onClick={() => handleArchive(product)}
                                  title="Archiver le produit (masquer sans supprimer)"
                                  className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl border border-black/[0.08] bg-white text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                                >
                                  <Archive className="h-4 w-4" />
                                </button>
                              )}

                              {/* Mettre à la corbeille */}
                              {canTrash && (
                                <button
                                  type="button"
                                  id={`btn-delete-${product.id}`}
                                  onClick={() => handleSoftDelete(product)}
                                  title="Déplacer dans la corbeille"
                                  className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
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
            const isTrashed = product.deletedAt != null;
            const isSelected = selectedProductIds.includes(product.id);
            return (
              <div
                key={product.id}
                className={cn(
                  "rounded-2xl border border-black/[0.08] bg-white p-4 shadow-2xs space-y-3 relative flex flex-col justify-between",
                  isSelected && "ring-2 ring-black",
                  isTrashed && "opacity-90 bg-rose-50/20 border-rose-200"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(product.id)}
                      className="rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    />
                    {isTrashed ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        Corbeille
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {product.productStatus || "Actif"}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-xs text-[#111111] mt-2 line-clamp-1">
                    {product.name || product.title}
                  </h4>
                  <p className="text-[11px] font-black text-[#111111] mt-1">
                    {formatFcfa(product.salePrice)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-black/[0.05]">
                  {isTrashed ? (
                    <>
                      <button
                        onClick={() => handleRestore(product)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold"
                      >
                        Restaurer
                      </button>
                      {canHardDelete && (
                        <button
                          onClick={() => openHardDeleteModal(product)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/app/${storeSlug}/produits/${product.id}`}
                        className="flex-1 text-center py-1.5 rounded-lg bg-[#111111] text-white text-xs font-bold"
                      >
                        Modifier
                      </Link>
                      {canTrash && (
                        <button
                          onClick={() => handleSoftDelete(product)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                          title="Mettre à la corbeille"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* BARRE D'ACTIONS GROUPÉES COLLANTE (Prompt 14-B) */}
      {/* ======================================================== */}
      {selectedProductIds.length > 0 && (
        <div
          id="batch-bar"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#111111] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200 border border-white/10"
        >
          <span className="font-bold text-white whitespace-nowrap">
            {selectedProductIds.length} sélectionné(s)
          </span>

          <div className="h-4 w-px bg-white/20" />

          {statusFilter === "trash" ? (
            /* ACTIONS EN LOT EN CORBEILLE */
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-batch-restore"
                onClick={() => handleBulkAction("restore")}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurer la sélection</span>
              </button>

              {canHardDelete && (
                <button
                  type="button"
                  id="btn-batch-hard-delete"
                  onClick={() => handleBulkAction("hard_delete")}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer définitivement</span>
                </button>
              )}
            </div>
          ) : (
            /* ACTIONS EN LOT STANDARD */
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-batch-publish"
                onClick={() => handleBulkAction("publish")}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer"
              >
                Publier
              </button>
              <button
                type="button"
                id="btn-batch-unpublish"
                onClick={() => handleBulkAction("unpublish")}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer"
              >
                Dépublier
              </button>
              {canArchive && (
                <button
                  type="button"
                  id="btn-batch-archive"
                  onClick={() => handleBulkAction("archive")}
                  className="px-3 py-1.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-white font-bold transition-colors cursor-pointer"
                >
                  Archiver
                </button>
              )}
              {canTrash && (
                <button
                  type="button"
                  id="btn-batch-trash"
                  onClick={() => handleBulkAction("trash")}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>
              )}
            </div>
          )}

          <div className="h-4 w-px bg-white/20" />

          <button
            type="button"
            onClick={() => setSelectedProductIds([])}
            className="text-stone-400 hover:text-white text-xs underline cursor-pointer"
          >
            Désélectionner tout
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE : SUPPRESSION DÉFINITIVE D'UN PRODUIT (Prompt 14-B) */}
      {/* ======================================================== */}
      {hardDeleteTarget && (
        <div
          id="modal-hard-delete"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg rounded-3xl border border-rose-200 bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-950">
                  Suppression définitive du produit
                </h3>
                <p className="text-xs font-bold text-rose-800 mt-0.5">
                  « {hardDeleteTarget.name || hardDeleteTarget.title} »
                </p>
              </div>
            </div>

            {/* Vérification des commandes en cours (Protection stricte) */}
            {(() => {
              const pendingCount = getPendingOrdersCountForProduct(storeSlug, hardDeleteTarget.id);
              if (pendingCount > 0) {
                return (
                  <div className="p-3.5 rounded-2xl bg-rose-100/90 border border-rose-300 text-xs text-rose-900 space-y-2">
                    <div className="font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>Suppression impossible : commandes en cours</span>
                    </div>
                    <p className="leading-relaxed">
                      Impossible de supprimer : <strong>{pendingCount} commande(s) en cours</strong> contiennent ce produit.
                      Traitez ou annulez ces commandes d'abord, ou conservez le produit dans la corbeille.
                    </p>
                  </div>
                );
              }
              return (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-semibold leading-relaxed">
                      Cette action est <strong>irréversible</strong>. Les variantes, offres et liaisons seront définitivement nettoyées.
                      Le slug « {hardDeleteTarget.slug} » sera immédiatement libéré pour être réutilisé.
                    </p>
                    <p className="text-[11px] text-amber-700">
                      Les commandes passées conservent leur instantané figé (titre, prix, image) et ne seront jamais altérées.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-bold text-[#111111]">
                      Pour confirmer, tapez le nom du produit (« {hardDeleteTarget.name || hardDeleteTarget.title} ») ou « SUPPRIMER » :
                    </label>
                    <input
                      type="text"
                      id="input-hard-delete-confirm"
                      value={hardDeleteConfirmInput}
                      onChange={(e) => {
                        setHardDeleteConfirmInput(e.target.value);
                        setHardDeleteError(null);
                      }}
                      placeholder="Tapez SUPPRIMER pour valider"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-black/[0.12] bg-white text-[#111111] focus:outline-none focus:border-rose-600 font-mono"
                    />
                  </div>

                  {hardDeleteError && (
                    <p className="text-xs text-rose-600 font-semibold">{hardDeleteError}</p>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.06]">
              <button
                type="button"
                id="btn-cancel-hard-delete"
                onClick={() => setHardDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-black/10 text-xs font-bold text-[#666660] hover:bg-black/5"
              >
                Annuler
              </button>
              {getPendingOrdersCountForProduct(storeSlug, hardDeleteTarget.id) === 0 && (
                <button
                  type="button"
                  id="btn-confirm-hard-delete"
                  disabled={
                    hardDeleteConfirmInput.trim().toLowerCase() !== "supprimer" &&
                    hardDeleteConfirmInput.trim().toLowerCase() !==
                      (hardDeleteTarget.name || hardDeleteTarget.title || "").trim().toLowerCase()
                  }
                  onClick={handleHardDeleteConfirm}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black shadow-xs transition-colors"
                >
                  Confirmer la suppression définitive
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE : VIDER LA CORBEILLE (Prompt 14-B) */}
      {/* ======================================================== */}
      {isEmptyTrashModalOpen && (
        <div
          id="modal-empty-trash"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-950">Vider la corbeille ?</h3>
                <p className="text-xs text-rose-800">{tabCounts.trash} produit(s) concerné(s)</p>
              </div>
            </div>

            <p className="text-xs text-[#666660] leading-relaxed">
              Tous les produits actuellement dans la corbeille seront définitivement effacés. Leurs slugs seront libérés.
              Cette action est irréversible.
            </p>

            {emptyTrashBlockedCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                Note : {emptyTrashBlockedCount} produit(s) avec des commandes en cours seront conservés dans la corbeille.
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsEmptyTrashModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-black/10 text-xs font-bold text-[#666660] hover:bg-black/5"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-confirm-empty-trash"
                onClick={handleEmptyTrashConfirm}
                className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-black shadow-xs transition-colors"
              >
                Vider définitivement
              </button>
            </div>
          </div>
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
