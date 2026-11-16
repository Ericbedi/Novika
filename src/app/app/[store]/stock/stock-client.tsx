"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  RotateCcw,
  History,
  Package,
  TrendingUp,
  Clock,
  Truck,
  ArrowRight,
  ShoppingCart,
  Filter,
  MapPin,
  Check,
  X,
  FileText,
  AlertCircle,
} from "lucide-react";
import { MOCK_PRODUCTS } from "@/mock-data/products";
import {
  MOCK_STOCK_LEVELS,
  MOCK_STOCK_ADJUSTMENTS,
  MOCK_REORDER_ITEMS,
  calculateAvailableStock,
  calculateDaysOfStock,
  calculateReorderPoint,
  calculateSuggestedQuantity,
} from "@/mock-data/stock";
import { MOCK_SUPPLIERS } from "@/mock-data/suppliers";
import { StockLevel, StockAdjustment, ReorderItem, Product } from "@/server/data/types";
import { formatFcfa } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/layout/app-shell";
import { ProductsNavTabs } from "@/components/products/products-nav-tabs";

interface StockClientProps {
  storeSlug: string;
}

export function StockClient({ storeSlug }: StockClientProps) {
  const router = useRouter();
  const { activeRole } = useApp();
  const isCloser = activeRole === "closer";

  // Tabs
  const [activeTab, setActiveTab] = useState<"levels" | "reorder" | "history">("levels");

  // Velocity period selector: 7, 14, 30 days
  const [velocityPeriod, setVelocityPeriod] = useState<"7" | "14" | "30">("30");

  // Stock levels state
  const [stockLevels, setStockLevels] = useState<StockLevel[]>(MOCK_STOCK_LEVELS);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(MOCK_STOCK_ADJUSTMENTS);
  const [reorderItems, setReorderItems] = useState<ReorderItem[]>(MOCK_REORDER_ITEMS);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");

  // Manual Adjustment Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedStockLevel, setSelectedStockLevel] = useState<StockLevel | null>(null);
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
  const [adjustQuantity, setAdjustQuantity] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<
    "purchase_receipt" | "delivery" | "customer_return" | "correction" | "damage" | "loss" | "physical_sale"
  >("correction");
  const [adjustNote, setAdjustNote] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Locations list
  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(stockLevels.map((s) => s.location)));
  }, [stockLevels]);

  // Filtered stock levels
  const filteredLevels = useMemo(() => {
    return stockLevels.filter((stk) => {
      const matchSearch =
        searchQuery === "" ||
        stk.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (stk.variantName && stk.variantName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        stk.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stk.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchLocation = locationFilter === "all" || stk.location === locationFilter;
      const matchStatus = statusFilter === "all" || stk.status === statusFilter;

      return matchSearch && matchLocation && matchStatus;
    });
  }, [stockLevels, searchQuery, locationFilter, statusFilter]);

  // Overall KPIs
  const totalPhysical = stockLevels.reduce((sum, s) => sum + s.physicalStock, 0);
  const totalReserved = stockLevels.reduce((sum, s) => sum + s.reservedStock, 0);
  const totalAvailable = stockLevels.reduce((sum, s) => sum + s.availableStock, 0);
  const totalInTransit = stockLevels.reduce((sum, s) => sum + s.inTransitStock, 0);
  const lowStockCount = stockLevels.filter((s) => s.status === "low_stock").length;
  const outOfStockCount = stockLevels.filter((s) => s.status === "out_of_stock").length;

  // Open adjustment modal
  const handleOpenAdjust = (stk: StockLevel) => {
    setSelectedStockLevel(stk);
    setAdjustType("add");
    setAdjustQuantity(10);
    setAdjustReason("correction");
    setAdjustNote("");
    setIsAdjustModalOpen(true);
  };

  // Submit manual adjustment
  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockLevel || adjustQuantity <= 0) return;

    const delta = adjustType === "add" ? adjustQuantity : -adjustQuantity;
    const newPhysical = Math.max(0, selectedStockLevel.physicalStock + delta);
    const newAvailable = calculateAvailableStock(newPhysical, selectedStockLevel.reservedStock);
    const newDays = calculateDaysOfStock(newAvailable, selectedStockLevel.salesVelocity);
    const newStatus = newAvailable === 0 ? "out_of_stock" : newAvailable <= 10 ? "low_stock" : "in_stock";

    // Update stock levels
    setStockLevels((prev) =>
      prev.map((s) =>
        s.id === selectedStockLevel.id
          ? {
              ...s,
              physicalStock: newPhysical,
              availableStock: newAvailable,
              daysOfStock: newDays,
              status: newStatus,
            }
          : s
      )
    );

    // Add to movement history
    const reasonLabels: Record<string, string> = {
      purchase_receipt: "Réception bon d'achat fournisseur",
      delivery: "Décrément suite livraison client confirmée",
      customer_return: "Retour client accepté après contrôle qualité",
      correction: "Ajustement inventaire manuel",
      damage: "Casse ou détérioration magasin",
      loss: "Perte / Écart d'inventaire",
      physical_sale: "Vente directe au comptoir",
    };

    const newMovement: StockAdjustment = {
      id: `adj_${Date.now()}`,
      productId: selectedStockLevel.productId,
      productName: selectedStockLevel.productName,
      variantId: selectedStockLevel.variantId,
      variantName: selectedStockLevel.variantName,
      delta,
      previousStock: selectedStockLevel.physicalStock,
      newStock: newPhysical,
      reason: adjustReason,
      reasonLabel: `${reasonLabels[adjustReason]} ${adjustNote ? `(${adjustNote})` : ""}`,
      date: new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      author: isCloser ? "Closeuse" : "Promises Bedi",
    };

    setAdjustments((prev) => [newMovement, ...prev]);
    setIsAdjustModalOpen(false);
    showToast(`Stock de "${selectedStockLevel.productName}" mis à jour (${delta > 0 ? `+${delta}` : delta})`);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Navigation 5 Onglets */}
      <ProductsNavTabs storeSlug={storeSlug} />

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
              Logistique & Entrepôts
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#111111]/[0.05] text-[#111111]">
              {stockLevels.length} lignes d'inventaire
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Gestion du Stock
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Suivi en temps réel : Physique, Réservé, Disponible, En transit et calculs automatiques de réapprovisionnement.
          </p>
        </div>

        {/* Sélecteur de période de vélocité */}
        <div className="flex items-center gap-2 bg-[#FAF8F5] p-1.5 rounded-xl border border-black/[0.08]">
          <span className="text-[11px] font-bold text-[#666660] px-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Vélocité :
          </span>
          {(["7", "14", "30"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setVelocityPeriod(p)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                velocityPeriod === p
                  ? "bg-[#111111] text-white shadow-xs"
                  : "text-[#666660] hover:text-[#111111]"
              )}
            >
              {p} jours
            </button>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* RÈGLES MÉTIER DU STOCK & RÉSUMÉ EN CHIFFRES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#888880] block">
            Stock Physique
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#111111]">{totalPhysical}</span>
            <span className="text-[10px] font-semibold text-[#888880]">en rayons</span>
          </div>
          <span className="text-[10px] text-[#888880] mt-1 block">
            Décrémenté lors de la livraison
          </span>
        </div>

        <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            Stock Réservé
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-900">{totalReserved}</span>
            <span className="text-[10px] font-semibold text-amber-700">programmées</span>
          </div>
          <span className="text-[10px] text-amber-700/80 mt-1 block">
            Commandes en cours de tournée
          </span>
        </div>

        <div className="rounded-[20px] border border-black/[0.08] bg-emerald-50/70 border-emerald-200/60 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
            Stock Disponible
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-950">{totalAvailable}</span>
            <span className="text-[10px] font-semibold text-emerald-800">à vendre</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
            = Physique − Réservé
          </span>
        </div>

        <div className="rounded-[20px] border border-black/[0.08] bg-blue-50/70 border-blue-200/60 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
            En Transit
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-950">{totalInTransit}</span>
            <span className="text-[10px] font-semibold text-blue-800">commandés</span>
          </div>
          <span className="text-[10px] text-blue-700 font-medium mt-1 block">
            Achats navire / coursier
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BLOC « À RENOUVELER » (RECOMMANDES URGENTES) */}
      {/* ======================================================== */}
      {reorderItems.length > 0 && (
        <div className="rounded-[24px] border-2 border-amber-300/80 bg-gradient-to-br from-amber-50/90 to-[#FAF8F5] p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-amber-950">
                    Articles prioritaires à renouveler
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    {reorderItems.length} alertes critiques
                  </span>
                </div>
                <p className="text-xs text-amber-900/80 mt-0.5">
                  Jours de stock restants &lt; Délai de réapprovisionnement fournisseur. Passez commande pour éviter l'épuisement des stocks.
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right text-[11px] font-bold text-amber-900/80 bg-white/70 px-3 py-1.5 rounded-xl border border-amber-200/70">
              Formule : Vitesse × (Délai + Couverture) − Dispo − Transit
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {reorderItems.map((item) => (
              <div
                key={item.productId}
                className="rounded-2xl border border-amber-200 bg-white p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-[#111111] line-clamp-1">
                      {item.productName}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap",
                        item.daysOfStock === 0
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-900"
                      )}
                    >
                      {item.daysOfStock === 0 ? "Rupture" : `${item.daysOfStock}j restants`}
                    </span>
                  </div>

                  <div className="mt-1 text-[11px] text-[#666660]">
                    Fournisseur : <span className="font-semibold text-[#111111]">{item.supplierName}</span> ({item.supplierLeadTimeDays}j délai)
                  </div>

                  <div className="mt-3 p-2.5 rounded-xl bg-[#F5F2EA] border border-black/[0.05] space-y-1 text-[11px]">
                    <div className="flex justify-between text-[#666660]">
                      <span>Vitesse actuelle :</span>
                      <span className="font-bold text-[#111111]">{item.salesVelocity} un./j</span>
                    </div>
                    <div className="flex justify-between text-[#666660]">
                      <span>Stock disponible :</span>
                      <span className="font-bold text-[#111111]">{item.availableStock} unités</span>
                    </div>
                    <div className="flex justify-between text-[#666660]">
                      <span>Point de commande :</span>
                      <span className="font-bold text-amber-800">{item.reorderPoint} unités</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-black/[0.06] text-xs font-bold text-[#111111]">
                      <span>Quantité conseillée :</span>
                      <span className="text-emerald-700 font-black text-sm">
                        {item.suggestedQuantity} unités
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/app/${storeSlug}/produits/achats?action=new&supplier=${item.supplierId}&product=${item.productId}&qty=${item.suggestedQuantity}`}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-colors shadow-xs"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Créer un bon de commande</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onglets secondaires : Niveaux de Stock vs Historique */}
      <div className="flex items-center gap-2 border-b border-black/[0.08] pb-2">
        <button
          onClick={() => setActiveTab("levels")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
            activeTab === "levels"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-[#FAF8F5] text-[#666660] hover:text-[#111111] border border-black/[0.06]"
          )}
        >
          <Boxes className="w-4 h-4" />
          <span>Inventaire par Lieu & Variante ({stockLevels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
            activeTab === "history"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-[#FAF8F5] text-[#666660] hover:text-[#111111] border border-black/[0.06]"
          )}
        >
          <History className="w-4 h-4" />
          <span>Historique des Mouvements ({adjustments.length})</span>
        </button>
      </div>

      {/* TAB 1 : TABLEAU DES NIVEAUX DE STOCK */}
      {activeTab === "levels" && (
        <div className="space-y-4">
          {/* Barre de filtres */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
              <input
                type="text"
                placeholder="Rechercher par article, variante, SKU ou entrepôt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filtre Lieu */}
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
              >
                <option value="all">Tous les lieux</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              {/* Filtre Statut */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
              >
                <option value="all">Tous les états</option>
                <option value="in_stock">En stock</option>
                <option value="low_stock">Stock bas (&lt; seuil)</option>
                <option value="out_of_stock">Rupture</option>
              </select>
            </div>
          </div>

          {/* Tableau détaillé */}
          <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.08] bg-black/[0.02] text-[10px] font-bold uppercase tracking-wider text-[#666660]">
                    <th className="py-3.5 pl-6 pr-3">Produit & Variante</th>
                    <th className="py-3.5 px-3">Lieu de Stock</th>
                    <th className="py-3.5 px-3">Physique</th>
                    <th className="py-3.5 px-3">Réservé</th>
                    <th className="py-3.5 px-3 font-black text-[#111111]">Disponible</th>
                    <th className="py-3.5 px-3">En Transit</th>
                    <th className="py-3.5 px-3">Jours Restants</th>
                    <th className="py-3.5 px-3">Statut</th>
                    <th className="py-3.5 pr-6 pl-3 text-right">Ajuster</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05] text-xs">
                  {filteredLevels.map((stk) => {
                    return (
                      <tr key={stk.id} className="hover:bg-black/[0.015] transition-colors group">
                        {/* Produit & Variante */}
                        <td className="py-3.5 pl-6 pr-3">
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-[#111111] block">
                              {stk.productName}
                            </span>
                            <span className="text-[10px] text-[#888880]">
                              {stk.variantName ? `${stk.variantName} · ` : ""}SKU: {stk.sku}
                            </span>
                          </div>
                        </td>

                        {/* Lieu */}
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#666660]">
                            <MapPin className="w-3.5 h-3.5 text-[#888880]" />
                            {stk.location}
                          </span>
                        </td>

                        {/* Physique */}
                        <td className="py-3.5 px-3 font-semibold text-[#111111]">
                          {stk.physicalStock}
                        </td>

                        {/* Réservé */}
                        <td className="py-3.5 px-3 text-amber-700 font-semibold">
                          {stk.reservedStock}
                        </td>

                        {/* Disponible = Physique - Réservé */}
                        <td className="py-3.5 px-3">
                          <span
                            className={cn(
                              "font-black text-sm",
                              stk.availableStock === 0
                                ? "text-rose-600"
                                : stk.availableStock <= 10
                                ? "text-amber-800"
                                : "text-emerald-700"
                            )}
                          >
                            {stk.availableStock}
                          </span>
                        </td>

                        {/* En transit */}
                        <td className="py-3.5 px-3">
                          {stk.inTransitStock > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700">
                              <Truck className="w-3.5 h-3.5" />
                              +{stk.inTransitStock}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#999990]">-</span>
                          )}
                        </td>

                        {/* Jours restants */}
                        <td className="py-3.5 px-3">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold",
                              stk.daysOfStock === 0
                                ? "bg-rose-100 text-rose-800"
                                : stk.daysOfStock < 7
                                ? "bg-amber-100 text-amber-900"
                                : "bg-emerald-100 text-emerald-900"
                            )}
                          >
                            {stk.daysOfStock} j
                          </span>
                        </td>

                        {/* Statut avec badge informatif "Réappro en cours" */}
                        <td className="py-3.5 px-3">
                          <div className="flex flex-col gap-1">
                            {stk.status === "in_stock" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                En stock
                              </span>
                            )}
                            {stk.status === "low_stock" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Stock bas
                              </span>
                            )}
                            {stk.status === "out_of_stock" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Rupture
                              </span>
                            )}
                            {stk.hasActivePO && (
                              <span
                                title="Un bon de commande est déjà commandé ou en cours d'expédition"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold"
                              >
                                <Truck className="w-2.5 h-2.5" />
                                Réappro en cours
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Bouton Ajuster */}
                        <td className="py-3.5 pr-6 pl-3 text-right">
                          <button
                            onClick={() => handleOpenAdjust(stk)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-black/[0.03] transition-colors cursor-pointer"
                          >
                            <span>Ajuster</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 : HISTORIQUE DES MOUVEMENTS */}
      {activeTab === "history" && (
        <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-black/[0.08] bg-black/[0.01]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#666660]">
              Journal d'audit des mouvements de stock
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/[0.08] bg-black/[0.02] text-[10px] font-bold uppercase tracking-wider text-[#666660]">
                  <th className="py-3.5 pl-6 pr-3">Date & Heure</th>
                  <th className="py-3.5 px-3">Article & Variante</th>
                  <th className="py-3.5 px-3">Variation</th>
                  <th className="py-3.5 px-3">Avant → Après</th>
                  <th className="py-3.5 px-3">Motif du mouvement</th>
                  <th className="py-3.5 pr-6 pl-3">Auteur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] text-xs">
                {adjustments.map((adj) => {
                  return (
                    <tr key={adj.id} className="hover:bg-black/[0.015] transition-colors">
                      <td className="py-3.5 pl-6 pr-3 font-mono text-[11px] text-[#666660]">
                        {adj.date}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-[#111111]">
                        {adj.productName}
                        {adj.variantName && (
                          <span className="text-[10px] text-[#888880] block">
                            {adj.variantName}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black",
                            adj.delta > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          )}
                        >
                          {adj.delta > 0 ? `+${adj.delta}` : adj.delta}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-[#666660] font-mono">
                        {adj.previousStock} → <span className="font-bold text-[#111111]">{adj.newStock}</span>
                      </td>
                      <td className="py-3.5 px-3 text-[#111111]">
                        {adj.reasonLabel}
                      </td>
                      <td className="py-3.5 pr-6 pl-3 text-[#666660] font-medium">
                        {adj.author}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE D'AJUSTEMENT MANUEL AVEC MOTIF OBLIGATOIRE */}
      {/* ======================================================== */}
      {isAdjustModalOpen && selectedStockLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
              <div>
                <h3 className="text-base font-black text-[#111111]">
                  Ajuster le stock
                </h3>
                <p className="text-xs text-[#666660] mt-0.5">
                  {selectedStockLevel.productName} ({selectedStockLevel.location})
                </p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded-lg text-[#888880] hover:text-[#111111] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="space-y-4 text-xs">
              {/* Type d'opération : Ajouter ou Retirer */}
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Type d'opération
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("add")}
                    className={cn(
                      "py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                      adjustType === "add"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white border border-black/[0.08] text-[#666660] hover:text-[#111111]"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Entrée (+ en stock)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("remove")}
                    className={cn(
                      "py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                      adjustType === "remove"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-white border border-black/[0.08] text-[#666660] hover:text-[#111111]"
                    )}
                  >
                    <Minus className="w-4 h-4" />
                    <span>Sortie (- du stock)</span>
                  </button>
                </div>
              </div>

              {/* Quantité */}
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Quantité d'unités à modifier <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-sm font-black text-[#111111] focus:outline-none focus:border-[#111111]"
                />
                <span className="text-[11px] text-[#888880] mt-1 block">
                  Stock actuel : {selectedStockLevel.physicalStock} unités → Nouveau stock :{" "}
                  <span className="font-bold text-[#111111]">
                    {adjustType === "add"
                      ? selectedStockLevel.physicalStock + adjustQuantity
                      : Math.max(0, selectedStockLevel.physicalStock - adjustQuantity)}
                  </span>
                </span>
              </div>

              {/* Motif OBLIGATOIRE */}
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Motif obligatoire de l'ajustement <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-black/[0.08] bg-white text-xs font-semibold text-[#111111] focus:outline-none"
                >
                  <option value="correction">Correction manuelle d'inventaire</option>
                  <option value="purchase_receipt">Réception d'achat fournisseur</option>
                  <option value="delivery">Livraison directe effectuée</option>
                  <option value="customer_return">Retour client accepté après contrôle</option>
                  <option value="damage">Casse / Produit détérioré</option>
                  <option value="loss">Perte ou vol constaté</option>
                  <option value="physical_sale">Vente directe showroom / foire</option>
                </select>
              </div>

              {/* Notes complémentaires */}
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Notes / Référence justificative
                </label>
                <input
                  type="text"
                  placeholder="Ex: N° Bon de livraison, litige transporteur..."
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] bg-white text-[#666660] font-semibold hover:bg-black/5 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#111111] text-white font-bold hover:bg-black transition-colors"
                >
                  Confirmer le mouvement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
