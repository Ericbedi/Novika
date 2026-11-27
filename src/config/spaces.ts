import { UserRole } from "@/server/data/types";

/**
 * Configuration des espaces par rôle Kelio (Prompt 06-L)
 * Définit la redirection par défaut pour chaque rôle et le périmètre d'accès autorisé.
 */

export interface SpaceConfig {
  id: string;
  name: string;
  role: UserRole | "control";
  defaultPath: (storeSlug?: string) => string;
  allowedPrefixes: string[];
}

export const SPACES_CONFIG: Record<string, SpaceConfig> = {
  owner: {
    id: "owner",
    name: "Espace Vendeur & Administration",
    role: "owner",
    defaultPath: (storeSlug = "lome-glow") => `/app/${storeSlug}`,
    allowedPrefixes: ["/app", "/demarrer"],
  },
  admin: {
    id: "admin",
    name: "Espace Administration",
    role: "admin",
    defaultPath: (storeSlug = "lome-glow") => `/app/${storeSlug}`,
    allowedPrefixes: ["/app"],
  },
  manager: {
    id: "manager",
    name: "Espace Manager",
    role: "manager",
    defaultPath: (storeSlug = "lome-glow") => `/app/${storeSlug}`,
    allowedPrefixes: ["/app"],
  },
  closer: {
    id: "closer",
    name: "Espace Closing",
    role: "closer",
    defaultPath: (storeSlug = "lome-glow") => `/app/${storeSlug}/commandes`,
    allowedPrefixes: ["/app/:store/commandes", "/app/:store/clients", "/app/:store/tournee"],
  },
  rider: {
    id: "rider",
    name: "Espace Livraison",
    role: "rider",
    defaultPath: (storeSlug = "lome-glow") => `/app/${storeSlug}/tournee`,
    allowedPrefixes: ["/app/:store/tournee", "/app/:store/livraisons"],
  },
  courier: {
    id: "courier",
    name: "Espace Coursier",
    role: "courier",
    defaultPath: (storeSlug = "lome-glow") => `/app/${storeSlug}/tournee`,
    allowedPrefixes: ["/app/:store/tournee", "/app/:store/livraisons"],
  },
  agency: {
    id: "agency",
    name: "Espace Agence de Livraison",
    role: "agency",
    defaultPath: (storeSlug = "lome-glow") => `/app/${storeSlug}/commandes?view=agency`,
    allowedPrefixes: ["/app/:store/commandes", "/app/:store/tournee", "/app/:store/livraisons"],
  },
  control: {
    id: "control",
    name: "Espace Control Plateforme",
    role: "control",
    defaultPath: () => "/platform-admin",
    allowedPrefixes: ["/platform-admin"],
  },
};

/**
 * Renvoie l'espace par défaut pour un rôle donné
 */
export function getDefaultSpaceForRole(role?: string | null, storeSlug = "lome-glow"): string {
  const normalized = (role || "owner").toLowerCase();
  const config = SPACES_CONFIG[normalized] || SPACES_CONFIG.owner;
  return config.defaultPath(storeSlug);
}

/**
 * Vérifie si un chemin interne donné est autorisé pour le rôle de l'utilisateur
 */
export function isPathAllowedForRole(pathname: string, role?: string | null): boolean {
  if (!pathname || typeof pathname !== "string") return false;
  const normalized = (role || "owner").toLowerCase();

  // Espace de contrôle / plateforme
  if (pathname.startsWith("/platform-admin")) {
    return normalized === "control" || normalized === "owner";
  }

  // L'administrateur / propriétaire a accès à toutes les sections marchandes
  if (normalized === "owner" || normalized === "admin" || normalized === "manager") {
    return pathname.startsWith("/app") || pathname.startsWith("/demarrer");
  }

  // Rôle Closeur
  if (normalized === "closer") {
    // Interdiction stricte des finances, sourcing, réglages et gestion boutique
    if (
      pathname.includes("/finances") ||
      pathname.includes("/sourcing") ||
      pathname.includes("/boutique-en-ligne") ||
      pathname.includes("/reglages") ||
      pathname.includes("/statistiques") ||
      pathname.includes("/stats")
    ) {
      return false;
    }
    return (
      pathname.includes("/commandes") ||
      pathname.includes("/clients") ||
      pathname.includes("/tournee")
    );
  }

  // Rôle Livreur / Coursier
  if (normalized === "rider" || normalized === "courier") {
    if (
      pathname.includes("/finances") ||
      pathname.includes("/sourcing") ||
      pathname.includes("/produits") ||
      pathname.includes("/reglages") ||
      pathname.includes("/stats")
    ) {
      return false;
    }
    return pathname.includes("/tournee") || pathname.includes("/livraisons");
  }

  // Rôle Agence de livraison
  if (normalized === "agency") {
    if (
      pathname.includes("/sourcing") ||
      pathname.includes("/boutique-en-ligne") ||
      pathname.includes("/produits")
    ) {
      return false;
    }
    return (
      pathname.includes("/commandes") ||
      pathname.includes("/tournee") ||
      pathname.includes("/livraisons")
    );
  }

  return pathname.startsWith("/app");
}

/**
 * Sécurisation anti-redirection ouverte (Open Redirect Protection)
 * - N'accepte que des chemins internes commençant par '/'
 * - Rejette systématiquement '//', '/\', '\\', 'http:', 'https:', 'javascript:', 'data:'
 * - Contrôle la correspondance avec le rôle de l'utilisateur
 * - En cas de doute ou d'anomalie, redirige vers l'espace par défaut du rôle
 */
export function sanitizeInternalRedirect(
  redirectUrl: string | null | undefined,
  role?: string | null,
  defaultStoreSlug = "lome-glow"
): string {
  const fallback = getDefaultSpaceForRole(role, defaultStoreSlug);
  if (!redirectUrl || typeof redirectUrl !== "string") {
    return fallback;
  }

  const trimmed = redirectUrl.trim();

  // 1. Doit débuter impérativement par un '/' unique
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.startsWith("\\")
  ) {
    return fallback;
  }

  // 2. Rejet des injections de protocole directes
  if (
    trimmed.includes("://") ||
    trimmed.toLowerCase().includes("javascript:") ||
    trimmed.toLowerCase().includes("data:") ||
    trimmed.toLowerCase().includes("vbscript:")
  ) {
    return fallback;
  }

  // 3. Décodage sécurisé pour contrer les encodages d'obfuscation (%2F%2F, %5C)
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return fallback;
  }

  if (
    decoded.startsWith("//") ||
    decoded.startsWith("/\\") ||
    decoded.startsWith("\\") ||
    decoded.includes("://") ||
    decoded.toLowerCase().includes("javascript:") ||
    decoded.toLowerCase().includes("data:")
  ) {
    return fallback;
  }

  // 4. Extraction du pathname strict (sans query string ni hash)
  const pathname = decoded.split("?")[0].split("#")[0];

  // 5. Vérification des permissions par rôle
  if (!isPathAllowedForRole(pathname, role)) {
    return fallback;
  }

  return trimmed;
}
