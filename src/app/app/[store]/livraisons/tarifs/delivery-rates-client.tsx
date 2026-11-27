"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin, Trash2 } from "lucide-react";
import { formatFcfa } from "@/lib/money";

interface Rate {
  id: string;
  city: string;
  fee: number;
}

export function DeliveryRatesClient({ storeSlug }: { storeSlug: string }) {
  const [rates, setRates] = useState<Rate[] | null>(null);
  const [city, setCity] = useState("");
  const [fee, setFee] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/delivery-rates?store=${encodeURIComponent(storeSlug)}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Lecture impossible.");
      setRates(data.rates);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lecture impossible.");
      setRates([]);
    }
  }, [storeSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/delivery-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store: storeSlug, city, fee: Number(fee) }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !data.success) return setError(data.error || "Enregistrement impossible.");
    setCity("");
    setFee("");
    void load();
  };

  const remove = async (r: Rate) => {
    await fetch(`/api/delivery-rates?store=${encodeURIComponent(storeSlug)}&id=${r.id}`, { method: "DELETE" });
    void load();
  };

  const input = "h-11 px-3 rounded-xl border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/20";

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20">
      <div>
        <h1 className="text-xl font-extrabold text-[#111111] flex items-center gap-2">
          <MapPin className="w-5 h-5" /> Tarifs de livraison
        </h1>
        <p className="text-xs text-[#666660] mt-0.5">Frais de livraison par ville, proposés automatiquement dans « Nouvelle commande ».</p>
      </div>

      <form onSubmit={add} className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-4 flex flex-col sm:flex-row gap-2.5">
        <input className={`${input} flex-1`} placeholder="Ville ou quartier (ex. Lomé)" value={city} onChange={(e) => setCity(e.target.value)} required />
        <input className={`${input} sm:w-40`} placeholder="Frais (FCFA)" value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ""))} inputMode="numeric" required />
        <button type="submit" disabled={busy} className="h-11 px-5 rounded-xl bg-[#111111] text-white text-xs font-bold cursor-pointer disabled:opacity-50">
          Enregistrer
        </button>
      </form>
      <p className="text-[11px] text-[#7A7A7A] -mt-3">Une ville déjà enregistrée est mise à jour avec le nouveau tarif.</p>

      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">{error}</div>}

      {rates === null ? (
        <div className="py-10 text-center text-sm text-[#7A7A7A] flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
        </div>
      ) : rates.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-black/15 p-8 text-center text-sm text-[#666660]">Aucun tarif enregistré.</div>
      ) : (
        <div className="rounded-[20px] border border-black/[0.08] bg-white divide-y divide-black/[0.06]">
          {rates.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold text-[#111111]">{r.city}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono">{formatFcfa(r.fee)}</span>
                <button type="button" aria-label={`Supprimer ${r.city}`} onClick={() => remove(r)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
