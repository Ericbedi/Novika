"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, Phone, Search, Users } from "lucide-react";
import { formatFcfa } from "@/lib/money";
import { telLink, whatsappLink } from "@/lib/phone";
import type { Customer } from "@/server/data/types";

type Row = Customer & { deliveredCount?: number; failedCount?: number };
type Filter = "all" | "vip" | "regular" | "new" | "risk";

const LABELS: Record<Filter, string> = { all: "Tous", vip: "VIP", regular: "Réguliers", new: "Nouveaux", risk: "À risque" };
const BADGE: Record<string, string> = {
  vip: "bg-amber-100 text-amber-900",
  regular: "bg-blue-100 text-blue-900",
  new: "bg-neutral-200 text-neutral-800",
  risk: "bg-rose-100 text-rose-800",
};

export function CustomersClient({ storeSlug }: { storeSlug: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/customers?store=${encodeURIComponent(storeSlug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d?.success) throw new Error(d?.error || "Lecture impossible.");
        setRows(d.customers);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Lecture impossible.");
        setRows([]);
      });
  }, [storeSlug]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || []).filter((c) => (filter === "all" || c.status === filter) && (!s || `${c.name} ${c.phone} ${c.city}`.toLowerCase().includes(s)));
  }, [rows, filter, q]);

  const total = (rows || []).reduce((a, c) => a + c.totalSpent, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-24">
      <div>
        <h1 className="text-xl font-extrabold text-[#111111] flex items-center gap-2"><Users className="w-5 h-5" /> Clients</h1>
        <p className="text-xs text-[#666660] mt-0.5">Créés automatiquement à chaque commande. Le total dépensé ne compte que les commandes livrées.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl border border-black/[0.08] bg-white p-3"><div className="font-bold">{(rows || []).length}</div><div className="text-[10px] text-[#7A7A7A]">Clients</div></div>
        <div className="rounded-2xl border border-black/[0.08] bg-white p-3"><div className="font-bold">{formatFcfa(total)}</div><div className="text-[10px] text-[#7A7A7A]">Encaissé (livrées)</div></div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {(Object.keys(LABELS) as Filter[]).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`shrink-0 h-10 px-4 rounded-xl text-xs font-bold cursor-pointer border ${filter === f ? "bg-[#111111] text-white border-[#111111]" : "bg-white border-black/10"}`}>
            {LABELS[f]}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#999990]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, téléphone ou ville" className="w-full h-11 pl-9 pr-3 rounded-xl border border-black/10 bg-white text-sm" />
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">{error}</div>}

      {rows === null ? (
        <div className="py-10 text-center text-sm text-[#7A7A7A] flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</div>
      ) : list.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-black/15 p-8 text-center text-sm text-[#666660]">Aucun client pour l'instant. Ils apparaissent dès la première commande.</div>
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <div key={c.id} className="rounded-[20px] border border-black/[0.08] bg-white p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/app/${storeSlug}/clients/${c.id}`} className="min-w-0">
                  <div className="font-bold truncate hover:underline">{c.name}</div>
                  <div className="text-xs font-mono text-[#666660]">{c.phone}</div>
                  <div className="text-xs text-[#666660] truncate">{c.city}</div>
                </Link>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${BADGE[c.status]}`}>{LABELS[c.status as Filter]}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-[#FAF8F5] py-2"><div className="font-bold">{c.ordersCount}</div><div className="text-[10px] text-[#7A7A7A]">Commandes</div></div>
                <div className="rounded-xl bg-[#FAF8F5] py-2"><div className="font-bold">{c.deliveredCount ?? 0} / {c.failedCount ?? 0}</div><div className="text-[10px] text-[#7A7A7A]">Livrées / échecs</div></div>
                <div className="rounded-xl bg-[#FAF8F5] py-2"><div className="font-bold">{formatFcfa(c.totalSpent)}</div><div className="text-[10px] text-[#7A7A7A]">Dépensé</div></div>
              </div>
              <div className="flex gap-2">
                <a href={telLink(c.phone)} className="h-9 px-3 rounded-lg border border-black/10 text-xs font-semibold flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Appeler</a>
                <a href={whatsappLink(c.phone, `Bonjour ${c.name},`)} target="_blank" rel="noopener noreferrer" className="h-9 px-3 rounded-lg border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
