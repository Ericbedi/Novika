"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, MessageCircle, Pencil, Plus, Trash2, Truck } from "lucide-react";
import { formatFcfa } from "@/lib/money";
import { whatsappLink } from "@/lib/phone";
import type { RiderRow } from "@/lib/orders-api";

interface Draft {
  id?: string;
  name: string;
  phone: string;
  city: string;
  default_fee: string;
}
const EMPTY: Draft = { name: "", phone: "", city: "", default_fee: "1000" };

export function RidersClient({ storeSlug }: { storeSlug: string }) {
  const [riders, setRiders] = useState<RiderRow[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/riders?store=${encodeURIComponent(storeSlug)}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Lecture impossible.");
      setRiders(data.riders);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lecture impossible.");
      setRiders([]);
    }
  }, [storeSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/riders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store: storeSlug,
        rider: { id: draft.id, name: draft.name, phone: draft.phone, city: draft.city, default_fee: Number(draft.default_fee) || 0 },
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !data.success) return setError(data.error || "Enregistrement impossible.");
    setDraft(null);
    void load();
  };

  const toggle = async (r: RiderRow) => {
    await fetch("/api/riders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store: storeSlug, rider: { ...r, active: !r.active } }),
    });
    void load();
  };

  const remove = async (r: RiderRow) => {
    if (!window.confirm(`Supprimer le livreur ${r.name} ? Les commandes déjà livrées sont conservées.`)) return;
    await fetch(`/api/riders?store=${encodeURIComponent(storeSlug)}&id=${r.id}`, { method: "DELETE" });
    void load();
  };

  const input = "w-full h-11 px-3 rounded-xl border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/20";

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#111111] flex items-center gap-2">
            <Truck className="w-5 h-5" /> Livreurs
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">Vos livreurs, leur tarif par course et leurs livraisons.</p>
        </div>
        <button
          type="button"
          onClick={() => setDraft({ ...EMPTY })}
          className="h-10 px-4 rounded-xl bg-[#111111] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">{error}</div>}

      {draft && (
        <form onSubmit={save} className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-4 space-y-3">
          <h2 className="text-sm font-bold">{draft.id ? "Modifier le livreur" : "Nouveau livreur"}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input className={input} placeholder="Nom *" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
            <input className={input} placeholder="Téléphone avec indicatif * (+22890…)" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} required inputMode="tel" />
            <input className={input} placeholder="Ville / zone" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
            <input className={input} placeholder="Frais par course (FCFA)" value={draft.default_fee} onChange={(e) => setDraft({ ...draft, default_fee: e.target.value.replace(/\D/g, "") })} inputMode="numeric" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setDraft(null)} className="h-10 px-4 rounded-xl border border-black/10 bg-white text-xs font-bold cursor-pointer">
              Annuler
            </button>
            <button type="submit" disabled={busy} className="h-10 px-4 rounded-xl bg-[#111111] text-white text-xs font-bold cursor-pointer disabled:opacity-50">
              {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      )}

      {riders === null ? (
        <div className="py-10 text-center text-sm text-[#7A7A7A] flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
        </div>
      ) : riders.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-black/15 p-8 text-center text-sm text-[#666660]">
          Aucun livreur pour l'instant. Ajoutez le premier pour pouvoir lui affecter des commandes.
        </div>
      ) : (
        <div className="space-y-3">
          {riders.map((r) => (
            <div key={r.id} className={`rounded-[20px] border border-black/[0.08] bg-white p-4 ${r.active ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-[#111111] truncate">{r.name}</div>
                  <div className="text-xs text-[#666660] font-mono">{r.phone}</div>
                  <div className="text-xs text-[#666660] mt-0.5">
                    {r.city || "Ville non précisée"} · {formatFcfa(r.default_fee)} par course
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={whatsappLink(r.phone, `Bonjour ${r.name},`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-50"
                    aria-label="Écrire sur WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <button type="button" aria-label="Modifier" onClick={() => setDraft({ id: r.id, name: r.name, phone: r.phone, city: r.city || "", default_fee: String(r.default_fee) })} className="p-2 rounded-lg hover:bg-[#F4F4F0] cursor-pointer">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" aria-label="Supprimer" onClick={() => remove(r)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex gap-3 text-[#555550]">
                  <span><b className="text-[#111111]">{r.active_count}</b> en cours</span>
                  <span><b className="text-emerald-700">{r.delivered_count}</b> livrées</span>
                  <span><b className="text-rose-600">{r.failed_count}</b> échecs</span>
                </div>
                <button type="button" onClick={() => toggle(r)} className="px-3 h-8 rounded-lg border border-black/10 font-semibold cursor-pointer">
                  {r.active ? "Désactiver" : "Réactiver"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
