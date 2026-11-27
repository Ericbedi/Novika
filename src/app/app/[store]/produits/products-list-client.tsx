"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
  Smartphone,
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
  HelpCircle,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Tag,
  Boxes,
  MoreHorizontal,
  RefreshCw,
  Database,
} from "lucide-react";
import {
  canUseAiProductGenerator,
  canTrashProduct,
  canArchiveProduct,
  canHardDeleteProduct,
  canBatchManageProducts,
  canViewProducts,
  canManageProducts,
  canViewProductFinancials,
  canImportProducts,
} from "@/config/permissions";
import { MOCK_PRODUCTS } from "@/mock-data/products";
import { MOCK_COLLECTIONS } from "@/mock-data/collections";
import { MOCK_ORDERS } from "@/mock-data/orders";
import { Product, Order, ProductStatus } from "@/server/data/types";
import { formatFcfa } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/layout/app-shell";
import { ensureListImagesRemote } from "@/lib/upload-data-images";
import { ProductsNavTabs } from "@/components/products/products-nav-tabs";
import { CsvImportModal } from "@/components/products/csv-import-modal";
import { sanitizeCellForCsv, rollbackImportBatch } from "@/lib/csv-import-engine";
import {
  softDeleteProduct,
  restoreProduct,
  archiveProduct,
  hardDeleteProduct,
  emptyTrash,
  batchUpdateProductsStatus,
  batchAssignCollection,
  batchAddTag,
  batchEnableStockTracking,
  getPendingOrdersCountForProduct,
  purgeExpiredTrash,
  getShopProductsRaw,
  saveShopProductsList,
} from "@/lib/products-store";
import {
  calculateProductIndicators,
  IndicatorPeriod,
  ProductDashboardIndicators,
} from "@/lib/product-indicators";
import { getProductPublicUrl } from "@/lib/storefront-urls";
import { ClientPreviewModal } from "@/components/preview/ClientPreviewModal";

interface ProductsListClientProps {
  storeSlug: string;
}

export function ProductsListClient({ storeSlug }: ProductsListClientProps) {
  const { activeRole } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();
  const batchFilter = searchParams?.get("batchId");
  const isFounderDemoStore = storeSlug === "lome-glow";

  // Contrôle des droits (Prompt 17)
  const canView = canViewProducts(activeRole);
  const canManage = canManageProducts(activeRole);
  const canSeeFinancials = canViewProductFinancials(activeRole);
  const canImport = canImportProducts(activeRole);
  const canTrash = canTrashProduct(activeRole);
  const canArchive = canArchiveProduct(activeRole);
  const canHardDelete = canHardDeleteProduct(activeRole);
  const canBatch = canBatchManageProducts(activeRole);
  const [isClientPreviewOpen, setIsClientPreviewOpen] = useState(false);

  // État des produits & commandes
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== "undefined") {
      purgeExpiredTrash(storeSlug, 30);
      const saved = localStorage.getItem(`novika_store_products_${storeSlug}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter((p) => p && typeof p === "object");
          }
        } catch { }
      }
      return getShopProductsRaw(storeSlug);
    }
    return getShopProductsRaw(storeSlug);
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window !== "undefined") {
      const savedOrders = localStorage.getItem(`novika_store_orders_${storeSlug}`);
      if (savedOrders) {
        try {
          const parsed = JSON.parse(savedOrders);
          if (Array.isArray(parsed)) return parsed;
        } catch { }
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      purgeExpiredTrash(storeSlug, 30);
      const prods = getShopProductsRaw(storeSlug);
      setProducts(prods);

      let ords: Order[] = [];
      const savedOrders = localStorage.getItem(`novika_store_orders_${storeSlug}`);
      if (savedOrders) {
        try {
          const parsed = JSON.parse(savedOrders);
          if (Array.isArray(parsed)) ords = parsed;
        } catch { }
      }
      setOrders(ords);
    }
  }, [storeSlug]);

  // Synchronisation sauvegarde produits
  useEffect(() => {
    if (typeof window !== "undefined") {
      saveShopProductsList(storeSlug, products);
    }
  }, [products, storeSlug]);

  // Filtres et Vues (Prompt 17)
  const [quickView, setQuickView] = useState<
    "all" | "active" | "draft" | "archived" | "out_of_stock" | "low_stock" | "trash"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Indicateurs & Sélecteur de période (Aujourd'hui / 7 j / 30 j / 90 j)
  const [indicatorPeriod, setIndicatorPeriod] = useState<IndicatorPeriod>("30d");

  // Choix des colonnes optionnelles (mémorisé dans le navigateur)
  const [visibleColumns, setVisibleColumns] = useState<{
    supplier: boolean;
    collections: boolean;
    margin: boolean;
    updatedAt: boolean;
  }>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`novika_product_columns_${storeSlug}`);
        if (saved) return JSON.parse(saved);
      } catch { }
    }
    return {
      supplier: false,
      collections: false,
      margin: true,
      updatedAt: false,
    };
  });

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (typeof window !== "undefined") {
        localStorage.setItem(`novika_product_columns_${storeSlug}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [isMoreActionsMenuOpen, setIsMoreActionsMenuOpen] = useState(false);

  // Pagination (50 par page par défaut, Prompt 17)
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Tri par colonne
  const [sortBy, setSortBy] = useState<"title" | "price" | "stock" | "date">("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (column: "title" | "price" | "stock" | "date") => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Modales d'actions
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [undoToast, setUndoToast] = useState<{
    productIds: string[];
    message: string;
  } | null>(null);

  // Modale Hard Delete
  const [hardDeleteTarget, setHardDeleteTarget] = useState<Product | null>(null);
  const [hardDeleteConfirmInput, setHardDeleteConfirmInput] = useState("");
  const [hardDeleteError, setHardDeleteError] = useState<string | null>(null);

  // Modale Vider Corbeille
  const [isEmptyTrashModalOpen, setIsEmptyTrashModalOpen] = useState(false);
  const [emptyTrashBlockedCount, setEmptyTrashBlockedCount] = useState(0);

  // Modales Actions Groupées Prompt 17
  const [isBatchCollectionModalOpen, setIsBatchCollectionModalOpen] = useState(false);
  const [batchCollectionInput, setBatchCollectionInput] = useState("");
  const [isBatchTagModalOpen, setIsBatchTagModalOpen] = useState(false);
  const [batchTagInput, setBatchTagInput] = useState("");
  const [isBatchStockTrackModalOpen, setIsBatchStockTrackModalOpen] = useState(false);
  const [isBatchStatusModalOpen, setIsBatchStatusModalOpen] = useState(false);
  const [batchStatusChoice, setBatchStatusChoice] = useState<"active" | "draft" | "archived">("active");

  // Synchronisation Supabase (Prompt 17-O)
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncReport, setSyncReport] = useState<{
    total_received: number;
    synced_count: number;
    existing_count: number;
    error_count: number;
    errors: any[];
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Rafraîchit la liste quand le catalogue partagé (autre appareil) a été fusionné
  useEffect(() => {
    const refresh = () => setProducts(getShopProductsRaw(storeSlug));
    window.addEventListener("novika:products-synced", refresh);
    return () => window.removeEventListener("novika:products-synced", refresh);
  }, [storeSlug]);

  const handleSyncToSupabase = async () => {
    try {
      setIsSyncing(true);
      const rescued = await ensureListImagesRemote(storeSlug, getShopProductsRaw(storeSlug));
      if (rescued.changed) saveShopProductsList(storeSlug, rescued.products);
      const localProducts = rescued.products;
      const res = await fetch("/api/products/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug,
          products: localProducts,
          role: activeRole,
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setSyncReport(data.report);
        setIsSyncModalOpen(true);
        // Rafraîchir les produits locaux
        setProducts(getShopProductsRaw(storeSlug));
        showToast(
          data.report.synced_count > 0
            ? `${data.report.synced_count} produit(s) synchronisé(s) dans Supabase !`
            : "Tous vos produits sont déjà synchronisés dans Supabase !"
        );
      } else {
        showToast(data.error || "Erreur lors de la synchronisation Supabase.");
      }
    } catch {
      showToast("Échec de connexion lors de la synchronisation.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Publie tous les brouillons sur la vitrine (après confirmation explicite)
  const handlePublishAllDrafts = async () => {
    const all = getShopProductsRaw(storeSlug);
    const drafts = all.filter((p) => p && !p.deletedAt && p.productStatus === "draft");
    if (drafts.length === 0) {
      showToast("Aucun brouillon à publier.");
      return;
    }
    const titles = drafts.slice(0, 8).map((p) => `• ${p.title || p.name || p.id}`).join("\n");
    if (!confirm(`Publier ${drafts.length} brouillon(s) sur la vitrine ?\n\n${titles}${drafts.length > 8 ? "\n…" : ""}`)) return;
    try {
      setIsSyncing(true);
      const draftIds = new Set(drafts.map((p) => p.id));
      const updated = all.map((p) =>
        draftIds.has(p.id)
          ? ({ ...p, status: "active", productStatus: "active", hiddenFromCatalog: false, published_to_storefront: true } as Product)
          : p
      );
      const rescuedAll = await ensureListImagesRemote(storeSlug, updated);
      const toSend = rescuedAll.products.filter((p) => draftIds.has(p.id));
      const res = await fetch("/api/products/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeSlug, products: toSend, role: activeRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        showToast(data.error || "Publication impossible. Reconnectez-vous puis réessayez.");
        return;
      }
      saveShopProductsList(storeSlug, rescuedAll.products);
      setProducts(getShopProductsRaw(storeSlug));
      showToast(`${data.report?.synced_count ?? toSend.length} produit(s) publié(s) sur la vitrine !`);
    } catch {
      showToast("Échec de connexion lors de la publication.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Calcul dynamique des 3 indicateurs
  const indicators: ProductDashboardIndicators = useMemo(() => {
    return calculateProductIndicators(products, orders, indicatorPeriod);
  }, [products, orders, indicatorPeriod]);

  // Compteurs des vues rapides
  const viewCounts = useMemo(() => {
    const valid = products.filter((p) => p && typeof p === "object");
    const trashed = valid.filter((p) => p.deletedAt != null);
    const nonTrashed = valid.filter((p) => !p.deletedAt);

    const active = nonTrashed.filter((p) => (p.productStatus || "active") === "active");
    const draft = nonTrashed.filter((p) => p.productStatus === "draft");
    const archived = nonTrashed.filter((p) => p.productStatus === "archived");

    const outOfStock = nonTrashed.filter((p) => {
      const isStockTracked = p.trackQuantity !== false && p.trackStock !== false;
      if (!isStockTracked) return false;
      const stock = p.availableStock ?? p.stock ?? 0;
      return stock === 0;
    });

    const lowStock = nonTrashed.filter((p) => {
      const isStockTracked = p.trackQuantity !== false && p.trackStock !== false;
      if (!isStockTracked) return false;
      const stock = p.availableStock ?? p.stock ?? 0;
      return stock > 0 && stock <= (p.lowStockThreshold || 10);
    });

    return {
      all: nonTrashed.length,
      active: active.length,
      draft: draft.length,
      archived: archived.length,
      outOfStock: outOfStock.length,
      lowStock: lowStock.length,
      trash: trashed.length,
    };
  }, [products]);

  // Filtrage combiné multi-critères
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      if (!prod || typeof prod !== "object") return false;

      // Filtre de lot d'importation (Prompt 17-I)
      if (batchFilter && prod.importBatchId !== batchFilter) {
        return false;
      }

      // Gestion corbeille
      if (quickView === "trash") {
        if (!prod.deletedAt) return false;
      } else {
        if (prod.deletedAt) return false;
      }

      // Vues rapides
      if (quickView === "active") {
        if ((prod.productStatus || "active") !== "active") return false;
      } else if (quickView === "draft") {
        if (prod.productStatus !== "draft") return false;
      } else if (quickView === "archived") {
        if (prod.productStatus !== "archived") return false;
      } else if (quickView === "out_of_stock") {
        const isStockTracked = prod.trackQuantity !== false && prod.trackStock !== false;
        if (!isStockTracked) return false;
        const stock = prod.availableStock ?? prod.stock ?? 0;
        if (stock !== 0) return false;
      } else if (quickView === "low_stock") {
        const isStockTracked = prod.trackQuantity !== false && prod.trackStock !== false;
        if (!isStockTracked) return false;
        const stock = prod.availableStock ?? prod.stock ?? 0;
        if (stock === 0 || stock > (prod.lowStockThreshold || 10)) return false;
      }

      // Recherche multi-critères : nom, SKU, catégorie, type, fournisseur, tags, collection
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const name = (prod.name || prod.title || "").toLowerCase();
        const sku = (prod.sku || "").toLowerCase();
        const category = (prod.category || "").toLowerCase();
        const type = (prod.productType || prod.type || "").toLowerCase();
        const supplier = (prod.supplierName || "").toLowerCase();
        const collection = (prod.collection || "").toLowerCase();
        const tags = Array.isArray(prod.tags) ? prod.tags.join(" ").toLowerCase() : "";

        const match =
          name.includes(q) ||
          sku.includes(q) ||
          category.includes(q) ||
          type.includes(q) ||
          supplier.includes(q) ||
          collection.includes(q) ||
          tags.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [products, quickView, searchQuery]);

  // Tri dynamique
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "title") {
        const nameA = (a.name || a.title || "").toLowerCase();
        const nameB = (b.name || b.title || "").toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (sortBy === "price") {
        const priceA = a.salePrice ?? a.price ?? 0;
        const priceB = b.salePrice ?? b.price ?? 0;
        comparison = priceA - priceB;
      } else if (sortBy === "stock") {
        const stockA = a.trackQuantity === false ? -1 : a.availableStock ?? a.stock ?? 0;
        const stockB = b.trackQuantity === false ? -1 : b.availableStock ?? b.stock ?? 0;
        comparison = stockA - stockB;
      } else if (sortBy === "date") {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        comparison = dateA - dateB;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return list;
  }, [filteredProducts, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, currentPage, pageSize]);

  // Réinitialiser la page courante si le filtre change
  useEffect(() => {
    setCurrentPage(1);
  }, [quickView, searchQuery, pageSize]);

  // ==========================================
  // ACTIONS DE SÉLECTION
  // ==========================================
  const handleSelectPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedProducts.map((p) => p.id);
      setSelectedProductIds(Array.from(new Set([...selectedProductIds, ...pageIds])));
    } else {
      const pageIdsSet = new Set(paginatedProducts.map((p) => p.id));
      setSelectedProductIds((prev) => prev.filter((id) => !pageIdsSet.has(id)));
    }
  };

  const handleSelectAllFiltered = () => {
    setSelectedProductIds(filteredProducts.map((p) => p.id));
  };

  const handleSelectOne = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // ==========================================
  // ACTIONS INDIVIDUELLES
  // ==========================================
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

    setUndoToast({
      productIds: [product.id],
      message: `« ${product.name || product.title} » a été déplacé dans la corbeille.`,
    });
  };

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

  const handleDuplicateProduct = (product: Product) => {
    const newId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newName = `${product.name || product.title} (Copie)`;
    const newSlug = `${product.slug || "produit"}-copie-${Math.floor(Math.random() * 1000)}`;

    const duplicated: Product = {
      ...product,
      id: newId,
      name: newName,
      title: newName,
      slug: newSlug,
      productStatus: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    const updated = [duplicated, ...products];
    setProducts(updated);
    saveShopProductsList(storeSlug, updated);
    showToast(`Produit « ${newName} » dupliqué en brouillon.`);
  };

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

  // Hard Delete Modal
  const openHardDeleteModal = (product: Product) => {
    setHardDeleteTarget(product);
    setHardDeleteConfirmInput("");
    setHardDeleteError(null);
  };

  const handleHardDeleteConfirm = () => {
    if (!hardDeleteTarget) return;

    const res = hardDeleteProduct(storeSlug, hardDeleteTarget.id, hardDeleteConfirmInput, activeRole);
    if (!res.success) {
      setHardDeleteError(res.error || "Erreur lors de la suppression définitive.");
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== hardDeleteTarget.id));
    setSelectedProductIds((prev) => prev.filter((id) => id !== hardDeleteTarget.id));
    showToast(`« ${hardDeleteTarget.name || hardDeleteTarget.title} » définitivement supprimé.`);
    setHardDeleteTarget(null);
  };

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

  const handleEmptyTrashConfirm = () => {
    const res = emptyTrash(storeSlug, activeRole);
    if (!res.success) {
      showToast(res.error || "Erreur lors de la vidange de la corbeille.");
      setIsEmptyTrashModalOpen(false);
      return;
    }

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
  // EXPORT CSV (Prompt 17)
  // ==========================================
  const handleExportCsv = () => {
    const targetProducts =
      selectedProductIds.length > 0
        ? filteredProducts.filter((p) => selectedProductIds.includes(p.id))
        : filteredProducts;

    if (targetProducts.length === 0) {
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
      "Stock",
      "Suivi Stock",
      "Catégorie",
      "Type",
      "Collection",
      "Fournisseur",
      "SKU",
      "Balises",
      "Offres",
    ];

    const rows = targetProducts.map((p) => [
      sanitizeCellForCsv(p.id),
      sanitizeCellForCsv(p.name || p.title || ""),
      sanitizeCellForCsv(p.slug || ""),
      sanitizeCellForCsv(p.productStatus || "active"),
      sanitizeCellForCsv(p.salePrice ?? p.price ?? 0),
      sanitizeCellForCsv(canSeeFinancials ? p.costPrice ?? 0 : "Masqué"),
      sanitizeCellForCsv(p.trackQuantity === false ? "Non suivi" : p.availableStock ?? p.stock ?? 0),
      sanitizeCellForCsv(p.trackQuantity === false ? "NON" : "OUI"),
      sanitizeCellForCsv(p.category || ""),
      sanitizeCellForCsv(p.productType || p.type || "Standard"),
      sanitizeCellForCsv(p.collection || ""),
      sanitizeCellForCsv(p.supplierName || ""),
      sanitizeCellForCsv(p.sku || ""),
      sanitizeCellForCsv((p.tags || []).join("; ")),
      sanitizeCellForCsv(p.quantityOffers ? `${p.quantityOffers.length} offre(s)` : "0"),
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `produits_${storeSlug}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`${targetProducts.length} produit(s) exporté(s) en CSV.`);
  };

  // ==========================================
  // ACTIONS GROUPÉES (Prompt 17)
  // ==========================================
  const handleBulkAction = (
    action: "publish" | "unpublish" | "archive" | "trash" | "restore" | "hard_delete"
  ) => {
    if (selectedProductIds.length === 0) return;

    if (action === "hard_delete") {
      const firstTarget = products.find((p) => p.id === selectedProductIds[0]);
      if (selectedProductIds.length === 1 && firstTarget) {
        openHardDeleteModal(firstTarget);
        return;
      }
      if (!window.confirm(`Confirmez-vous la SUPPRESSION DÉFINITIVE de ${selectedProductIds.length} produit(s) ? Cette action est irréversible.`)) {
        return;
      }
    }

    const res = batchUpdateProductsStatus(storeSlug, selectedProductIds, action, activeRole);
    if (!res.success) {
      showToast(res.error || "Erreur lors de l'action groupée.");
      return;
    }

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
            return { ...p, productStatus: "archived" as const, archivedAt: nowIso };
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
      showToast(`${res.count} produit(s) mis à jour.`);
    }

    setSelectedProductIds([]);
  };

  // Action groupée : Assigner à une collection
  const handleConfirmBatchCollection = () => {
    if (!batchCollectionInput.trim()) {
      showToast("Veuillez sélectionner ou saisir une collection.");
      return;
    }
    const res = batchAssignCollection(storeSlug, selectedProductIds, batchCollectionInput, activeRole);
    if (res.success) {
      setProducts(getShopProductsRaw(storeSlug));
      showToast(`${res.count} produit(s) assigné(s) à « ${batchCollectionInput} ».`);
      setIsBatchCollectionModalOpen(false);
      setBatchCollectionInput("");
      setSelectedProductIds([]);
    } else {
      showToast(res.error || "Erreur lors de l'assignation de la collection.");
    }
  };

  // Action groupée : Ajouter une balise (tag)
  const handleConfirmBatchTag = () => {
    if (!batchTagInput.trim()) {
      showToast("Veuillez saisir une balise.");
      return;
    }
    const res = batchAddTag(storeSlug, selectedProductIds, batchTagInput, activeRole);
    if (res.success) {
      setProducts(getShopProductsRaw(storeSlug));
      showToast(`Balise « ${batchTagInput} » ajoutée à ${res.count} produit(s).`);
      setIsBatchTagModalOpen(false);
      setBatchTagInput("");
      setSelectedProductIds([]);
    } else {
      showToast(res.error || "Erreur lors de l'ajout de balise.");
    }
  };

  // Action groupée : Activer le suivi de stock (Prompt 17)
  const handleConfirmBatchEnableStock = () => {
    const res = batchEnableStockTracking(storeSlug, selectedProductIds, 0, activeRole);
    if (res.success) {
      setProducts(getShopProductsRaw(storeSlug));
      showToast(`Suivi de stock activé pour ${res.count} produit(s).`);
      setIsBatchStockTrackModalOpen(false);
      setSelectedProductIds([]);
    } else {
      showToast(res.error || "Erreur lors de l'activation du suivi de stock.");
    }
  };

  // Action groupée : Modifier le statut en masse
  const handleConfirmBatchStatus = () => {
    handleBulkAction(batchStatusChoice === "active" ? "publish" : batchStatusChoice === "draft" ? "unpublish" : "archive");
    setIsBatchStatusModalOpen(false);
  };

  // ==========================================
  // PROTECTION DES DROITS (Prompt 17)
  // ==========================================
  if (!canView) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] pb-24 text-[#111111] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200 p-8 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-[#111111]">Accès non autorisé</h2>
          <p className="text-sm text-[#7A7A7A] mt-2 leading-relaxed">
            Votre profil (<strong>{activeRole}</strong>) ne possède pas les permissions nécessaires pour accéder au catalogue des produits.
          </p>
          <div className="mt-6">
            <Link
              href={`/app/${storeSlug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F3A26] text-white text-xs font-bold hover:bg-[#162B1C] transition-colors"
            >
              Retourner au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPageSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedProductIds.includes(p.id));

  return (
    <div className="space-y-6 pb-24 text-[#111111]">
      {/* Toast d'action */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1F3A26] text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Undo Toast (Prompt 14-B) */}
      {undoToast && (
        <div
          id="toast-undo-trash"
          className="fixed bottom-6 right-6 z-50 bg-[#1F3A26] text-white px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 border border-white/10"
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

      {/* ======================================================== */}
      {/* 1) BARRE DU HAUT (Prompt 17 - Phase 17-A) */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
              Produits
            </h1>
            <p className="text-xs text-[#7A7A7A] mt-1">
              Catalogue, tarification, variantes et suivi d'inventaire de la boutique.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bouton : Afficher en tant que client (Prompt 17-M : sélecteur d'appareil iPhone 15 Pro Max par défaut) */}
            <button
              type="button"
              id="btn-view-as-customer"
              data-testid="btn-view-as-customer"
              onClick={() => setIsClientPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E0D4] bg-white text-xs font-semibold text-[#111111] hover:bg-[#F3EFE6] transition-colors shadow-2xs cursor-pointer"
              title="Aperçu mobile iPhone 15 Pro Max et multi-appareils"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#666660]" />
              <span>Afficher en tant que client</span>
            </button>

            {/* Bouton : Importer (CSV) */}
            {canImport && (
              <button
                type="button"
                id="btn-import-csv"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E0D4] bg-white text-xs font-semibold text-[#111111] hover:bg-[#F3EFE6] transition-colors shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-[#666660]" />
                <span>Importer</span>
              </button>
            )}

            {/* Bouton : Synchroniser mes produits vers la base (Prompt 17-O) */}
            {canImport && (
              <button
                type="button"
                id="btn-sync-to-supabase"
                data-testid="btn-sync-to-supabase"
                onClick={handleSyncToSupabase}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                title="Synchroniser mes produits vers la base de données Supabase"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 text-emerald-700", isSyncing && "animate-spin")} />
                <span>{isSyncing ? "Synchronisation..." : "Synchroniser vers la base"}</span>
              </button>
            )}

            {/* Bouton : Publier tous les brouillons sur la vitrine */}
            {canImport && (
              <button
                type="button"
                data-testid="btn-publish-all-drafts"
                onClick={handlePublishAllDrafts}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#C2410C] bg-[#FFF7ED] text-xs font-semibold text-[#9A3412] hover:bg-[#FFEDD5] transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <span>Tout publier</span>
              </button>
            )}

            {/* Bouton : Exporter (CSV) */}
            <button
              type="button"
              id="btn-export-csv"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E0D4] bg-white text-xs font-semibold text-[#111111] hover:bg-[#F3EFE6] transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#666660]" />
              <span>Exporter</span>
            </button>

            {/* Menu : Plus d'actions */}
            {canManage && (
              <div className="relative">
                <button
                  type="button"
                  id="btn-more-actions-menu"
                  onClick={() => setIsMoreActionsMenuOpen(!isMoreActionsMenuOpen)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-[#E6E0D4] bg-white text-xs font-semibold text-[#111111] hover:bg-[#F3EFE6] transition-colors shadow-2xs"
                >
                  <span>Plus d'actions</span>
                  <ChevronDown className="w-3 h-3 text-[#666660]" />
                </button>

                {isMoreActionsMenuOpen && (
                  <div className="absolute right-0 mt-1 w-56 rounded-2xl border border-[#E6E0D4] bg-white p-2 shadow-xl z-30 space-y-1">
                    <button
                      type="button"
                      disabled={selectedProductIds.length !== 1}
                      onClick={() => {
                        setIsMoreActionsMenuOpen(false);
                        const target = products.find((p) => p.id === selectedProductIds[0]);
                        if (target) handleDuplicateProduct(target);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F3EFE6] disabled:opacity-40 disabled:hover:bg-transparent text-xs font-semibold text-[#111111] flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4 text-[#666660]" />
                      <span>Dupliquer le produit</span>
                    </button>
                    <button
                      type="button"
                      disabled={selectedProductIds.length === 0}
                      onClick={() => {
                        setIsMoreActionsMenuOpen(false);
                        handleBulkAction("archive");
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F3EFE6] disabled:opacity-40 disabled:hover:bg-transparent text-xs font-semibold text-[#111111] flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4 text-stone-600" />
                      <span>Archiver la sélection</span>
                    </button>
                    <button
                      type="button"
                      disabled={selectedProductIds.length === 0}
                      onClick={() => {
                        setIsMoreActionsMenuOpen(false);
                        setIsBatchStatusModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F3EFE6] disabled:opacity-40 disabled:hover:bg-transparent text-xs font-semibold text-[#111111] flex items-center gap-2"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                      <span>Modifier en masse (statut)</span>
                    </button>
                    <button
                      type="button"
                      disabled={selectedProductIds.length === 0}
                      onClick={() => {
                        setIsMoreActionsMenuOpen(false);
                        setIsBatchCollectionModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F3EFE6] disabled:opacity-40 disabled:hover:bg-transparent text-xs font-semibold text-[#111111] flex items-center gap-2"
                    >
                      <FolderTree className="w-4 h-4 text-amber-600" />
                      <span>Modifier collection</span>
                    </button>
                    <button
                      type="button"
                      disabled={selectedProductIds.length === 0}
                      onClick={() => {
                        setIsMoreActionsMenuOpen(false);
                        setIsBatchTagModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F3EFE6] disabled:opacity-40 disabled:hover:bg-transparent text-xs font-semibold text-[#111111] flex items-center gap-2"
                    >
                      <Tag className="w-4 h-4 text-purple-600" />
                      <span>Modifier balises (tags)</span>
                    </button>
                    <div className="h-px bg-[#E6E0D4] my-1" />
                    <button
                      type="button"
                      disabled={selectedProductIds.length === 0}
                      onClick={() => {
                        setIsMoreActionsMenuOpen(false);
                        handleBulkAction("trash");
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 disabled:opacity-40 disabled:hover:bg-transparent text-xs font-semibold text-rose-700 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Supprimer (Corbeille)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bouton : Ajouter un produit (bouton principal sombre) */}
            {canManage && (
              <Link
                href={`/app/${storeSlug}/produits/nouveau`}
                id="btn-add-product-main"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1F3A26] text-white text-xs font-bold hover:bg-[#162B1C] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un produit</span>
              </Link>
            )}
          </div>
        </div>

        {/* Sous-menu Produits officiel Prompt 17 */}
        <ProductsNavTabs storeSlug={storeSlug} />

        {/* Bannière de lot d'importation (Prompt 17-I) */}
        {batchFilter && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-black">Lot d'importation actif : </span>
                <span>Affichage des {filteredProducts.length} produit(s) du lot #{batchFilter}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/app/${storeSlug}/produits`)}
                className="px-3 py-1.5 rounded-xl bg-white border border-amber-200 hover:bg-amber-100 font-bold text-amber-900 transition-colors cursor-pointer"
              >
                Voir tout le catalogue
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Confirmez-vous l'annulation complète de ce lot d'import ? Tous les produits créés par ce lot seront retirés.")) {
                    const res = rollbackImportBatch(batchFilter, products, storeSlug);
                    setProducts(res.remainingProducts);
                    router.push(`/app/${storeSlug}/produits`);
                    showToast(`${res.rolledBackCount} produit(s) du lot retiré(s).`);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors cursor-pointer"
              >
                Annuler ce lot d'import (24 h)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2) BANDEAU DE 3 INDICATEURS AVEC SÉLECTEUR DE PÉRIODE */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#7A7A7A] uppercase tracking-wider">
            Indicateurs de performance (commandes livrées)
          </span>

          {/* Sélecteur de période */}
          <div className="flex items-center gap-1 p-1 bg-white border border-[#E6E0D4] rounded-xl shadow-2xs">
            {(
              [
                { id: "today", label: "Aujourd'hui" },
                { id: "7d", label: "7 j" },
                { id: "30d", label: "30 j" },
                { id: "90d", label: "90 j" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setIndicatorPeriod(p.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
                  indicatorPeriod === p.id
                    ? "bg-[#1F3A26] text-white shadow-xs"
                    : "text-[#666660] hover:text-[#111111] hover:bg-[#F3EFE6]"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Indicateur 1 : Taux de vente moyen */}
          <div className="rounded-2xl border border-[#E6E0D4] bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#7A7A7A] mb-2">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Taux de vente moyen</span>
                </span>
                <span
                  title="Formule : Unités vendues ÷ (Unités vendues + Stock restant) sur les commandes livrées de la période."
                  className="cursor-help text-[#AAAAAA] hover:text-[#111111]"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-black text-[#111111]">
                {indicators.sellThrough.hasData
                  ? indicators.sellThrough.formattedRate
                  : "Aucune donnée"}
              </div>
              <p className="mt-1 text-xs text-[#7A7A7A]">
                {indicators.sellThrough.hasData
                  ? `${indicators.sellThrough.totalSoldUnits} unités livrées · ${indicators.sellThrough.totalRemainingStock} en stock`
                  : "Aucune commande livrée sur cette période"}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#F0EBE0] text-[10px] text-[#888888]">
              Unités vendues ÷ (vendues + stock restant)
            </div>
          </div>

          {/* Indicateur 2 : Produits par jours de stock restants */}
          <div className="rounded-2xl border border-[#E6E0D4] bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#7A7A7A] mb-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Jours de stock restants</span>
                </span>
                <span
                  title="Formule : Stock disponible ÷ Ventes moyennes par jour sur les commandes livrées. Alerte les ruptures imminentes (< 7 j)."
                  className="cursor-help text-[#AAAAAA] hover:text-[#111111]"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl font-black text-[#111111]">
                {indicators.runway.hasData
                  ? indicators.runway.summaryText
                  : "Aucune donnée"}
              </div>
              <p className="mt-1 text-xs text-[#7A7A7A]">
                {indicators.runway.hasData
                  ? `${indicators.runway.criticalCount} < 7 j (alerte) · ${indicators.runway.warningCount} 7-15 j`
                  : "Rythme de vente indisponible"}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#F0EBE0] text-[10px] text-[#888888]">
              Stock dispo ÷ ventes quotidiennes livrées
            </div>
          </div>

          {/* Indicateur 3 : Analyse ABC */}
          <div className="rounded-2xl border border-[#E6E0D4] bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#7A7A7A] mb-2">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Analyse ABC</span>
                </span>
                <span
                  title="Classement Pareto du chiffre d'affaires livré : Classe A (80% premiers), Classe B (15% suivants), Classe C (le reste)."
                  className="cursor-help text-[#AAAAAA] hover:text-[#111111]"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl font-black text-[#111111]">
                {indicators.abc.hasData ? indicators.abc.summaryText : "Aucune donnée"}
              </div>
              <p className="mt-1 text-xs text-[#7A7A7A]">
                {indicators.abc.hasData
                  ? canSeeFinancials
                    ? `CA livré cumulé : ${formatFcfa(indicators.abc.totalRevenue)}`
                    : "Classement établi sur les livraisons"
                  : "Aucune vente livrée"}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#F0EBE0] text-[10px] text-[#888888]">
              Pareto : A (80 % CA) · B (15 %) · C (5 %)
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3) BARRE DE FILTRES : VUES RAPIDES + RECHERCHE + CHOIX COLONNES */}
      {/* ======================================================== */}
      <div className="space-y-3">
        {/* Vues rapides par onglets */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E6E0D4] pb-2">
          {(
            [
              { id: "all", label: "Tous", count: viewCounts.all },
              { id: "active", label: "Actifs", count: viewCounts.active },
              { id: "draft", label: "Brouillons", count: viewCounts.draft },
              { id: "archived", label: "Archivés", count: viewCounts.archived },
              { id: "out_of_stock", label: "En rupture", count: viewCounts.outOfStock },
              { id: "low_stock", label: "Stock bas", count: viewCounts.lowStock },
              { id: "trash", label: "Corbeille", count: viewCounts.trash },
            ] as const
          ).map((v) => (
            <button
              key={v.id}
              type="button"
              id={`tab-view-${v.id}`}
              onClick={() => {
                setQuickView(v.id);
                setSelectedProductIds([]);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                quickView === v.id
                  ? v.id === "trash"
                    ? "bg-rose-700 text-white shadow-xs"
                    : v.id === "out_of_stock"
                      ? "bg-red-700 text-white shadow-xs"
                      : v.id === "low_stock"
                        ? "bg-amber-700 text-white shadow-xs"
                        : "bg-[#1F3A26] text-white shadow-xs"
                  : "bg-white border border-[#E6E0D4] text-[#666660] hover:text-[#111111] hover:bg-[#F3EFE6]"
              )}
            >
              <span>{v.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px]",
                  quickView === v.id ? "bg-white/20 text-white" : "bg-[#EFECE6] text-[#666660]"
                )}
              >
                {v.count}
              </span>
            </button>
          ))}
        </div>

        {/* Bannière Corbeille si sélectionnée */}
        {quickView === "trash" && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block">Articles dans la corbeille (Rétention 30 jours)</span>
                <span className="text-rose-700 text-[11px]">
                  Ces produits sont retirés de la vitrine. Ils seront définitivement purgés après 30 jours.
                </span>
              </div>
            </div>

            {canHardDelete && viewCounts.trash > 0 && (
              <button
                type="button"
                id="btn-empty-trash"
                onClick={openEmptyTrashModal}
                className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vider la corbeille</span>
              </button>
            )}
          </div>
        )}

        {/* Barre de recherche et choix des colonnes */}
        <div className="rounded-2xl border border-[#E6E0D4] bg-white p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Champ « Rechercher et filtrer » multi-critères */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
            <input
              type="text"
              id="input-product-search"
              placeholder="Rechercher et filtrer (nom, SKU, catégorie, type, fournisseur, tag, collection)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-[#111111] placeholder:text-[#999990] focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Bouton de choix des colonnes */}
            <div className="relative">
              <button
                type="button"
                id="btn-columns-picker"
                onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-[#111111] text-xs font-semibold hover:bg-[#EFECE6] transition-colors"
                title="Personnaliser les colonnes du tableau"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#666660]" />
                <span>Colonnes</span>
              </button>

              {isColumnPickerOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#E6E0D4] bg-white p-3 shadow-xl z-30 space-y-2">
                  <p className="text-xs font-bold text-[#111111] pb-1 border-b border-[#E6E0D4]">
                    Colonnes optionnelles
                  </p>
                  <label className="flex items-center gap-2 text-xs text-[#4A4A4A] cursor-pointer hover:text-[#111111]">
                    <input
                      type="checkbox"
                      checked={visibleColumns.supplier}
                      onChange={() => toggleColumn("supplier")}
                      className="rounded border-[#E6E0D4] text-black focus:ring-black"
                    />
                    <span>Fournisseur</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[#4A4A4A] cursor-pointer hover:text-[#111111]">
                    <input
                      type="checkbox"
                      checked={visibleColumns.collections}
                      onChange={() => toggleColumn("collections")}
                      className="rounded border-[#E6E0D4] text-black focus:ring-black"
                    />
                    <span>Collections</span>
                  </label>
                  {canSeeFinancials && (
                    <label className="flex items-center gap-2 text-xs text-[#4A4A4A] cursor-pointer hover:text-[#111111]">
                      <input
                        type="checkbox"
                        checked={visibleColumns.margin}
                        onChange={() => toggleColumn("margin")}
                        className="rounded border-[#E6E0D4] text-black focus:ring-black"
                      />
                      <span>Marge & Coût</span>
                    </label>
                  )}
                  <label className="flex items-center gap-2 text-xs text-[#4A4A4A] cursor-pointer hover:text-[#111111]">
                    <input
                      type="checkbox"
                      checked={visibleColumns.updatedAt}
                      onChange={() => toggleColumn("updatedAt")}
                      className="rounded border-[#E6E0D4] text-black focus:ring-black"
                    />
                    <span>Dernière modification</span>
                  </label>
                </div>
              )}
            </div>

            {/* Sélecteur Vue Tableau / Grille */}
            <div className="flex items-center rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] p-1">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === "table" ? "bg-[#1F3A26] text-white" : "text-[#888880] hover:text-[#111111]"
                )}
                title="Vue Tableau"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === "grid" ? "bg-[#1F3A26] text-white" : "text-[#888880] hover:text-[#111111]"
                )}
                title="Vue Grille"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4) TABLEAU DES PRODUITS (Prompt 17 - Phase 17-A) */}
      {/* ======================================================== */}
      {filteredProducts.length === 0 ? (
        /* État vide soigné (Prompt 17) */
        <div className="rounded-3xl border border-[#E6E0D4] bg-white p-12 text-center shadow-2xs space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-[#FAF8F5] border border-[#E6E0D4] flex items-center justify-center mx-auto text-[#7A7A7A]">
            {quickView === "trash" ? (
              <Trash2 className="h-8 w-8 text-rose-500" />
            ) : (
              <Package className="h-8 w-8 text-[#111111]" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#111111]">
              {quickView === "trash"
                ? "La corbeille est vide"
                : products.length === 0
                  ? "Ajoutez votre premier produit"
                  : "Aucun produit ne correspond à vos filtres"}
            </h3>
            <p className="text-xs text-[#7A7A7A] max-w-sm mx-auto mt-1 leading-relaxed">
              {quickView === "trash"
                ? "Aucun produit n'a été déplacé dans la corbeille."
                : products.length === 0
                  ? "Commencez par ajouter votre premier produit pour alimenter votre vitrine et lancer vos campagnes publicitaires."
                  : searchQuery
                    ? `Aucun produit ne correspond à « ${searchQuery} ».`
                    : "Modifiez vos filtres pour afficher des produits."}
            </p>
          </div>

          {quickView !== "trash" && canManage && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/app/${storeSlug}/produits/nouveau`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F3A26] text-white text-xs font-bold hover:bg-[#162B1C] transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un produit</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E6E0D4] bg-white text-[#111111] text-xs font-semibold hover:bg-[#F3EFE6] transition-colors"
              >
                <Upload className="w-4 h-4 text-[#666660]" />
                <span>Importer (CSV)</span>
              </button>
              {canUseAiProductGenerator(activeRole) && (
                <Link
                  href={`/app/${storeSlug}/produits/nouveau-ia`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 transition-colors shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Générer avec l'IA</span>
                </Link>
              )}
            </div>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* VUE TABLEAU (Desktop) & CARTES RESPONSIVES (Mobile iPhone 13) */
        <div className="rounded-3xl border border-[#E6E0D4] bg-white overflow-hidden shadow-2xs">
          {/* Version Desktop : TABLEAU */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse" id="table-products-list">
              <thead>
                <tr className="border-b border-[#E6E0D4] bg-[#FAF8F5] text-[10px] font-bold uppercase tracking-wider text-[#7A7A7A]">
                  <th className="py-3.5 pl-5 pr-2 w-8">
                    <input
                      type="checkbox"
                      id="checkbox-select-all"
                      checked={isPageSelected}
                      onChange={handleSelectPage}
                      className="rounded border-[#E6E0D4] text-black focus:ring-black cursor-pointer"
                      title="Sélectionner la page"
                    />
                  </th>
                  <th className="py-3.5 pl-2 pr-3 w-14">Image</th>
                  <th
                    onClick={() => handleSort("title")}
                    className="py-3.5 px-3 cursor-pointer hover:text-[#111111]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Titre</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-3">Statut</th>
                  <th
                    onClick={() => handleSort("stock")}
                    className="py-3.5 px-3 cursor-pointer hover:text-[#111111]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Stock</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-3">Catégorie</th>
                  <th className="py-3.5 px-3">Type</th>
                  <th
                    onClick={() => handleSort("price")}
                    className="py-3.5 px-3 cursor-pointer hover:text-[#111111]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Prix</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-3">Offres</th>
                  {visibleColumns.supplier && <th className="py-3.5 px-3">Fournisseur</th>}
                  {visibleColumns.collections && <th className="py-3.5 px-3">Collections</th>}
                  {visibleColumns.margin && canSeeFinancials && (
                    <th className="py-3.5 px-3">Marge</th>
                  )}
                  {visibleColumns.updatedAt && (
                    <th
                      onClick={() => handleSort("date")}
                      className="py-3.5 px-3 cursor-pointer hover:text-[#111111]"
                    >
                      <div className="flex items-center gap-1">
                        <span>Modifié</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                  )}
                  <th className="py-3.5 pr-6 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE0] text-xs">
                {paginatedProducts.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  const isTrashed = product.deletedAt != null;
                  const isStockTracked = product.trackQuantity !== false && product.trackStock !== false;
                  const currentStock = product.availableStock ?? product.stock ?? 0;
                  const variantsCount = product.variants ? product.variants.length : 1;
                  const offersCount = product.quantityOffers ? product.quantityOffers.length : 0;
                  const primaryImage =
                    (product.images && product.images[0]) ||
                    (product.mediaItems && product.mediaItems[0]?.url) ||
                    null;

                  return (
                    <tr
                      key={product.id}
                      id={`product-row-${product.id}`}
                      className={cn(
                        "hover:bg-[#FAF8F5] transition-colors group",
                        isSelected && "bg-[#FAF8F5]",
                        isTrashed && "opacity-85 bg-rose-50/20"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-5 pr-2">
                        <input
                          type="checkbox"
                          id={`checkbox-product-${product.id}`}
                          checked={isSelected}
                          onChange={() => handleSelectOne(product.id)}
                          className="rounded border-[#E6E0D4] text-black focus:ring-black cursor-pointer"
                        />
                      </td>

                      {/* Image Miniature Optimisée */}
                      <td className="py-3.5 pl-2 pr-3">
                        <div className="h-11 w-11 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs text-[#7A7A7A]">
                          {primaryImage ? (
                            <img
                              src={primaryImage}
                              alt={product.name || product.title || "Produit"}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            (product.name || product.title || "P").charAt(0).toUpperCase()
                          )}
                        </div>
                      </td>

                      {/* Titre (tronqué 2 lignes max) + SKU */}
                      <td className="py-3.5 px-3 min-w-[200px] max-w-xs">
                        <Link
                          href={`/app/${storeSlug}/produits/${product.id}/modifier`}
                          className="font-bold text-xs text-[#111111] hover:underline line-clamp-2"
                        >
                          {product.name || product.title || "Produit sans titre"}
                        </Link>
                        <span className="text-[10px] text-[#888880] block mt-0.5">
                          SKU: {product.sku || "N/A"}
                        </span>
                      </td>

                      {/* Statut (pastille colorée) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isTrashed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            <Trash2 className="w-3 h-3" />
                            Corbeille
                          </span>
                        ) : product.productStatus === "active" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Actif
                          </span>
                        ) : product.productStatus === "draft" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            Brouillon
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-200 text-stone-700">
                            Archivé
                          </span>
                        )}
                      </td>

                      {/* Stock (Prompt 17 : « Stock non suivi » ou « X en stock · Y variantes ») */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {!isStockTracked ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                            Stock non suivi
                          </span>
                        ) : currentStock === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            Rupture de stock
                          </span>
                        ) : currentStock <= (product.lowStockThreshold || 10) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
                            {currentStock} en stock{variantsCount > 1 ? ` · ${variantsCount} var.` : ""}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {currentStock} en stock{variantsCount > 1 ? ` · ${variantsCount} var.` : ""}
                          </span>
                        )}
                      </td>

                      {/* Catégorie */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-[#4A4A4A]">
                        {product.category || "—"}
                      </td>

                      {/* Type de produit */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-[#666660]">
                        {product.productType || product.type || "Standard"}
                      </td>

                      {/* Prix (FCFA) */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-bold text-[#111111]">
                        {formatFcfa(product.salePrice ?? product.price ?? 0)}
                      </td>

                      {/* Offres (nombre de packs configurés) */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-[#666660]">
                        {offersCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-semibold border border-purple-200">
                            {offersCount} offre{offersCount > 1 ? "s" : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Colonne optionnelle : Fournisseur */}
                      {visibleColumns.supplier && (
                        <td className="py-3.5 px-3 whitespace-nowrap text-[#666660]">
                          {product.supplierName || "—"}
                        </td>
                      )}

                      {/* Colonne optionnelle : Collections */}
                      {visibleColumns.collections && (
                        <td className="py-3.5 px-3 whitespace-nowrap text-[#666660]">
                          {product.collection || (product.collections || []).join(", ") || "—"}
                        </td>
                      )}

                      {/* Colonne optionnelle : Marge (réservée admin) */}
                      {visibleColumns.margin && canSeeFinancials && (
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="text-[11px] font-semibold text-emerald-700">
                            +{formatFcfa((product.salePrice ?? 0) - (product.costPrice ?? 0))}
                          </div>
                          <div className="text-[10px] text-[#888880]">
                            Revient: {formatFcfa(product.costPrice ?? 0)}
                          </div>
                        </td>
                      )}

                      {/* Colonne optionnelle : Modifié */}
                      {visibleColumns.updatedAt && (
                        <td className="py-3.5 px-3 whitespace-nowrap text-[11px] text-[#888880]">
                          {product.updatedAt
                            ? new Date(product.updatedAt).toLocaleDateString("fr-FR")
                            : "—"}
                        </td>
                      )}

                      {/* Actions rapides */}
                      <td className="py-3.5 pr-6 pl-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Icône œil : aperçu vitrine */}
                          <a
                            id={`btn-product-preview-${product.id}`}
                            href={getProductPublicUrl(product, storeSlug, { preview: true })}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Voir sur la vitrine"
                            className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl border border-[#E6E0D4] bg-white text-[#111111] hover:bg-[#F3EFE6] transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </a>

                          {/* Modifier (si gestionnaire) */}
                          {canManage && (
                            <Link
                              href={`/app/${storeSlug}/produits/${product.id}/modifier`}
                              className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl border border-[#E6E0D4] bg-white text-[#111111] hover:bg-[#F3EFE6] transition-colors"
                              title="Modifier la fiche produit"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Link>
                          )}

                          {/* Si Corbeille : Restaurer / Supprimer définitivement */}
                          {isTrashed ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRestore(product)}
                                className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors"
                                title="Restaurer"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                              {canHardDelete && (
                                <button
                                  type="button"
                                  onClick={() => openHardDeleteModal(product)}
                                  className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 transition-colors"
                                  title="Supprimer définitivement"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </>
                          ) : (
                            /* Menu contextuel ... pour actions avancées */
                            canManage && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateProduct(product)}
                                  title="Dupliquer"
                                  className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl border border-[#E6E0D4] bg-white text-[#666660] hover:bg-[#F3EFE6] transition-colors"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                                {canTrash && (
                                  <button
                                    type="button"
                                    onClick={() => handleSoftDelete(product)}
                                    title="Mettre à la corbeille"
                                    className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Version Mobile : CARTES (iPhone 13 responsive, sans coupure) */}
          <div className="sm:hidden divide-y divide-[#F0EBE0]">
            {paginatedProducts.map((product) => {
              const isSelected = selectedProductIds.includes(product.id);
              const isTrashed = product.deletedAt != null;
              const isStockTracked = product.trackQuantity !== false && product.trackStock !== false;
              const currentStock = product.availableStock ?? product.stock ?? 0;
              const primaryImage =
                (product.images && product.images[0]) ||
                (product.mediaItems && product.mediaItems[0]?.url) ||
                null;

              return (
                <div
                  key={product.id}
                  className={cn("p-4 space-y-3", isSelected && "bg-[#FAF8F5]")}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(product.id)}
                      className="mt-1 rounded border-[#E6E0D4] text-black focus:ring-black"
                    />

                    <div className="h-12 w-12 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs text-[#7A7A7A]">
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={product.name || product.title || "Produit"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (product.name || product.title || "P").charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/app/${storeSlug}/produits/${product.id}`}
                        className="font-bold text-sm text-[#111111] block line-clamp-2"
                      >
                        {product.name || product.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-extrabold text-sm text-[#111111]">
                          {formatFcfa(product.salePrice ?? product.price ?? 0)}
                        </span>
                        <span className="text-[10px] text-[#888880]">
                          SKU: {product.sku || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Statut */}
                    {isTrashed ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        Corbeille
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {product.productStatus || "Actif"}
                      </span>
                    )}

                    {/* Stock */}
                    {!isStockTracked ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                        Stock non suivi
                      </span>
                    ) : currentStock === 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        Rupture
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {currentStock} en stock
                      </span>
                    )}

                    {product.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#666660] border border-[#E6E0D4]">
                        {product.category}
                      </span>
                    )}
                  </div>

                  {/* Actions mobile */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0EBE0]">
                    <a
                      href={getProductPublicUrl(product, storeSlug, { preview: true })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-[#E6E0D4] bg-white text-xs font-semibold text-[#111111] flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Vitrine</span>
                    </a>
                    {canManage && (
                      <Link
                        href={`/app/${storeSlug}/produits/${product.id}/modifier`}
                        className="px-3 py-1.5 rounded-lg bg-[#1F3A26] text-white text-xs font-bold"
                      >
                        Modifier
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination (50 par page, Prompt 17) */}
          <div className="p-4 border-t border-[#E6E0D4] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7A7A7A]">
            <div className="flex items-center gap-3">
              <span>
                Affichage de {paginatedProducts.length} sur {sortedProducts.length} produit(s)
              </span>
              <div className="flex items-center gap-1.5">
                <span>Par page :</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-[#E6E0D4] bg-white text-[#111111] font-semibold focus:outline-none"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[#E6E0D4] bg-white text-[#111111] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F3EFE6]"
                title="Page précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-[#111111]">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-[#E6E0D4] bg-white text-[#111111] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F3EFE6]"
                title="Page suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VUE GRILLE (Grid) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedProducts.map((product) => {
            const isSelected = selectedProductIds.includes(product.id);
            const isStockTracked = product.trackQuantity !== false && product.trackStock !== false;
            const currentStock = product.availableStock ?? product.stock ?? 0;
            const primaryImage =
              (product.images && product.images[0]) ||
              (product.mediaItems && product.mediaItems[0]?.url) ||
              null;

            return (
              <div
                key={product.id}
                className={cn(
                  "rounded-2xl border border-[#E6E0D4] bg-white p-4 shadow-2xs space-y-3 relative flex flex-col justify-between",
                  isSelected && "ring-2 ring-black"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(product.id)}
                      className="rounded border-[#E6E0D4] text-black focus:ring-black"
                    />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {product.productStatus || "Actif"}
                    </span>
                  </div>

                  <div className="h-32 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4] my-2 overflow-hidden flex items-center justify-center">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={product.name || product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-[#CCCCCC]" />
                    )}
                  </div>

                  <h4 className="font-bold text-xs text-[#111111] line-clamp-1">
                    {product.name || product.title}
                  </h4>
                  <p className="text-sm font-extrabold text-[#111111] mt-1">
                    {formatFcfa(product.salePrice ?? product.price ?? 0)}
                  </p>
                  <p className="text-[10px] text-[#7A7A7A]">
                    {!isStockTracked ? "Stock non suivi" : `${currentStock} en stock`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-[#F0EBE0]">
                  <a
                    href={getProductPublicUrl(product, storeSlug, { preview: true })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-[#E6E0D4] text-[#111111] hover:bg-[#FAF8F5]"
                    title="Voir vitrine"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  {canManage && (
                    <Link
                      href={`/app/${storeSlug}/produits/${product.id}/modifier`}
                      className="flex-1 text-center py-2 rounded-lg bg-[#1F3A26] text-white text-xs font-bold"
                    >
                      Modifier
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5) BARRE FLOTTANTE D'ACTIONS GROUPÉES (Prompt 17) */}
      {/* ======================================================== */}
      {selectedProductIds.length > 0 && canManage && (
        <div
          id="batch-bar"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1F3A26] text-white px-5 py-3 rounded-2xl shadow-2xl flex flex-wrap items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200 border border-white/10"
        >
          <span className="font-bold text-white whitespace-nowrap">
            {selectedProductIds.length} sélectionné(s)
          </span>

          <div className="h-4 w-px bg-white/20 hidden sm:block" />

          {/* Actions groupées Prompt 17 */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBatchStatusModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer"
            >
              Modifier le statut
            </button>
            <button
              type="button"
              onClick={() => setIsBatchCollectionModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer"
            >
              Ajouter à une collection
            </button>
            <button
              type="button"
              onClick={() => setIsBatchTagModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer"
            >
              Ajouter une balise
            </button>
            <button
              type="button"
              id="btn-batch-enable-stock"
              onClick={() => setIsBatchStockTrackModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-colors cursor-pointer"
            >
              Activer le suivi de stock
            </button>
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

          <div className="h-4 w-px bg-white/20 hidden sm:block" />

          <button
            type="button"
            onClick={() => setSelectedProductIds([])}
            className="text-stone-400 hover:text-white text-xs underline cursor-pointer ml-auto"
          >
            Désélectionner
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE : MODIFIER LE STATUT EN MASSE */}
      {/* ======================================================== */}
      {isBatchStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#111111]">
              Modifier le statut de {selectedProductIds.length} produit(s)
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E6E0D4] cursor-pointer hover:bg-[#FAF8F5]">
                <input
                  type="radio"
                  name="batch-status"
                  value="active"
                  checked={batchStatusChoice === "active"}
                  onChange={() => setBatchStatusChoice("active")}
                  className="text-black"
                />
                <div>
                  <p className="font-bold text-xs text-[#111111]">Actif</p>
                  <p className="text-[11px] text-[#7A7A7A]">Visible en ligne pour les acheteurs</p>
                </div>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E6E0D4] cursor-pointer hover:bg-[#FAF8F5]">
                <input
                  type="radio"
                  name="batch-status"
                  value="draft"
                  checked={batchStatusChoice === "draft"}
                  onChange={() => setBatchStatusChoice("draft")}
                  className="text-black"
                />
                <div>
                  <p className="font-bold text-xs text-[#111111]">Brouillon</p>
                  <p className="text-[11px] text-[#7A7A7A]">Masqué du catalogue public</p>
                </div>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E6E0D4] cursor-pointer hover:bg-[#FAF8F5]">
                <input
                  type="radio"
                  name="batch-status"
                  value="archived"
                  checked={batchStatusChoice === "archived"}
                  onChange={() => setBatchStatusChoice("archived")}
                  className="text-black"
                />
                <div>
                  <p className="font-bold text-xs text-[#111111]">Archivé</p>
                  <p className="text-[11px] text-[#7A7A7A]">Non modifiable et masqué de la vitrine</p>
                </div>
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6E0D4]">
              <button
                type="button"
                onClick={() => setIsBatchStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E6E0D4] text-xs font-semibold text-[#666660] hover:bg-[#FAF8F5]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchStatus}
                className="px-4 py-2 rounded-xl bg-[#1F3A26] text-white text-xs font-bold hover:bg-[#162B1C]"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE : AJOUTER À UNE COLLECTION EN LOT */}
      {/* ======================================================== */}
      {isBatchCollectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#111111]">
              Ajouter {selectedProductIds.length} produit(s) à une collection
            </h3>
            <p className="text-xs text-[#7A7A7A]">
              Choisissez une collection existante ou tapez le nom d'une nouvelle collection.
            </p>
            <input
              type="text"
              placeholder="Ex: Soins Visage, Meilleures Ventes..."
              value={batchCollectionInput}
              onChange={(e) => setBatchCollectionInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-[#111111] focus:outline-none focus:border-[#111111]"
            />
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6E0D4]">
              <button
                type="button"
                onClick={() => setIsBatchCollectionModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E6E0D4] text-xs font-semibold text-[#666660] hover:bg-[#FAF8F5]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchCollection}
                className="px-4 py-2 rounded-xl bg-[#1F3A26] text-white text-xs font-bold hover:bg-[#162B1C]"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE : AJOUTER UNE BALISE (TAG) EN LOT */}
      {/* ======================================================== */}
      {isBatchTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#111111]">
              Ajouter une balise à {selectedProductIds.length} produit(s)
            </h3>
            <p className="text-xs text-[#7A7A7A]">
              Les balises permettent de filtrer rapidement votre catalogue et de cibler vos campagnes.
            </p>
            <input
              type="text"
              placeholder="Ex: Promo, Vedette, Pack Promo, Bio..."
              value={batchTagInput}
              onChange={(e) => setBatchTagInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-[#111111] focus:outline-none focus:border-[#111111]"
            />
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6E0D4]">
              <button
                type="button"
                onClick={() => setIsBatchTagModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E6E0D4] text-xs font-semibold text-[#666660] hover:bg-[#FAF8F5]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchTag}
                className="px-4 py-2 rounded-xl bg-[#1F3A26] text-white text-xs font-bold hover:bg-[#162B1C]"
              >
                Ajouter la balise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE : ACTIVER LE SUIVI DE STOCK EN LOT (Prompt 17) */}
      {/* ======================================================== */}
      {isBatchStockTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111111]">
                  Activer le suivi de stock ?
                </h3>
                <p className="text-xs text-[#7A7A7A]">
                  {selectedProductIds.length} produit(s) sélectionné(s)
                </p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Avertissement :</strong> Activer le suivi de stock oblige Kelio à décompter les pièces physiques disponibles. Les produits sélectionnés dont le stock n'est pas encore renseigné seront initialisés à 0 et pourront apparaître en rupture tant qu'un réapprovisionnement n'aura pas été saisi.
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6E0D4]">
              <button
                type="button"
                onClick={() => setIsBatchStockTrackModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E6E0D4] text-xs font-semibold text-[#666660] hover:bg-[#FAF8F5]"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-confirm-enable-stock"
                onClick={handleConfirmBatchEnableStock}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
              >
                Confirmer l'activation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE : SUPPRESSION DÉFINITIVE D'UN PRODUIT (Prompt 14-B) */}
      {/* ======================================================== */}
      {hardDeleteTarget && (
        <div
          id="modal-hard-delete"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
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

            {(() => {
              const pendingCount = getPendingOrdersCountForProduct(storeSlug, hardDeleteTarget.id);
              if (pendingCount > 0) {
                return (
                  <div className="p-3.5 rounded-2xl bg-rose-100 border border-rose-300 text-xs text-rose-900 space-y-2">
                    <div className="font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>Suppression impossible : commandes en cours</span>
                    </div>
                    <p className="leading-relaxed">
                      Impossible de supprimer : <strong>{pendingCount} commande(s) en cours</strong> contiennent ce produit.
                    </p>
                  </div>
                );
              }
              return (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-semibold leading-relaxed">
                      Cette action est <strong>irréversible</strong>. Le slug « {hardDeleteTarget.slug} » sera immédiatement libéré.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-bold text-[#111111]">
                      Pour confirmer, tapez le nom du produit ou « SUPPRIMER » :
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
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E6E0D4] bg-white text-[#111111] focus:outline-none focus:border-rose-600 font-mono"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-950">Vider la corbeille ?</h3>
                <p className="text-xs text-rose-800">{viewCounts.trash} produit(s) concerné(s)</p>
              </div>
            </div>

            <p className="text-xs text-[#666660] leading-relaxed">
              Tous les produits actuellement dans la corbeille seront définitivement effacés. Leurs slugs seront libérés.
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

      {/* Modale de rapport de synchronisation Supabase (Prompt 17-O) */}
      {isSyncModalOpen && syncReport && (
        <div
          data-testid="sync-report-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-3xl border border-[#E6E0D4] shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#111111]">Synchronisation Supabase</h3>
                  <p className="text-[11px] text-[#7A7A7A]">Rapport d'enregistrement en base de données</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-[#7A7A7A] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-0.5">
                <span className="text-[10px] font-bold text-[#7A7A7A] uppercase">Total analysé</span>
                <p className="text-xl font-black text-[#111111]">{syncReport.total_received}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Insérés en base</span>
                <p className="text-xl font-black text-emerald-700">{syncReport.synced_count}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200/80 space-y-0.5">
                <span className="text-[10px] font-bold text-blue-800 uppercase">Déjà en base</span>
                <p className="text-xl font-black text-blue-700">{syncReport.existing_count}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 space-y-0.5">
                <span className="text-[10px] font-bold text-rose-800 uppercase">Erreurs</span>
                <p className="text-xl font-black text-rose-700">{syncReport.error_count}</p>
              </div>
            </div>

            {syncReport.errors && syncReport.errors.length > 0 && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
                <p className="font-bold">Détails des erreurs :</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {syncReport.errors.slice(0, 3).map((err: any, i: number) => (
                    <li key={i}>{err.title}: {err.error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-[11px] text-amber-900 leading-snug">
              Vos produits sont désormais enregistrés de manière permanente dans la base Supabase et visibles en vitrine publique. Vos données locales restent intactes dans votre navigateur.
            </div>

            <button
              type="button"
              onClick={() => setIsSyncModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#1F3A26] text-white text-xs font-bold hover:bg-[#162B1C] transition-colors"
            >
              Fermer le rapport
            </button>
          </div>
        </div>
      )}

      {/* Modale d'importation CSV */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        storeSlug={storeSlug}
        activeRole={activeRole}
        existingProducts={products}
        onImportSuccess={(imported) => {
          setIsImportModalOpen(false);
          const count = Array.isArray(imported) ? imported.length : imported;
          setProducts(getShopProductsRaw(storeSlug));
          showToast(`${count} produit(s) importé(s) avec succès !`);
        }}
      />

      {/* Modale d'aperçu client iPhone 15 Pro Max par défaut (Prompt 17-M) */}
      <ClientPreviewModal
        isOpen={isClientPreviewOpen}
        onClose={() => setIsClientPreviewOpen(false)}
        storeSlug={storeSlug}
        initialPath={`/boutique/${storeSlug}`}
        modalTitle="Afficher en tant que client"
      />
    </div>
  );
}
