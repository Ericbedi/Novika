import { ProductReview, ReviewToken } from "@/server/data/product-page-types";

// In-memory tokens de collecte d'avis post-livraison
export const MOCK_REVIEW_TOKENS: ReviewToken[] = [
  {
    id: "rt_delivered_order_10482",
    tokenHash: "hash_tok_rev_awa_traore_abidjan_2026",
    rawToken: "rev_tok_awa_traore_valid_delivered_10482",
    orderId: "ord_10482",
    storeId: "store_lome_glow",
    productId: "prod_coffee",
    customerName: "Awa Traoré",
    customerPhone: "+2250748291102",
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    isUsed: false,
  },
  {
    id: "rt_expired_order_9999",
    tokenHash: "hash_tok_rev_expired_koffi",
    rawToken: "rev_tok_expired_sample_30days",
    orderId: "ord_9999",
    storeId: "store_lome_glow",
    productId: "prod_serum",
    customerName: "Koffi Mensah",
    customerPhone: "+22890123456",
    expiresAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    isUsed: false,
  },
];

export function validateReviewToken(
  rawToken: string
): { isValid: boolean; error?: string; tokenRecord?: ReviewToken } {
  const record = MOCK_REVIEW_TOKENS.find((t) => t.rawToken === rawToken);

  if (!record) {
    return {
      isValid: false,
      error: "Ce lien de dépôt d'avis est introuvable ou invalide. Seuls les clients ayant reçu une commande livrée peuvent déposer un avis vérifié.",
    };
  }

  if (record.isUsed) {
    return {
      isValid: false,
      error: "Ce lien d'avis à usage unique a déjà été utilisé pour donner votre évaluation. Merci pour votre retour !",
    };
  }

  if (Date.now() > new Date(record.expiresAt).getTime()) {
    return {
      isValid: false,
      error: "Ce lien de dépôt d'avis a expiré (validité de 30 jours après livraison dépassée).",
    };
  }

  return { isValid: true, tokenRecord: record };
}

/**
 * Calcule les statistiques d'avis réelles d'un produit (note moyenne, répartition).
 * N'accepte aucune donnée inventée par le client.
 */
export function calculateProductReviewMetrics(reviews: ProductReview[]): {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>; // 1: n, 2: n, ... 5: n
  verifiedBuyersCount: number;
} {
  const published = reviews.filter((r) => r.status === "published");
  const totalReviews = published.length;

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalScore = 0;
  let verifiedBuyersCount = 0;

  for (const rev of published) {
    const star = Math.max(1, Math.min(5, Math.round(rev.rating)));
    ratingDistribution[star] = (ratingDistribution[star] || 0) + 1;
    totalScore += rev.rating;
    if (rev.isVerifiedBuyer) verifiedBuyersCount++;
  }

  const averageRating = totalReviews > 0 ? Math.round((totalScore / totalReviews) * 10) / 10 : 0;

  return {
    averageRating,
    totalReviews,
    ratingDistribution,
    verifiedBuyersCount,
  };
}
