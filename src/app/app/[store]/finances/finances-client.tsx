"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { formatFcfa } from "@/lib/money";

interface Summary {
  revenue: number;
  product_cost: number;
  rider_fees: number;
  expenses: number;
  net_profit: number;
  delivered_count: number;
  orders_count: number;
  failed_count: number;
  cash_in_transit: number;
  by_category: Record<string, number>;
}
interface Expense {
  id: string;
  category: string;
  amount: number;
  spent_on: string;
  note: string | null;
}

const CATS: Record<string, string> = { pub: "Publicité", stock: "Achat de stock", salaire: "Salaires / commissions", loyer: "Loyer", transport: "Transport", autre: "Autre" };
const PERIODS = [
  { id: "today", label: "Aujourd'hui" },
  { id: "7", label: "7 jours" },
  { id: "30", label: "30 jours" },
  { id: "month", label: "Ce mois" },
] as const;

const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
function range(p: string): { from: string; to: string } {
  const now = new Date();
  const to = iso(now);
  if (p === "today") return { from: to, to };
  if (p === "month") return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to };
  const n = Number(p) - 1;
  return { from: iso(new Date(now.getTime() - n * 86400000)), to };
}

export function FinancesClient({ storeSlug }: { storeSlug: string }) {
  const [period, setPeriod] = useState<string>("30");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState("");
  const [cat, setCat] = useState("pub");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const r = useMemo(() => range(period), [period]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/finance?store=${encodeURIComponent(storeSlug)}&from=${r.from}&to=${r.to}`);
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.error || "Lecture impossible.");
      setSummary(d.summary);
      setExpenses(d.expenses);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lecture impossible.");
      setSummary((s) => s);
    }
  }, [storeSlug, r]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store: storeSlug, expense: { category: cat, amount: Number(amount), note } }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !d.success) return setError(d.error || "Enregistrement impossible.");
    setAmount("");
    setNote("");
    void load();
  };

  const del = async (x: Expense) => {
    await fetch(`/api/finance?store=${encodeURIComponent(storeSlug)}&id=${x.id}`, { method: "DELETE" });
    void load();
  };

  const input = "h-11 px-3 rounded-xl border border-black/10 bg-white text-sm";
  const profit = summary?.net_profit ?? 0;
  const margin = summary && summary.revenue > 0 ? Math.round((profit / summary.revenue) * 100) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-24">
      <div>
        <h1 className="text-xl font-extrabold text-[#111111]">Finances</h1>
        <p className="text-xs text-[#666660] mt-0.5">Calculé uniquement sur les commandes livrées et l'argent réellement encaissé.</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {PERIODS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPeriod(p.id)} className={`shrink-0 h-10 px-4 rounded-xl text-xs font-bold cursor-pointer border ${period === p.id ? "bg-[#1F3A26] text-white border-[#111111]" : "bg-white border-black/10"}`}>
            {p.label}
          </button>
        ))}
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">{error}</div>}

      {!summary ? (
        !error && (
          <div className="py-10 text-center text-sm text-[#7A7A7A] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
          </div>
        )
      ) : (
        <>
          <div className={`rounded-[24px] p-5 border ${profit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
            <div className="text-xs font-semibold text-[#555550] flex items-center gap-1.5">
              {profit >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-700" /> : <TrendingDown className="w-4 h-4 text-rose-700" />} Bénéfice net réel
            </div>
            <div className={`text-3xl font-black mt-1 ${profit >= 0 ? "text-emerald-800" : "text-rose-800"}`}>{formatFcfa(profit)}</div>
            <div className="text-xs text-[#666660] mt-1">
              {summary.delivered_count} livraison{summary.delivered_count > 1 ? "s" : ""} réussie{summary.delivered_count > 1 ? "s" : ""}
              {margin !== null && ` · marge ${margin} %`}
            </div>
          </div>

          <div className="rounded-[20px] border border-black/[0.08] bg-white divide-y divide-black/[0.06] text-sm">
            <Row label="Argent encaissé (livrées)" value={summary.revenue} bold />
            <Row label="− Coût d'achat des produits" value={-summary.product_cost} />
            <Row label="− Frais des livreurs" value={-summary.rider_fees} />
            <Row label="− Dépenses (pub, loyer, salaires…)" value={-summary.expenses} />
            <Row label="= Bénéfice net" value={profit} bold />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Commandes" value={String(summary.orders_count)} />
            <Stat label="Échecs / retours" value={String(summary.failed_count)} />
            <Stat label="En cours chez livreurs" value={formatFcfa(summary.cash_in_transit)} />
          </div>
          {summary.product_cost === 0 && summary.delivered_count > 0 && (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
              Le prix d'achat de vos produits est à 0 : renseignez-le dans la fiche produit pour que le bénéfice soit exact.
            </p>
          )}
        </>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-bold">Ajouter une dépense</h2>
        <form onSubmit={add} className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-4 grid sm:grid-cols-[1fr_9rem_1fr_auto] gap-2.5">
          <select className={input} value={cat} onChange={(e) => setCat(e.target.value)}>
            {Object.entries(CATS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input className={input} placeholder="Montant" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} required />
          <input className={input} placeholder="Note (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
          <button type="submit" disabled={busy} className="h-11 px-4 rounded-xl bg-[#1F3A26] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </form>

        {expenses.length === 0 ? (
          <p className="text-xs text-[#7A7A7A]">Aucune dépense sur cette période.</p>
        ) : (
          <div className="rounded-[20px] border border-black/[0.08] bg-white divide-y divide-black/[0.06]">
            {expenses.map((x) => (
              <div key={x.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{CATS[x.category] || x.category}</div>
                  <div className="text-[11px] text-[#7A7A7A] truncate">{new Date(x.spent_on).toLocaleDateString("fr-FR")}{x.note ? ` · ${x.note}` : ""}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-sm">{formatFcfa(x.amount)}</span>
                  <button type="button" aria-label="Supprimer" onClick={() => del(x)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between px-4 py-3 ${bold ? "font-bold" : ""}`}>
      <span>{label}</span>
      <span className="font-mono">{formatFcfa(value)}</span>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white p-3">
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[10px] text-[#7A7A7A] mt-0.5">{label}</div>
    </div>
  );
}
