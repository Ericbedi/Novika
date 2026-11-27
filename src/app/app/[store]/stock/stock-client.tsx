"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, Package } from "lucide-react";
import { ProductsNavTabs } from "@/components/products/products-nav-tabs";

interface Prod {
  id: string;
  title: string;
  sku: string | null;
  stock: number;
  threshold: number;
  track: boolean;
}
interface Move {
  id: string;
  title: string;
  delta: number;
  new_stock: number;
  label: string;
  author: string;
  notes: string | null;
  created_at: string;
}

type Mode = "set" | "add" | "remove";
const MODES: { id: Mode; label: string }[] = [
  { id: "add", label: "Ajouter" },
  { id: "remove", label: "Retirer" },
  { id: "set", label: "Fixer à" },
];

export function StockClient({ storeSlug }: { storeSlug: string }) {
  const [products, setProducts] = useState<Prod[] | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("add");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("purchase_receipt");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"levels" | "history">("levels");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/stock?store=${encodeURIComponent(storeSlug)}`);
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.error || "Lecture impossible.");
      setProducts(d.products);
      setMoves(d.movements);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lecture impossible.");
      setProducts([]);
    }
  }, [storeSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const open = (id: string) => {
    setEditing(editing === id ? null : id);
    setMode("add");
    setQty("");
    setReason("purchase_receipt");
  };

  const apply = async (p: Prod) => {
    if (qty === "") return;
    setBusy(true);
    const res = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store: storeSlug, productId: p.id, mode, qty: Number(qty), reason: mode === "set" ? "inventory_adjustment" : reason }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !d.success) return setError(d.error || "Ajustement impossible.");
    setEditing(null);
    setError("");
    void load();
  };

  const low = (products || []).filter((p) => p.track && p.stock <= p.threshold);

  return (
    <div className="space-y-4 pb-24">
      <ProductsNavTabs storeSlug={storeSlug} />
      <div className="max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#111111] flex items-center gap-2"><Package className="w-5 h-5" /> Stock</h1>
          <p className="text-xs text-[#666660] mt-0.5">Le stock baisse automatiquement quand une commande passe en « Livrée », et remonte si elle est retournée.</p>
        </div>

        {low.length > 0 && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Stock bas ou épuisé : {low.map((p) => `${p.title.slice(0, 40)} (${p.stock})`).join(", ")}</span>
          </div>
        )}

        <div className="flex gap-1.5">
          {([["levels", "Niveaux"], ["history", "Historique"]] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)} className={`h-10 px-4 rounded-xl text-xs font-bold cursor-pointer border ${tab === id ? "bg-[#1F3A26] text-white border-[#111111]" : "bg-white border-black/10"}`}>{label}</button>
          ))}
        </div>

        {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">{error}</div>}

        {products === null ? (
          <div className="py-10 text-center text-sm text-[#7A7A7A] flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</div>
        ) : tab === "levels" ? (
          products.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-black/15 p-8 text-center text-sm text-[#666660]">Aucun produit. Créez un produit pour suivre son stock.</div>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="rounded-[20px] border border-black/[0.08] bg-white p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{p.title}</div>
                      <div className="text-[11px] text-[#7A7A7A]">{p.sku ? `Réf. ${p.sku}` : "Sans référence"}{!p.track && " · stock non suivi"}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-2xl font-black ${p.track && p.stock <= 0 ? "text-rose-600" : p.track && p.stock <= p.threshold ? "text-amber-600" : "text-[#111111]"}`}>{p.stock}</div>
                      <div className="text-[10px] text-[#7A7A7A]">en stock</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => open(p.id)} className="h-9 px-4 rounded-lg border border-black/10 text-xs font-bold cursor-pointer">{editing === p.id ? "Fermer" : "Ajuster le stock"}</button>
                  {editing === p.id && (
                    <div className="rounded-xl bg-[#FAF8F5] p-3 space-y-2.5">
                      <div className="flex gap-1.5">
                        {MODES.map((m) => (
                          <button key={m.id} type="button" onClick={() => setMode(m.id)} className={`flex-1 h-9 rounded-lg text-xs font-bold cursor-pointer border ${mode === m.id ? "bg-[#1F3A26] text-white border-[#111111]" : "bg-white border-black/10"}`}>{m.label}</button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Quantité" className="w-28 h-11 px-3 rounded-xl border border-black/10 bg-white text-sm" />
                        {mode !== "set" && (
                          <select value={reason} onChange={(e) => setReason(e.target.value)} className="flex-1 h-11 px-2 rounded-xl border border-black/10 bg-white text-sm">
                            {mode === "add" ? <option value="purchase_receipt">Réception de marchandise</option> : <option value="loss_damage">Perte / casse</option>}
                            <option value="inventory_adjustment">Correction d'inventaire</option>
                          </select>
                        )}
                        <button type="button" disabled={busy || qty === ""} onClick={() => apply(p)} className="h-11 px-4 rounded-xl bg-[#1F3A26] text-white text-xs font-bold cursor-pointer disabled:opacity-40">{busy ? "…" : "Valider"}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : moves.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-black/15 p-8 text-center text-sm text-[#666660]">Aucun mouvement de stock pour l'instant.</div>
        ) : (
          <div className="rounded-[20px] border border-black/[0.08] bg-white divide-y divide-black/[0.06]">
            {moves.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{m.title}</div>
                  <div className="text-[11px] text-[#7A7A7A] truncate">{m.label} · {new Date(m.created_at).toLocaleString("fr-FR")} · {m.author}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-bold ${m.delta < 0 ? "text-rose-600" : "text-emerald-700"}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</div>
                  <div className="text-[10px] text-[#7A7A7A]">reste {m.new_stock}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
