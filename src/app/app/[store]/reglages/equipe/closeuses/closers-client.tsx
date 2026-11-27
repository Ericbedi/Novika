"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle, Pencil, Plus, Trash2, Users } from "lucide-react";
import { formatFcfa } from "@/lib/money";
import { whatsappLink } from "@/lib/phone";
import type { CloserRow } from "@/lib/orders-api";

interface Draft {
  id?: string;
  name: string;
  phone: string;
  country: string;
  commission: string;
}
const EMPTY: Draft = { name: "", phone: "", country: "TG", commission: "500" };
const PERIODS = [
  { id: "7", label: "7 jours" },
  { id: "30", label: "30 jours" },
  { id: "month", label: "Ce mois" },
  { id: "all", label: "Tout" },
] as const;

const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
function range(p: string) {
  const now = new Date();
  const to = iso(now);
  if (p === "all") return { from: "2000-01-01", to };
  if (p === "month") return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to };
  return { from: iso(new Date(now.getTime() - (Number(p) - 1) * 86400000)), to };
}

export function ClosersClient({ storeSlug }: { storeSlug: string }) {
  const [closers, setClosers] = useState<CloserRow[] | null>(null);
  const [period, setPeriod] = useState("30");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => range(period), [period]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/closers?store=${encodeURIComponent(storeSlug)}&from=${r.from}&to=${r.to}`);
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.error || "Lecture impossible.");
      setClosers(d.closers);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lecture impossible.");
      setClosers([]);
    }
  }, [storeSlug, r]);

  useEffect(() => {
    void load();
  }, [load]);

  const post = (closer: Record<string, unknown>) =>
    fetch("/api/closers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store: storeSlug, closer }) }).then((x) => x.json().catch(() => ({})));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    const d = await post({ id: draft.id, name: draft.name, phone: draft.phone, country: draft.country, commission: Number(draft.commission) || 0 });
    setBusy(false);
    if (!d.success) return setError(d.error || "Enregistrement impossible.");
    setDraft(null);
    setError("");
    void load();
  };
  const toggle = async (c: CloserRow) => {
    await post({ ...c, active: !c.active });
    void load();
  };
  const remove = async (c: CloserRow) => {
    if (!window.confirm(`Supprimer ${c.name} ? Ses commandes restent, sans closeuse affectée.`)) return;
    await fetch(`/api/closers?store=${encodeURIComponent(storeSlug)}&id=${c.id}`, { method: "DELETE" });
    void load();
  };

  const total = (closers || []).reduce((s, c) => s + c.delivered * c.commission, 0);
  const input = "w-full h-11 px-3 rounded-xl border border-black/10 bg-white text-sm";

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-24">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#111111] flex items-center gap-2"><Users className="w-5 h-5" /> Closeuses</h1>
          <p className="text-xs text-[#666660] mt-0.5">Qui confirme les commandes, leurs résultats et la commission due par livraison réussie.</p>
        </div>
        <button type="button" onClick={() => setDraft({ ...EMPTY })} className="h-10 px-4 rounded-xl bg-[#111111] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {PERIODS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPeriod(p.id)} className={`shrink-0 h-10 px-4 rounded-xl text-xs font-bold cursor-pointer border ${period === p.id ? "bg-[#111111] text-white border-[#111111]" : "bg-white border-black/10"}`}>
            {p.label}
          </button>
        ))}
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">{error}</div>}

      {draft && (
        <form onSubmit={save} className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-4 space-y-3">
          <h2 className="text-sm font-bold">{draft.id ? "Modifier la closeuse" : "Nouvelle closeuse"}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input className={input} placeholder="Nom *" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
            <input className={input} placeholder="Téléphone (+22890…)" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} inputMode="tel" />
            <select className={input} value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })}>
              <option value="TG">Togo</option>
              <option value="CI">Côte d'Ivoire</option>
              <option value="SN">Sénégal</option>
              <option value="BJ">Bénin</option>
            </select>
            <input className={input} placeholder="Commission par livraison (FCFA)" value={draft.commission} onChange={(e) => setDraft({ ...draft, commission: e.target.value.replace(/\D/g, "") })} inputMode="numeric" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setDraft(null)} className="h-10 px-4 rounded-xl border border-black/10 bg-white text-xs font-bold cursor-pointer">Annuler</button>
            <button type="submit" disabled={busy} className="h-10 px-4 rounded-xl bg-[#111111] text-white text-xs font-bold cursor-pointer disabled:opacity-50">{busy ? "Enregistrement…" : "Enregistrer"}</button>
          </div>
        </form>
      )}

      {closers === null ? (
        <div className="py-10 text-center text-sm text-[#7A7A7A] flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</div>
      ) : closers.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-black/15 p-8 text-center text-sm text-[#666660]">Aucune closeuse. Ajoutez-en une, puis affectez-lui des commandes depuis la fiche commande.</div>
      ) : (
        <>
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between text-sm">
            <span>Commissions dues sur la période</span>
            <b>{formatFcfa(total)}</b>
          </div>
          <div className="space-y-3">
            {closers.map((c) => {
              const done = c.delivered + c.failed;
              const rate = done > 0 ? Math.round((c.delivered / done) * 100) : null;
              return (
                <div key={c.id} className={`rounded-[20px] border border-black/[0.08] bg-white p-4 ${c.active ? "" : "opacity-60"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold truncate">{c.name}</div>
                      <div className="text-xs text-[#666660]">{c.country || "—"} · {formatFcfa(c.commission)} par livraison</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {c.phone && (
                        <a href={whatsappLink(c.phone, `Bonjour ${c.name},`)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-50" aria-label="WhatsApp"><MessageCircle className="w-4 h-4" /></a>
                      )}
                      <button type="button" aria-label="Modifier" onClick={() => setDraft({ id: c.id, name: c.name, phone: c.phone || "", country: c.country || "TG", commission: String(c.commission) })} className="p-2 rounded-lg hover:bg-[#F4F4F0] cursor-pointer"><Pencil className="w-4 h-4" /></button>
                      <button type="button" aria-label="Supprimer" onClick={() => remove(c)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
                    <Cell label="Affectées" value={String(c.assigned)} />
                    <Cell label="Livrées" value={String(c.delivered)} />
                    <Cell label="Taux" value={rate === null ? "—" : `${rate} %`} />
                    <Cell label="Commission" value={formatFcfa(c.delivered * c.commission)} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#666660]">
                    <span>Chiffre livré : <b className="text-[#111111]">{formatFcfa(c.revenue)}</b></span>
                    <button type="button" onClick={() => toggle(c)} className="px-3 h-8 rounded-lg border border-black/10 font-semibold cursor-pointer">{c.active ? "Désactiver" : "Réactiver"}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#FAF8F5] py-2">
      <div className="font-bold text-sm">{value}</div>
      <div className="text-[10px] text-[#7A7A7A]">{label}</div>
    </div>
  );
}
