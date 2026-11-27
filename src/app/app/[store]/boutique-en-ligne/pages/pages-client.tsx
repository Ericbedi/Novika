"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink, FilePlus2, Pencil, Trash2 } from "lucide-react";

interface PageRow {
  id: string;
  slug: string;
  title: string;
  content: string;
  published: boolean;
}

const EMPTY = { id: "", title: "", slug: "", content: "", published: true };

export function PagesClient({ storeSlug }: { storeSlug: string }) {
  const searchParams = useSearchParams();
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<typeof EMPTY | null>(searchParams.get("new") ? EMPTY : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/pages?store=${encodeURIComponent(storeSlug)}`)
      .then((r) => r.json())
      .then((d) => setPages(d?.success ? d.pages : []))
      .catch(() => setPages([]))
      .finally(() => setLoading(false));
  }, [storeSlug]);

  useEffect(load, [load]);

  async function save() {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store: storeSlug, page: form }),
      });
      const d = await r.json();
      if (!d?.success) throw new Error(d?.error || "Enregistrement impossible.");
      setForm(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: PageRow) {
    if (!window.confirm(`Supprimer la page « ${p.title} » ?`)) return;
    await fetch(`/api/pages?store=${encodeURIComponent(storeSlug)}&id=${p.id}`, { method: "DELETE" });
    load();
  }

  const input = "w-full min-h-[44px] px-3 py-2 text-base sm:text-sm rounded-xl border border-black/[0.1] bg-white focus:outline-none focus:border-black/30";

  return (
    <div className="space-y-6 pb-24 max-w-3xl">
      <Link href={`/app/${storeSlug}/boutique-en-ligne`} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#666660] hover:text-[#111111]">
        <ArrowLeft className="h-3.5 w-3.5" /> Boutique en ligne
      </Link>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#111111]">Pages</h1>
          <p className="text-xs text-[#666660]">À propos, livraison, conditions… affichées sur votre vitrine.</p>
        </div>
        <button type="button" onClick={() => { setError(null); setForm(EMPTY); }} className="min-h-[44px] px-4 rounded-xl bg-[#1F3A26] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer">
          <FilePlus2 className="h-4 w-4" /> Créer une page
        </button>
      </div>

      {form && (
        <div className="rounded-[24px] border border-black/[0.08] bg-white p-5 space-y-3 shadow-2xs">
          <h2 className="text-sm font-black">{form.id ? "Modifier la page" : "Nouvelle page"}</h2>
          <input className={input} placeholder="Titre (ex : À propos de nous)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className={input} placeholder="Adresse (facultatif, ex : a-propos)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <textarea className={`${input} min-h-[180px]`} placeholder="Contenu de la page (un paragraphe par ligne vide)" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Publiée sur la vitrine
          </label>
          {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" disabled={saving} onClick={save} className="min-h-[44px] px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-60 cursor-pointer">
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button type="button" onClick={() => setForm(null)} className="min-h-[44px] px-4 rounded-xl border border-black/[0.1] text-xs font-bold cursor-pointer">Annuler</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {loading && <p className="text-xs text-[#666660]">Chargement…</p>}
        {!loading && pages.length === 0 && !form && (
          <div className="rounded-2xl border border-dashed border-black/[0.15] p-8 text-center text-xs text-[#666660]">Aucune page pour le moment. Créez la première.</div>
        )}
        {pages.map((p) => (
          <div key={p.id} className="rounded-2xl border border-black/[0.08] bg-white p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#111111] truncate">{p.title}</p>
              <p className="text-[11px] text-[#888880] truncate">/pages/{p.slug} · {p.published ? "Publiée" : "Brouillon"}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {p.published && (
                <a href={`/boutique/${storeSlug}/pages/${p.slug}`} target="_blank" rel="noopener noreferrer" className="h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-black/[0.05]" aria-label="Voir">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <button type="button" onClick={() => { setError(null); setForm({ id: p.id, title: p.title, slug: p.slug, content: p.content, published: p.published }); }} className="h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-black/[0.05] cursor-pointer" aria-label="Modifier">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => remove(p)} className="h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer" aria-label="Supprimer">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
