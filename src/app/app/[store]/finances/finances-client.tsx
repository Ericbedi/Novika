"use client";

import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Truck,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  HelpCircle,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  CheckCircle2,
  FileText,
  Building2,
  ShoppingBag,
  Package,
} from "lucide-react";
import { StatCard, StatCardsGrid } from "@/components/app/stat-card";
import { MOCK_FINANCE_SUMMARY, MOCK_EXPENSES, MOCK_CASHBOOK } from "@/mock-data/finances";
import { Expense, CashbookEntry } from "@/server/data/types";
import { formatFcfa } from "@/lib/money";
import { FinancesNavTabs } from "@/components/finances/finances-nav-tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";

interface FinancesClientProps {
  storeSlug: string;
}

export function FinancesClient({ storeSlug }: FinancesClientProps) {
  const [period, setPeriod] = useState<"last7" | "last30" | "today">("last7");
  const summary = MOCK_FINANCE_SUMMARY[period] || MOCK_FINANCE_SUMMARY.last7;

  // Dépenses interactives (ajouter, modifier, supprimer)
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const [expLabel, setExpLabel] = useState("");
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDate, setExpDate] = useState("15/11/2026");
  const [expCategory, setExpCategory] = useState<"ads" | "shipping" | "packaging" | "salary" | "software" | "other">("packaging");

  // Livre de compte
  const [cashbook] = useState<CashbookEntry[]>(MOCK_CASHBOOK);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAddExpense = () => {
    setEditingExpenseId(null);
    setExpLabel("");
    setExpAmount(0);
    setExpDate(new Date().toLocaleDateString("fr-FR"));
    setExpCategory("packaging");
    setShowAddExpenseModal(true);
  };

  const handleOpenEditExpense = (item: Expense) => {
    setEditingExpenseId(item.id);
    setExpLabel(item.label);
    setExpAmount(item.amount);
    setExpDate(item.date);
    setExpCategory(item.category);
    setShowAddExpenseModal(true);
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette dépense ?")) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      showToast("Dépense supprimée !");
    }
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expLabel.trim() || expAmount <= 0) {
      alert("Veuillez renseigner un libellé et un montant valide.");
      return;
    }

    const categoryLabels: Record<string, string> = {
      ads: "Publicité Meta / TikTok",
      shipping: "Frais de livraison",
      packaging: "Emballage & Colisage",
      salary: "Commissions Closeuse / Équipe",
      software: "Logiciels & Outils",
      other: "Autre charge",
    };

    if (editingExpenseId) {
      setExpenses((prev) =>
        prev.map((item) =>
          item.id === editingExpenseId
            ? {
                ...item,
                label: expLabel,
                amount: expAmount,
                date: expDate,
                category: expCategory,
                categoryLabel: categoryLabels[expCategory] || "Autre",
              }
            : item
        )
      );
      showToast("Dépense mise à jour avec succès !");
    } else {
      const newExp: Expense = {
        id: `exp_${Date.now()}`,
        label: expLabel,
        amount: expAmount,
        date: expDate,
        category: expCategory,
        categoryLabel: categoryLabels[expCategory] || "Autre",
      };
      setExpenses((prev) => [newExp, ...prev]);
      showToast("Nouvelle dépense ajoutée !");
    }

    setShowAddExpenseModal(false);
  };

  const totalCosts =
    summary.productCost + summary.adSpend + summary.shippingCost + summary.otherExpenses;

  return (
    <div className="space-y-8 pb-24">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Onglets Finances */}
      <FinancesNavTabs storeSlug={storeSlug} />

      {/* En-tête avec sélecteur de période */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
              Rentabilité Réelle COD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Finances & Résultat Net
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Suivi des encaissements en espèces, coûts produits, publicités et bénéfice net en poche.
          </p>
        </div>

        {/* Sélecteur de période universel */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <DateRangePicker align="right" />
        </div>
      </div>

      {/* CARTE PRINCIPALE : RÉSULTAT NET AVEC FORMULE EXPLICITE */}
      <div className="rounded-[28px] border-2 border-[#111111] bg-[#111111] text-[#FAF8F5] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Formule Officielle COD
              </span>
              <span className="text-xs text-[#E5DEC9]/80 font-mono">
                Encaissé − Coûts = Résultat net
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#FAF8F5]/70">
              <span className="font-bold text-emerald-400">{summary.profitMargin}%</span> de marge nette
            </div>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FAF8F5]/60 block mb-1">
              Résultat Net Réalisé
            </span>
            <div className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {formatFcfa(summary.netProfit)}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-[#FAF8F5]/60 uppercase block">1. Total Encaissé</span>
              <span className="text-base font-bold text-emerald-400">{formatFcfa(summary.collectedRevenue)}</span>
              <span className="text-[10px] text-[#FAF8F5]/50 block mt-0.5">Espèces reçues des livreurs</span>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-[#FAF8F5]/60 uppercase block">2. Total Coûts Réels</span>
              <span className="text-base font-bold text-rose-400">−{formatFcfa(totalCosts)}</span>
              <span className="text-[10px] text-[#FAF8F5]/50 block mt-0.5">Produits + Pub + Livraison + Charges</span>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-[#FAF8F5]/60 uppercase block">3. Bénéfice Net Restant</span>
              <span className="text-base font-bold text-white">={formatFcfa(summary.netProfit)}</span>
              <span className="text-[10px] text-[#FAF8F5]/50 block mt-0.5">Disponible pour réinvestissement</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 CARTES DE STATS FINANCIÈRES UNIFIÉES */}
      <StatCardsGrid id="finances-stat-cards-grid">
        <StatCard
          id="stat-card-finance-revenue"
          label="Revenus Encaissés"
          numericValue={summary.collectedRevenue}
          currency="FCFA"
          hint="CA réel encaissé en espèces"
          icon={Wallet}
        />

        <StatCard
          id="stat-card-finance-deliveries"
          label="Livraisons Faites"
          numericValue={summary.deliveredCount}
          unit="colis"
          hint="Payées à la livraison"
          icon={Truck}
        />

        <StatCard
          id="stat-card-finance-cogs"
          label="Coût des Produits"
          numericValue={summary.productCost}
          currency="FCFA"
          hint="Revient × livrées"
          icon={Package}
        />

        <StatCard
          id="stat-card-finance-marketing-shipping"
          label="Frais Pub & Livraison"
          numericValue={summary.adSpend + summary.shippingCost}
          currency="FCFA"
          hint="Ads Meta & courses livreurs"
          icon={DollarSign}
        />

        <StatCard
          id="stat-card-finance-net-profit"
          label="Bénéfice Net Réel"
          numericValue={summary.netProfit}
          currency="FCFA"
          hint="Résultat réel en poche"
          icon={TrendingUp}
        />
      </StatCardsGrid>

      {/* TABLEAU : DÉTAIL DU CALCUL */}
      <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] overflow-hidden shadow-2xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-[#111111] uppercase tracking-wide">
              Détail du Calcul de Rentabilité
            </h2>
            <p className="text-xs text-[#666660]">
              Décomposition transparente poste par poste pour la période sélectionnée.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-black/[0.04] text-[#111111]">
            Période : {period === "last7" ? "7 derniers jours" : period === "last30" ? "30 derniers jours" : "Aujourd'hui"}
          </span>
        </div>

        <div className="border border-black/[0.08] rounded-2xl bg-white overflow-hidden divide-y divide-black/[0.06] text-xs">
          {/* Ligne 1 : Encaissé */}
          <div className="p-3.5 flex items-center justify-between bg-emerald-50/40">
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                +
              </span>
              <div>
                <span className="font-bold text-[#111111] block">Chiffre d'affaires Encaissé (COD)</span>
                <span className="text-[10px] text-[#666660]">Espèces collectées auprès des clients à la livraison</span>
              </div>
            </div>
            <span className="font-black text-sm text-emerald-700">+{formatFcfa(summary.collectedRevenue)}</span>
          </div>

          {/* Ligne 2 : Coût produits */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-lg bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center">
                −
              </span>
              <div>
                <span className="font-bold text-[#111111] block">Coût d'achat des produits livrés</span>
                <span className="text-[10px] text-[#666660]">Prix de revient × {summary.deliveredCount} commandes livrées</span>
              </div>
            </div>
            <span className="font-bold text-xs text-rose-600">−{formatFcfa(summary.productCost)}</span>
          </div>

          {/* Ligne 3 : Frais de pub */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-lg bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center">
                −
              </span>
              <div>
                <span className="font-bold text-[#111111] block">Dépenses publicitaires (Ads)</span>
                <span className="text-[10px] text-[#666660]">Budgets consommés sur Meta Ads & TikTok Ads</span>
              </div>
            </div>
            <span className="font-bold text-xs text-rose-600">−{formatFcfa(summary.adSpend)}</span>
          </div>

          {/* Ligne 4 : Frais de livraison */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-lg bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center">
                −
              </span>
              <div>
                <span className="font-bold text-[#111111] block">Frais de livraison payés</span>
                <span className="text-[10px] text-[#666660]">Courses versées aux livreurs et agences de transport</span>
              </div>
            </div>
            <span className="font-bold text-xs text-rose-600">−{formatFcfa(summary.shippingCost)}</span>
          </div>

          {/* Ligne 5 : Autres dépenses */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-lg bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center">
                −
              </span>
              <div>
                <span className="font-bold text-[#111111] block">Autres charges d'exploitation</span>
                <span className="text-[10px] text-[#666660]">Pochettes colis kraft, abonnements et primes</span>
              </div>
            </div>
            <span className="font-bold text-xs text-rose-600">−{formatFcfa(summary.otherExpenses)}</span>
          </div>

          {/* Ligne Totale : Résultat Net */}
          <div className="p-4 flex items-center justify-between bg-[#111111] text-[#FAF8F5]">
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-lg bg-emerald-500 text-black font-black text-xs flex items-center justify-center">
                =
              </span>
              <div>
                <span className="font-black text-sm uppercase block">RÉSULTAT NET (Bénéfice en poche)</span>
                <span className="text-[10px] text-[#FAF8F5]/60">Ce montant vous appartient et est déjà encaissé</span>
              </div>
            </div>
            <span className="font-black text-lg text-emerald-400">+{formatFcfa(summary.netProfit)}</span>
          </div>
        </div>
      </div>

      {/* SECTION DÉPENSES (Formulaire d'ajout, modifier, supprimer) */}
      <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-[#111111] uppercase tracking-wide">
              Gestion des Dépenses Réelles
            </h2>
            <p className="text-xs text-[#666660]">
              Enregistrez vos coûts publicitaires, emballages et charges pour un résultat net exact.
            </p>
          </div>
          <button
            onClick={handleOpenAddExpense}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all cursor-pointer shadow-sm self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une dépense</span>
          </button>
        </div>

        {/* Modal Ajout / Modification Dépense */}
        {showAddExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-[#FAF8F5] border border-black/[0.12] rounded-[24px] p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-sm font-black text-[#111111]">
                {editingExpenseId ? "Modifier la dépense" : "Ajouter une nouvelle dépense"}
              </h3>

              <form onSubmit={handleSaveExpense} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1">
                    Libellé de la dépense <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={expLabel}
                    onChange={(e) => setExpLabel(e.target.value)}
                    placeholder="Ex: Facture Publicité Meta 14 Novembre"
                    className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#111111] mb-1">
                      Montant (FCFA) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="500"
                      required
                      value={expAmount || ""}
                      onChange={(e) => setExpAmount(Number(e.target.value) || 0)}
                      placeholder="Ex: 50000"
                      className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#111111] mb-1">
                      Date
                    </label>
                    <input
                      type="text"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      placeholder="JJ/MM/AAAA"
                      className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1">
                    Catégorie de charge
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e: any) => setExpCategory(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                  >
                    <option value="ads">Publicité Meta / TikTok</option>
                    <option value="packaging">Emballage & Colisage</option>
                    <option value="software">Logiciels & WhatsApp</option>
                    <option value="salary">Commissions Closeuses / Équipe</option>
                    <option value="shipping">Livraison spécifique</option>
                    <option value="other">Autre charge diverse</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-black/[0.08] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddExpenseModal(false)}
                    className="px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black"
                  >
                    {editingExpenseId ? "Mettre à jour" : "Enregistrer la dépense"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Liste des dépenses */}
        <div className="border border-black/[0.08] rounded-2xl bg-white overflow-hidden divide-y divide-black/[0.06] text-xs">
          {expenses.map((item) => (
            <div
              key={item.id}
              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.015] transition-colors"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#111111]">{item.label}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/[0.05] text-[#111111]">
                    {item.categoryLabel}
                  </span>
                </div>
                <div className="text-[10px] text-[#888880] flex items-center gap-2">
                  <span>Date : {item.date}</span>
                  {item.notes && <span>• {item.notes}</span>}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="font-black text-sm text-[#111111]">
                  {formatFcfa(item.amount)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditExpense(item)}
                    className="p-1.5 rounded-lg border border-black/[0.08] text-[#111111] hover:bg-[#FAF8F5]"
                    title="Modifier"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(item.id)}
                    className="p-1.5 rounded-lg border border-black/[0.08] text-rose-600 hover:bg-rose-50"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION FRAIS DE LIVRAISON */}
      <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-5 sm:p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-black text-[#111111] uppercase tracking-wide flex items-center gap-2">
            <Truck className="h-4 w-4 text-[#111111]" />
            Frais de Livraison Payés par le Vendeur
          </h2>
          <p className="text-xs text-[#666660]">
            Coûts des tournées et courses payées aux livreurs partenaires par zone géographique.
          </p>
        </div>

        <div className="p-6 text-center rounded-2xl bg-white border border-black/[0.06] text-xs text-[#888880] space-y-1">
          <p className="font-bold text-[#111111]">Aucun frais de livraison forfaitaire enregistré.</p>
          <p>Configurez vos tarifs de livraison par pays et ville dans le module Livraisons &gt; Tarifs.</p>
        </div>
      </div>

      {/* SECTION LIVRE DE COMPTE (ENTRÉES, SORTIES, RETRAITS) */}
      <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-5 sm:p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-black text-[#111111] uppercase tracking-wide flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[#111111]" />
            Livre de Compte & Flux de Trésorerie
          </h2>
          <p className="text-xs text-[#666660]">
            Registre chronologique des espèces encaissées, règlements fournisseurs et prélèvements.
          </p>
        </div>

        {/* ALERTE CRUCIALE DEMANDÉE DANS LE PROMPT 5.B : LES RETRAITS NE COMPTENT PAS DANS LE RÉSULTAT NET */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-900 block">
              Règle comptable COD essentielle :
            </span>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Les <strong>retraits du propriétaire</strong> (virements vers un compte personnel ou prélèvements de bénéfices) sont des mouvements de trésorerie personnelle. <strong>Ils ne constituent pas une charge d'exploitation et ne diminuent en aucun cas votre résultat net.</strong>
            </p>
          </div>
        </div>

        {/* Tableau du livre de compte */}
        <div className="border border-black/[0.08] rounded-2xl bg-white overflow-hidden divide-y divide-black/[0.06] text-xs">
          {cashbook.map((entry) => {
            const isEntry = entry.type === "entry";
            const isWithdrawal = entry.type === "withdrawal";

            return (
              <div
                key={entry.id}
                className={cn(
                  "p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors",
                  isWithdrawal ? "bg-amber-50/30" : "hover:bg-black/[0.015]"
                )}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {isEntry ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 uppercase">
                        Entrée
                      </span>
                    ) : isWithdrawal ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-900 uppercase">
                        Retrait Perso
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-800 uppercase">
                        Sortie
                      </span>
                    )}
                    <span className="font-bold text-[#111111]">{entry.label}</span>
                  </div>
                  <div className="text-[10px] text-[#888880] flex items-center gap-2">
                    <span>{entry.date}</span>
                    <span>• {entry.category}</span>
                    {entry.notes && <span className="italic">({entry.notes})</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span
                    className={cn(
                      "font-black text-sm",
                      isEntry
                        ? "text-emerald-700"
                        : isWithdrawal
                        ? "text-amber-900"
                        : "text-rose-600"
                    )}
                  >
                    {isEntry ? "+" : "−"}
                    {formatFcfa(entry.amount)}
                  </span>
                  {!entry.impactsNetProfit && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      Hors résultat net
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
