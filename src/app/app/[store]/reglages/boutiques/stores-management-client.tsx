"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Copy,
  Archive,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Check,
  AlertTriangle,
  ArrowRight,
  Lock,
  Clock,
  RotateCcw,
  CheckCircle2,
  X,
  Search,
  Store as StoreIcon,
  Eye,
  Pencil,
  Globe2,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { Store, UserRole, USER_ROLE_LABELS } from "@/server/data/types";
import { useApp } from "@/components/layout/app-shell";
import { CountryFlag } from "@/components/ui/country-flag";
import { CreateStoreModal } from "@/components/app/create-store-modal";
import { EditStoreDrawer } from "@/components/app/edit-store-drawer";
import { AFRICAN_COUNTRIES_54 } from "@/server/data/african-countries";
import { canEditStore, canDeleteStore } from "@/config/permissions";
import { formatFcfa } from "@/lib/money";
import { cn } from "@/lib/utils";

interface StoresManagementClientProps {
  storeSlug: string;
}

export interface StoreItem extends Store {
  status: "active" | "archived" | "pending_deletion";
  deletionDate?: string;
  orderCount?: number;
  productCount?: number;
  todayOrders?: number;
  deliveredOrders?: number;
  deliveredRevenue?: number;
  description?: string;
  contactEmail?: string;
  logo?: string;
  version?: number;
}

export function StoresManagementClient({ storeSlug }: StoresManagementClientProps) {
  const router = useRouter();
  const { activeStore, setActiveStore, activeRole, stores, openCreateStoreModal } = useApp();

  // Plafond technique réglable par variable d'environnement (Prompt 19)
  const maxShopsLimit = parseInt(process.env.NEXT_PUBLIC_MAX_SHOPS_LIMIT || "20", 10);

  // Vue synthétique propriétaire vs cartes individuelles
  const [viewMode, setViewMode] = useState<"cards" | "owner_overview">("cards");

  // Liste des boutiques synchronisée avec le magasin serveur
  const [storeList, setStoreList] = useState<StoreItem[]>(() => {
    return stores.map((s) => ({
      ...s,
      status: "active",
      orderCount: 0,
      productCount: 0,
      todayOrders: 0,
      deliveredOrders: 0,
      deliveredRevenue: 0,
      description: "",
      contactEmail: "",
      version: 1,
    }));
  });

  // Hydratation depuis l'API serveur
  useEffect(() => {
    fetch("/api/stores")
      .then((res) => res.json())
      .then((data) => {
        if (data.stores && Array.isArray(data.stores) && data.stores.length > 0) {
          setStoreList(data.stores);
        }
      })
      .catch(() => { });
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "archived">("all");

  // Panneau latéral d'édition (Prompt 05-M)
  const [editingStore, setEditingStore] = useState<StoreItem | null>(null);

  // Modales
  const [duplicateTarget, setDuplicateTarget] = useState<StoreItem | null>(null);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicateCountry, setDuplicateCountry] = useState("CI");

  const [archiveTarget, setArchiveTarget] = useState<StoreItem | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<StoreItem | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // VÉRIFICATION DES RÔLES : closer et rider sont interdits (403)
  const isAuthorized = activeRole === "owner" || activeRole === "admin";

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="p-8 rounded-3xl bg-white border border-rose-200 shadow-sm space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-700">
              403 · Accès Refusé
            </span>
            <h1 className="text-xl font-black text-[#111111] mt-2">
              Gestion des boutiques non autorisée
            </h1>
            <p className="text-sm text-[#666660] mt-1 max-w-md mx-auto">
              Votre rôle actuel (<strong>{USER_ROLE_LABELS[activeRole]}</strong>) ne vous permet pas de consulter ni de modifier la structure des boutiques de l'organisation.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href={`/app/${storeSlug}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-colors"
            >
              <span>Retour au tableau de bord</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtrage
  const filteredStores = storeList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.countryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Action : Mise à jour depuis le Drawer
  const handleStoreUpdated = (updatedStore: StoreItem) => {
    setStoreList((prev) =>
      prev.map((s) => (s.id === updatedStore.id ? { ...s, ...updatedStore } : s))
    );
    if (activeStore.id === updatedStore.id) {
      setActiveStore({ ...activeStore, ...updatedStore });
    }
    showNotification(`Boutique "${updatedStore.name}" mise à jour avec succès.`);
  };

  // Action : Dupliquer
  const handleStartDuplicate = (store: StoreItem) => {
    setDuplicateTarget(store);
    setDuplicateName(`${store.name} (Copie)`);
    setDuplicateCountry(store.country === "TG" ? "CI" : "TG");
  };

  const handleConfirmDuplicate = () => {
    if (!duplicateTarget) return;
    const countryObj = AFRICAN_COUNTRIES_54.find((c) => c.code === duplicateCountry);
    const newSlug = duplicateName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const newStore: StoreItem = {
      id: `store_${duplicateCountry.toLowerCase()}_${Date.now()}`,
      name: duplicateName,
      slug: newSlug || `store-${Date.now()}`,
      country: duplicateCountry,
      countryName: countryObj?.name || duplicateCountry,
      flag: countryObj?.flag || "🌍",
      currency: countryObj?.officialCurrency || "XOF",
      whatsappNumber: duplicateTarget.whatsappNumber,
      role: "owner",
      status: "active",
      orderCount: 0,
      productCount: duplicateTarget.productCount,
      version: 1,
    };

    setStoreList((prev) => [newStore, ...prev]);
    setDuplicateTarget(null);
    showNotification(`Boutique "${duplicateName}" dupliquée avec succès avec ses produits et grilles.`);
  };

  // Action : Archiver / Désarchiver
  const handleToggleArchive = (targetStore?: StoreItem) => {
    const target = targetStore || archiveTarget;
    if (!target) return;
    const newStatus = target.status === "archived" ? "active" : "archived";
    setStoreList((prev) =>
      prev.map((s) => (s.id === target.id ? { ...s, status: newStatus } : s))
    );
    const actionText = newStatus === "archived" ? "archivée" : "réactivée";
    setArchiveTarget(null);
    if (editingStore?.id === target.id) {
      setEditingStore((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    showNotification(`La boutique "${target.name}" a été ${actionText}.`);
  };

  // Action : Supprimer (Prompt 05-M : propriétaire uniquement, confirmation nom exact, délai de grâce 30 jours si commandes)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (!canDeleteStore(activeRole)) {
      setDeleteError("Action réservée au propriétaire de l'organisation.");
      return;
    }

    if (deleteConfirmName.trim() !== deleteTarget.name.trim()) {
      setDeleteError("Le nom saisi ne correspond pas exactement au nom de la boutique.");
      return;
    }

    if (!deletePassword || deletePassword.length < 4) {
      setDeleteError("Veuillez saisir votre mot de passe pour confirmer cette opération de haute sécurité.");
      return;
    }

    const hasOrders = (deleteTarget.orderCount ?? 0) > 0;

    try {
      const res = await fetch(`/api/stores/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userRole: activeRole,
          confirmName: deleteConfirmName.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setDeleteError(errData.error || "Impossible de supprimer la boutique.");
        return;
      }

      if (hasOrders) {
        // Période de grâce de 30 jours avant suppression définitive
        const deletionDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toLocaleDateString("fr-FR");
        setStoreList((prev) =>
          prev.map((s) =>
            s.id === deleteTarget.id
              ? { ...s, status: "pending_deletion", deletionDate }
              : s
          )
        );
        showNotification(
          `Boutique "${deleteTarget.name}" placée en corbeille sécurisée avec délai de grâce de 30 jours.`
        );
      } else {
        // Suppression immédiate si 0 commande
        setStoreList((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        showNotification(`Boutique "${deleteTarget.name}" supprimée définitivement.`);
      }

      setDeleteTarget(null);
      setDeleteConfirmName("");
      setDeletePassword("");
      setDeleteError("");
    } catch {
      setDeleteError("Erreur lors de la communication avec le serveur.");
    }
  };

  // Annuler la suppression différée
  const handleCancelDeletion = (storeId: string) => {
    setStoreList((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, status: "active", deletionDate: undefined } : s))
    );
    showNotification("Suppression annulée. La boutique a été restaurée à l'état actif.");
  };

  const activeCount = storeList.filter((s) => s.status === "active").length;
  const archivedCount = storeList.filter((s) => s.status === "archived").length;

  return (
    <div className="space-y-6">
      {/* Toast de notification de succès */}
      {successMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#111111] text-[#FAF8F5] text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 border border-white/10"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* En-tête de page standardisé */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-[#666660] font-medium mb-1">
            <Link href={`/app/${storeSlug}/reglages`} className="hover:text-[#111111] transition-colors">
              Réglages
            </Link>
            <span>›</span>
            <span className="text-[#111111] font-bold">Boutiques</span>
          </nav>
          <h1 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
            Gérer mes boutiques
          </h1>
          <p className="text-xs sm:text-sm text-[#666660] mt-0.5">
            Configurez vos boutiques COD multi-pays, dupliquez vers de nouveaux territoires ou archivez vos opérations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {storeList.length >= maxShopsLimit ? (
            <div className="text-right">
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl">
                Plafond atteint ({maxShopsLimit} boutiques)
              </span>
            </div>
          ) : (
            <button
              type="button"
              id="btn-create-store-management"
              onClick={openCreateStoreModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>+ Créer une boutique</span>
            </button>
          )}
        </div>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
          <p className="text-[10px] font-bold text-[#666660] uppercase tracking-wider">Total Boutiques</p>
          <p className="text-2xl font-black text-[#111111] mt-1">{storeList.length}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
          <p className="text-[10px] font-bold text-[#666660] uppercase tracking-wider">Actives</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
          <p className="text-[10px] font-bold text-[#666660] uppercase tracking-wider">Archivées</p>
          <p className="text-2xl font-black text-[#666660] mt-1">{archivedCount}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
          <p className="text-[10px] font-bold text-[#666660] uppercase tracking-wider">Pays Desservis</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {Array.from(new Set(storeList.map((s) => s.country))).map((c) => (
              <CountryFlag key={c} code={c} width={24} height={16} />
            ))}
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888880]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, pays ou identifiant..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-black/[0.08] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-black/15 transition-all placeholder:text-[#888880]"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {(
            [
              { id: "all", label: "Toutes" },
              { id: "active", label: "Actives" },
              { id: "archived", label: "Archivées" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer",
                filterStatus === tab.id
                  ? "bg-[#111111] text-[#FAF8F5]"
                  : "bg-[#FAF8F5] text-[#666660] hover:text-[#111111]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sélecteur de vue : Cartes vs Synthèse Propriétaire (Prompt 19) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-black/10">
          <button
            type="button"
            id="tab-view-cards"
            onClick={() => setViewMode("cards")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer",
              viewMode === "cards" ? "bg-white text-[#111111] shadow-2xs" : "text-[#666660] hover:text-[#111111]"
            )}
          >
            Vue Cartes
          </button>
          <button
            type="button"
            id="tab-view-owner"
            onClick={() => setViewMode("owner_overview")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer",
              viewMode === "owner_overview" ? "bg-white text-[#111111] shadow-2xs" : "text-[#666660] hover:text-[#111111]"
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Vue « Toutes les boutiques » (Propriétaire)</span>
          </button>
        </div>
      </div>

      {viewMode === "owner_overview" ? (
        /* Tableau de synthèse Propriétaire (Prompt 19) */
        <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#111111] flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#C2410C]" />
              <span>Tableau de bord global des boutiques</span>
            </h2>
            <span className="text-xs text-[#666660]">Commandes du jour, livrées & Chiffre d'affaires livré</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-black/[0.08] rounded-xl overflow-hidden">
              <thead className="bg-[#FAF8F5] text-[#666660] font-bold text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Boutique</th>
                  <th className="p-3">Pays & Devise</th>
                  <th className="p-3 text-right">Commandes du jour</th>
                  <th className="p-3 text-right">Commandes livrées</th>
                  <th className="p-3 text-right">CA livré</th>
                  <th className="p-3">Domaines</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.08]">
                {filteredStores.map((s) => (
                  <tr key={s.id} className="hover:bg-black/[0.02]">
                    <td className="p-3 font-bold text-[#111111]">
                      <div className="flex items-center gap-2">
                        <CountryFlag code={s.country} width={20} height={14} />
                        <span>{s.name}</span>
                        {s.id === activeStore.id && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#111111] text-white">Active</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-[#666660]">{s.countryName} · {s.currency}</td>
                    <td className="p-3 text-right font-black text-[#111111]">{s.todayOrders ?? 0}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">{s.deliveredOrders ?? 0}</td>
                    <td className="p-3 text-right font-black text-[#111111]">
                      {formatFcfa(s.deliveredRevenue ?? 0)}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/app/${s.slug}/reglages/domaines`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        <Globe2 className="h-3 w-3" />
                        <span>Gérer DNS</span>
                      </Link>
                    </td>
                    <td className="p-3 text-right">
                      {s.id !== activeStore.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveStore(s);
                            router.push(`/app/${s.slug}`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-black/10 text-[11px] font-bold hover:bg-black/5"
                        >
                          Basculer
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#888880] italic">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Liste des boutiques */
        <div className="space-y-3">
          {filteredStores.map((store) => {
            const isCurrentActive = store.id === activeStore.id;
            const isPendingDelete = store.status === "pending_deletion";
            const isArchived = store.status === "archived";
            const canEdit = canEditStore(activeRole);
            const canDelete = canDeleteStore(activeRole);

            return (
              <div
                key={store.id}
                className={cn(
                  "p-4 rounded-2xl border bg-white transition-all shadow-2xs",
                  isCurrentActive
                    ? "border-[#111111] ring-1 ring-[#111111]/15"
                    : isPendingDelete
                      ? "border-rose-300 bg-rose-50/30"
                      : "border-black/[0.08] hover:border-black/20"
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Informations de base */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="h-11 w-11 rounded-xl bg-[#FAF8F5] border border-black/[0.08] flex items-center justify-center shrink-0">
                      <CountryFlag code={store.country} width={28} height={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Clic sur le nom de la boutique ouvre le tiroir Modifier (Prompt 05-M) */}
                        {canEdit ? (
                          <button
                            type="button"
                            id={`link-edit-store-${store.slug}`}
                            onClick={() => setEditingStore(store)}
                            className="text-sm font-black text-[#111111] hover:underline text-left cursor-pointer truncate"
                            title="Cliquer pour modifier cette boutique"
                          >
                            {store.name}
                          </button>
                        ) : (
                          <h2 className="text-sm font-black text-[#111111] truncate">{store.name}</h2>
                        )}

                        {isCurrentActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#111111] text-[#FAF8F5]">
                            Boutique Active
                          </span>
                        )}
                        {isArchived && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/[0.06] text-[#666660]">
                            Archivée
                          </span>
                        )}
                        {isPendingDelete && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                            Suppression le {store.deletionDate}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#666660]">
                        <span className="font-semibold text-[#111111]">
                          {store.countryName} · {store.currency}
                        </span>
                        <span>·</span>
                        <span className="font-mono text-[11px] text-[#888880]">/boutique/{store.slug}</span>
                        <span>·</span>
                        <span>WhatsApp : {store.whatsappNumber}</span>
                        <span>·</span>
                        <span>{store.productCount ?? 0} produits</span>
                        <span>·</span>
                        <span>{store.orderCount ?? 0} commandes</span>
                      </div>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* ACTIONS CONTEXTUELLES DE LA CARTE DE BOUTIQUE            */}
                  {/* ORDRE FINAL STRICT (Prompt 05-M) :                       */}
                  {/* 1. Basculer ici                                          */}
                  {/* 2. Aperçu (œil)                                          */}
                  {/* 3. Modifier                                              */}
                  {/* 4. Dupliquer                                             */}
                  {/* 5. Archiver                                              */}
                  {/* 6. Supprimer                                             */}
                  {/* ======================================================== */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-black/[0.06]">
                    {/* 1. Basculer ici (si non active) */}
                    {!isCurrentActive && !isPendingDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveStore(store);
                          router.push(`/app/${store.slug}`);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-black/[0.1] bg-[#FAF8F5] hover:bg-black/[0.05] text-xs font-bold text-[#111111] transition-colors cursor-pointer"
                      >
                        Basculer ici
                      </button>
                    )}

                    {/* 2. Aperçu (œil) */}
                    <a
                      id={`btn-store-preview-${store.slug}`}
                      href={`/boutique/${store.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={store.status === "active" ? "Voir la boutique" : "Aperçu de la boutique (non publiée)"}
                      aria-label={`Voir la boutique ${store.name} (s'ouvre dans un nouvel onglet)`}
                      className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl border border-black/[0.08] hover:border-black/20 text-[#666660] hover:text-[#111111] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                    >
                      <Eye className="h-4 w-4" />
                    </a>

                    {/* 2b. Domaines & DNS (Prompt 19) */}
                    <Link
                      href={`/app/${store.slug}/reglages/domaines`}
                      title="Gérer les domaines et DNS"
                      className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl border border-black/[0.08] hover:border-black/20 text-[#666660] hover:text-[#111111] transition-colors"
                    >
                      <Globe2 className="h-4 w-4" />
                    </Link>

                    {/* 3. Modifier (icône crayon + texte) - Réservé aux rôles autorisés */}
                    {canEdit && (
                      <button
                        type="button"
                        id={`btn-edit-store-${store.slug}`}
                        onClick={() => setEditingStore(store)}
                        title="Modifier les paramètres de la boutique"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] hover:border-black/20 text-xs font-semibold text-[#111111] hover:bg-black/[0.03] transition-colors cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5 text-[#666660]" />
                        <span>Modifier</span>
                      </button>
                    )}

                    {/* 4. Dupliquer */}
                    <button
                      type="button"
                      id={`btn-duplicate-store-${store.slug}`}
                      onClick={() => handleStartDuplicate(store)}
                      title="Dupliquer vers un autre pays ou nouvelle marque"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] hover:border-black/20 text-xs font-semibold text-[#111111] hover:bg-black/[0.03] transition-colors cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5 text-[#666660]" />
                      <span>Dupliquer</span>
                    </button>

                    {/* 5. Archiver / Désarchiver */}
                    <button
                      type="button"
                      id={`btn-archive-store-${store.slug}`}
                      onClick={() => setArchiveTarget(store)}
                      title={isArchived ? "Réactiver cette boutique" : "Archiver cette boutique"}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] hover:border-black/20 text-xs font-semibold text-[#666660] hover:text-[#111111] hover:bg-black/[0.03] transition-colors cursor-pointer"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      <span>{isArchived ? "Réactiver" : "Archiver"}</span>
                    </button>

                    {/* 6. Supprimer ou Annuler suppression - Réservé au Propriétaire (Prompt 05-M) */}
                    {isPendingDelete ? (
                      <button
                        type="button"
                        onClick={() => handleCancelDeletion(store.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Annuler la suppression</span>
                      </button>
                    ) : (
                      canDelete && (
                        <button
                          type="button"
                          id={`btn-delete-store-${store.slug}`}
                          onClick={() => {
                            setDeleteTarget(store);
                            setDeleteConfirmName("");
                            setDeletePassword("");
                            setDeleteError("");
                          }}
                          title="Supprimer la boutique (action propriétaire)"
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredStores.length === 0 && (
            <div className="p-8 text-center rounded-2xl bg-white border border-black/[0.08] text-xs text-[#666660]">
              Aucune boutique ne correspond à votre recherche.
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TIROIR LATÉRAL DE MODIFICATION (DRAWER PROMPT 05-M)     */}
      {/* ======================================================== */}
      <EditStoreDrawer
        isOpen={!!editingStore}
        store={editingStore}
        userRole={activeRole}
        onClose={() => setEditingStore(null)}
        onStoreUpdated={handleStoreUpdated}
        onDuplicateRequest={(s) => {
          setEditingStore(null);
          handleStartDuplicate(s);
        }}
        onRestoreRequest={(s) => {
          handleToggleArchive(s);
        }}
      />

      {/* ======================================================== */}
      {/* MODALE DE DUPLICATION                                    */}
      {/* ======================================================== */}
      {duplicateTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-[#FAF8F5] border border-black/10 p-6 shadow-2xl text-[#111111] space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-black/[0.06] text-[#111111] flex items-center justify-center">
                  <Copy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Dupliquer la boutique</h3>
                  <p className="text-xs text-[#666660]">
                    Source : <strong>{duplicateTarget.name}</strong> ({duplicateTarget.countryName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDuplicateTarget(null)}
                className="p-1 rounded-lg text-[#888880] hover:text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] text-xs space-y-2">
              <span className="font-bold text-[#111111] block">Éléments dupliqués automatiquement :</span>
              <ul className="space-y-1 text-[#666660] list-disc list-inside">
                <li>Catalogue complet des {duplicateTarget.productCount ?? 0} produits (en statut brouillon)</li>
                <li>Grilles de tarifs de livraison ajustées à la devise cible</li>
                <li>Modèles de relances et de confirmation WhatsApp</li>
                <li>Palette de thème, polices et bannières promotionnelles</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Nouveau nom de boutique
                </label>
                <input
                  type="text"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/15 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Pays cible d'implantation
                </label>
                <select
                  value={duplicateCountry}
                  onChange={(e) => setDuplicateCountry(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/15 font-bold"
                >
                  {AFRICAN_COUNTRIES_54.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.officialCurrency})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.08]">
              <button
                type="button"
                onClick={() => setDuplicateTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#666660] hover:text-[#111111] hover:bg-black/[0.04]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDuplicate}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#111111] text-[#FAF8F5] hover:bg-black shadow-xs cursor-pointer"
              >
                Confirmer la duplication
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE D'ARCHIVAGE                                       */}
      {/* ======================================================== */}
      {archiveTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md rounded-3xl bg-[#FAF8F5] border border-black/10 p-6 shadow-2xl text-[#111111] space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Archive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight">
                  {archiveTarget.status === "archived" ? "Réactiver la boutique ?" : "Archiver la boutique ?"}
                </h3>
                <p className="text-xs text-[#666660]">{archiveTarget.name}</p>
              </div>
            </div>

            <p className="text-xs text-[#666660] leading-relaxed">
              {archiveTarget.status === "archived"
                ? "La boutique sera de nouveau accessible au public et acceptera les commandes COD. Les paramètres précédents seront immédiatement restaurés."
                : "La vitrine en ligne sera mise en veille et ne recevra plus de commandes. Toutes les commandes antérieures, statistiques et données financières restent consultables dans votre compte."}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.08]">
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#666660] hover:text-[#111111] hover:bg-black/[0.04]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleToggleArchive()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#111111] text-[#FAF8F5] hover:bg-black shadow-xs cursor-pointer"
              >
                {archiveTarget.status === "archived" ? "Réactiver la boutique" : "Confirmer l'archivage"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE DE SUPPRESSION DE HAUTE SÉCURITÉ                   */}
      {/* ======================================================== */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Suppression sécurisée de boutique"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-[#FAF8F5] border border-rose-300 p-6 shadow-2xl text-[#111111] space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-rose-900">
                    Suppression sécurisée de boutique
                  </h3>
                  <p className="text-xs text-rose-700">
                    {(deleteTarget.orderCount ?? 0) > 0
                      ? "Période de grâce de 30 jours (commandes existantes)"
                      : "Suppression définitive immédiate (0 commande)"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="p-1 rounded-lg text-[#888880] hover:text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Avertissement & recommandation d'archivage (Prompt 05-M) */}
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Attention : Cette action est irréversible après la période de grâce.</p>
                  {(deleteTarget.orderCount ?? 0) > 0 ? (
                    <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">
                      Cette boutique compte <strong>{deleteTarget.orderCount} commandes</strong>. Conformément aux règles de sécurité, elle sera placée dans la corbeille pendant <strong>30 jours</strong> avant purge définitive de ses données comptables et fiscales.
                    </p>
                  ) : (
                    <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">
                      Cette boutique ne possède aucune commande. La suppression sera effective immédiatement après confirmation.
                    </p>
                  )}
                </div>
              </div>

              {(deleteTarget.orderCount ?? 0) > 0 && (
                <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-rose-900 font-semibold">
                    Vous souhaitez seulement suspendre les ventes ?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const t = deleteTarget;
                      setDeleteTarget(null);
                      setArchiveTarget(t);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-900 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    Préférer archiver
                  </button>
                </div>
              )}
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-[11px] font-bold text-rose-800">
                {deleteError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  1. Saisissez exactement le nom de la boutique pour confirmer :{" "}
                  <span className="font-mono text-rose-700 select-all font-black">{deleteTarget.name}</span>
                </label>
                <input
                  type="text"
                  id="input-delete-store-confirm-name"
                  value={deleteConfirmName}
                  onChange={(e) => {
                    setDeleteConfirmName(e.target.value);
                    setDeleteError("");
                  }}
                  placeholder={deleteTarget.name}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  2. Mot de passe de votre compte propriétaire (ré-authentification requise)
                </label>
                <input
                  type="password"
                  id="input-delete-store-password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError("");
                  }}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.08]">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#666660] hover:text-[#111111] hover:bg-black/[0.04]"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-confirm-delete-store"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmName !== deleteTarget.name || !deletePassword}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs",
                  deleteConfirmName === deleteTarget.name && deletePassword
                    ? "bg-rose-600 hover:bg-rose-700 cursor-pointer"
                    : "bg-rose-300 cursor-not-allowed opacity-60"
                )}
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
