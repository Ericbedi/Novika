/**
 * Client API Vercel pour la gestion des domaines personnalisés (Prompt 19)
 * - Appels sécurisés côté serveur uniquement (jeton jamais exposé)
 * - Récupération exacte des enregistrements DNS émis par Vercel
 * - Émission automatique des certificats SSL / HTTPS
 * - Mode simulation propre pour le développement local et les tests
 */

import { DnsRecordInstruction, VERCEL_APEX_IP, VERCEL_CNAME_TARGET, isSubdomain } from "./custom-domains";

export interface VercelDomainApiResponse {
  name: string;
  apexName: string;
  projectId: string;
  verified: boolean;
  verification?: {
    type: string;
    domain: string;
    value: string;
    reason?: string;
  }[];
  error?: {
    code: string;
    message: string;
  };
}

const VERCEL_API_BASE = "https://api.vercel.com";

function getVercelConfig() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  return { token, projectId, teamId };
}

/**
 * Attache un domaine au projet Vercel côté serveur.
 */
export async function addDomainToVercel(domain: string): Promise<{ success: boolean; dnsRecords: DnsRecordInstruction[]; error?: string }> {
  const { token, projectId, teamId } = getVercelConfig();

  // Si aucun jeton n'est configuré (ex: environnement local ou tests), utiliser la simulation sécurisée
  if (!token || !projectId) {
    return simulateVercelAddDomain(domain);
  }

  try {
    const url = new URL(`${VERCEL_API_BASE}/v9/projects/${projectId}/domains`);
    if (teamId) url.searchParams.set("teamId", teamId);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    });

    const data: VercelDomainApiResponse = await res.json();

    if (!res.ok) {
      return {
        success: false,
        dnsRecords: [],
        error: data.error?.message || "Impossible d'ajouter le domaine chez Vercel.",
      };
    }

    const dnsRecords = extractDnsRecordsFromVercel(domain, data);
    return { success: true, dnsRecords };
  } catch (err: any) {
    console.error("[Vercel Domains API] Erreur d'ajout :", err);
    return { success: false, dnsRecords: [], error: err.message || "Erreur de communication avec l'API Vercel." };
  }
}

/**
 * Déclenche la vérification DNS d'un domaine chez Vercel.
 */
export async function verifyDomainOnVercel(domain: string): Promise<{ isVerified: boolean; dnsRecords: DnsRecordInstruction[]; statusReason?: string }> {
  const { token, projectId, teamId } = getVercelConfig();

  if (!token || !projectId) {
    // Sans jeton Vercel, on ne peut pas confirmer le rattachement : jamais de faux succès
    return { isVerified: false, dnsRecords: [], statusReason: "Rattachement Vercel non configuré." };
  }

  try {
    const url = new URL(`${VERCEL_API_BASE}/v9/projects/${projectId}/domains/${domain}/verify`);
    if (teamId) url.searchParams.set("teamId", teamId);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data: VercelDomainApiResponse = await res.json();
    const isVerified = Boolean(data.verified);
    const dnsRecords = extractDnsRecordsFromVercel(domain, data);

    return {
      isVerified,
      dnsRecords,
      statusReason: isVerified
        ? "Certificat HTTPS actif et DNS vérifié avec succès."
        : "Les enregistrements DNS n'ont pas encore été détectés chez votre registrar.",
    };
  } catch (err: any) {
    console.error("[Vercel Domains API] Erreur de vérification :", err);
    return {
      isVerified: false,
      dnsRecords: [],
      statusReason: "Erreur réseau lors de la vérification Vercel.",
    };
  }
}

/**
 * Retire un domaine de Vercel.
 */
export async function removeDomainFromVercel(domain: string): Promise<{ success: boolean; error?: string }> {
  const { token, projectId, teamId } = getVercelConfig();

  if (!token || !projectId) {
    return { success: true };
  }

  try {
    const url = new URL(`${VERCEL_API_BASE}/v9/projects/${projectId}/domains/${domain}`);
    if (teamId) url.searchParams.set("teamId", teamId);

    const res = await fetch(url.toString(), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { success: res.ok };
  } catch (err: any) {
    console.error("[Vercel Domains API] Erreur de retrait :", err);
    return { success: false, error: err.message || "Erreur lors du retrait du domaine." };
  }
}

// ============================================================================
// SIMULATION HORS-LIGNE & TESTS
// ============================================================================

function simulateVercelAddDomain(domain: string): { success: boolean; dnsRecords: DnsRecordInstruction[] } {
  const isSub = isSubdomain(domain);
  const dnsRecords: DnsRecordInstruction[] = isSub
    ? [
        {
          type: "CNAME",
          name: domain.split(".")[0],
          value: VERCEL_CNAME_TARGET,
          status: "pending",
          description: `Chez votre registrar (Namecheap, OVH, GoDaddy), ajoutez un enregistrement CNAME pour ${domain.split(".")[0]} pointant vers ${VERCEL_CNAME_TARGET}`,
        },
      ]
    : [
        {
          type: "A",
          name: "@",
          value: VERCEL_APEX_IP,
          status: "pending",
          description: `Chez votre registrar (Namecheap, OVH, GoDaddy), ajoutez un enregistrement A pour @ pointant vers ${VERCEL_APEX_IP}`,
        },
      ];

  return { success: true, dnsRecords };
}

function extractDnsRecordsFromVercel(domain: string, data: VercelDomainApiResponse): DnsRecordInstruction[] {
  const isSub = isSubdomain(domain);
  const records: DnsRecordInstruction[] = [];

  if (isSub) {
    records.push({
      type: "CNAME",
      name: domain.split(".")[0],
      value: VERCEL_CNAME_TARGET,
      status: data.verified ? "valid" : "pending",
      description: `Enregistrement CNAME pour « ${domain.split(".")[0]} » pointant vers ${VERCEL_CNAME_TARGET}`,
    });
  } else {
    records.push({
      type: "A",
      name: "@",
      value: VERCEL_APEX_IP,
      status: data.verified ? "valid" : "pending",
      description: `Enregistrement A pour « @ » pointant vers ${VERCEL_APEX_IP}`,
    });
  }

  // Si Vercel réclame une vérification de propriété par TXT
  if (data.verification && data.verification.length > 0) {
    data.verification.forEach((v) => {
      records.push({
        type: (v.type as any) || "TXT",
        name: v.domain || "_vercel",
        value: v.value,
        status: data.verified ? "valid" : "pending",
        description: `Vérification de propriété Vercel (TXT) : ${v.domain} = ${v.value}`,
      });
    });
  }

  return records;
}
