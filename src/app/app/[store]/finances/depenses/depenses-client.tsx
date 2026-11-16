"use client";

import React, { useMemo, useState } from "react";
import {
  CreditCard,
  Plus,
  Search,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  Paperclip,
  TrendingDown,
  TrendingUp,
  X,
  FileText,
  AlertTriangle,
  Play,
  Pause,
  ArrowRightLeft,
  ShieldAlert,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { FinancesNavTabs } from "@/components/finances/finances-nav-tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { CountryChip } from "@/components/app/bits";
import {
  ExpenseRecord,
  MOCK_ACCOUNTS,
  MOCK_EXPENSES_ADVANCED,
  MOCK_RECURRING_CHARGES,
  MOCK_REVENUES_ADVANCED,
  MOCK_TRANSFERS,
  RecurringChargeRecord,
  RevenueRecord,
  TransferRecord,
} from "@/mock-data/advanced-finances";
import { formatMoney } from "@/lib/currencies";
import { useApp } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

interface DepensesClientProps {
  storeSlug: string;
}

export function DepensesClient({ storeSlug }: DepensesClientProps) {
  const { activeRole } = useApp();
  const [activeTab, setActiveTab] = useState<"expenses" | "revenues" | "transfers" | "recurring">("expenses");
  const [searchQuery, setSearchQuery] = useState("");

  // État des dépenses
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(MOCK_EXPENSES_ADVANCED);
  const [revenues, setRevenues] = useState<RevenueRecord[]>(MOCK_REVENUES_ADVANCED);
  const [transfers, setTransfers] = useState<TransferRecord[]>(MOCK_TRANSFERS);
  const [recurringCharges, setRecurringCharges] = useState<RecurringChargeRecord[]>(MOCK_RECURRING_CHARGES);

  // Seuil d'approbation en XOF (100 000 FCFA par défaut)
  const [approvalThreshold] = useState<number>(100000);

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);

  // Formulaire Dépense
  const [newExpDesc, setNewExpDesc] = useState("");
  const [newExpCategory, setNewExpCategory] = useState("Emballage & Colisage");
  const [newExpAmount, setNewExpAmount] = useState<number>(0);
  const [newExpCurrency, setNewExpCurrency] = useState("XOF");
  const [newExpAccountId, setNewExpAccountId] = useState(MOCK_ACCOUNTS[0]?.id || "acc_01");
  const [newExpCountry, setNewExpCountry] = useState("CI");
  const [newExpAttachment, setNewExpAttachment] = useState("");

  // Formulaire Transfert
  const [fromAccId, setFromAccId] = useState(MOCK_ACCOUNTS[1]?.id || "acc_02");
  const [toAccId, setToAccId] = useState(MOCK_ACCOUNTS[4]?.id || "acc_05");
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferFee, setTransferFee] = useState<number>(0);
  const [transferFxRate, setTransferFxRate] = useState<number>(1.0);
  const [transferNotes, setTransferNotes] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtrage
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.accountName.toLowerCase().includes(q)
      );
    });
  }, [expenses, searchQuery]);

  const filteredRevenues = useMemo(() => {
    return revenues.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.accountName.toLowerCase().includes(q)
      );
    });
  }, [revenues, searchQuery]);

  // Totaux
  const totalExpensesXof = useMemo(() => {
    return expenses
      .filter((e) => e.status !== "reversed" && e.currency === "XOF")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalRevenuesXof = useMemo(() => {
    return revenues
      .filter((r) => r.currency === "XOF")
      .reduce((sum, r) => sum + r.amount, 0);
  }, [revenues]);

  // Ajouter une dépense (avec vérification du seuil d'approbation)
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpDesc.trim() || newExpAmount <= 0) return;

    const acc = MOCK_ACCOUNTS.find((a) => a.id === newExpAccountId);
    const requiresApproval = newExpAmount >= approvalThreshold && activeRole !== "owner";

    const newExp: ExpenseRecord = {
      id: `exp_${Date.now()}`,
      description: newExpDesc.trim(),
      category: newExpCategory,
      amount: Math.round(newExpAmount),
      currency: newExpCurrency,
      accountId: newExpAccountId,
      accountName: acc?.name || "Compte principal",
      country: newExpCountry,
      date: new Date().toLocaleDateString("fr-FR"),
      attachmentName: newExpAttachment ? "justificatif.pdf" : undefined,
      status: requiresApproval ? "pending_approval" : "approved",
      createdBy: activeRole === "owner" ? "Propriétaire" : "Membre équipe",
      approvedBy: requiresApproval ? undefined : "Auto-approuvé",
    };

    setExpenses([newExp, ...expenses]);
    setIsExpenseModalOpen(false);
    setNewExpDesc("");
    setNewExpAmount(0);
    setNewExpAttachment("");

    if (requiresApproval) {
      showToast(
        `Dépense créée en attente d'approbation (> ${formatMoney(approvalThreshold, "XOF")}) !`
      );
    } else {
      showToast("Dépense enregistrée avec succès !");
    }
  };

  // Approuver une dépense en attente
  const handleApproveExpense = (id: string) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: "approved", approvedBy: "Propriétaire" } : e
      )
    );
    showToast("Dépense approuvée et imputée au compte !");
  };

  // Annuler une dépense (RÈGLE STRICTE APPEND-ONLY : Génère une écriture inverse reversal)
  const handleReverseExpense = (original: ExpenseRecord) => {
    if (confirm(`Voulez-vous annuler cette dépense par une contre-passation comptable ?`)) {
      // 1. Marquer l'original comme reversed
      setExpenses((prev) =>
        prev.map((e) => (e.id === original.id ? { ...e, status: "reversed" } : e))
      );

      // 2. Créer l'écriture d'annulation inverse (reversal)
      const reversalExp: ExpenseRecord = {
        id: `exp_rev_${Date.now()}`,
        description: `ANNULATION : ${original.description}`,
        category: `Contre-passation (${original.category})`,
        amount: -original.amount, // Montant négatif qui crédite la caisse
        currency: original.currency,
        accountId: original.accountId,
        accountName: original.accountName,
        country: original.country,
        date: new Date().toLocaleDateString("fr-FR"),
        status: "approved",
        isReversal: true,
        reversalOfId: original.id,
        createdBy: "Système de contre-passation",
        approvedBy: "Propriétaire",
      };

      setExpenses((prev) => [reversalExp, ...prev]);
      showToast("Écriture d'annulation (contre-passation inverse) générée sans perte d'historique !");
    }
  };

  // Créer un transfert inter-comptes
  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccId === toAccId || transferAmount <= 0) {
      alert("Veuillez sélectionner deux comptes différents et un montant supérieur à 0.");
      return;
    }

    const fromAcc = MOCK_ACCOUNTS.find((a) => a.id === fromAccId);
    const toAcc = MOCK_ACCOUNTS.find((a) => a.id === toAccId);
    if (!fromAcc || !toAcc) return;

    const amountTo =
      fromAcc.currency === toAcc.currency
        ? transferAmount - transferFee
        : Math.round((transferAmount - transferFee) * transferFxRate);

    const newTr: TransferRecord = {
      id: `tr_${Date.now()}`,
      fromAccountId: fromAcc.id,
      fromAccountName: fromAcc.name,
      toAccountId: toAcc.id,
      toAccountName: toAcc.name,
      amountFrom: transferAmount,
      currencyFrom: fromAcc.currency,
      amountTo,
      currencyTo: toAcc.currency,
      fxRate: transferFxRate,
      transferFee,
      date: new Date().toLocaleDateString("fr-FR"),
      notes: transferNotes || undefined,
    };

    setTransfers([newTr, ...transfers]);
    setIsTransferModalOpen(false);
    setTransferAmount(0);
    setTransferFee(0);
    setTransferNotes("");
    showToast(
      `Transfert de ${formatMoney(transferAmount, fromAcc.currency)} vers « ${toAcc.name} » exécuté !`
    );
  };

  // Basculer pause sur charge récurrente
  const togglePauseRecurring = (id: string) => {
    setRecurringCharges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPaused: !c.isPaused } : c))
    );
    showToast("Statut de la charge récurrente modifié !");
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Onglets Finances */}
      <FinancesNavTabs storeSlug={storeSlug} />

      {/* En-tête de la page */}
      <ScrollReveal delay={0}>
        <PageHeader
          title="Dépenses, Revenus & Transferts"
          description="Comptabilisez vos dépenses opérationnelles, vos revenus annexes, vos virements inter-comptes et vos charges récurrentes."
          actions={
            <div className="flex items-center gap-2">
              <DateRangePicker align="right" />
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all shadow-2xs cursor-pointer"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                <span>Nouveau transfert</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] text-xs font-bold text-[#FAF8F5] hover:bg-black transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajouter une dépense</span>
              </button>
            </div>
          }
        />
      </ScrollReveal>

      {/* 3 Cartes Résumé */}
      <ScrollReveal delay={50}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-rose-900">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Dépenses</span>
              <TrendingDown className="h-4 w-4 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-rose-950">
              {formatMoney(totalExpensesXof, "XOF")}
            </div>
            <p className="mt-1 text-[11px] text-rose-800">Hors dépenses annulées</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-900">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Revenus Encaissés</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-950">
              {formatMoney(totalRevenuesXof, "XOF")}
            </div>
            <p className="mt-1 text-[11px] text-emerald-800">Ventes COD & B2B</p>
          </div>

          <div className="rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-4 shadow-2xs">
            <div className="flex items-center justify-between text-[#666660]">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Charges Récurrentes Mensuelles
              </span>
              <Clock className="h-4 w-4 text-[#111111]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#111111]">
              {formatMoney(
                recurringCharges.reduce((s, c) => (c.isPaused ? s : s + c.amount), 0),
                "XOF"
              )}
            </div>
            <p className="mt-1 text-[11px] text-[#666660]">Loyers, abonnements et forfaits</p>
          </div>
        </div>
      </ScrollReveal>

      {/* Onglets Dépenses / Revenus / Transferts / Récurrentes */}
      <ScrollReveal delay={100}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-black/[0.08] bg-[#FAF8F5] p-1">
            <button
              type="button"
              onClick={() => setActiveTab("expenses")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeTab === "expenses"
                  ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                  : "text-[#666660] hover:text-[#111111]"
              )}
            >
              Dépenses ({expenses.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("revenues")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeTab === "revenues"
                  ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                  : "text-[#666660] hover:text-[#111111]"
              )}
            >
              Revenus ({revenues.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("transfers")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeTab === "transfers"
                  ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                  : "text-[#666660] hover:text-[#111111]"
              )}
            >
              Transferts ({transfers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("recurring")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeTab === "recurring"
                  ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                  : "text-[#666660] hover:text-[#111111]"
              )}
            >
              Charges récurrentes ({recurringCharges.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888880]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une opération..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] placeholder:text-[#888880] focus:outline-none focus:ring-2 focus:ring-black/[0.12]"
            />
          </div>
        </div>
      </ScrollReveal>

      {/* CONTENU ONGLET 1 : DÉPENSES */}
      {activeTab === "expenses" && (
        <ScrollReveal delay={150}>
          <div className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-black/[0.06] text-[#666660] font-bold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Catégorie</th>
                    <th className="py-3 px-4">Compte débité</th>
                    <th className="py-3 px-4">Pays</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-center">Pièce</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06]">
                  {filteredExpenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className={cn(
                        "hover:bg-[#FAF8F5]/60 transition-colors",
                        exp.isReversal && "bg-amber-50/40 text-amber-950 font-medium",
                        exp.status === "reversed" && "opacity-50 line-through"
                      )}
                    >
                      <td className="py-3 px-4 text-[#666660] whitespace-nowrap">{exp.date}</td>
                      <td className="py-3 px-4 font-bold text-[#111111] max-w-xs truncate">
                        {exp.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F5] border border-black/[0.06] text-[#666660]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#111111] truncate max-w-[160px]">
                        {exp.accountName}
                      </td>
                      <td className="py-3 px-4">
                        <CountryChip code={exp.country} />
                      </td>
                      <td className="py-3 px-4 text-right font-black whitespace-nowrap">
                        <span className={exp.amount < 0 ? "text-emerald-700" : "text-rose-700"}>
                          {exp.amount < 0 ? "+" : "-"}
                          {formatMoney(Math.abs(exp.amount), exp.currency)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {exp.status === "approved" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Approuvé
                          </span>
                        )}
                        {exp.status === "pending_approval" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                            En attente (&gt;100k)
                          </span>
                        )}
                        {exp.status === "reversed" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            Annulée
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {exp.attachmentName ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                            title={exp.attachmentName}
                          >
                            <Paperclip className="h-3 w-3" />
                            <span>PDF</span>
                          </span>
                        ) : (
                          <span className="text-[#888880]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {exp.status === "pending_approval" && (
                            <button
                              type="button"
                              onClick={() => handleApproveExpense(exp.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 cursor-pointer shadow-2xs"
                            >
                              Approuver
                            </button>
                          )}
                          {exp.status === "approved" && !exp.isReversal && (
                            <button
                              type="button"
                              onClick={() => handleReverseExpense(exp)}
                              className="px-2 py-1 rounded-lg border border-black/[0.08] text-[10px] font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Annuler par contre-passation (Append-only)"
                            >
                              Annuler (Reversal)
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* CONTENU ONGLET 2 : REVENUS */}
      {activeTab === "revenues" && (
        <ScrollReveal delay={150}>
          <div className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-black/[0.06] text-[#666660] font-bold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Catégorie</th>
                    <th className="py-3 px-4">Compte crédité</th>
                    <th className="py-3 px-4">Pays</th>
                    <th className="py-3 px-4">Référence</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06]">
                  {filteredRevenues.map((rev) => (
                    <tr key={rev.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3 px-4 text-[#666660] whitespace-nowrap">{rev.date}</td>
                      <td className="py-3 px-4 font-bold text-[#111111] max-w-sm truncate">
                        {rev.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {rev.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#111111] truncate">{rev.accountName}</td>
                      <td className="py-3 px-4">
                        <CountryChip code={rev.country} />
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#666660]">
                        {rev.referenceNumber || "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700 whitespace-nowrap">
                        +{formatMoney(rev.amount, rev.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* CONTENU ONGLET 3 : TRANSFERTS */}
      {activeTab === "transfers" && (
        <ScrollReveal delay={150}>
          <div className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-black/[0.06] text-[#666660] font-bold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Compte Source</th>
                    <th className="py-3 px-4 text-center">Flux</th>
                    <th className="py-3 px-4">Compte Destination</th>
                    <th className="py-3 px-4 text-right">Montant Débité</th>
                    <th className="py-3 px-4 text-right">Montant Crédité</th>
                    <th className="py-3 px-4 text-right">Frais</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06]">
                  {transfers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3 px-4 text-[#666660] whitespace-nowrap">{tr.date}</td>
                      <td className="py-3 px-4 font-bold text-[#111111] truncate">{tr.fromAccountName}</td>
                      <td className="py-3 px-4 text-center">
                        <ArrowRight className="h-3.5 w-3.5 text-[#888880] mx-auto" />
                      </td>
                      <td className="py-3 px-4 font-bold text-[#111111] truncate">{tr.toAccountName}</td>
                      <td className="py-3 px-4 text-right font-black text-rose-700 whitespace-nowrap">
                        -{formatMoney(tr.amountFrom, tr.currencyFrom)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700 whitespace-nowrap">
                        +{formatMoney(tr.amountTo, tr.currencyTo)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#666660] whitespace-nowrap">
                        {tr.transferFee > 0 ? formatMoney(tr.transferFee, tr.currencyFrom) : "0"}
                      </td>
                      <td className="py-3 px-4 text-[#666660] max-w-xs truncate">{tr.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* CONTENU ONGLET 4 : CHARGES RÉCURRENTES */}
      {activeTab === "recurring" && (
        <ScrollReveal delay={150}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#666660]">
                Ces charges automatiques sont prélevées selon leur cadence sans ressaisie manuelle.
              </p>
              <button
                type="button"
                onClick={() => showToast("Toutes les écritures échues ont été synchronisées !")}
                className="px-3.5 py-1.5 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all cursor-pointer shadow-2xs"
              >
                Générer les écritures dues
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recurringCharges.map((rec) => (
                <div
                  key={rec.id}
                  className={cn(
                    "rounded-2xl border p-4 bg-white shadow-2xs flex flex-col justify-between space-y-3",
                    rec.isPaused ? "opacity-60 border-dashed" : "border-black/[0.08]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#111111]">{rec.name}</h4>
                      <p className="text-[11px] text-[#666660]">{rec.category}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F5] border border-black/[0.06] text-[#111111]">
                      {rec.frequency === "monthly" ? "Mensuel" : rec.frequency}
                    </span>
                  </div>

                  <div className="bg-[#FAF8F5] rounded-xl p-2.5">
                    <p className="text-[10px] text-[#666660] font-bold">Montant récurrent</p>
                    <p className="text-lg font-black text-[#111111]">
                      {formatMoney(rec.amount, rec.currency)}
                    </p>
                    <p className="text-[10px] text-[#666660] mt-1">
                      Compte : {rec.accountName}
                    </p>
                    <p className="text-[10px] text-amber-800 font-bold mt-0.5">
                      Prochaine échéance : {rec.nextDueDate}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/[0.06]">
                    <button
                      type="button"
                      onClick={() => togglePauseRecurring(rec.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#111111] hover:underline cursor-pointer"
                    >
                      {rec.isPaused ? (
                        <>
                          <Play className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Reprendre</span>
                        </>
                      ) : (
                        <>
                          <Pause className="h-3.5 w-3.5 text-amber-600" />
                          <span>Mettre en pause</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* MODAL AJOUTER UNE DÉPENSE */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.08]">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#111111]" />
                <h3 className="font-black text-base text-[#111111]">Enregistrer une dépense</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1 rounded-lg text-[#888880] hover:text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#111111] block mb-1">Description de la dépense *</label>
                <input
                  type="text"
                  required
                  value={newExpDesc}
                  onChange={(e) => setNewExpDesc(e.target.value)}
                  placeholder="Ex: Achat cartons, carburant livraison..."
                  className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Catégorie *</label>
                  <select
                    value={newExpCategory}
                    onChange={(e) => setNewExpCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                  >
                    <option value="Emballage & Colisage">Emballage & Colisage</option>
                    <option value="Transport & Carburant">Transport & Carburant</option>
                    <option value="Publicité Meta">Publicité Meta</option>
                    <option value="Publicité TikTok">Publicité TikTok</option>
                    <option value="Télécom & Internet">Télécom & Internet</option>
                    <option value="Matériel & Téléphonie">Matériel & Téléphonie</option>
                    <option value="Loyer & Locaux">Loyer & Locaux</option>
                    <option value="Autre charge opérationnelle">Autre charge</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Pays concerné *</label>
                  <select
                    value={newExpCountry}
                    onChange={(e) => setNewExpCountry(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                  >
                    <option value="TG">🇹🇬 Togo (TG)</option>
                    <option value="CI">🇨🇮 Côte d'Ivoire (CI)</option>
                    <option value="SN">🇸🇳 Sénégal (SN)</option>
                    <option value="BJ">🇧🇯 Bénin (BJ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Montant *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newExpAmount}
                    onChange={(e) => setNewExpAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111] font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Devise *</label>
                  <select
                    value={newExpCurrency}
                    onChange={(e) => setNewExpCurrency(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                  >
                    <option value="XOF">XOF (FCFA)</option>
                    <option value="XAF">XAF (FCFA)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Compte à débiter *</label>
                <select
                  value={newExpAccountId}
                  onChange={(e) => setNewExpAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                >
                  {MOCK_ACCOUNTS.filter((a) => !a.isArchived).map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — {formatMoney(acc.balance, acc.currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Pièce jointe / Facture (optionnel)
                </label>
                <input
                  type="file"
                  onChange={(e) => setNewExpAttachment(e.target.value)}
                  className="w-full p-2 rounded-xl border border-black/[0.1] bg-white text-[#111111] file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#111111] file:text-[#FAF8F5]"
                />
              </div>

              {newExpAmount >= approvalThreshold && activeRole !== "owner" && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    Montant supérieur à {formatMoney(approvalThreshold, "XOF")} : cette dépense sera soumise à l'approbation du propriétaire.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white font-bold text-[#111111]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#111111] font-bold text-[#FAF8F5] hover:bg-black"
                >
                  Valider la dépense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOUVEAU TRANSFERT INTER-COMPTES */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.08]">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-[#111111]" />
                <h3 className="font-black text-base text-[#111111]">Virement inter-comptes</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded-lg text-[#888880] hover:text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#111111] block mb-1">Compte Source (Débité) *</label>
                <select
                  value={fromAccId}
                  onChange={(e) => setFromAccId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                >
                  {MOCK_ACCOUNTS.filter((a) => !a.isArchived).map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatMoney(acc.balance, acc.currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Compte Destination (Crédité) *</label>
                <select
                  value={toAccId}
                  onChange={(e) => setToAccId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                >
                  {MOCK_ACCOUNTS.filter((a) => !a.isArchived && a.id !== fromAccId).map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatMoney(acc.balance, acc.currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Montant à transférer *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111] font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Frais de transfert</label>
                  <input
                    type="number"
                    min={0}
                    value={transferFee}
                    onChange={(e) => setTransferFee(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Notes / Motif du virement</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Ex: Rapatriement Wave, recharge carte pub..."
                  className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white font-bold text-[#111111]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#111111] font-bold text-[#FAF8F5] hover:bg-black"
                >
                  Exécuter le transfert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
