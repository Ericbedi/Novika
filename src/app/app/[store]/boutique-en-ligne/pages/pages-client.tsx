"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink, FilePlus2, MoreVertical, Pencil } from "lucide-react";

interface PageRow {
  id: string;
  slug: string;
  title: string;
  content: string;
  sections?: unknown[];
  published: boolean;
  updated_at?: string;
}

interface Row {
  key: string;
  name: string;
  sub: string;
  type: "Accueil" | "Collection" | "Page";
  slug: string;
  published: boolean;
  updated?: string;
  system: boolean;
  page?: PageRow;
  editId: string;
  viewUrl: string;
}

const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

export function PagesClient({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const base = `/app/${storeSlug}/boutique-en-ligne`;
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(!!searchParams.get("new"));
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    fetch(`/api/pages?store=${encodeURIComponent(storeSlug)}`)
      .then((r) => r.json())
      .then((d) => setPages(d?.success ? d.pages : []))
      .catch(() => setPages([]))
      .finally(() => setLoading(false));
  }, [storeSlug]);
  useEffect(load, [load]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setMenu(null); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const rows: Row[] = [
    { key: "home", name: "Accueil", sub: "Page d'accueil de la boutique", type: "Accueil", slug: "/", published: true, system: true, editId: "home", viewUrl: `/boutique/${storeSlug}` },
    { key: "catalogue", name: "Produits", sub: "Catalogue des produits", type: "Collection", slug: "/catalogue", published: true, system: true, editId: "catalogue", viewUrl: `/boutique/${storeSlug}/catalogue` },
    { key: "contact", name: "Contact", sub: "Page de contact", type: "Page", slug: "/contact", published: true, system: true, editId: "contact", viewUrl: `/boutique/${storeSlug}/contact` },
    ...pages.map<Row>((p) => ({
      key: p.id, name: p.title, sub: "Page personnalisée", type: "Page", slug: `/pages/${p.slug}`, published: p.published,
      updated: p.updated_at, system: false, page: p, editId: p.id, viewUrl: `/boutique/${storeSlug}/pages/${p.slug}`,
    })),
  ];

  async function post(page: Record<string, unknown>) {
    const r = await fetch("/api/pages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store: storeSlug, page }) });
    return r.json();
  }

  async function create() {
    if (!title.trim()) { setError("Donnez un titre à la page."); return; }
    setBusy(true); setError(null);
    try {
      const d = await post({ title: title.trim(), slug: "", content: "", sections: [], published: true });
      if (!d?.success) throw new Error(d?.error || "Création impossible.");
      router.push(`${base}/studio/${d.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible.");
      setBusy(false);
    }
  }

  async function togglePublish(p: PageRow) {
    setMenu(null);
    await post({ id: p.id, title: p.title, slug: p.slug, content: p.content, sections: p.sections || [], published: !p.published });
    load();
  }

  async function remove(p: PageRow) {
    setMenu(null);
    if (!window.confirm(`Supprimer la page « ${p.title} » ?`)) return;
    await fetch(`/api/pages?store=${encodeURIComponent(storeSlug)}&id=${p.id}`, { method: "DELETE" });
    load();
  }

  const inputCls = "w-full min-h-[44px] px-3 py-2 text-base sm:text-sm rounded-xl border border-black/[0.1] bg-white focus:outline-none focus:border-black/30";
  const badge = (r: Row) => (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black ${r.published ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
      {r.published ? "PUBLIÉE" : "BROUILLON"}
    </span>
  );

  return (
    <div className="space-y-6 pb-24 max-w-5xl" ref={wrap}>
      <Link href={base} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#666660] hover:text-[#111111]">
        <ArrowLeft className="h-3.5 w-3.5" /> Boutique en ligne
      </Link>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#111111]">Pages</h1>
          <p className="text-xs text-[#666660]">Gérez et personnalisez les pages de votre boutique.</p>
        </div>
        <button type="button" onClick={() => { setError(null); setCreating(true); }} className="min-h-[44px] px-4 rounded-xl bg-[#1F3A26] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer">
          <FilePlus2 className="h-4 w-4" /> Créer une page
        </button>
      </div>

      {creating && (
        <div className="rounded-[24px] border border-black/[0.08] bg-white p-5 space-y-3 shadow-2xs">
          <h2 className="text-sm font-black">Nouvelle page</h2>
          <input autoFocus className={inputCls} placeholder="Titre (ex : À propos de nous)" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} />
          {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={create} className="min-h-[44px] px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-60 cursor-pointer">{busy ? "Création…" : "Créer et ouvrir l'éditeur"}</button>
            <button type="button" onClick={() => { setCreating(false); setError(null); }} className="min-h-[44px] px-4 rounded-xl border border-black/[0.1] text-xs font-bold cursor-pointer">Annuler</button>
          </div>
        </div>
      )}

      {/* Tableau (ordinateur) */}
      <div className="hidden md:block rounded-2xl border border-black/[0.08] bg-white overflow-visible">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-black tracking-widest text-[#888880] border-b border-black/[0.06]">
              <th className="px-4 py-3">NOM</th><th className="px-4 py-3">TYPE</th><th className="px-4 py-3">SLUG</th><th className="px-4 py-3">STATUT</th><th className="px-4 py-3">MODIFIÉ</th><th className="px-4 py-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-black/[0.04] last:border-0">
                <td className="px-4 py-3"><p className="font-bold text-[#111111]">{r.name}</p><p className="text-[11px] text-[#888880]">{r.sub}</p></td>
                <td className="px-4 py-3 text-xs text-[#444440]">{r.type}</td>
                <td className="px-4 py-3 text-xs text-[#666660] font-mono">{r.slug}</td>
                <td className="px-4 py-3">{badge(r)}</td>
                <td className="px-4 py-3 text-xs text-[#666660]">{fmtDate(r.updated)}</td>
                <td className="px-4 py-3"><Actions r={r} base={base} menu={menu} setMenu={setMenu} togglePublish={togglePublish} remove={remove} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartes (téléphone) */}
      <div className="md:hidden space-y-2">
        {rows.map((r) => (
          <div key={r.key} className="rounded-2xl border border-black/[0.08] bg-white p-4 flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-bold text-[#111111] truncate">{r.name}</p>
              <p className="text-[11px] text-[#888880] truncate">{r.type} · {r.slug}</p>
              {badge(r)}
            </div>
            <Actions r={r} base={base} menu={menu} setMenu={setMenu} togglePublish={togglePublish} remove={remove} />
          </div>
        ))}
      </div>
      {loading && <p className="text-xs text-[#666660]">Chargement…</p>}
    </div>
  );
}

function Actions({ r, base, menu, setMenu, togglePublish, remove }: {
  r: Row; base: string; menu: string | null; setMenu: (k: string | null) => void;
  togglePublish: (p: PageRow) => void; remove: (p: PageRow) => void;
}) {
  const item = "w-full min-h-[44px] px-4 text-left text-xs font-bold hover:bg-black/[0.04] flex items-center gap-2 cursor-pointer";
  return (
    <div className="relative flex items-center justify-end gap-1 shrink-0">
      <Link href={`${base}/studio/${r.editId}`} aria-label="Modifier" className="h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-black/[0.05]">
        <Pencil className="h-4 w-4" />
      </Link>
      <button type="button" aria-label="Plus d'actions" onClick={() => setMenu(menu === r.key ? null : r.key)} className="h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-black/[0.05] cursor-pointer">
        <MoreVertical className="h-4 w-4" />
      </button>
      {menu === r.key && (
        <div className="absolute right-0 top-11 z-30 w-52 rounded-xl border border-black/[0.1] bg-white shadow-lg overflow-hidden">
          <a href={r.viewUrl} target="_blank" rel="noopener noreferrer" className={item} onClick={() => setMenu(null)}><ExternalLink className="h-4 w-4" /> Voir sur la boutique</a>
          {!r.system && r.page && (
            <>
              <button type="button" className={item} onClick={() => togglePublish(r.page!)}>{r.page.published ? "Dépublier" : "Publier"}</button>
              <button type="button" className={`${item} text-rose-600`} onClick={() => remove(r.page!)}>Supprimer</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
