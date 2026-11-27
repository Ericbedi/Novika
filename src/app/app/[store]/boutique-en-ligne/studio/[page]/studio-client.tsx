"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ChevronDown, ChevronUp, Eye, EyeOff, Monitor, Palette, Plus, Redo2, Smartphone, Tablet, Trash2, Undo2, X, Image as ImageIcon,
} from "lucide-react";
import { ImagePicker } from "@/components/media/ImagePicker";
import { saveHomeConfig, sanitizeHomeConfig, type HomeConfig } from "@/lib/storefront-home-config";
import { STUDIO_MESSAGE } from "@/lib/studio-bridge";
import { newPageBlock, PAGE_BLOCK_LABELS, sanitizePageBlocks, type PageBlock, type PageBlockType } from "@/lib/page-sections";
import {
  GROUP_LABELS, SECTION_CATALOG, contentOrder, isSectionVisible, readItems, readValue, setSectionVisible, writeItems, writeValue,
  type Field, type SectionDef, type SectionGroup,
} from "@/lib/studio-catalog";

type Obj = Record<string, unknown>;
type Device = "auto" | "tablet" | "mobile";
type MobileTab = "sections" | "preview" | "settings";

interface PageRow { id: string; slug: string; title: string; content: string; sections?: unknown[]; published: boolean }

const SYSTEM_PAGES: Record<string, { label: string; path: string }> = {
  home: { label: "Accueil", path: "" },
  catalogue: { label: "Produits", path: "/catalogue" },
  contact: { label: "Contact", path: "/contact" },
};

const inputCls = "w-full min-h-[44px] px-3 py-2 text-base sm:text-sm rounded-xl border border-black/[0.12] bg-white focus:outline-none focus:border-[#1F3A26]";

function ImageField({ value, onChange, pick }: { value: string; onChange: (v: string) => void; pick: (cb: (url: string) => void) => void }) {
return (
  <div className="space-y-2">
    {value ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={value} alt="" className="h-24 w-full object-cover rounded-xl border border-black/10" />
    ) : (
      <div className="h-16 w-full rounded-xl border border-dashed border-black/20 grid place-items-center text-[11px] text-[#888880]">Aucune image</div>
    )}
    <div className="flex gap-2">
      <button type="button" onClick={() => pick(onChange)} className="min-h-[40px] px-3 rounded-lg border border-black/[0.12] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
        <ImageIcon className="h-3.5 w-3.5" /> {value ? "Changer" : "Choisir une image"}
      </button>
      {value && <button type="button" onClick={() => onChange("")} className="min-h-[40px] px-3 rounded-lg text-xs font-bold text-rose-600 cursor-pointer">Retirer</button>}
    </div>
  </div>
);
}

function FieldInput({ f, value, onChange, pick }: { f: Field; value: unknown; onChange: (v: unknown) => void; ckey?: string; pick: (cb: (url: string) => void) => void }) {
  const str = typeof value === "string" ? value : value == null ? "" : String(value);
  return (
    <div className="space-y-1.5">
      {f.kind !== "toggle" && <label className="text-[11px] font-black uppercase tracking-wide text-[#666660]">{f.label}</label>}
      {f.kind === "text" && <input className={inputCls} value={str} onChange={(e) => onChange(e.target.value)} />}
      {f.kind === "url" && <input className={inputCls} inputMode="url" placeholder="https://… ou /boutique/…" value={str} onChange={(e) => onChange(e.target.value)} />}
      {f.kind === "textarea" && <textarea className={`${inputCls} min-h-[96px]`} value={str} onChange={(e) => onChange(e.target.value)} />}
      {f.kind === "number" && (
        <input type="number" className={inputCls} min={f.min} max={f.max} value={str} onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) ? Math.min(f.max ?? 9999, Math.max(f.min ?? 0, n)) : 0);
        }} />
      )}
      {f.kind === "select" && (
        <select className={inputCls} value={str} onChange={(e) => onChange(e.target.value)}>
          {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
      {f.kind === "image" && <ImageField value={str} onChange={(v) => onChange(v)} pick={pick} />}
      {f.kind === "toggle" && (
        <label className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer">
          <span className="text-sm font-bold">{f.label}</span>
          <input type="checkbox" className="h-5 w-5 accent-[#1F3A26]" checked={value !== false} onChange={(e) => onChange(e.target.checked)} />
        </label>
      )}
      {f.hint && <p className="text-[11px] text-[#888880]">{f.hint}</p>}
    </div>
  );
}

export function StudioClient({ storeSlug, pageId }: { storeSlug: string; pageId: string }) {
  const isSystem = pageId in SYSTEM_PAGES;
  const base = `/app/${storeSlug}/boutique-en-ligne`;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ----- état de la page -----
  const [cfg, setCfg] = useState<HomeConfig | null>(null);
  const [page, setPage] = useState<PageRow | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ----- navigation -----
  const [selected, setSelected] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("auto");
  const [tab, setTab] = useState<MobileTab>("sections");
  const [picker, setPicker] = useState<null | ((url: string) => void)>(null);
  const [adding, setAdding] = useState(false);

  // ----- historique (annuler / rétablir) -----
  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const lastKey = useRef<{ key: string; t: number }>({ key: "", t: 0 });
  const [, force] = useState(0);

  const snapshot = useCallback(() => JSON.stringify(isSystem ? cfg : blocks), [isSystem, cfg, blocks]);
  const apply = useCallback((json: string) => {
    const v = JSON.parse(json);
    if (isSystem) setCfg(v as HomeConfig); else setBlocks(v as PageBlock[]);
    setDirty(true);
  }, [isSystem]);

  const commit = useCallback((next: HomeConfig | PageBlock[], coalesce?: string) => {
    const now = Date.now();
    const same = coalesce && lastKey.current.key === coalesce && now - lastKey.current.t < 900;
    if (!same) { past.current.push(snapshot()); if (past.current.length > 60) past.current.shift(); }
    lastKey.current = { key: coalesce || "", t: now };
    future.current = [];
    if (isSystem) setCfg(next as HomeConfig); else setBlocks(next as PageBlock[]);
    setDirty(true);
    force((n) => n + 1);
  }, [snapshot, isSystem]);

  const undo = () => { const prev = past.current.pop(); if (prev === undefined) return; future.current.push(snapshot()); apply(prev); force((n) => n + 1); };
  const redo = () => { const nx = future.current.pop(); if (nx === undefined) return; past.current.push(snapshot()); apply(nx); force((n) => n + 1); };

  // ----- chargement -----
  useEffect(() => {
    if (isSystem) return;
    fetch(`/api/pages?store=${encodeURIComponent(storeSlug)}`)
      .then((r) => r.json())
      .then((d) => {
        const p = (d?.pages as PageRow[] | undefined)?.find((x) => x.id === pageId);
        if (!p) { setLoadError("Page introuvable."); return; }
        setPage(p);
        setBlocks(sanitizePageBlocks(p.sections));
      })
      .catch(() => setLoadError("Chargement impossible."));
  }, [isSystem, pageId, storeSlug]);

  // configuration de départ envoyée par l'aperçu (valeurs réellement affichées)
  useEffect(() => {
    if (!isSystem) return;
    const wanted = pageId === "home" ? "home" : "layout";
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== iframeRef.current?.contentWindow) return;
      if (e.data?.type === "kelio-studio-base" && e.data.source === wanted) {
        setCfg((cur) => cur ?? sanitizeHomeConfig(e.data.config));
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [isSystem, pageId]);

  // brouillon -> aperçu
  useEffect(() => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    if (isSystem && cfg) w.postMessage({ type: STUDIO_MESSAGE, config: cfg }, window.location.origin);
    if (!isSystem && page) w.postMessage({ type: STUDIO_MESSAGE, pageSections: blocks }, window.location.origin);
  }, [cfg, blocks, isSystem, page]);

  const iframeSrc = useMemo(() => {
    if (isSystem) return `/boutique/${storeSlug}${SYSTEM_PAGES[pageId].path}?studio=1`;
    return page ? `/boutique/${storeSlug}/pages/${page.slug}?studio=1` : "";
  }, [isSystem, pageId, storeSlug, page]);

  // quitter avec modifications non enregistrées
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600); };

  async function save() {
    setSaving(true);
    try {
      if (isSystem) {
        if (!cfg) return;
        const ok = await saveHomeConfig(storeSlug, sanitizeHomeConfig(cfg));
        if (!ok) throw new Error();
      } else if (page) {
        const r = await fetch("/api/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store: storeSlug, page: { id: page.id, title: page.title, slug: page.slug, content: page.content, published: page.published, sections: blocks } }),
        });
        const d = await r.json();
        if (!d?.success) throw new Error();
      }
      setDirty(false);
      flash("Enregistré ✓");
    } catch {
      flash("Enregistrement impossible. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  // ----- sections de l'accueil / globales -----
  const sections = useMemo(() => {
    if (!isSystem || !cfg) return [] as SectionDef[];
    const byId = new Map(SECTION_CATALOG.map((s) => [s.id, s]));
    const out: SectionDef[] = [];
    for (const id of ["announcement", "header"]) out.push(byId.get(id)!);
    if (pageId === "home") for (const id of contentOrder(cfg)) out.push(byId.get(id)!);
    out.push(byId.get("footer")!);
    return out;
  }, [isSystem, cfg, pageId]);

  function moveSection(id: string, dir: -1 | 1) {
    if (!cfg) return;
    const order = contentOrder(cfg);
    const i = order.indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    commit({ ...cfg, order });
  }

  function moveBlock(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  }

  const selDef = isSystem ? sections.find((s) => s.id === selected) : undefined;
  const selBlock = !isSystem ? blocks.find((b) => b.id === selected) : undefined;

  const title = isSystem ? SYSTEM_PAGES[pageId].label : page?.title || "Page";
  const frameWidth = device === "mobile" ? 390 : device === "tablet" ? 768 : undefined;

  if (loadError) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-bold">{loadError}</p>
        <Link href={`${base}/pages`} className="text-xs font-bold underline">Retour aux pages</Link>
      </div>
    );
  }

  const pickImage = (cb: (url: string) => void) => setPicker(() => cb);

  // ----- panneaux -----
  const sectionsPanel = (
    <div className="p-3 space-y-4">
      {isSystem && cfg ? (
        (["header", "content", "footer"] as SectionGroup[]).map((g) => {
          const list = sections.filter((s) => s.group === g);
          if (!list.length) return null;
          return (
            <div key={g} className="space-y-1">
              <p className="px-2 text-[10px] font-black tracking-widest text-[#888880]">{GROUP_LABELS[g]}</p>
              {list.map((s) => {
                const visible = isSectionVisible(cfg, s);
                const order = g === "content" ? contentOrder(cfg) : [];
                const idx = order.indexOf(s.id);
                return (
                  <div key={s.id} className={`flex items-center gap-1 rounded-xl border ${selected === s.id ? "border-[#1F3A26] bg-[#EEF5EE]" : "border-transparent hover:bg-black/[0.04]"}`}>
                    <button type="button" onClick={() => { setSelected(s.id); setTab("settings"); }} className={`flex-1 min-h-[44px] px-3 text-left text-sm font-bold cursor-pointer ${visible ? "" : "opacity-40"}`}>
                      {s.label}
                    </button>
                    {s.movable && (
                      <>
                        <button type="button" aria-label="Monter" disabled={idx <= 0} onClick={() => moveSection(s.id, -1)} className="h-9 w-8 grid place-items-center disabled:opacity-20 cursor-pointer"><ChevronUp className="h-4 w-4" /></button>
                        <button type="button" aria-label="Descendre" disabled={idx >= order.length - 1} onClick={() => moveSection(s.id, 1)} className="h-9 w-8 grid place-items-center disabled:opacity-20 cursor-pointer"><ChevronDown className="h-4 w-4" /></button>
                      </>
                    )}
                    {s.canHide && (
                      <button type="button" aria-label={visible ? "Masquer" : "Afficher"} onClick={() => commit(setSectionVisible(cfg, s, !visible))} className="h-9 w-9 grid place-items-center cursor-pointer">
                        {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })
      ) : !isSystem ? (
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-black tracking-widest text-[#888880]">CONTENU DE LA PAGE</p>
          <button type="button" onClick={() => { setSelected("__page"); setTab("settings"); }} className={`w-full min-h-[44px] px-3 rounded-xl text-left text-sm font-bold cursor-pointer ${selected === "__page" ? "bg-[#EEF5EE] border border-[#1F3A26]" : "hover:bg-black/[0.04]"}`}>Titre et statut</button>
          {blocks.map((b, i) => (
            <div key={b.id} className={`flex items-center gap-1 rounded-xl border ${selected === b.id ? "border-[#1F3A26] bg-[#EEF5EE]" : "border-transparent hover:bg-black/[0.04]"}`}>
              <button type="button" onClick={() => { setSelected(b.id); setTab("settings"); }} className="flex-1 min-h-[44px] px-3 text-left text-sm font-bold truncate cursor-pointer">
                {PAGE_BLOCK_LABELS[b.type]}{b.text ? ` — ${b.text.slice(0, 22)}` : ""}
              </button>
              <button type="button" aria-label="Monter" disabled={i === 0} onClick={() => moveBlock(i, -1)} className="h-9 w-8 grid place-items-center disabled:opacity-20 cursor-pointer"><ChevronUp className="h-4 w-4" /></button>
              <button type="button" aria-label="Descendre" disabled={i === blocks.length - 1} onClick={() => moveBlock(i, 1)} className="h-9 w-8 grid place-items-center disabled:opacity-20 cursor-pointer"><ChevronDown className="h-4 w-4" /></button>
            </div>
          ))}
          <button type="button" onClick={() => setAdding(true)} className="mt-2 w-full min-h-[44px] rounded-xl border border-dashed border-black/25 text-xs font-bold inline-flex items-center justify-center gap-2 hover:bg-black/[0.03] cursor-pointer">
            <Plus className="h-4 w-4" /> Ajouter une section
          </button>
        </div>
      ) : (
        <p className="p-3 text-xs text-[#666660]">Chargement des sections…</p>
      )}
      {isSystem && pageId !== "home" && (
        <p className="px-2 text-[11px] text-[#888880]">Le contenu de cette page est géré automatiquement (produits, formulaire…). Vous pouvez personnaliser l'en-tête, la barre d'annonce et le pied de page.</p>
      )}
    </div>
  );

  const settingsPanel = (() => {
    if (isSystem && cfg && selDef) {
      const items = selDef.items ? readItems(cfg, selDef) : [];
      return (
        <div className="p-4 space-y-5">
          <h2 className="text-base font-black">{selDef.label}</h2>
          {selDef.canHide && (
            <label className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer">
              <span className="text-sm font-bold">Afficher cette section</span>
              <input type="checkbox" className="h-5 w-5 accent-[#1F3A26]" checked={isSectionVisible(cfg, selDef)} onChange={(e) => commit(setSectionVisible(cfg, selDef, e.target.checked))} />
            </label>
          )}
          {selDef.fields.map((f) => (
            <FieldInput pick={pickImage} key={f.key} f={f} ckey={`${selDef.id}.${f.key}`} value={readValue(cfg, selDef, f.key)} onChange={(v) => commit(writeValue(cfg, selDef, f.key, v), `${selDef.id}.${f.key}`)} />
          ))}
          {selDef.items && (
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-wide text-[#666660]">{selDef.items.label}</p>
              {items.map((it, i) => (
                <div key={String(it.id ?? i)} className="rounded-2xl border border-black/[0.1] p-3 space-y-3 bg-[#FAFAF8]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">Élément {i + 1}</span>
                    <button type="button" onClick={() => commit(writeItems(cfg, selDef, items.filter((_, k) => k !== i)))} className="h-9 px-2 inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" /> Supprimer
                    </button>
                  </div>
                  {selDef.items!.fields.map((f) => (
                    <FieldInput pick={pickImage} key={f.key} f={f} ckey={`${selDef.id}.${i}.${f.key}`} value={it[f.key]} onChange={(v) => commit(writeItems(cfg, selDef, items.map((x, k) => (k === i ? { ...x, [f.key]: v } : x))), `${selDef.id}.${i}.${f.key}`)} />
                  ))}
                </div>
              ))}
              {items.length < selDef.items.max && (
                <button type="button" onClick={() => commit(writeItems(cfg, selDef, [...items, selDef.items!.blank()]))} className="w-full min-h-[44px] rounded-xl border border-dashed border-black/25 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer">
                  <Plus className="h-4 w-4" /> {selDef.items.addLabel}
                </button>
              )}
            </div>
          )}
        </div>
      );
    }
    if (!isSystem && page && selected === "__page") {
      return (
        <div className="p-4 space-y-4">
          <h2 className="text-base font-black">Titre et statut</h2>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wide text-[#666660]">Titre de la page</label>
            <input className={inputCls} value={page.title} onChange={(e) => { setPage({ ...page, title: e.target.value }); setDirty(true); }} />
          </div>
          <label className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer">
            <span className="text-sm font-bold">Page publiée</span>
            <input type="checkbox" className="h-5 w-5 accent-[#1F3A26]" checked={page.published} onChange={(e) => { setPage({ ...page, published: e.target.checked }); setDirty(true); }} />
          </label>
          <p className="text-[11px] text-[#888880]">Adresse : /pages/{page.slug}</p>
        </div>
      );
    }
    if (!isSystem && selBlock) {
      const upd = (patch: Partial<PageBlock>, k: string) => commit(blocks.map((b) => (b.id === selBlock.id ? { ...b, ...patch } : b)), `${selBlock.id}.${k}`);
      return (
        <div className="p-4 space-y-5">
          <h2 className="text-base font-black">{PAGE_BLOCK_LABELS[selBlock.type]}</h2>
          {(selBlock.type === "heading" || selBlock.type === "button") && (
            <FieldInput pick={pickImage} f={{ key: "text", label: selBlock.type === "button" ? "Texte du bouton" : "Titre", kind: "text" }} ckey="t" value={selBlock.text} onChange={(v) => upd({ text: String(v) }, "text")} />
          )}
          {selBlock.type === "text" && <FieldInput pick={pickImage} f={{ key: "text", label: "Texte", kind: "textarea" }} ckey="t" value={selBlock.text} onChange={(v) => upd({ text: String(v) }, "text")} />}
          {selBlock.type === "image" && (
            <>
              <FieldInput pick={pickImage} f={{ key: "imageUrl", label: "Image", kind: "image" }} ckey="i" value={selBlock.imageUrl} onChange={(v) => upd({ imageUrl: String(v) }, "img")} />
              <FieldInput pick={pickImage} f={{ key: "alt", label: "Texte alternatif", kind: "text" }} ckey="a" value={selBlock.alt} onChange={(v) => upd({ alt: String(v) }, "alt")} />
            </>
          )}
          {selBlock.type === "button" && <FieldInput pick={pickImage} f={{ key: "url", label: "Lien", kind: "url" }} ckey="u" value={selBlock.url} onChange={(v) => upd({ url: String(v) }, "url")} />}
          <FieldInput pick={pickImage} f={{ key: "align", label: "Alignement", kind: "select", options: [{ value: "left", label: "À gauche" }, { value: "center", label: "Centré" }] }} ckey="al" value={selBlock.align} onChange={(v) => upd({ align: v === "center" ? "center" : "left" }, "align")} />
          <button type="button" onClick={() => { commit(blocks.filter((b) => b.id !== selBlock.id)); setSelected(null); setTab("sections"); }} className="w-full min-h-[44px] rounded-xl border border-rose-200 text-rose-600 text-xs font-bold inline-flex items-center justify-center gap-2 hover:bg-rose-50 cursor-pointer">
            <Trash2 className="h-4 w-4" /> Supprimer le bloc
          </button>
        </div>
      );
    }
    return <p className="p-6 text-xs text-[#666660] text-center">Sélectionnez une section pour modifier ses réglages.</p>;
  })();

  const previewPanel = (
    <div className="h-full w-full bg-[#E9EAE6] overflow-auto flex justify-center p-0 sm:p-4">
      {iframeSrc ? (
        <iframe
          ref={iframeRef}
          key={iframeSrc}
          src={iframeSrc}
          title="Aperçu"
          onLoad={() => {
            const w = iframeRef.current?.contentWindow;
            if (!w) return;
            if (isSystem && cfg) w.postMessage({ type: STUDIO_MESSAGE, config: cfg }, window.location.origin);
            if (!isSystem) w.postMessage({ type: STUDIO_MESSAGE, pageSections: blocks }, window.location.origin);
          }}
          className="bg-white h-full border-0 sm:rounded-xl sm:shadow-lg"
          style={{ width: frameWidth ? `${frameWidth}px` : "100%", maxWidth: "100%", minHeight: "100%" }}
        />
      ) : (
        <p className="m-auto text-xs text-[#666660]">Chargement de l'aperçu…</p>
      )}
    </div>
  );

  const ready = isSystem ? !!cfg : !!page;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col text-[#111111]">
      {/* Barre du haut */}
      <header className="h-14 shrink-0 border-b border-black/[0.08] px-2 sm:px-4 flex items-center gap-1 sm:gap-2">
        <Link href={`${base}/pages`} onClick={(e) => { if (dirty && !window.confirm("Quitter sans enregistrer vos modifications ?")) e.preventDefault(); }} className="min-h-[44px] px-2 sm:px-3 inline-flex items-center gap-1.5 text-xs font-bold rounded-lg hover:bg-black/[0.05]">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Retour</span>
        </Link>
        <span className="hidden md:inline px-2.5 py-1 rounded-full bg-[#1F3A26] text-white text-[11px] font-black">Kelio Studio</span>
        <span className="px-2.5 py-1 rounded-full bg-black/[0.06] text-[11px] font-bold truncate max-w-[110px] sm:max-w-none">{title}</span>
        <div className="flex-1" />
        <button type="button" aria-label="Annuler" disabled={!past.current.length} onClick={undo} className="h-10 w-10 grid place-items-center rounded-lg hover:bg-black/[0.05] disabled:opacity-25 cursor-pointer"><Undo2 className="h-4 w-4" /></button>
        <button type="button" aria-label="Rétablir" disabled={!future.current.length} onClick={redo} className="h-10 w-10 grid place-items-center rounded-lg hover:bg-black/[0.05] disabled:opacity-25 cursor-pointer"><Redo2 className="h-4 w-4" /></button>
        {isSystem && (
          <Link href={`${base}/apparence`} className="hidden sm:inline-flex min-h-[40px] px-3 items-center gap-1.5 text-xs font-bold rounded-lg hover:bg-black/[0.05]">
            <Palette className="h-4 w-4" /> Thème
          </Link>
        )}
        <div className="hidden lg:flex items-center rounded-lg border border-black/[0.1] overflow-hidden">
          {([["auto", Monitor, "Auto"], ["tablet", Tablet, "Tablette"], ["mobile", Smartphone, "Mobile"]] as const).map(([d, Icon, label]) => (
            <button key={d} type="button" aria-label={label} title={label} onClick={() => setDevice(d)} className={`h-9 w-10 grid place-items-center cursor-pointer ${device === d ? "bg-[#1F3A26] text-white" : "hover:bg-black/[0.05]"}`}><Icon className="h-4 w-4" /></button>
          ))}
        </div>
        <button type="button" disabled={saving || !dirty || !ready} onClick={save} className="min-h-[40px] px-4 rounded-xl bg-[#1F3A26] text-white text-xs font-bold disabled:opacity-40 cursor-pointer">
          {saving ? "…" : "Enregistrer"}
        </button>
      </header>

      {/* Corps : 3 colonnes sur grand écran, onglets sur mobile */}
      <div className="flex-1 min-h-0 flex">
        <aside className={`${tab === "sections" ? "flex" : "hidden"} lg:flex w-full lg:w-72 shrink-0 flex-col border-r border-black/[0.08] overflow-y-auto bg-white`}>{sectionsPanel}</aside>
        <main className={`${tab === "preview" ? "block" : "hidden"} lg:block flex-1 min-w-0`}>{previewPanel}</main>
        <aside className={`${tab === "settings" ? "block" : "hidden"} lg:block w-full lg:w-80 shrink-0 border-l border-black/[0.08] overflow-y-auto bg-white`}>{settingsPanel}</aside>
      </div>

      {/* Onglets mobiles */}
      <nav className="lg:hidden h-14 shrink-0 border-t border-black/[0.08] grid grid-cols-3 bg-white">
        {([["sections", "Sections"], ["preview", "Aperçu"], ["settings", "Réglages"]] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`text-xs font-black cursor-pointer ${tab === k ? "text-[#1F3A26] border-t-2 border-[#1F3A26]" : "text-[#666660]"}`}>{l}</button>
        ))}
      </nav>

      {/* Ajouter une section (pages personnalisées) */}
      {adding && (
        <div className="fixed inset-0 z-[110] bg-black/40 grid place-items-end sm:place-items-center" onClick={() => setAdding(false)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-black">Ajouter une section</h3>
              <button type="button" aria-label="Fermer" onClick={() => setAdding(false)} className="h-9 w-9 grid place-items-center cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            {(Object.keys(PAGE_BLOCK_LABELS) as PageBlockType[]).map((t) => (
              <button key={t} type="button" onClick={() => { const b = newPageBlock(t); commit([...blocks, b]); setSelected(b.id); setAdding(false); setTab("settings"); }} className="w-full min-h-[48px] rounded-xl border border-black/[0.1] text-sm font-bold hover:bg-[#FAF8F5] cursor-pointer">
                {PAGE_BLOCK_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      )}

      <ImagePicker
        isOpen={!!picker}
        onClose={() => setPicker(null)}
        storeSlug={storeSlug}
        context="banner"
        onSelectImage={(d) => { picker?.(d.url); setPicker(null); }}
      />

      {toast && <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[120] px-4 py-2 rounded-full bg-[#111111] text-white text-xs font-bold shadow-lg">{toast}</div>}
    </div>
  );
}
