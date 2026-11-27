"use client";

import React, { useMemo, useState } from "react";
import {
  Wallet,
  Building2,
  Smartphone,
  CreditCard,
  Truck,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Archive,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  X,
  History,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { FinancesNavTabs } from "@/components/finances/finances-nav-tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { AccountRecord, MOCK_ACCOUNTS } from "@/mock-data/advanced-finances";
import { formatMoney } from "@/lib/currencies";
import { useApp } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

interface CaisseClientProps {
  storeSlug: string;
}

export function CaisseClient({ storeSlug }: CaisseClientProps) {
  const { activeRole } = useApp();
  const [accounts, setAccounts] = useState<AccountRecord[]>(MOCK_ACCOUNTS);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Créer une Caisse
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<AccountRecord["type"]>("cash");
  const [newOperator, setNewOperator] = useState("");
  const [newCurrency, setNewCurrency] = useState("XOF");
  const [newInitialBalance, setNewInitialBalance] = useState<number>(0);

  // Modal Réconciliation
  const [reconcilingAccount, setReconcilingAccount] = useState<AccountRecord | null>(null);
  const [declaredBalance, setDeclaredBalance] = useState<number>(0);
  const [reconcileReason, setReconcileReason] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtrage des comptes
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (activeTab === "active" && acc.isArchived) return false;
      if (activeTab === "archived" && !acc.isArchived) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = acc.name.toLowerCase().includes(q);
        const matchesOp = acc.operatorName?.toLowerCase().includes(q);
        const matchesNum = acc.accountNumber?.toLowerCase().includes(q);
        if (!matchesName && !matchesOp && !matchesNum) return false;
      }
      return true;
    });
  }, [accounts, activeTab, searchQuery]);

  // Totaux par type de compte
  const totals = useMemo(() => {
    let totalCash = 0;
    let totalMomo = 0;
    let totalBank = 0;
    let totalCourierTransit = 0;

    accounts.forEach((acc) => {
      if (acc.isArchived || acc.currency !== "XOF") return;
      if (acc.type === "cash") totalCash += acc.balance;
      else if (acc.type === "momo") totalMomo += acc.balance;
      else if (acc.type === "bank") totalBank += acc.balance;
      else if (acc.type === "courier_transit") totalCourierTransit += acc.balance;
    });

    return {
      totalCash,
      totalMomo,
      totalBank,
      totalCourierTransit,
      grandTotalXof: totalCash + totalMomo + totalBank + totalCourierTransit,
    };
  }, [accounts]);

  // Création d'une caisse
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newAcc: AccountRecord = {
      id: `acc_${Date.now()}`,
      name: newName.trim(),
      type: newType,
      operatorName: newType === "momo" || newType === "bank" ? newOperator.trim() : undefined,
      currency: newCurrency,
      balance: Math.round(newInitialBalance),
      isArchived: false,
      lastReconciliationDate: new Date().toLocaleDateString("fr-FR"),
      lastReconciliationDiscrepancy: 0,
    };

    setAccounts([newAcc, ...accounts]);
    setIsCreateOpen(false);
    setNewName("");
    setNewOperator("");
    setNewInitialBalance(0);
    showToast(`Compte « ${newAcc.name} » créé avec succès !`);
  };

  // Enregistrement de réconciliation
  const handleSaveReconciliation = () => {
    if (!reconcilingAccount) return;
    const theoretical = reconcilingAccount.balance;
    const discrepancy = declaredBalance - theoretical;

    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === reconcilingAccount.id
          ? {
              ...acc,
              balance: declaredBalance,
              lastReconciliationDate: new Date().toLocaleDateString("fr-FR"),
              lastReconciliationDiscrepancy: discrepancy,
            }
          : acc
      )
    );

    setReconcilingAccount(null);
    setReconcileReason("");
    showToast(
      `Réconciliation validée pour « ${reconcilingAccount.name} » (écart : ${formatMoney(
        discrepancy,
        reconcilingAccount.currency
      )})`
    );
  };

  // Archivage / Restauration
  const toggleArchive = (id: string) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, isArchived: !acc.isArchived } : acc))
    );
    showToast("Statut du compte mis à jour !");
  };

  const getTypeIcon = (type: AccountRecord["type"]) => {
    switch (type) {
      case "cash":
        return Wallet;
      case "bank":
        return Building2;
      case "momo":
        return Smartphone;
      case "card":
        return CreditCard;
      case "courier_transit":
        return Truck;
    }
  };

  const getTypeBadge = (type: AccountRecord["type"]) => {
    switch (type) {
      case "cash":
        return { label: "Espèces", color: "bg-emerald-50 text-emerald-800 border-emerald-200" };
      case "bank":
        return { label: "Banque", color: "bg-blue-50 text-blue-800 border-blue-200" };
      case "momo":
        return { label: "Mobile Money", color: "bg-amber-50 text-amber-800 border-amber-200" };
      case "card":
        return { label: "Carte bancaire", color: "bg-purple-50 text-purple-800 border-purple-200" };
      case "courier_transit":
        return { label: "Cash livreurs (Transit)", color: "bg-orange-50 text-orange-800 border-orange-200" };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#1F3A26] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Onglets Finances */}
      <FinancesNavTabs storeSlug={storeSlug} />

      {/* En-tête de la page */}
      <ScrollReveal delay={0}>
        <PageHeader
          title="Caisses & Comptes"
          description="Gérez vos comptes d'espèces, Mobile Money, banques et les liquidités en transit chez vos livreurs."
          actions={
            <div className="flex items-center gap-2">
              <DateRangePicker align="right" />
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F3A26] text-xs font-bold text-[#FAF8F5] hover:bg-[#162B1C] transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Créer une caisse</span>
              </button>
            </div>
          }
        />
      </ScrollReveal>

      {/* 4 Compteurs KPI par Type de Trésorerie */}
      <ScrollReveal delay={50}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Trésorerie Globale */}
          <div className="rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-4 shadow-2xs">
            <div className="flex items-center justify-between text-[#666660]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Trésorerie Totale</span>
              <Wallet className="h-4 w-4 text-[#111111]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#111111]">
              {formatMoney(totals.grandTotalXof, "XOF")}
            </div>
            <p className="mt-1 text-[11px] text-[#666660]">Solde disponible consolidé</p>
          </div>

          {/* 2. Mobile Money */}
          <div className="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-[#666660]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Mobile Money</span>
              <Smartphone className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#111111]">
              {formatMoney(totals.totalMomo, "XOF")}
            </div>
            <p className="mt-1 text-[11px] text-[#666660]">Wave, Orange, TMoney, MTN</p>
          </div>

          {/* 3. Banque */}
          <div className="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-[#666660]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Comptes Bancaires</span>
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#111111]">
              {formatMoney(totals.totalBank, "XOF")}
            </div>
            <p className="mt-1 text-[11px] text-[#666660]">Fonds sécurisés en banque</p>
          </div>

          {/* 4. Cash livreurs en transit */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-amber-900">
              <span className="text-[11px] font-bold uppercase tracking-wider">Cash Livreurs (Transit)</span>
              <Truck className="h-4 w-4 text-amber-700" />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-950">
              {formatMoney(totals.totalCourierTransit, "XOF")}
            </div>
            <p className="mt-1 text-[11px] text-amber-800">Espèces en tournée non reversées</p>
          </div>
        </div>
      </ScrollReveal>

      {/* Barre d'Onglets En Service / Archivées + Recherche */}
      <ScrollReveal delay={100}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-black/[0.08] bg-[#FAF8F5] p-1">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeTab === "active"
                  ? "bg-[#1F3A26] text-[#FAF8F5] shadow-xs"
                  : "text-[#666660] hover:text-[#111111]"
              )}
            >
              En service ({accounts.filter((a) => !a.isArchived).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("archived")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeTab === "archived"
                  ? "bg-[#1F3A26] text-[#FAF8F5] shadow-xs"
                  : "text-[#666660] hover:text-[#111111]"
              )}
            >
              Archivées ({accounts.filter((a) => a.isArchived).length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888880]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une caisse..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] placeholder:text-[#888880] focus:outline-none focus:ring-2 focus:ring-black/[0.12]"
            />
          </div>
        </div>
      </ScrollReveal>

      {/* Grille des Comptes & Caisses */}
      <ScrollReveal delay={150}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((acc) => {
            const Icon = getTypeIcon(acc.type);
            const badge = getTypeBadge(acc.type);

            return (
              <div
                key={acc.id}
                className={cn(
                  "rounded-2xl border p-4.5 bg-white shadow-2xs hover:border-black/20 transition-all flex flex-col justify-between space-y-4",
                  acc.isArchived ? "opacity-60 border-dashed border-black/20" : "border-black/[0.08]"
                )}
              >
                {/* En-tête de la carte */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-[#FAF8F5] border border-black/[0.08] flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-[#111111]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-[#111111] truncate">{acc.name}</h3>
                      <p className="text-[11px] text-[#666660] truncate">
                        {acc.operatorName || acc.accountNumber || "Compte interne"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0",
                      badge.color
                    )}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Solde du compte */}
                <div className="bg-[#FAF8F5] rounded-xl p-3 border border-black/[0.06]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#666660]">
                    Solde Actuel
                  </p>
                  <p className="text-xl font-black text-[#111111] mt-0.5">
                    {formatMoney(acc.balance, acc.currency)}
                  </p>
                  {acc.lastReconciliationDate && (
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#666660]">
                      <span>Dernier point : {acc.lastReconciliationDate}</span>
                      {acc.lastReconciliationDiscrepancy !== undefined && acc.lastReconciliationDiscrepancy !== 0 && (
                        <span className="text-rose-600 font-bold">
                          Écart : {formatMoney(acc.lastReconciliationDiscrepancy, acc.currency)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions de la caisse */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setReconcilingAccount(acc);
                      setDeclaredBalance(acc.balance);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg border border-black/[0.08] text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>Réconcilier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleArchive(acc.id)}
                    className="p-1.5 rounded-lg border border-black/[0.08] text-[#666660] hover:text-[#111111] hover:bg-[#FAF8F5] transition-all cursor-pointer"
                    title={acc.isArchived ? "Restaurer le compte" : "Archiver le compte"}
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollReveal>

      {/* MODAL CRÉER UNE CAISSE */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.08]">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-[#111111]" />
                <h3 className="font-black text-base text-[#111111]">Créer un compte / caisse</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-[#888880] hover:text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#111111] block mb-1">Nom de la caisse *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Caisse Principale, Wave Marchand..."
                  className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Type de compte *</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as AccountRecord["type"])}
                    className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:ring-2 focus:ring-black"
                  >
                    <option value="cash">Espèces</option>
                    <option value="momo">Mobile Money</option>
                    <option value="bank">Compte Bancaire</option>
                    <option value="card">Carte Bancaire</option>
                    <option value="courier_transit">Cash Livreur (Transit)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Devise ISO *</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:ring-2 focus:ring-black"
                  >
                    <option value="XOF">XOF (Franc CFA)</option>
                    <option value="XAF">XAF (Franc CFA)</option>
                    <option value="GNF">GNF (Guinée)</option>
                    <option value="GHS">GHS (Ghana)</option>
                    <option value="USD">USD (Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
              </div>

              {(newType === "momo" || newType === "bank") && (
                <div>
                  <label className="font-bold text-[#111111] block mb-1">
                    Nom de l'opérateur ou banque
                  </label>
                  <input
                    type="text"
                    value={newOperator}
                    onChange={(e) => setNewOperator(e.target.value)}
                    placeholder="Ex: Wave, Orange, MTN, Moov, Ecobank..."
                    className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Solde d'ouverture initial ({newCurrency})
                </label>
                <input
                  type="number"
                  min={0}
                  value={newInitialBalance}
                  onChange={(e) => setNewInitialBalance(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white font-bold text-[#111111]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1F3A26] font-bold text-[#FAF8F5] hover:bg-[#162B1C]"
                >
                  Créer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RÉCONCILIATION */}
      {reconcilingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.08]">
              <div>
                <h3 className="font-black text-base text-[#111111]">
                  Réconciliation : {reconcilingAccount.name}
                </h3>
                <p className="text-[11px] text-[#666660]">
                  Vérifiez le solde réel physique ou relevé par rapport au solde théorique.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReconcilingAccount(null)}
                className="p-1 rounded-lg text-[#888880] hover:text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-white p-3 rounded-xl border border-black/[0.08] flex items-center justify-between">
                <span className="text-[#666660] font-bold">Solde théorique système :</span>
                <span className="font-black text-[#111111] text-sm">
                  {formatMoney(reconcilingAccount.balance, reconcilingAccount.currency)}
                </span>
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Solde physique / relevé constaté *
                </label>
                <input
                  type="number"
                  value={declaredBalance}
                  onChange={(e) => setDeclaredBalance(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white font-black text-sm text-[#111111]"
                />
              </div>

              {/* Écart calculé */}
              <div
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-between font-bold",
                  declaredBalance === reconcilingAccount.balance
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                )}
              >
                <span>Écart constaté :</span>
                <span>
                  {formatMoney(
                    declaredBalance - reconcilingAccount.balance,
                    reconcilingAccount.currency
                  )}
                </span>
              </div>

              {declaredBalance !== reconcilingAccount.balance && (
                <div>
                  <label className="font-bold text-[#111111] block mb-1">
                    Motif de l'écart (obligatoire pour l'audit) *
                  </label>
                  <textarea
                    rows={2}
                    value={reconcileReason}
                    onChange={(e) => setReconcileReason(e.target.value)}
                    placeholder="Ex: Frais de retrait non comptabilisés, surplus monnaie..."
                    className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => setReconcilingAccount(null)}
                  className="px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white font-bold text-[#111111]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveReconciliation}
                  className="px-4 py-2 rounded-xl bg-[#1F3A26] font-bold text-[#FAF8F5] hover:bg-[#162B1C]"
                >
                  Valider la réconciliation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
