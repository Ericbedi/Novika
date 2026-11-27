"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { HOME_FONTS, storefrontFontStack, type HomeConfig } from "@/lib/storefront-home-config";

const FONT_LABELS: Record<string, string> = {
  "Playfair Display": "Élégante (serif)",
  Inter: "Moderne (Inter)",
  Poppins: "Arrondie (Poppins)",
  Montserrat: "Géométrique (Montserrat)",
  "Plus Jakarta Sans": "Douce (Jakarta)",
};

const PRESETS = [
  { name: "Élégant", fontFamily: "Playfair Display", primary: "#2B2A26", background: "#FFFFFF" },
  { name: "Moderne", fontFamily: "Inter", primary: "#1F3A26", background: "#FFFFFF" },
  { name: "Chaleureux", fontFamily: "Poppins", primary: "#B45309", background: "#FFFBF5" },
];

export function AppearanceClient({ storeSlug }: { storeSlug: string }) {
  const [cfg, setCfg] = useState<HomeConfig>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/shop-home?store=${encodeURIComponent(storeSlug)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d?.config && setCfg(d.config))
      .catch(() => {});
  }, [storeSlug]);

  const font = cfg.typography?.fontFamily || "Inter";
  const primary = cfg.colors?.primary || "#111111";
  const background = cfg.colors?.background || "#FFFFFF";
  const ann = cfg.announcementBar || {};

  const set = (patch: Partial<HomeConfig>) => setCfg((c) => ({ ...c, ...patch }));

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch("/api/stores/home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store: storeSlug, config: cfg }),
      });
      const d = await r.json();
      setMsg(d?.success ? { ok: true, text: "Enregistré. Votre vitrine est à jour sur mobile et navigateur." } : { ok: false, text: d?.error || "Enregistrement impossible." });
    } catch {
      setMsg({ ok: false, text: "Enregistrement impossible." });
    } finally {
      setSaving(false);
    }
  }

  const input = "w-full min-h-[44px] px-3 py-2 text-base sm:text-sm rounded-xl border border-black/[0.1] bg-white focus:outline-none focus:border-black/30";

  return (
    <div className="space-y-6 pb-24 max-w-2xl">
      <Link href={`/app/${storeSlug}/boutique-en-ligne`} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#666660] hover:text-[#111111]">
        <ArrowLeft className="h-3.5 w-3.5" /> Boutique en ligne
      </Link>
      <div>
        <h1 className="text-2xl font-black text-[#111111]">Apparence de la vitrine</h1>
        <p className="text-xs text-[#666660]">Police, couleurs et bandeau d&apos;annonce de votre page d&apos;accueil.</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wide text-[#666660]">Styles prêts à l&apos;emploi</h2>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => set({ typography: { fontFamily: p.fontFamily, headingFont: p.fontFamily }, colors: { ...cfg.colors, primary: p.primary, background: p.background } })}
              className="rounded-2xl border border-black/[0.1] bg-white p-3 text-left hover:border-black/30 cursor-pointer"
            >
              <span className="block text-base font-bold" style={{ fontFamily: storefrontFontStack(p.fontFamily), color: p.primary }}>Aa</span>
              <span className="block text-[11px] font-bold mt-1">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wide text-[#666660]">Police</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {HOME_FONTS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => set({ typography: { fontFamily: f, headingFont: f } })}
              className={`rounded-2xl border p-3 text-left cursor-pointer ${font === f ? "border-emerald-600 bg-emerald-50" : "border-black/[0.1] bg-white"}`}
            >
              <span className="block text-lg font-bold" style={{ fontFamily: storefrontFontStack(f) }}>Le confort que vous méritez</span>
              <span className="block text-[11px] text-[#666660]">{FONT_LABELS[f]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wide text-[#666660]">Couleurs</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-bold space-y-1 block">
            Couleur des boutons
            <input type="color" value={primary} onChange={(e) => set({ colors: { ...cfg.colors, primary: e.target.value } })} className="block h-12 w-full rounded-xl border border-black/[0.1] bg-white p-1 cursor-pointer" />
          </label>
          <label className="text-xs font-bold space-y-1 block">
            Fond de la page
            <input type="color" value={background} onChange={(e) => set({ colors: { ...cfg.colors, background: e.target.value } })} className="block h-12 w-full rounded-xl border border-black/[0.1] bg-white p-1 cursor-pointer" />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wide text-[#666660]">Bandeau d&apos;annonce</h2>
        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
          <input type="checkbox" className="h-5 w-5 accent-emerald-600" checked={ann.isEnabled !== false} onChange={(e) => set({ announcementBar: { ...ann, isEnabled: e.target.checked } })} />
          Afficher le bandeau en haut de la vitrine
        </label>
        <input className={input} placeholder="Ex : Paiement à la livraison — Commandez maintenant !" value={ann.text ?? ""} onChange={(e) => set({ announcementBar: { ...ann, text: e.target.value } })} />
        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
          <input type="checkbox" className="h-5 w-5 accent-emerald-600" checked={cfg.header?.showSearch !== false} onChange={(e) => set({ header: { ...cfg.header, showSearch: e.target.checked } })} />
          Afficher la recherche dans l&apos;en-tête
        </label>
      </div>

      <p className="text-[11px] text-[#666660]">Les textes de la page d&apos;accueil (titre, avantages, histoire, newsletter) se modifient directement sur la vitrine avec « Modifier », ou dans l&apos;éditeur.</p>

      {msg && <p className={`text-xs font-bold ${msg.ok ? "text-emerald-700" : "text-rose-600"}`}>{msg.text}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={saving} onClick={save} className="min-h-[48px] px-6 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-60 cursor-pointer">
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <a href={`/boutique/${storeSlug}`} target="_blank" rel="noopener noreferrer" className="min-h-[48px] px-5 rounded-xl border border-black/[0.1] text-sm font-bold inline-flex items-center gap-2">
          <ExternalLink className="h-4 w-4" /> Voir la vitrine
        </a>
      </div>
    </div>
  );
}
