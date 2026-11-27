"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ChevronDown, ChevronUp, GripVertical, Mail, MapPin, Phone, Plus, Search, Trash2, AlignLeft, Globe, List, Map as MapIcon, Type,
} from "lucide-react";
import { getSortedAfricanCountries } from "@/config/countries";
import {
  BUTTON_COLORS, FIELD_KIND_LABELS, defaultFormConfig, newField, readableTextColor, sanitizeFormConfig,
  type FormFieldDef, type FormFieldKind, type OrderFormConfig,
} from "@/lib/order-form-config";

const COUNTRIES = getSortedAfricanCountries();
const ICONS: Record<FormFieldKind, React.ComponentType<{ className?: string }>> = {
  name: Type, phone: Phone, city: MapPin, address: MapPin, text: Type, textarea: AlignLeft, email: Mail, select: List, country: Globe, region: MapIcon,
};
const ADDABLE: FormFieldKind[] = ["text", "textarea", "phone", "email", "select", "address"];
const GEO: FormFieldKind[] = ["country", "region"];

const inp = "w-full min-h-[44px] px-3 py-2 text-base sm:text-sm rounded-xl border border-black/[0.1] bg-[#FAF8F5] focus:outline-none focus:border-[#2B4A2C]";
const cap = "block text-[10px] font-black uppercase tracking-[0.15em] text-[#666660] mb-1.5";

export function OrderFormClient({ storeSlug }: { storeSlug: string }) {
  const [cfg, setCfg] = useState<OrderFormConfig>(defaultFormConfig());
  const [saved, setSaved] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [cOpen, setCOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrap = useRef<HTMLDivElement>(null);
  const dragId = useRef<string | null>(null);

  useEffect(() => {
    fetch(`/api/shop-brand?store=${encodeURIComponent(storeSlug)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const b = d?.brand || {};
        let next = sanitizeFormConfig(b.formConfig) || defaultFormConfig();
        // Reprend les anciens réglages (titre, bouton) si aucune configuration n'a encore été enregistrée
        if (!b.formConfig) next = { ...next, name: b.formTitle || "", buttonText: b.formButton || next.buttonText, buttonColor: typeof b.color === "string" && /^#[0-9a-fA-F]{6}$/.test(b.color) ? b.color : next.buttonColor };
        setCfg(next);
        setSaved(JSON.stringify(next));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [storeSlug]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) { setMenu(false); setCOpen(false); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const dirty = loaded && JSON.stringify(cfg) !== saved;
  const upd = (patch: Partial<OrderFormConfig>) => setCfg((c) => ({ ...c, ...patch }));
  const updField = (id: string, patch: Partial<FormFieldDef>) => setCfg((c) => ({ ...c, fields: c.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
  const move = (id: string, dir: -1 | 1) => setCfg((c) => {
    const i = c.fields.findIndex((f) => f.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= c.fields.length) return c;
    const fields = [...c.fields];
    [fields[i], fields[j]] = [fields[j], fields[i]];
    return { ...c, fields };
  });
  const dropOn = (targetId: string) => {
    const from = dragId.current;
    dragId.current = null;
    if (!from || from === targetId) return;
    setCfg((c) => {
      const fields = [...c.fields];
      const i = fields.findIndex((f) => f.id === from), j = fields.findIndex((f) => f.id === targetId);
      if (i < 0 || j < 0) return c;
      const [it] = fields.splice(i, 1);
      fields.splice(j, 0, it);
      return { ...c, fields };
    });
  };
  const addField = (kind: FormFieldKind) => {
    const f = newField(kind);
    setCfg((c) => ({ ...c, fields: [...c.fields, f] }));
    setOpen(f.id);
    setMenu(false);
  };

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const clean = sanitizeFormConfig(cfg)!;
      const r = await fetch("/api/stores/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // formTitle / formButton restent synchronisés pour les anciennes pages produit
        body: JSON.stringify({ slug: storeSlug, brand: { formConfig: clean, formTitle: clean.name, formButton: clean.buttonText } }),
      });
      const d = await r.json();
      if (!d?.success) throw new Error(d?.error || "Enregistrement impossible.");
      setCfg(clean);
      setSaved(JSON.stringify(clean));
      setMsg({ ok: true, text: "Enregistré. Le formulaire de la boutique est à jour (mobile et navigateur)." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Enregistrement impossible." });
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(() => COUNTRIES.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase())), [q]);
  const toggleCountry = (code: string) => upd({ countries: cfg.countries.includes(code) ? cfg.countries.filter((x) => x !== code) : [...cfg.countries, code] });

  return (
    <div className="pb-28 max-w-6xl space-y-6" ref={wrap}>
      <Link href={`/app/${storeSlug}/boutique-en-ligne`} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#666660] hover:text-[#111111]">
        <ArrowLeft className="h-3.5 w-3.5" /> Boutique en ligne
      </Link>
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#111111] tracking-tight">Formulaire <span className="font-light italic text-[#666660]">· commande</span></h1>
        <p className="text-xs text-[#666660] mt-2">Personnalisez le formulaire de commande de vos clients</p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
        <div className="space-y-5 min-w-0">
          {/* Nom du formulaire */}
          <section className="rounded-3xl border border-black/[0.08] bg-white p-5">
            <label className={cap}>Nom du formulaire</label>
            <input className={inp} placeholder="Ex : Formulaire de commande" value={cfg.name} onChange={(e) => upd({ name: e.target.value })} />
          </section>

          {/* Pays acceptés */}
          <section className="rounded-3xl border border-black/[0.08] bg-white p-5 space-y-3">
            <div>
              <label className={cap}>Pays acceptés</label>
              <p className="text-[11px] text-[#888880]">Définit les pays où vous livrez. Laissez vide pour accepter tous les pays.</p>
            </div>
            <div className="relative">
              <button type="button" onClick={() => setCOpen(!cOpen)} className={`${inp} flex items-center justify-between text-left cursor-pointer`}>
                <span className={cfg.countries.length ? "text-[#111111]" : "text-[#888880]"}>
                  {cfg.countries.length ? cfg.countries.map((c) => COUNTRIES.find((x) => x.code === c)?.name || c).join(", ") : "Sélectionnez un ou plusieurs pays…"}
                </span>
                {cOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>
              {cOpen && (
                <div className="absolute z-30 left-0 right-0 mt-1 rounded-2xl border border-black/[0.1] bg-white shadow-xl overflow-hidden">
                  <div className="p-2 relative">
                    <Search className="h-4 w-4 absolute left-5 top-1/2 -translate-y-1/2 text-[#888880]" />
                    <input autoFocus className={`${inp} pl-9`} placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
                  </div>
                  <div className="flex gap-2 px-2 pb-2">
                    <button type="button" onClick={() => upd({ countries: COUNTRIES.map((c) => c.code) })} className="px-3 py-1.5 rounded-lg border border-black/[0.1] text-[10px] font-black uppercase tracking-wider cursor-pointer">+ Tous les pays</button>
                    <button type="button" onClick={() => upd({ countries: [] })} className="px-3 py-1.5 rounded-lg border border-black/[0.1] text-[10px] font-black uppercase tracking-wider cursor-pointer">Tout effacer</button>
                  </div>
                  <ul className="max-h-64 overflow-y-auto border-t border-black/[0.06]">
                    {filtered.map((c) => (
                      <li key={c.code}>
                        <label className="flex items-center justify-between gap-3 px-4 min-h-[44px] hover:bg-[#FAF8F5] cursor-pointer">
                          <span className="text-sm"><span className="text-[10px] font-mono font-bold text-[#888880] mr-2">{c.code}</span>{c.name}</span>
                          <input type="checkbox" className="h-4 w-4 accent-[#2B4A2C]" checked={cfg.countries.includes(c.code)} onChange={() => toggleCountry(c.code)} />
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* Champs */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl italic text-[#111111]">Champs du formulaire</h2>
              <div className="relative">
                <button type="button" onClick={() => setMenu(!menu)} className="min-h-[44px] px-4 rounded-xl bg-[#2B4A2C] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer">
                  <Plus className="h-4 w-4" /> Ajouter un champ
                </button>
                {menu && (
                  <div className="absolute right-0 z-30 mt-2 w-72 max-w-[85vw] rounded-2xl border border-black/[0.1] bg-white shadow-xl p-2">
                    {ADDABLE.map((k) => <MenuItem key={k} kind={k} onPick={addField} />)}
                    <p className="px-3 pt-3 pb-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#888880]">Champs géographiques</p>
                    {GEO.map((k) => <MenuItem key={k} kind={k} onPick={addField} />)}
                  </div>
                )}
              </div>
            </div>

            {cfg.fields.map((f, i) => {
              const Icon = ICONS[f.kind];
              const isOpen = open === f.id;
              return (
                <div
                  key={f.id}
                  draggable
                  onDragStart={() => { dragId.current = f.id; }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => dropOn(f.id)}
                  className={`rounded-2xl border bg-white ${isOpen ? "border-[#2B4A2C]" : "border-black/[0.08]"}`}
                >
                  <div className="flex items-center gap-2 px-3 min-h-[60px]">
                    <GripVertical className="h-4 w-4 text-[#BBBBB0] shrink-0 hidden sm:block cursor-grab" />
                    <button type="button" onClick={() => setOpen(isOpen ? null : f.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left min-h-[44px] cursor-pointer">
                      <span className="h-9 w-9 rounded-xl bg-[#F1EBE1] grid place-items-center shrink-0"><Icon className="h-4 w-4" /></span>
                      <span className="text-sm font-bold truncate">{f.label}</span>
                      <span className="hidden sm:inline px-2 py-0.5 rounded bg-[#F1EBE1] text-[9px] font-black uppercase tracking-wider">{FIELD_KIND_LABELS[f.kind].label}</span>
                      {f.system && <span className="hidden sm:inline px-2 py-0.5 rounded bg-sky-100 text-sky-900 text-[9px] font-black uppercase tracking-wider">Système</span>}
                    </button>
                    {f.required && <span className="text-[9px] font-black uppercase tracking-wider text-rose-600">Requis</span>}
                    <button type="button" aria-label="Monter" disabled={i === 0} onClick={() => move(f.id, -1)} className="h-9 w-8 grid place-items-center disabled:opacity-20 cursor-pointer"><ChevronUp className="h-4 w-4" /></button>
                    <button type="button" aria-label="Descendre" disabled={i === cfg.fields.length - 1} onClick={() => move(f.id, 1)} className="h-9 w-8 grid place-items-center disabled:opacity-20 cursor-pointer"><ChevronDown className="h-4 w-4" /></button>
                    <button type="button" aria-label="Supprimer" disabled={f.system} onClick={() => { setCfg((c) => ({ ...c, fields: c.fields.filter((x) => x.id !== f.id) })); setOpen(null); }} className="h-9 w-9 grid place-items-center disabled:opacity-20 text-[#666660] hover:text-rose-600 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  {isOpen && (
                    <div className="border-t border-black/[0.06] p-4 space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div><label className={cap}>Libellé affiché</label><input className={inp} value={f.label} onChange={(e) => updField(f.id, { label: e.target.value })} /></div>
                        <div><label className={cap}>Texte indicatif (placeholder)</label><input className={inp} value={f.placeholder} onChange={(e) => updField(f.id, { placeholder: e.target.value })} /></div>
                      </div>
                      {f.kind === "select" && (
                        <div>
                          <label className={cap}>Options (une par ligne)</label>
                          <textarea className={`${inp} min-h-[96px]`} value={(f.options || []).join("\n")} onChange={(e) => updField(f.id, { options: e.target.value.split("\n") })} />
                        </div>
                      )}
                      <label className="flex items-center justify-between gap-3 pt-3 border-t border-black/[0.06] min-h-[44px] cursor-pointer">
                        <span className="text-sm">Champ obligatoire{f.system && <span className="text-[#888880] text-xs"> — requis par le système</span>}</span>
                        <input type="checkbox" disabled={f.system} className="h-5 w-5 accent-[#2B4A2C]" checked={f.required} onChange={(e) => updField(f.id, { required: e.target.checked })} />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {/* Bouton */}
          <section className="rounded-3xl border border-black/[0.08] bg-white p-5 space-y-5">
            <div><label className={cap}>Texte du bouton de validation</label><input className={inp} value={cfg.buttonText} onChange={(e) => upd({ buttonText: e.target.value })} placeholder="Commander" /></div>
            <div className="border-t border-black/[0.06] pt-5 space-y-3">
              <label className={cap}>Couleur du bouton</label>
              <div className="flex flex-wrap gap-3">
                {BUTTON_COLORS.map((c) => (
                  <button key={c} type="button" aria-label={c} onClick={() => upd({ buttonColor: c })} style={{ backgroundColor: c }} className={`h-11 w-11 rounded-xl cursor-pointer ${cfg.buttonColor.toLowerCase() === c.toLowerCase() ? "ring-2 ring-offset-2 ring-[#111111]" : ""}`} />
                ))}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-[#666660]">Personnalisée :</span>
                <input type="color" aria-label="Couleur personnalisée" value={cfg.buttonColor} onChange={(e) => upd({ buttonColor: e.target.value })} className="h-10 w-12 rounded-lg border border-black/10 cursor-pointer" />
                <input className="w-28 min-h-[40px] px-3 rounded-lg border border-black/[0.1] bg-[#FAF8F5] font-mono text-sm" value={cfg.buttonColor} onChange={(e) => upd({ buttonColor: e.target.value })} />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#888880]">✓ Texte {readableTextColor(cfg.buttonColor) === "#FFFFFF" ? "blanc" : "noir"}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Aperçu en direct */}
        <aside className="lg:sticky lg:top-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2B4A2C] flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-600" />Aperçu en direct</p>
          <p className="text-[11px] text-[#666660]">Voici exactement ce que verront vos clients sur la boutique.</p>
          <div className="rounded-3xl border border-black/[0.08] bg-white p-5 shadow-sm space-y-4">
            {cfg.name && <h3 className="text-base font-black">{cfg.name}</h3>}
            {cfg.fields.map((f) => (
              <div key={f.id} className="space-y-1.5">
                <label className="text-sm font-bold">{f.label}{f.required && <span className="text-rose-600"> *</span>}</label>
                {f.kind === "textarea" ? (
                  <textarea readOnly rows={3} placeholder={f.placeholder} className="w-full px-3 py-2.5 text-sm rounded-xl border border-black/[0.1] bg-white" />
                ) : f.kind === "select" || f.kind === "country" ? (
                  <select disabled className="w-full min-h-[44px] px-3 text-sm rounded-xl border border-black/[0.1] bg-white"><option>{f.placeholder || "Choisissez…"}</option></select>
                ) : (
                  <input readOnly placeholder={f.placeholder} className="w-full min-h-[44px] px-3 text-sm rounded-xl border border-black/[0.1] bg-white" />
                )}
              </div>
            ))}
            <button type="button" style={{ backgroundColor: cfg.buttonColor, color: readableTextColor(cfg.buttonColor) }} className="w-full min-h-[52px] rounded-xl font-black text-sm">{cfg.buttonText || "Commander"}</button>
          </div>
        </aside>
      </div>

      {/* Barre d'enregistrement */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-black/[0.08] px-4 py-3 flex items-center justify-end gap-3">
        {msg && <p className={`text-xs font-bold mr-auto ${msg.ok ? "text-emerald-700" : "text-rose-600"}`}>{msg.text}</p>}
        <button type="button" disabled={!dirty || saving} onClick={save} className="min-h-[48px] px-6 rounded-xl bg-[#2B4A2C] text-white text-sm font-bold disabled:opacity-40 cursor-pointer">
          {saving ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}

function MenuItem({ kind, onPick }: { kind: FormFieldKind; onPick: (k: FormFieldKind) => void }) {
  const Icon = ICONS[kind];
  return (
    <button type="button" onClick={() => onPick(kind)} className="w-full flex items-center gap-3 px-3 min-h-[52px] rounded-xl hover:bg-[#F1EBE1] text-left cursor-pointer">
      <span className="h-9 w-9 rounded-xl bg-[#F1EBE1] grid place-items-center shrink-0"><Icon className="h-4 w-4" /></span>
      <span><span className="block text-sm font-bold">{FIELD_KIND_LABELS[kind].label}</span><span className="block text-[11px] text-[#888880]">{FIELD_KIND_LABELS[kind].hint}</span></span>
    </button>
  );
}
