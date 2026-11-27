/**
 * Module de gestion des domaines personnalisés par boutique (Prompt 19)
 * - Validation stricte du format (pas d'URL, pas d'IP, pas de domaine réservé)
 * - Unicité absolue sur toute la plateforme
 * - Intégration Vercel Domains API (HTTPS automatique, enregistrements DNS exacts)
 * - Routage multi-domaines et protection Host Header
 */

export interface DnsRecordInstruction {
  type: "A" | "CNAME" | "TXT";
  name: string;
  value: string;
  status: "valid" | "invalid" | "pending";
  description?: string;
}

export type DomainStatus = "pending_dns" | "verifying" | "active" | "error";

export interface CustomDomain {
  id: string;
  storeSlug: string;
  domain: string; // ex: kelio.com ou www.kelio.com
  isPrimary: boolean;
  redirectToPrimary?: boolean; // Redirige 301 vers le domaine principal si secondaire
  status: DomainStatus;
  statusReason?: string;
  dnsRecords: DnsRecordInstruction[];
  verifiedAt?: string;
  lastCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Domaines réservés de la plateforme (interdits aux boutiques)
export const RESERVED_PLATFORM_DOMAINS = [
  "novika.com",
  "novika.africa",
  "novika-delta.vercel.app",
  "afribuilder.africa",
  "afribuilder.com",
  "vercel.app",
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
];

// IP et CNAME officiels de Vercel pour la configuration DNS
export const VERCEL_APEX_IP = "76.76.21.21";
export const VERCEL_CNAME_TARGET = "cname.vercel-dns.com";

/**
 * Valide le format d'un nom de domaine personnalisé.
 */
export function validateDomainFormat(input: string): { isValid: boolean; normalized: string; error?: string } {
  if (!input || typeof input !== "string") {
    return { isValid: false, normalized: "", error: "Veuillez renseigner un nom de domaine." };
  }

  let domain = input.trim().toLowerCase();

  // Supprimer d'éventuels préfixes de protocole ou slashes
  domain = domain.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim();

  // Supprimer d'éventuels ports
  domain = domain.split(":")[0];

  // Vérification présence d'adresse IP
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(domain)) {
    return { isValid: false, normalized: "", error: "Une adresse IP ne peut pas être utilisée comme nom de domaine." };
  }

  // Vérification de domaine de premier niveau (TLD)
  if (!domain.includes(".") || domain.endsWith(".")) {
    return {
      isValid: false,
      normalized: "",
      error: "Nom de domaine invalide. Veuillez inclure une extension (ex: .com, .ci, .sn, .shop).",
    };
  }

  // Caractères autorisés : lettres minuscules, chiffres, tirets et points
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
    return {
      isValid: false,
      normalized: "",
      error: "Le nom de domaine contient des caractères non autorisés (espaces, accents ou symboles).",
    };
  }

  // Vérification des domaines réservés
  for (const reserved of RESERVED_PLATFORM_DOMAINS) {
    if (domain === reserved || domain.endsWith(`.${reserved}`)) {
      return {
        isValid: false,
        normalized: "",
        error: "Ce domaine est réservé par la plateforme Kelio et ne peut pas être attribué à une boutique.",
      };
    }
  }

  return { isValid: true, normalized: domain };
}

/**
 * Détermine si le domaine est un domaine racine (apex) ou un sous-domaine.
 */
export function isSubdomain(domain: string): boolean {
  const parts = domain.split(".");
  // Si le domaine commence par www ou possède plus de 2 segments (ex: shop.kelio.com)
  return parts.length > 2;
}

/**
 * Génère les instructions DNS exactes pour un domaine donné.
 */
export function generateDefaultDnsRecords(domain: string): DnsRecordInstruction[] {
  if (isSubdomain(domain)) {
    const parts = domain.split(".");
    const subName = parts[0]; // ex: "www" ou "boutique"
    return [
      {
        type: "CNAME",
        name: subName,
        value: VERCEL_CNAME_TARGET,
        status: "pending",
        description: `Créez un enregistrement CNAME pour « ${subName} » pointant vers ${VERCEL_CNAME_TARGET}`,
      },
    ];
  } else {
    // Domaine racine (apex)
    return [
      {
        type: "A",
        name: "@",
        value: VERCEL_APEX_IP,
        status: "pending",
        description: `Créez un enregistrement A pour « @ » pointant vers l'adresse IP ${VERCEL_APEX_IP}`,
      },
    ];
  }
}

// ============================================================================
// REGISTRE EN MÉMOIRE & PERSISTANCE DES DOMAINES
// ============================================================================

const MEMORY_DOMAINS_BY_STORE = new Map<string, CustomDomain[]>();

export function clearCustomDomainsMemory(): void {
  MEMORY_DOMAINS_BY_STORE.clear();
}

export function getStoreDomainsKey(storeSlug: string): string {
  return `novika_shop_domains_${storeSlug}`;
}

export function getAllCustomDomainsGlobal(): CustomDomain[] {
  const all: CustomDomain[] = [];
  MEMORY_DOMAINS_BY_STORE.forEach((domains) => all.push(...domains));

  if (typeof window !== "undefined") {
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith("novika_shop_domains_")) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const list: CustomDomain[] = JSON.parse(raw);
            list.forEach((d) => {
              if (!all.some((a) => a.domain === d.domain)) {
                all.push(d);
              }
            });
          }
        }
      }
    } catch {}
  }

  return all;
}

/**
 * Récupère tous les domaines configurés pour une boutique.
 */
export function getStoreDomains(storeSlug: string): CustomDomain[] {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(getStoreDomainsKey(storeSlug));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
  }

  if (MEMORY_DOMAINS_BY_STORE.has(storeSlug)) {
    return MEMORY_DOMAINS_BY_STORE.get(storeSlug)!;
  }

  // Domaines de démo par défaut pour lome-glow
  if (storeSlug === "lome-glow") {
    const demoDomains: CustomDomain[] = [
      {
        id: "dom_lome_primary",
        storeSlug: "lome-glow",
        domain: "lomeglow.shop",
        isPrimary: true,
        status: "active",
        dnsRecords: [
          { type: "A", name: "@", value: VERCEL_APEX_IP, status: "valid" },
        ],
        verifiedAt: new Date().toISOString(),
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: new Date().toISOString(),
      },
      {
        id: "dom_lome_secondary",
        storeSlug: "lome-glow",
        domain: "www.lomeglow.shop",
        isPrimary: false,
        redirectToPrimary: true,
        status: "active",
        dnsRecords: [
          { type: "CNAME", name: "www", value: VERCEL_CNAME_TARGET, status: "valid" },
        ],
        verifiedAt: new Date().toISOString(),
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: new Date().toISOString(),
      },
    ];
    MEMORY_DOMAINS_BY_STORE.set(storeSlug, demoDomains);
    return demoDomains;
  }

  return [];
}

/**
 * Sauvegarde la liste des domaines d'une boutique.
 */
export function saveStoreDomains(storeSlug: string, domains: CustomDomain[]): void {
  MEMORY_DOMAINS_BY_STORE.set(storeSlug, domains);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getStoreDomainsKey(storeSlug), JSON.stringify(domains));
    } catch {}
  }
}

/**
 * Retrouve la boutique active associée à un nom de domaine (pour le middleware).
 */
export function findStoreByHost(rawHost: string): { storeSlug: string; isPrimary: boolean; redirectToPrimary?: boolean; primaryDomain?: string } | null {
  const host = rawHost.toLowerCase().split(":")[0].trim();

  // Recherche dans toutes les boutiques enregistrées
  const allDomains = getAllCustomDomainsGlobal();
  const matched = allDomains.find((d) => d.domain === host && d.status === "active");

  if (!matched) return null;

  let primaryDomain: string | undefined = undefined;
  if (!matched.isPrimary && matched.redirectToPrimary) {
    const primary = allDomains.find((d) => d.storeSlug === matched.storeSlug && d.isPrimary);
    if (primary) primaryDomain = primary.domain;
  }

  return {
    storeSlug: matched.storeSlug,
    isPrimary: matched.isPrimary,
    redirectToPrimary: matched.redirectToPrimary,
    primaryDomain,
  };
}

/**
 * Vérifie si un nom de domaine est déjà utilisé par une autre boutique sur la plateforme.
 */
export function isDomainTakenAcrossPlatform(domain: string, currentStoreSlug?: string): { isTaken: boolean; takenByStore?: string } {
  const all = getAllCustomDomainsGlobal();
  const found = all.find((d) => d.domain === domain.toLowerCase());

  if (found && found.storeSlug !== currentStoreSlug) {
    return { isTaken: true, takenByStore: found.storeSlug };
  }
  return { isTaken: false };
}
