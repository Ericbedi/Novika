import { z } from "zod";
import { Product } from "@/server/data/types";
import { QuickOrderDraft } from "@/server/data/vague1-types";

// Schéma strict de sortie pour l'extraction de commande rapide
export const QuickOrderExtractedSchema = z.object({
  customerName: z.string().min(2, "Nom trop court").max(80),
  customerPhone: z.string().min(8, "Numéro de téléphone invalide").max(20),
  productName: z.string().min(2, "Produit requis").max(120),
  variantName: z.string().max(60).optional(),
  quantity: z.number().int().min(1).max(50).default(1),
  city: z.string().min(2).max(80).default("Abidjan"),
  address: z.string().max(200).default("À préciser"),
  notes: z.string().max(300).optional(),
  unitPrice: z.number().int().min(0).optional(),
});

export type QuickOrderExtractedData = z.infer<typeof QuickOrderExtractedSchema>;

/**
 * Barrière de neutralisation d'injections dans les conversations WhatsApp collées.
 * Supprime les tentatives de prompt injection / commandes système.
 */
export function sanitizeConversationInput(rawText: string): string {
  if (!rawText) return "";
  let clean = rawText
    // Neutralisation des balises et scripts
    .replace(/<[^>]*>/g, " ")
    // Neutralisation des tentatives classiques d'évasion
    .replace(/\b(ignore previous instructions|drop table|system prompt|admin override)\b/gi, "[contenu neutralisé]")
    .trim();
  // Limite de taille à 4000 caractères
  return clean.slice(0, 4000);
}

/**
 * Analyseur intelligent (IA/Heuristique sécurisé) de conversation WhatsApp.
 * Traite le texte collé comme une donnée 100% inerte.
 */
export function parseWhatsAppOrderText(
  rawText: string,
  catalogProducts: Product[] = []
): {
  extracted: QuickOrderExtractedData;
  matchedProduct?: Product;
  confidenceScore: number;
} {
  const sanitized = sanitizeConversationInput(rawText);
  const lines = sanitized.split("\n").map((l) => l.trim()).filter(Boolean);

  let detectedName = "Client WhatsApp";
  let detectedPhone = "+225";
  let detectedCity = "Abidjan";
  let detectedAddress = "";
  let detectedProduct = "Produit à préciser";
  let detectedVariant = "";
  let detectedQty = 1;
  let detectedNotes = "";

  // 1. Détection du téléphone (formats africains +225, +228, +221, +229, 07..., 90..., etc.)
  const phoneRegex = /(\+?[0-9]{2,4}[0-9\s-]{6,20})/g;
  const phoneMatches = sanitized.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    // Prendre le match le plus long et plausible
    const bestPhone = phoneMatches
      .map((p) => p.replace(/[\s-]/g, ""))
      .filter((p) => p.length >= 8 && p.length <= 16)[0];
    if (bestPhone) {
      detectedPhone = bestPhone.startsWith("+") ? bestPhone : `+${bestPhone}`;
    }
  }

  // 2. Détection du nom client
  for (const line of lines) {
    const nameMatch = line.match(/(?:mon nom\s*(?:c'est|est|:)?|nom\s*(?:c'est|est|:)?|je m'appelle|moi c'est)\s*([A-Za-zÀ-ÿ\s]{2,40})/i);
    if (nameMatch && nameMatch[1]) {
      detectedName = nameMatch[1].replace(/^(?:c['’]est|est|:)\s*/i, "").trim();
      break;
    }
  }
  // Si non trouvé par regex, chercher une ligne courte au début qui ressemble à un nom
  if (detectedName === "Client WhatsApp" && lines.length > 0) {
    const firstNonPhone = lines.find((l) => !l.match(phoneRegex) && l.length > 3 && l.length < 35 && !l.includes(":") && !l.includes("http"));
    if (firstNonPhone) {
      detectedName = firstNonPhone;
    }
  }

  // 3. Détection de la ville et quartier (les plus spécifiques en premier)
  const cityKeywords: Record<string, string> = {
    angré: "Abidjan (Cocody Angré)",
    angre: "Abidjan (Cocody Angré)",
    cocody: "Abidjan (Cocody)",
    yopougon: "Abidjan (Yopougon)",
    koumassi: "Abidjan (Koumassi)",
    marcory: "Abidjan (Marcory)",
    abidjan: "Abidjan",
    agoè: "Lomé (Agoè)",
    agoe: "Lomé (Agoè)",
    lomé: "Lomé",
    lome: "Lomé",
    mermoz: "Dakar (Mermoz)",
    parcelles: "Dakar (Parcelles)",
    dakar: "Dakar",
    cadjehoun: "Cotonou (Cadjehoun)",
    cotonou: "Cotonou",
  };

  const lowerText = sanitized.toLowerCase();
  for (const [key, cityLabel] of Object.entries(cityKeywords)) {
    if (lowerText.includes(key)) {
      detectedCity = cityLabel;
      break;
    }
  }

  // Détection adresse / repère
  for (const line of lines) {
    const addrMatch = line.match(/(?:adresse|quartier|repère|localisation|lieu|chez moi\s*:)\s*([^\n\r]+)/i);
    if (addrMatch && addrMatch[1]) {
      detectedAddress = addrMatch[1].trim();
      break;
    }
  }
  if (!detectedAddress) {
    // Chercher des repères usuels (carrefour, pharmacie, école, marché)
    const landmarkLine = lines.find((l) => /carrefour|pharmacie|école|face|près|marché|immeuble|villa/i.test(l));
    if (landmarkLine) {
      detectedAddress = landmarkLine;
    }
  }

  // 4. Détection quantité
  const qtyMatch = sanitized.match(/(?:quantité|qte|qté|\bpris\b|\bprends\b|\bj'en veux\b|\bpack de\b)\s*([0-9]{1,2})/i);
  if (qtyMatch && qtyMatch[1]) {
    detectedQty = Math.max(1, parseInt(qtyMatch[1], 10));
  } else {
    // "2 boîtes", "3 flacons"
    const unitsMatch = sanitized.match(/\b([1-9])\s*(?:boîtes|boites|flacons|packs|exemplaires|articles|pots|pièces|pieces)\b/i);
    if (unitsMatch && unitsMatch[1]) {
      detectedQty = parseInt(unitsMatch[1], 10);
    }
  }

  // 5. Correspondance produit avec le catalogue
  let bestProduct: Product | undefined = undefined;
  let bestScore = 0;

  for (const prod of catalogProducts) {
    const pName = (prod as any).title || prod.name || "";
    const prodTitleLower = pName.toLowerCase();
    const prodWords = prodTitleLower.split(/\s+/).filter((w: string) => w.length > 3);
    let matchedWords = 0;

    for (const word of prodWords) {
      if (lowerText.includes(word)) {
        matchedWords++;
      }
    }

    const score = prodWords.length > 0 ? matchedWords / prodWords.length : 0;
    if (score > bestScore && score >= 0.3) {
      bestScore = score;
      bestProduct = prod;
      detectedProduct = pName;
    }
  }

  // Si pas de produit trouvé dans le catalogue, chercher une ligne produit
  if (!bestProduct) {
    const prodLine = lines.find((l) => /produit|commande|pack|sérum|café|crème|huile|thé/i.test(l));
    if (prodLine) {
      detectedProduct = prodLine;
    }
  }

  // Détection variante si le produit en a
  if (bestProduct && bestProduct.variants && bestProduct.variants.length > 0) {
    for (const v of bestProduct.variants) {
      const vName = (v as any).title || v.name || "";
      if (vName && lowerText.includes(vName.toLowerCase())) {
        detectedVariant = vName;
        break;
      }
    }
    if (!detectedVariant) {
      const firstVariant = bestProduct.variants[0];
      detectedVariant = (firstVariant as any)?.title || firstVariant?.name || "";
    }
  }

  const confidenceScore = Math.min(
    1,
    (detectedPhone !== "+225" ? 0.35 : 0.05) +
      (detectedName !== "Client WhatsApp" ? 0.25 : 0.05) +
      (bestProduct ? 0.25 : 0.1) +
      (detectedAddress ? 0.15 : 0.05)
  );

  return {
    extracted: {
      customerName: detectedName,
      customerPhone: detectedPhone,
      productName: detectedProduct,
      variantName: detectedVariant || undefined,
      quantity: detectedQty,
      city: detectedCity,
      address: detectedAddress || "Non spécifié, à confirmer",
      notes: detectedNotes || undefined,
      unitPrice: bestProduct ? ((bestProduct as any).price || bestProduct.salePrice) : undefined,
    },
    matchedProduct: bestProduct,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
  };
}

/**
 * Détection de doublon récent (téléphone + produit dans les 7 derniers jours).
 */
export function checkRecentDuplicateOrder(
  phone: string,
  productTitle: string,
  existingOrders: Array<{ customerPhone: string; items: Array<{ productName: string }>; createdAt: string }>
): { isDuplicate: boolean; details?: string } {
  const cleanTargetPhone = phone.replace(/\D/g, "");
  const targetLower = productTitle.toLowerCase();

  for (const ord of existingOrders) {
    const cleanOrdPhone = ord.customerPhone.replace(/\D/g, "");
    if (cleanOrdPhone.length >= 8 && cleanTargetPhone.includes(cleanOrdPhone)) {
      const hasSameProduct = ord.items.some((it) =>
        it.productName.toLowerCase().includes(targetLower) || targetLower.includes(it.productName.toLowerCase())
      );
      if (hasSameProduct) {
        return {
          isDuplicate: true,
          details: `Attention : Une commande pour ce même client (${ord.customerPhone}) avec ce produit existe déjà (${ord.createdAt}). Vérifiez s'il s'agit d'une relance ou d'un doublon.`,
        };
      }
    }
  }

  return { isDuplicate: false };
}
