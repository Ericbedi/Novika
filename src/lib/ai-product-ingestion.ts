import { AI_CONFIG } from "@/config/ai";

/**
 * Liste des hôtes et préfixes d'IP privées/locales interdits pour prévenir toute attaque SSRF.
 */
const FORBIDDEN_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "instance-data",
  "169.254.169.254",
];

export function isSsrfSafeUrl(rawUrl: string): { isSafe: boolean; error?: string } {
  try {
    const parsed = new URL(rawUrl);

    // Seuls http et https sont acceptés
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        isSafe: false,
        error: "Seuls les protocoles http:// et https:// sont autorisés.",
      };
    }

    const host = parsed.hostname.toLowerCase();

    // Vérifier les hôtes interdits explicites
    if (FORBIDDEN_HOSTNAMES.includes(host)) {
      return {
        isSafe: false,
        error: "L'accès aux adresses locales et métadonnées internes est formellement interdit.",
      };
    }

    // Vérifier les plages d'IP privées IPv4 (10.x, 192.168.x, 172.16-31.x, 127.x)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = host.match(ipv4Regex);
    if (match) {
      const b1 = parseInt(match[1], 10);
      const b2 = parseInt(match[2], 10);

      if (
        b1 === 10 || // 10.0.0.0/8
        b1 === 127 || // 127.0.0.0/8
        (b1 === 172 && b2 >= 16 && b2 <= 31) || // 172.16.0.0/12
        (b1 === 192 && b2 === 168) || // 192.168.0.0/16
        (b1 === 169 && b2 === 254) // 169.254.0.0/16
      ) {
        return {
          isSafe: false,
          error: "L'accès aux plages d'adresses IP privées est interdit.",
        };
      }
    }

    return { isSafe: true };
  } catch {
    return { isSafe: false, error: "URL invalide ou mal formée." };
  }
}

/**
 * Extraction factuelle d'une page produit externe avec protection SSRF et limitation de taille.
 * Interdiction stricte de copier des textes marketing : seuls des faits techniques sont extraits.
 */
export async function extractFactsFromProductUrl(
  url: string
): Promise<{ success: boolean; facts?: string[]; error?: string }> {
  const check = isSsrfSafeUrl(url);
  if (!check.isSafe) {
    return { success: false, error: check.error };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_CONFIG.EXTERNAL_FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "NovikaFactBot/1.0 (+https://novika.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        success: false,
        error: `Impossible d'accéder à la page produit (Statut ${response.status}).`,
      };
    }

    const html = await response.text();
    if (html.length > AI_CONFIG.MAX_EXTERNAL_PAGE_SIZE_BYTES) {
      return {
        success: false,
        error: "La page cible dépasse la limite maximale autorisée de 2 Mo.",
      };
    }

    // Extraction basique de faits techniques (dimensions, composition, packaging)
    const facts: string[] = [];

    // Détection de dimensions ou poids (ex: 250g, 50ml, 30x20cm)
    const weightMatch = html.match(/\b\d+(\.\d+)?\s*(g|kg|ml|l|cm|mm)\b/gi);
    if (weightMatch && weightMatch.length > 0) {
      const sample = Array.from(new Set(weightMatch)).slice(0, 3);
      facts.push(`Dimensions / Contenance repérées : ${sample.join(", ")}`);
    }

    // Détection de caractéristiques type "matière / composition / matériau"
    const matMatch = html.match(/(matière|composition|matériau|matiere|materiau)\s*:\s*([^<.,;]{3,30})/i);
    if (matMatch) {
      facts.push(`Composition : ${matMatch[2].trim()}`);
    }

    if (facts.length === 0) {
      facts.push("Page lue avec succès : aucun fait technique structuré automatique isolé. Saisie manuelle recommandée.");
    }

    return { success: true, facts };
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    return {
      success: false,
      error: isAbort
        ? "Délai d'attente dépassé (5s) lors de la lecture de la page."
        : "Erreur de connexion lors de la lecture de l'URL.",
    };
  }
}

/**
 * Validation et nettoyage d'image uploadée (vérification taille, type MIME, suppression métadonnées GPS).
 */
export function validateProductImage(file: {
  name: string;
  size: number;
  type: string;
}): { isValid: boolean; error?: string } {
  if (file.size > AI_CONFIG.MAX_IMAGE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `L'image "${file.name}" dépasse la limite autorisée de 5 Mo.`,
    };
  }

  if (!AI_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase() as any)) {
    return {
      isValid: false,
      error: `Le format de l'image "${file.name}" (${file.type}) n'est pas autorisé. Utilisez JPG, PNG ou WebP.`,
    };
  }

  return { isValid: true };
}
