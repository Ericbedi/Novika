/** Vérification DNS réelle d'un domaine (DNS-over-HTTPS), côté serveur. */
import { VERCEL_APEX_IP, VERCEL_CNAME_TARGET, isSubdomain } from "./custom-domains";

interface DohAnswer { type: number; data: string }

async function doh(name: string, type: "A" | "CNAME"): Promise<DohAnswer[]> {
  try {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, {
      headers: { accept: "application/dns-json" },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d?.Answer) ? d.Answer : [];
  } catch {
    return [];
  }
}

/** Vrai si le domaine pointe bien vers Vercel (A sur l'IP Vercel, ou CNAME vers vercel-dns). */
export async function domainPointsToPlatform(domain: string): Promise<{ ok: boolean; reason: string }> {
  const [a, cname] = await Promise.all([doh(domain, "A"), doh(domain, "CNAME")]);
  const cnameOk = cname.some((x) => x.type === 5 && /vercel-dns\.com\.?$/i.test(x.data));
  const aOk = a.some((x) => x.type === 1 && x.data === VERCEL_APEX_IP);
  // Un CNAME aplati (chez Cloudflare par ex.) renvoie directement des IP Vercel
  const aVercelRange = a.some((x) => x.type === 1 && /^(76\.76\.2[01]\.|64\.29\.17\.)/.test(x.data));
  if (cnameOk || aOk || aVercelRange) return { ok: true, reason: "Le domaine pointe bien vers Kelio." };
  if (!a.length && !cname.length) return { ok: false, reason: "Aucun enregistrement DNS trouvé pour l'instant. La propagation peut prendre de quelques minutes à 24 h." };
  return {
    ok: false,
    reason: isSubdomain(domain)
      ? `Le CNAME ne pointe pas encore vers ${VERCEL_CNAME_TARGET}.`
      : `L'enregistrement A ne pointe pas encore vers ${VERCEL_APEX_IP}.`,
  };
}
