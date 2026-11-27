"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, MessageCircle, ShoppingCart, Trash2 } from "lucide-react";
import { whatsappLink } from "@/lib/phone";

interface Cart {
  id: string;
  phone: string;
  name: string | null;
  city: string | null;
  product_name: string | null;
  last_seen: string;
  contacted_at: string | null;
  recovered: boolean;
}

type Tab = "todo" | "contacted" | "recovered";

function ago(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `il y a ${m} min`;
  if (m < 1440) return `il y a ${Math.round(m / 60)} h`;
  return `il y a ${Math.round(m / 1440)} j`;
}

export function AbandonedClient({ storeSlug }: { storeSlug: string }) {
  const [carts, setCarts] = useState<Cart[] | null>(null);
  const [tab, setTab] = useState<Tab>("todo");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/carts?store=${encodeURIComponent(storeSlug)}`);
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.error || "Lecture impossible.");
      setCarts(d.carts);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lecture impossible.");
      setCarts([]);
    }
  }, [storeSlug]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 60000);
    return () => clearInterval(t);
  }, [load]);

  const act = async (id: string, action: "contacted" | "delete") => {
    await fetch("/api/carts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store: storeSlug, id, action }) });
    void load();
  };

  const list = (carts || []).filter((c) => (tab === "recovered" ? c.recovered : tab === "contacted" ? !c.recovered && c.contacted_at : !c.recovered && !c.contacted_at));
  const count = (t: Tab) => (carts || []).filter((c) => (t === "recovered" ? c.recovered : t === "contacted" ? !c.recovered && c.contacted_at : !c.recovered && !c.contacted_at)).length;
  const msg = (c: Cart) =>
    `Bonjour ${c.name || ""}, vous avez commencé une commande${c.product_name ? ` pour « ${c.product_name} »` : ""} sur notre boutique. Souhaitez-vous la finaliser ? Paiement à la livraison.`;

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-24">
      <div>
        <h1 className="text-xl font-extrabold text-[#111111] flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Paniers abandonnés</h1>
        <p className="text-xs text-[#666660] mt-0.5">Clients qui ont saisi leur numéro sans valider la commande (30 derniers jours). Relancez-les sur WhatsApp.</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {([["todo", "À relancer"], ["contacted", "Relancés"], ["recovered", "Récupérés"]] as [Tab, string][]).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`shrink-0 h-10 px-4 rounded-xl text-xs font-bold cursor-pointer border ${tab === id ? "bg-[#111111] text-white border-[#111111]" : "bg-white border-black/10"}`}>
            {label} <span className="opacity-70">({count(id)})</span>
          </button>
        ))}
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">{error}</div>}

      {carts === null ? (
        <div className="py-10 text-center text-sm text-[#7A7A7A] flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</div>
      ) : list.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-black/15 p-8 text-center text-sm text-[#666660]">
          {tab === "todo" ? "Aucun panier à relancer pour l'instant. Les numéros apparaissent ici dès qu'un client commence le formulaire sans le valider." : "Rien dans cet onglet."}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <div key={c.id} className="rounded-[20px] border border-black/[0.08] bg-white p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold truncate">{c.name || "Client sans nom"}</div>
                  <div className="text-xs font-mono text-[#666660]">{c.phone}</div>
                  <div className="text-xs text-[#666660] mt-0.5 truncate">{c.product_name || "Produit non précisé"}{c.city ? ` · ${c.city}` : ""}</div>
                </div>
                <div className="text-[11px] text-[#7A7A7A] shrink-0">{ago(c.last_seen)}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {c.recovered ? (
                  <span className="h-9 px-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Commande passée</span>
                ) : (
                  <a href={whatsappLink(c.phone, msg(c))} target="_blank" rel="noopener noreferrer" onClick={() => void act(c.id, "contacted")} className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" /> {c.contacted_at ? "Relancer encore" : "Relancer sur WhatsApp"}
                  </a>
                )}
                <button type="button" aria-label="Supprimer" onClick={() => act(c.id, "delete")} className="h-10 px-3 rounded-xl border border-black/10 text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
