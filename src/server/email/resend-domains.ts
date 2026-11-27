/** Domaines d'envoi Resend : création, lecture, vérification (clé RESEND_API_KEY, jamais exposée). */
export interface SendDnsRecord { record: string; type: string; name: string; value: string; priority?: number; status?: string }
export interface ResendDomainState { id: string; status: string; records: SendDnsRecord[] }

const API = "https://api.resend.com/domains";
const headers = () => ({ Authorization: `Bearer ${process.env.RESEND_API_KEY?.trim() || ""}`, "Content-Type": "application/json" });

function shape(d: any): ResendDomainState {
  return {
    id: String(d?.id || ""),
    status: String(d?.status || "not_started"),
    records: (Array.isArray(d?.records) ? d.records : []).slice(0, 12).map((r: any) => ({
      record: String(r.record || ""), type: String(r.type || ""), name: String(r.name || ""), value: String(r.value || ""),
      ...(typeof r.priority === "number" ? { priority: r.priority } : {}), status: String(r.status || ""),
    })),
  };
}

export const resendConfigured = () => !!process.env.RESEND_API_KEY?.trim();

export async function createSendDomain(name: string): Promise<{ ok: true; domain: ResendDomainState } | { ok: false; error: string }> {
  try {
    const r = await fetch(API, { method: "POST", headers: headers(), body: JSON.stringify({ name }), signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    if (!r.ok) return { ok: false, error: d?.message || "Création du domaine d'envoi impossible." };
    // La création renvoie parfois sans les enregistrements : on relit
    return getSendDomain(String(d.id));
  } catch {
    return { ok: false, error: "Service d'envoi injoignable." };
  }
}

export async function getSendDomain(id: string): Promise<{ ok: true; domain: ResendDomainState } | { ok: false; error: string }> {
  try {
    const r = await fetch(`${API}/${encodeURIComponent(id)}`, { headers: headers(), signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    if (!r.ok) return { ok: false, error: d?.message || "Lecture impossible." };
    return { ok: true, domain: shape(d) };
  } catch {
    return { ok: false, error: "Service d'envoi injoignable." };
  }
}

export async function verifySendDomain(id: string): Promise<{ ok: true; domain: ResendDomainState } | { ok: false; error: string }> {
  try {
    await fetch(`${API}/${encodeURIComponent(id)}/verify`, { method: "POST", headers: headers(), signal: AbortSignal.timeout(8000) });
  } catch {
    return { ok: false, error: "Service d'envoi injoignable." };
  }
  return getSendDomain(id);
}
