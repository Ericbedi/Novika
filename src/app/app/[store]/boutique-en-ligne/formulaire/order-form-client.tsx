"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const DEFAULTS = {
  formTitle: "",
  formWarning: "",
  formButton: "",
  formCommitmentText: "",
  formEmail: "0",
  formInstructions: "1",
  formCommitment: "1",
};
type FormState = typeof DEFAULTS;

export function OrderFormClient({ storeSlug }: { storeSlug: string }) {
  const [f, setF] = useState<FormState>(DEFAULTS);
  const [initial, setInitial] = useState<FormState>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/shop-brand?store=${encodeURIComponent(storeSlug)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const b = d?.brand || {};
        const next = { ...DEFAULTS };
        (Object.keys(DEFAULTS) as (keyof FormState)[]).forEach((k) => {
          if (typeof b[k] === "string") next[k] = b[k];
        });
        setF(next);
        setInitial(next);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [storeSlug]);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch("/api/stores/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: storeSlug,
          brand: Object.fromEntries((Object.keys(f) as (keyof FormState)[]).filter((k) => f[k] !== initial[k]).map((k) => [k, f[k]])),
        }),
      });
      const d = await r.json();
      if (d?.success) setInitial(f);
      setMsg(d?.success ? { ok: true, text: "Enregistré. La vitrine est à jour (mobile et navigateur)." } : { ok: false, text: d?.error || "Enregistrement impossible." });
    } catch {
      setMsg({ ok: false, text: "Enregistrement impossible." });
    } finally {
      setSaving(false);
    }
  }

  const input = "w-full min-h-[44px] px-3 py-2 text-base sm:text-sm rounded-xl border border-black/[0.1] bg-white focus:outline-none focus:border-black/30";
  const toggle = (key: keyof FormState, label: string, hint: string) => (
    <label className="flex items-start gap-3 p-3 rounded-2xl border border-black/[0.08] bg-white cursor-pointer">
      <input type="checkbox" className="h-5 w-5 mt-0.5 accent-emerald-600 shrink-0" checked={f[key] === "1"} onChange={(e) => setF({ ...f, [key]: e.target.checked ? "1" : "0" })} />
      <span>
        <span className="block text-sm font-bold text-[#111111]">{label}</span>
        <span className="block text-[11px] text-[#666660]">{hint}</span>
      </span>
    </label>
  );

  return (
    <div className="space-y-6 pb-24 max-w-2xl">
      <Link href={`/app/${storeSlug}/boutique-en-ligne`} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#666660] hover:text-[#111111]">
        <ArrowLeft className="h-3.5 w-3.5" /> Boutique en ligne
      </Link>
      <div>
        <h1 className="text-2xl font-black text-[#111111]">Formulaire de commande</h1>
        <p className="text-xs text-[#666660]">Nom, téléphone, ville et adresse sont toujours demandés. Réglez le reste ici.</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wide text-[#666660]">Textes</h2>
        <input className={input} placeholder="Titre du formulaire (laisser vide = par défaut)" value={f.formTitle} onChange={(e) => setF({ ...f, formTitle: e.target.value })} />
        <input className={input} placeholder="Texte du bouton (ex : Commander maintenant)" value={f.formButton} onChange={(e) => setF({ ...f, formButton: e.target.value })} />
        <input className={input} placeholder="Message d'avertissement (facultatif)" value={f.formWarning} onChange={(e) => setF({ ...f, formWarning: e.target.value })} />
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wide text-[#666660]">Champs</h2>
        {toggle("formEmail", "Adresse e-mail", "Champ facultatif pour recevoir un reçu.")}
        {toggle("formInstructions", "Instructions de livraison", "Zone de texte libre pour le livreur.")}
        {toggle("formCommitment", "Case d'engagement", "Le client confirme être disponible et prêt à payer.")}
        {f.formCommitment === "1" && (
          <input className={input} placeholder="Texte de la case (facultatif)" value={f.formCommitmentText} onChange={(e) => setF({ ...f, formCommitmentText: e.target.value })} />
        )}
      </div>

      {msg && <p className={`text-xs font-bold ${msg.ok ? "text-emerald-700" : "text-rose-600"}`}>{msg.text}</p>}
      <button type="button" disabled={!loaded || saving} onClick={save} className="min-h-[48px] px-6 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-60 cursor-pointer">
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}
