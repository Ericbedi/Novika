"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, MapPin, MessageCircle, Phone, Search, Truck, UserCheck, XCircle } from "lucide-react";
import { formatFcfa } from "@/lib/money";
import { telLink, whatsappLink } from "@/lib/phone";
import { assignOrderRider, mapApiOrder, persistOrderStatus, type RiderRow } from "@/lib/orders-api";
import type { Order } from "@/server/data/types";

type Tab = "assign" | "active" | "done" | "failed";

const TABS: { id: Tab; label: string; statuses: string[] }[] = [
  { id: "assign", label: "À assigner", statuses: ["confirmed", "prepared", "scheduled", "postponed"] },
  { id: "active", label: "En cours", statuses: ["shipped"] },
  { id: "done", label: "Livrées", statuses: ["delivered"] },
  { id: "failed", label: "Échecs", statuses: ["failed", "returned", "unreachable", "rejected", "lost_unreachable", "rejected_invalid_number"] },
];

const FAIL_REASONS = ["Client injoignable", "Client absent", "Adresse introuvable", "Client a refusé le colis", "Reporté par le client", "Autre"];

export function DeliveriesClient({ storeSlug }: { storeSlug: string }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [riders, setRiders] = useState<RiderRow[]>([]);
  const [tab, setTab] = useState<Tab>("assign");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [failing, setFailing] = useState<Order | null>(null);
  const [reason, setReason] = useState(FAIL_REASONS[0]);

  const load = useCallback(async () => {
    try {
      const [o, r] = await Promise.all([
        fetch(`/api/orders?store=${encodeURIComponent(storeSlug)}`).then((x) => x.json()),
        fetch(`/api/riders?store=${encodeURIComponent(storeSlug)}`).then((x) => x.json()),
      ]);
      if (!o?.success) throw new Error(o?.error || "Commandes illisibles.");
      setOrders((o.orders as unknown[]).map(mapApiOrder));
      if (r?.success) setRiders(r.riders);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
      setOrders([]);
    }
  }, [storeSlug]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 30000);
    return () => clearInterval(t);
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { assign: 0, active: 0, done: 0, failed: 0 };
    (orders || []).forEach((o) => {
      const t = TABS.find((x) => x.statuses.includes(o.status));
      if (t) c[t.id]++;
    });
    return c;
  }, [orders]);

  const list = useMemo(() => {
    const statuses = TABS.find((t) => t.id === tab)!.statuses;
    const q = query.trim().toLowerCase();
    return (orders || [])
      .filter((o) => statuses.includes(o.status))
      .filter((o) => !q || `${o.orderNumber} ${o.customerName} ${o.customerPhone} ${o.city}`.toLowerCase().includes(q))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [orders, tab, query]);

  const run = async (o: Order, fn: () => Promise<string | null>) => {
    setBusyId(o.orderNumber);
    setError("");
    const err = await fn();
    setBusyId(null);
    if (err) setError(err);
    await load();
  };

  const assign = (o: Order, riderId: string) => run(o, () => assignOrderRider(storeSlug, o.orderNumber, riderId || null));
  const setStatus = (o: Order, status: string, note?: string) => run(o, () => persistOrderStatus(storeSlug, o.orderNumber, status, note));

  const riderMessage = (o: Order) =>
    `Livraison ${o.orderNumber}\nClient : ${o.customerName} ${o.customerPhone}\nAdresse : ${[o.deliveryAddress, o.district, o.city].filter(Boolean).join(", ")}\nÀ encaisser : ${formatFcfa(o.totalAmount)}`;

  const activeRiders = riders.filter((r) => r.active);
  const base = `/app/${storeSlug}`;

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-24">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold text-[#111111] flex items-center gap-2">
          <Truck className="w-5 h-5" /> Livraisons
        </h1>
        <div className="flex gap-2 text-xs font-bold">
          <Link href={`${base}/livraisons/livreurs`} className="px-3 h-9 rounded-xl border border-black/10 bg-white flex items-center">Livreurs</Link>
          <Link href={`${base}/livraisons/tarifs`} className="px-3 h-9 rounded-xl border border-black/10 bg-white flex items-center">Tarifs</Link>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 h-10 px-4 rounded-xl text-xs font-bold cursor-pointer border ${tab === t.id ? "bg-[#111111] text-white border-[#111111]" : "bg-white border-black/10 text-[#333330]"}`}
          >
            {t.label} <span className="opacity-70">({counts[t.id]})</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#999990]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher (n°, client, téléphone, ville)" className="w-full h-11 pl-9 pr-3 rounded-xl border border-black/10 bg-white text-sm" />
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">{error}</div>}

      {tab === "assign" && activeRiders.length === 0 && orders !== null && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          Aucun livreur actif. <Link className="underline font-bold" href={`${base}/livraisons/livreurs`}>Ajoutez-en un</Link> pour affecter les commandes.
        </div>
      )}

      {orders === null ? (
        <div className="py-12 text-center text-sm text-[#7A7A7A] flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-black/15 p-8 text-center text-sm text-[#666660]">
          {tab === "assign" ? "Aucune commande à assigner. Confirmez des commandes pour les voir ici." : "Rien dans cet onglet."}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((o) => {
            const busy = busyId === o.orderNumber;
            return (
              <div key={o.orderNumber} className="rounded-[20px] border border-black/[0.08] bg-white p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`${base}/commandes/${o.orderNumber}`} className="font-bold text-sm text-[#111111] hover:underline">{o.orderNumber}</Link>
                    <div className="text-sm text-[#333330] truncate">{o.customerName}</div>
                    <div className="text-xs text-[#666660] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{[o.deliveryAddress, o.district, o.city].filter(Boolean).join(", ")}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm">{formatFcfa(o.totalAmount)}</div>
                    <div className="text-[10px] text-[#7A7A7A]">à encaisser</div>
                  </div>
                </div>

                {o.statusReason && tab === "failed" && (
                  <div className="text-xs text-rose-700 bg-rose-50 rounded-lg px-3 py-2">Motif : {o.statusReason}</div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <a href={telLink(o.customerPhone)} className="h-9 px-3 rounded-lg border border-black/10 text-xs font-semibold flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Appeler</a>
                  <a href={whatsappLink(o.customerPhone, `Bonjour ${o.customerName}, c'est à propos de votre commande ${o.orderNumber}.`)} target="_blank" rel="noopener noreferrer" className="h-9 px-3 rounded-lg border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> Client</a>
                  {o.assignedRider?.phone && (
                    <a href={whatsappLink(o.assignedRider.phone, riderMessage(o))} target="_blank" rel="noopener noreferrer" className="h-9 px-3 rounded-lg border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Envoyer au livreur</a>
                  )}
                </div>

                {(tab === "assign" || tab === "active") && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#666660] shrink-0" />
                    <select
                      disabled={busy}
                      value={o.assignedRider?.id || ""}
                      onChange={(e) => assign(o, e.target.value)}
                      className="flex-1 h-10 px-2 rounded-lg border border-black/10 bg-white text-sm"
                    >
                      <option value="">Aucun livreur</option>
                      {activeRiders.map((r) => (
                        <option key={r.id} value={r.id}>{r.name} · {formatFcfa(r.default_fee)}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {tab === "assign" && (
                    <button type="button" disabled={busy || !o.assignedRider} onClick={() => setStatus(o, "shipped")} className="h-10 px-4 rounded-xl bg-[#111111] text-white text-xs font-bold cursor-pointer disabled:opacity-40">
                      {busy ? "…" : o.assignedRider ? "Expédier" : "Choisir un livreur d'abord"}
                    </button>
                  )}
                  {tab === "active" && (
                    <>
                      <button type="button" disabled={busy} onClick={() => setStatus(o, "delivered")} className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                        <CheckCircle2 className="w-4 h-4" /> Livrée, argent encaissé
                      </button>
                      <button type="button" disabled={busy} onClick={() => { setFailing(o); setReason(FAIL_REASONS[0]); }} className="h-10 px-4 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                        <XCircle className="w-4 h-4" /> Échec
                      </button>
                    </>
                  )}
                  {tab === "failed" && (
                    <button type="button" disabled={busy} onClick={() => setStatus(o, "confirmed", "Relancée après échec")} className="h-10 px-4 rounded-xl border border-black/10 text-xs font-bold cursor-pointer disabled:opacity-50">
                      Relancer la livraison
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {failing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-3" onClick={() => setFailing(null)}>
          <div className="w-full max-w-sm bg-white rounded-[24px] p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold">Motif de l'échec · {failing.orderNumber}</h2>
            <div className="space-y-1.5">
              {FAIL_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={reason === r} onChange={() => setReason(r)} /> {r}
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setFailing(null)} className="h-10 px-4 rounded-xl border border-black/10 text-xs font-bold cursor-pointer">Annuler</button>
              <button
                type="button"
                onClick={() => { const o = failing; setFailing(null); void setStatus(o, "failed", reason); }}
                className="h-10 px-4 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Confirmer l'échec
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
