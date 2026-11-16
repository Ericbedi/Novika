// Registre des affirmations de la landing page Novika (Prompt 05-L)
// Chaque affirmation est reliée à une fonctionnalité réelle prouvable.
// Règle produit : N'afficher que ce que l'application fait réellement.
// Aucun terme trompeur ou sur-promettant ("garanti", "zéro perte", "100%").

export interface Claim {
  id: string;
  statement: string;
  featureKey: string;
  isFeatureEnabled: boolean;
  category: "orders" | "delivery" | "finance" | "closing";
}

export const CLAIMS_REGISTRY: Record<string, Claim> = {
  cod_payment_rule: {
    id: "cod_payment_rule",
    statement: "Le client paie à la livraison",
    featureKey: "cod_order_form",
    isFeatureEnabled: true,
    category: "orders",
  },
  no_blocked_orders: {
    id: "no_blocked_orders",
    statement: "Aucune commande bloquée · Fiche closeuse",
    featureKey: "no_blocked_orders_rule",
    isFeatureEnabled: true,
    category: "orders",
  },
  free_delivery_zones: {
    id: "free_delivery_zones",
    statement: "Livraison gratuite automatique par zone",
    featureKey: "zone_free_delivery",
    isFeatureEnabled: true,
    category: "delivery",
  },
  short_order_form: {
    id: "short_order_form",
    statement: "Formulaire de commande optimisé pour mobile avec paiement à la livraison",
    featureKey: "cod_order_form",
    isFeatureEnabled: true,
    category: "orders",
  },
  free_text_zone_detection: {
    id: "free_text_zone_detection",
    statement: "Détection automatique de la zone de livraison et calcul des frais sans blocage",
    featureKey: "zone_signal_detection",
    isFeatureEnabled: true,
    category: "delivery",
  },
  closer_dispatch: {
    id: "closer_dispatch",
    statement: "Répartition des commandes entre closeuses et suivi des appels",
    featureKey: "team_closer_dispatch",
    isFeatureEnabled: true,
    category: "closing",
  },
  proof_of_delivery: {
    id: "proof_of_delivery",
    statement: "Preuves de livraison par code de confirmation ou photo à la remise",
    featureKey: "proof_of_delivery",
    isFeatureEnabled: true,
    category: "delivery",
  },
  remittances_tracking: {
    id: "remittances_tracking",
    statement: "Suivi rigoureux de l'argent encaissé et validation des remises d'espèces",
    featureKey: "cash_remittances",
    isFeatureEnabled: true,
    category: "finance",
  },
  revenue_goals: {
    id: "revenue_goals",
    statement: "Objectifs de chiffre d'affaires encaissé avec barre de progression pondérée",
    featureKey: "revenue_goals_tracking",
    isFeatureEnabled: true,
    category: "finance",
  },
  delivery_receipts: {
    id: "delivery_receipts",
    statement: "Reçus de livraison dédiés générés automatiquement à la remise",
    featureKey: "delivery_receipts",
    isFeatureEnabled: true,
    category: "orders",
  },
};

/**
 * Vérifie si une affirmation est active et autorisée à être affichée.
 */
export function isClaimVisible(claimId: string): boolean {
  const claim = CLAIMS_REGISTRY[claimId];
  return claim ? claim.isFeatureEnabled : false;
}

/**
 * Liste des termes strictement interdits sur toute la landing (Prompt 05-L)
 * Élimine toute sur-promesse non vérifiable.
 */
export const FORBIDDEN_COPY_TERMS = [
  "garanti",
  "garantie",
  "zéro perte",
  "zero perte",
  "100 %",
  "100%",
  "réduisez vos retours de",
  "le meilleur",
  "le seul",
  "tue",
  "élimine",
  "zéro retour",
  "scaler",
  "ghoster",
  "RTO",
  "OS",
];

export function validateCopySafety(text: string): { isSafe: boolean; forbiddenFound?: string } {
  const lower = text.toLowerCase();
  for (const term of FORBIDDEN_COPY_TERMS) {
    if (lower.includes(term.toLowerCase())) {
      return { isSafe: false, forbiddenFound: term };
    }
  }
  return { isSafe: true };
}
