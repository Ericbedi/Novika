/**
 * Client Robtex (analyse IP / DNS) — usage serveur uniquement.
 * API gratuite : ~10 requêtes/heure par IP ; pour davantage, renseigner ROBTEX_API_KEY (+ ROBTEX_BASE_URL / ROBTEX_API_HOST
 * de l'offre RapidAPI choisie). Un cache mémoire évite de consommer le quota inutilement.
 */

const BASE_URL = () => process.env.ROBTEX_BASE_URL || "https://freeapi.robtex.com";
const TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const cache = new Map<string, { at: number; value: unknown }>();

export class RobtexError extends Error {
  constructor(message: string, public code: "RATE_LIMITED" | "UNAVAILABLE" | "INVALID") {
    super(message);
  }
}

async function robtexGet(path: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(path, BASE_URL());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const key = url.toString();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.ROBTEX_API_KEY) {
    headers["x-rapidapi-key"] = process.env.ROBTEX_API_KEY;
    if (process.env.ROBTEX_API_HOST) headers["x-rapidapi-host"] = process.env.ROBTEX_API_HOST;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(key, { headers, signal: ctrl.signal, cache: "no-store" });
    if (res.status === 429) throw new RobtexError("Limite Robtex atteinte (10 requêtes/heure en version gratuite).", "RATE_LIMITED");
    if (!res.ok) throw new RobtexError(`Robtex indisponible (${res.status}).`, "UNAVAILABLE");
    const text = await res.text();
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      // Format NDJSON : une ligne JSON par enregistrement
      value = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          try {
            return JSON.parse(l);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    }
    if (value && typeof value === "object" && (value as { status?: string }).status === "ratelimited") {
      throw new RobtexError("Limite Robtex atteinte (10 requêtes/heure en version gratuite).", "RATE_LIMITED");
    }
    cache.set(key, { at: Date.now(), value });
    return value;
  } catch (e) {
    if (e instanceof RobtexError) throw e;
    throw new RobtexError("Robtex ne répond pas.", "UNAVAILABLE");
  } finally {
    clearTimeout(timer);
  }
}

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const DOMAIN = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

export function classifyQuery(raw: string): { kind: "ip" | "domain"; value: string } | null {
  const v = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  if (IPV4.test(v)) return { kind: "ip", value: v };
  if (DOMAIN.test(v)) return { kind: "domain", value: v };
  return null;
}

export interface IpInfo {
  ip: string;
  country?: string;
  city?: string;
  asn?: number;
  asName?: string;
  route?: string;
  hostnames: string[];
  isHosting: boolean;
}

const HOSTING_HINTS = /(amazon|aws|google|microsoft|azure|digitalocean|ovh|hetzner|linode|vultr|cloudflare|contabo|leaseweb|choopa|m247|oracle|alibaba|tencent|scaleway|datacamp|packet|colo|hosting|vps|server|cloud|datacenter|data center)/i;

export async function lookupIp(ip: string): Promise<IpInfo> {
  const d = (await robtexGet("/ipquery/" + encodeURIComponent(ip), {})) as Record<string, any>;
  const pas: any[] = Array.isArray(d.pas) ? d.pas : [];
  const hostnames = pas.map((p) => p?.o).filter((x) => typeof x === "string").slice(0, 25);
  const asName: string | undefined = d.asname || d.as_name;
  return {
    ip,
    country: d.country,
    city: d.city,
    asn: typeof d.as === "number" ? d.as : undefined,
    asName,
    route: d.bgproute || d.route,
    hostnames,
    isHosting: Boolean(asName && HOSTING_HINTS.test(asName)),
  };
}

export interface DnsRecords {
  a: string[];
  aaaa: string[];
  cname: string[];
  ns: string[];
  mx: string[];
}

export async function lookupDomain(domain: string): Promise<DnsRecords> {
  const raw = (await robtexGet("/pdns/forward/" + encodeURIComponent(domain), {})) as any;
  const rows: any[] = Array.isArray(raw) ? raw : [];
  const rec: DnsRecords = { a: [], aaaa: [], cname: [], ns: [], mx: [] };
  // Données passives : on ne garde que les observations proches de la plus récente (évite les anciens enregistrements)
  const newest = rows.reduce((m, r) => Math.max(m, Number(r?.time_last) || 0), 0);
  const recent = newest ? rows.filter((r) => (Number(r?.time_last) || 0) >= newest - 30 * 86400) : rows;
  rows.length = 0;
  rows.push(...recent);
  const push = (arr: string[], v: unknown) => {
    if (typeof v === "string" && v && !arr.includes(v)) arr.push(v);
  };
  for (const r of rows) {
    const t = String(r?.rrtype || "").toUpperCase();
    if (t === "A") push(rec.a, r.rrdata);
    else if (t === "AAAA") push(rec.aaaa, r.rrdata);
    else if (t === "CNAME") push(rec.cname, r.rrdata);
    else if (t === "NS") push(rec.ns, r.rrdata);
    else if (t === "MX") push(rec.mx, r.rrdata);
  }
  return rec;
}

export async function reverseDomains(ip: string): Promise<string[]> {
  const raw = (await robtexGet("/pdns/reverse/" + encodeURIComponent(ip), {})) as any;
  const rows: any[] = Array.isArray(raw) ? raw : [];
  const out: string[] = [];
  for (const r of rows) {
    const h = r?.rrname;
    if (typeof h === "string" && !out.includes(h)) out.push(h);
    if (out.length >= 30) break;
  }
  return out;
}

/** Vérifie si un domaine pointe vers l'hébergement Kelio (Vercel). */
export function checkNovikaDns(rec: DnsRecords): { ok: boolean; detail: string } {
  const VERCEL_A = "76.76.21.21";
  if (rec.a.includes(VERCEL_A)) return { ok: true, detail: `Enregistrement A correct (${VERCEL_A}).` };
  if (rec.cname.some((c) => /vercel-dns\.com\.?$/i.test(c))) return { ok: true, detail: "CNAME correct (vercel-dns.com)." };
  if (rec.a.length === 0 && rec.cname.length === 0) {
    return { ok: false, detail: "Aucun enregistrement A ou CNAME trouvé (le domaine n'est peut-être pas encore propagé)." };
  }
  return {
    ok: false,
    detail: `Le domaine pointe ailleurs (${[...rec.a, ...rec.cname].slice(0, 3).join(", ")}). Attendu : A ${VERCEL_A} ou CNAME cname.vercel-dns.com.`,
  };
}

const COUNTRY_NAMES: Record<string, string[]> = {
  TG: ["togo"],
  BJ: ["benin", "bénin"],
  CI: ["ivory coast", "côte d'ivoire", "cote d'ivoire"],
  SN: ["senegal", "sénégal"],
  GH: ["ghana"],
  BF: ["burkina faso"],
  ML: ["mali"],
  NE: ["niger"],
};

export interface OrderIpAssessment {
  ip: string;
  country?: string;
  asName?: string;
  isHosting: boolean;
  flags: string[]; // "datacenter" | "foreign_country"
}

/**
 * Évalue l'adresse IP d'un client qui commande (jamais bloquant : renvoie null en cas de délai ou d'erreur).
 * Signale : IP de centre de données / VPN probable, et pays différent du pays de la boutique.
 */
export async function assessOrderIp(rawIp: string | null | undefined, shopCountryCode?: string): Promise<OrderIpAssessment | null> {
  const ip = (rawIp || "").split(",")[0].trim();
  const c = classifyQuery(ip);
  if (!c || c.kind !== "ip") return null;
  if (/^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(c.value)) return null;
  try {
    const info = await Promise.race([
      lookupIp(c.value),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
    ]);
    if (!info) return null;
    const flags: string[] = [];
    if (info.isHosting) flags.push("datacenter");
    const expected = COUNTRY_NAMES[(shopCountryCode || "").toUpperCase()];
    if (expected && info.country && !expected.includes(info.country.toLowerCase())) flags.push("foreign_country");
    return { ip: c.value, country: info.country, asName: info.asName, isHosting: info.isHosting, flags };
  } catch {
    return null;
  }
}
