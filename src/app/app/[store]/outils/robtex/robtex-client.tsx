"use client";

import React, { useState } from "react";
import { Globe, Search, CheckCircle2, AlertTriangle, Server } from "lucide-react";

interface IpInfo {
  ip: string;
  country?: string;
  city?: string;
  asn?: number;
  asName?: string;
  route?: string;
  hostnames: string[];
  isHosting: boolean;
}
interface Result {
  success: boolean;
  kind: "ip" | "domain";
  query: string;
  ip?: IpInfo | null;
  dns?: { a: string[]; aaaa: string[]; cname: string[]; ns: string[]; mx: string[] };
  sharedDomains?: string[];
  novika?: { ok: boolean; detail: string };
}

function Chips({ items, empty = "Aucun" }: { items: string[]; empty?: string }) {
  if (!items.length) return <span className="text-xs text-[#888880]">{empty}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i} className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-black/[0.06] text-[11px] font-semibold text-[#111111] break-all">
          {i}
        </span>
      ))}
    </div>
  );
}

export function RobtexClient() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState<Result | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setRes(null);
    try {
      const r = await fetch(`/api/robtex/lookup?q=${encodeURIComponent(q.trim())}`, { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) setError(d.error || "Analyse impossible.");
      else setRes(d);
    } catch {
      setError("Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-black text-[#111111]">Analyse web (Robtex)</h1>
          <p className="text-xs text-[#666660]">
            Entrez un domaine (site concurrent, votre propre domaine) ou une adresse IP : DNS, hébergeur, sites sur le même serveur.
          </p>
        </div>
      </div>

      <form onSubmit={run} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="exemple.com ou 76.76.21.21"
          className="flex-1 min-h-[44px] px-3 rounded-xl border border-black/[0.1] bg-white text-base sm:text-sm focus:outline-none"
          aria-label="Domaine ou adresse IP"
        />
        <button
          type="submit"
          disabled={loading}
          className="min-h-[44px] px-4 rounded-xl bg-[#111111] text-white text-xs font-black flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
        >
          <Search className="h-4 w-4" />
          {loading ? "Analyse…" : "Analyser"}
        </button>
      </form>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800">{error}</div>}

      {res && (
        <div className="space-y-4">
          {res.kind === "domain" && res.novika && (
            <div
              className={`p-3 rounded-2xl border text-xs font-bold flex items-start gap-2 ${
                res.novika.ok ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-amber-50 border-amber-200 text-amber-950"
              }`}
            >
              {res.novika.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
              <span>
                {res.novika.ok ? "Ce domaine pointe vers Novika. " : "Ce domaine ne pointe pas encore vers Novika. "}
                {res.novika.detail}
              </span>
            </div>
          )}

          {res.dns && (
            <section className="p-4 rounded-2xl border border-black/[0.08] bg-white space-y-3">
              <h2 className="text-sm font-black text-[#111111]">Enregistrements DNS de {res.query}</h2>
              <div className="space-y-2">
                <div><p className="text-[11px] font-bold text-[#666660] mb-1">A (IPv4)</p><Chips items={res.dns.a} /></div>
                <div><p className="text-[11px] font-bold text-[#666660] mb-1">CNAME</p><Chips items={res.dns.cname} /></div>
                <div><p className="text-[11px] font-bold text-[#666660] mb-1">Serveurs de noms (NS)</p><Chips items={res.dns.ns} /></div>
                <div><p className="text-[11px] font-bold text-[#666660] mb-1">E-mail (MX)</p><Chips items={res.dns.mx} /></div>
              </div>
            </section>
          )}

          {res.ip && (
            <section className="p-4 rounded-2xl border border-black/[0.08] bg-white space-y-2">
              <h2 className="text-sm font-black text-[#111111] flex items-center gap-2">
                <Server className="h-4 w-4" /> Serveur {res.ip.ip}
              </h2>
              <dl className="grid grid-cols-[110px_1fr] gap-y-1.5 text-xs">
                <dt className="font-bold text-[#666660]">Pays / ville</dt>
                <dd>{[res.ip.country, res.ip.city].filter(Boolean).join(" · ") || "—"}</dd>
                <dt className="font-bold text-[#666660]">Hébergeur (AS)</dt>
                <dd>{res.ip.asName ? `${res.ip.asName}${res.ip.asn ? ` (AS${res.ip.asn})` : ""}` : "—"}</dd>
                <dt className="font-bold text-[#666660]">Réseau</dt>
                <dd>{res.ip.route || "—"}</dd>
                <dt className="font-bold text-[#666660]">Type</dt>
                <dd>{res.ip.isHosting ? "Centre de données / hébergement" : "Non identifié comme hébergement"}</dd>
              </dl>
              {res.ip.hostnames.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-[#666660] mb-1">Noms associés</p>
                  <Chips items={res.ip.hostnames} />
                </div>
              )}
            </section>
          )}

          {res.sharedDomains && (
            <section className="p-4 rounded-2xl border border-black/[0.08] bg-white space-y-2">
              <h2 className="text-sm font-black text-[#111111]">Autres sites sur le même serveur</h2>
              <Chips items={res.sharedDomains} empty="Aucun autre site observé" />
            </section>
          )}

          <p className="text-[11px] text-[#888880]">
            Source : Robtex (données DNS passives, elles peuvent être en retard de quelques heures ou jours). Version gratuite limitée à 10 analyses par heure.
          </p>
        </div>
      )}
    </div>
  );
}
