// Source unique et moteur de calcul pour la Performance Produit & Scaling (Prompt 05-G)
// Respecte scrupuleusement les formules mathématiques et les critères d'aide à la décision

export type CampaignPhase = "testing" | "prospecting" | "expansion" | "auto";

export type ScalingVerdictKey =
  | "insufficient_data" // Données insuffisantes
  | "cash_in"           // Encaisser
  | "scale"             // Scaler
  | "monitor"           // Surveiller
  | "cut";              // Couper

export interface ScalingVerdict {
  key: ScalingVerdictKey;
  label: string;
  badgeClass: string;
  reason: string;
  disclaimer: string;
}

export interface ScalingProductInput {
  productId: string;
  productName: string;
  acquisitionPrice: number;    // A : Prix d'achat produit (ex: 5 000 FCFA)
  sellingPrice: number;        // P : Prix de vente client (ex: 15 000 FCFA)
  deliveryCost: number;        // L : Frais de livraison supportés par le vendeur (ex: 1 500 FCFA)
  desiredProfit: number;       // B : Bénéfice net souhaité par pièce livrée (ex: 3 000 FCFA)
  dollarRate: number;          // r : Taux de change FCFA/Dollar (ex: 700 FCFA = 1 $)
  closingRate: number;         // c : Taux de livraison / closing observé (ex: 0.40 pour 40 %)
  adSpendDollars: number;      // S : Dépenses publicitaires en $ (ex: 100 $)
  deliveredUnits: number;      // Pièces livrées réelles
  pendingUnits: number;        // Commandes en cours de livraison (cohortes récentes)
  ordersCount: number;         // Nombre total de commandes passées
  campaignDays: number;        // Nombre de jours de diffusion
  phase: CampaignPhase;
  metaCostPerPurchase?: number;// Coût par achat rapporté par Meta Ads (optionnel)
  consecutiveDaysOverBreakeven?: number; // Jours consécutifs au-dessus du CPA breakeven
  consecutiveDaysUnderTarget?: number;    // Jours consécutifs sous le CPA cible
}

export interface ScalingMetrics {
  marginBeforeAds: number;           // M = P - A - L (en devise locale)
  isMarginSufficient: boolean;       // M > B
  marginErrorMessage?: string;
  cpaBreakevenDollars: number;       // CPA breakeven ($) = M / r
  cpaTargetDollars: number | null;   // CPA cible ($) = (M - B) / r
  qtyBreakevenUnits: number;         // Quantité breakeven = S / CPA breakeven
  qtyTargetUnits: number | null;     // Quantité cible = S / CPA cible
  realCpaDollars: number | null;     // CPA réel ($) = S / deliveredUnits
  maxMetaCostPerPurchase: number;    // Coût par achat Meta max ($) = CPA breakeven * c
  targetMetaCostPerPurchase: number | null; // Coût par achat Meta cible ($) = CPA cible * c
  ordersToGenerateTarget: number | null;    // Commandes à générer = quantité cible / c
  projectedDeliveredUnits: number;   // Livrées + en cours * taux de closing
  verdict: ScalingVerdict;
}

export const MANDATORY_SCALING_DISCLAIMER =
  "Aide à la décision basée sur vos données. Elle ne remplace pas votre jugement.";

/**
 * Calcule l'ensemble des métriques de scaling pour un produit donné.
 */
export function calculateScalingMetrics(input: ScalingProductInput): ScalingMetrics {
  const {
    acquisitionPrice: A,
    sellingPrice: P,
    deliveryCost: L,
    desiredProfit: B,
    dollarRate: r,
    closingRate: c,
    adSpendDollars: S,
    deliveredUnits,
    pendingUnits,
    ordersCount,
    campaignDays,
    metaCostPerPurchase,
    consecutiveDaysOverBreakeven = 0,
    consecutiveDaysUnderTarget = 0,
  } = input;

  // 1. Marge avant publicité par pièce livrée
  const M = P - A - L;
  const isMarginSufficient = M > B;

  if (r <= 0) {
    throw new Error("Le taux de change du dollar doit être strictement supérieur à 0.");
  }
  if (c <= 0 || c > 1) {
    throw new Error("Le taux de closing doit être compris entre 0 (exclu) et 1 (100 %).");
  }

  // 2. CPA Breakeven ($) = M / r
  const cpaBreakevenDollars = M > 0 ? M / r : 0;

  // 3. CPA Cible ($) = (M - B) / r (uniquement si M > B)
  const cpaTargetDollars = isMarginSufficient ? (M - B) / r : null;

  // 4. Quantité Breakeven = S / CPA Breakeven
  const qtyBreakevenUnits = cpaBreakevenDollars > 0 ? S / cpaBreakevenDollars : 0;

  // 5. Quantité Cible = S / CPA Cible
  const qtyTargetUnits =
    cpaTargetDollars && cpaTargetDollars > 0 ? S / cpaTargetDollars : null;

  // 6. CPA Réel ($) = S / deliveredUnits
  const realCpaDollars = deliveredUnits > 0 ? S / deliveredUnits : null;

  // 7. Coût par achat Meta maximal et cible
  const maxMetaCostPerPurchase = cpaBreakevenDollars * c;
  const targetMetaCostPerPurchase =
    cpaTargetDollars !== null ? cpaTargetDollars * c : null;

  // 8. Commandes à générer pour atteindre la quantité cible
  const ordersToGenerateTarget =
    qtyTargetUnits !== null ? qtyTargetUnits / c : null;

  // 9. Livraisons projetées (en tenant compte des commandes en cours pour éviter de couper prématurément)
  const projectedDeliveredUnits = deliveredUnits + pendingUnits * c;

  // 10. Calcul du Verdict décisionnel
  let verdict: ScalingVerdict;

  if (!isMarginSufficient) {
    verdict = {
      key: "cut",
      label: "Marge insuffisante",
      badgeClass: "bg-rose-100 text-rose-900 border-rose-300",
      reason: `Marge insuffisante pour le bénéfice souhaité (Marge brute : ${M} FCFA <= Bénéfice visé : ${B} FCFA).`,
      disclaimer: MANDATORY_SCALING_DISCLAIMER,
    };
  } else if (
    S < 2 * cpaBreakevenDollars ||
    ordersCount < 20 ||
    campaignDays < 3
  ) {
    // 1. Données insuffisantes : dépense < 2 * CPA breakeven OU < 20 commandes OU < 3 jours
    verdict = {
      key: "insufficient_data",
      label: "Données insuffisantes",
      badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
      reason: `Volume minimum non atteint (Dépense : ${S.toFixed(1)} $ / seuil 2x breakeven ${(2 * cpaBreakevenDollars).toFixed(1)} $, Commandes : ${ordersCount}/20, Jours : ${campaignDays}/3). Aucune consigne prématurée.`,
      disclaimer: MANDATORY_SCALING_DISCLAIMER,
    };
  } else if (qtyTargetUnits !== null && deliveredUnits >= qtyTargetUnits - 1) {
    // 2. Encaisser : pièces livrées >= quantité cible (à 1 pièce près)
    verdict = {
      key: "cash_in",
      label: "Encaisser",
      badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
      reason: `Objectif de volume atteint : ${deliveredUnits} pièces livrées (cible : ${qtyTargetUnits.toFixed(1)} pièces). Rentabilité validée.`,
      disclaimer: MANDATORY_SCALING_DISCLAIMER,
    };
  } else if (
    realCpaDollars !== null &&
    cpaTargetDollars !== null &&
    realCpaDollars <= cpaTargetDollars &&
    consecutiveDaysUnderTarget >= 3
  ) {
    // 3. Scaler : CPA réel <= CPA cible sur au moins 3 jours consécutifs
    verdict = {
      key: "scale",
      label: "Scaler",
      badgeClass: "bg-emerald-600 text-white border-emerald-700",
      reason: `Rentabilité excellente : CPA réel (${realCpaDollars.toFixed(2)} $) <= CPA cible (${cpaTargetDollars.toFixed(2)} $) depuis au moins 3 jours avec closing stable.`,
      disclaimer: MANDATORY_SCALING_DISCLAIMER,
    };
  } else if (
    // 5. Couper : vérification des 3 conditions d'alerte avec volume minimum atteint
    (consecutiveDaysOverBreakeven >= 3 && realCpaDollars !== null && realCpaDollars > cpaBreakevenDollars) ||
    (S >= 2 * cpaBreakevenDollars && projectedDeliveredUnits < qtyBreakevenUnits) ||
    (metaCostPerPurchase !== undefined && metaCostPerPurchase > maxMetaCostPerPurchase && consecutiveDaysOverBreakeven >= 3)
  ) {
    let cutReason = "Coupé car : ";
    if (consecutiveDaysOverBreakeven >= 3 && realCpaDollars !== null && realCpaDollars > cpaBreakevenDollars) {
      cutReason += `CPA réel ${realCpaDollars.toFixed(2)} $ > CPA breakeven ${cpaBreakevenDollars.toFixed(2)} $ pendant 3 jours consécutifs.`;
    } else if (S >= 2 * cpaBreakevenDollars && projectedDeliveredUnits < qtyBreakevenUnits) {
      cutReason += `Dépense (${S.toFixed(1)} $) >= 2x breakeven (${(2 * cpaBreakevenDollars).toFixed(1)} $) et livraisons projetées (${projectedDeliveredUnits.toFixed(1)}) < quantité breakeven (${qtyBreakevenUnits.toFixed(1)}).`;
    } else {
      cutReason += `Coût par achat Meta (${metaCostPerPurchase?.toFixed(2)} $) > Coût par achat maximal (${maxMetaCostPerPurchase.toFixed(2)} $) pendant 3 jours.`;
    }

    verdict = {
      key: "cut",
      label: "Couper",
      badgeClass: "bg-rose-600 text-white border-rose-700",
      reason: cutReason,
      disclaimer: MANDATORY_SCALING_DISCLAIMER,
    };
  } else {
    // 4. Surveiller : CPA réel entre CPA cible et CPA breakeven
    verdict = {
      key: "monitor",
      label: "Surveiller",
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
      reason: `CPA réel (${realCpaDollars ? realCpaDollars.toFixed(2) : "en cours"} $) situé entre le CPA cible (${cpaTargetDollars?.toFixed(2)} $) et le CPA breakeven (${cpaBreakevenDollars.toFixed(2)} $). Attendre la maturation des cohortes.`,
      disclaimer: MANDATORY_SCALING_DISCLAIMER,
    };
  }

  return {
    marginBeforeAds: M,
    isMarginSufficient,
    marginErrorMessage: isMarginSufficient
      ? undefined
      : "Marge insuffisante pour le bénéfice souhaité",
    cpaBreakevenDollars,
    cpaTargetDollars,
    qtyBreakevenUnits,
    qtyTargetUnits,
    realCpaDollars,
    maxMetaCostPerPurchase,
    targetMetaCostPerPurchase,
    ordersToGenerateTarget,
    projectedDeliveredUnits,
    verdict,
  };
}

// =====================================================================
// EXTENSION : ANALYSE WEEKLY & DÉTECTION D'OVER-SCALING VS SCALING SAIN
// =====================================================================

export type ScalingHealthStatus =
  | "healthy_scaling"     // Scaling sain & rentable : Budget en hausse ET profit en hausse, CPA maîtrisé
  | "warning_diminishing" // Rendements décroissants : Budget en hausse mais livraisons qui plafonnent, profit en baisse
  | "overscaling_danger"  // Over-scaling sévère : Budget en hausse mais profit négatif ou effondré !
  | "under_budget"        // Sous-diffusion : CPA très rentable, budget trop bas
  | "stable";             // Stable : Métriques constantes

export interface WeeklyScalingSnapshot {
  weekKey: string;           // "2026-W46"
  weekNumber: number;        // 46
  label: string;             // "Semaine 46 (10 - 16 Nov)"
  shortLabel: string;        // "S46"
  startDate: string;         // "2026-11-10"
  endDate: string;           // "2026-11-16"
  isCurrent: boolean;
  adSpendDollars: number;
  ordersCount: number;
  deliveredUnits: number;
  pendingUnits: number;
  closingRate: number;       // ex: 0.291 (29.1%)
  realCpaDollars: number;
  cpaTargetDollars: number;
  cpaBreakevenDollars: number;
  netProfitFcfa: number;
  dollarRate: number;
  productsSummary: {
    productId: string;
    productName: string;
    phase: CampaignPhase;
    adSpendDollars: number;
    deliveredUnits: number;
    ordersCount: number;
    realCpaDollars: number;
    netProfitFcfa: number;
    verdictKey: ScalingVerdictKey;
    verdictLabel: string;
  }[];
}

export interface WeeklyComparisonAnalysis {
  currentWeek: WeeklyScalingSnapshot;
  previousWeek: WeeklyScalingSnapshot | null;
  deltaSpendDollars: number;
  deltaSpendPct: number;
  deltaOrdersCount: number;
  deltaOrdersPct: number;
  deltaDeliveredUnits: number;
  deltaDeliveredPct: number;
  deltaRealCpaDollars: number;
  deltaRealCpaPct: number;
  deltaProfitFcfa: number;
  deltaProfitPct: number;
  profitElasticity: number | null; // deltaProfitPct / deltaSpendPct (< 0 = destruction de valeur)
  healthStatus: ScalingHealthStatus;
  healthLabel: string;
  healthBadgeClass: string;
  summaryTitle: string;
  diagnosis: string;
  actionRecommendation: string;
}

/**
 * Compare deux semaines consécutives pour détecter si l'augmentation de budget
 * génère du profit (Scaling Sain) ou détruit de la marge (Over-scaling).
 */
export function analyzeWeeklyScaling(
  currentWeek: WeeklyScalingSnapshot,
  previousWeek: WeeklyScalingSnapshot | null
): WeeklyComparisonAnalysis {
  if (!previousWeek || previousWeek.adSpendDollars <= 0) {
    return {
      currentWeek,
      previousWeek,
      deltaSpendDollars: 0,
      deltaSpendPct: 0,
      deltaOrdersCount: 0,
      deltaOrdersPct: 0,
      deltaDeliveredUnits: 0,
      deltaDeliveredPct: 0,
      deltaRealCpaDollars: 0,
      deltaRealCpaPct: 0,
      deltaProfitFcfa: 0,
      deltaProfitPct: 0,
      profitElasticity: null,
      healthStatus: "stable",
      healthLabel: "Semaine de référence",
      healthBadgeClass: "bg-slate-100 text-slate-800 border-slate-300",
      summaryTitle: "Semaine de base sans historique comparatif",
      diagnosis: `Dépenses de ${currentWeek.adSpendDollars} $ pour ${currentWeek.deliveredUnits} pièces livrées.`,
      actionRecommendation: "Poursuivez la collecte de données sur les prochains cycles de livraison.",
    };
  }

  const deltaSpendDollars = currentWeek.adSpendDollars - previousWeek.adSpendDollars;
  const deltaSpendPct = (deltaSpendDollars / previousWeek.adSpendDollars) * 100;

  const deltaOrdersCount = currentWeek.ordersCount - previousWeek.ordersCount;
  const deltaOrdersPct = previousWeek.ordersCount > 0 ? (deltaOrdersCount / previousWeek.ordersCount) * 100 : 0;

  const deltaDeliveredUnits = currentWeek.deliveredUnits - previousWeek.deliveredUnits;
  const deltaDeliveredPct =
    previousWeek.deliveredUnits > 0 ? (deltaDeliveredUnits / previousWeek.deliveredUnits) * 100 : 0;

  const deltaRealCpaDollars = currentWeek.realCpaDollars - previousWeek.realCpaDollars;
  const deltaRealCpaPct =
    previousWeek.realCpaDollars > 0 ? (deltaRealCpaDollars / previousWeek.realCpaDollars) * 100 : 0;

  const deltaProfitFcfa = currentWeek.netProfitFcfa - previousWeek.netProfitFcfa;
  const deltaProfitPct =
    Math.abs(previousWeek.netProfitFcfa) > 0
      ? (deltaProfitFcfa / Math.abs(previousWeek.netProfitFcfa)) * 100
      : 0;

  const profitElasticity =
    Math.abs(deltaSpendPct) > 2 ? Number((deltaProfitPct / deltaSpendPct).toFixed(2)) : null;

  let healthStatus: ScalingHealthStatus = "stable";
  let healthLabel = "Stabilisation";
  let healthBadgeClass = "bg-slate-100 text-slate-800 border-slate-300";
  let summaryTitle = "";
  let diagnosis = "";
  let actionRecommendation = "";

  // Cas 1 : Over-scaling sévère (Destruction nette de marge)
  // Le budget publicitaire augmente (> +10%), ET (le profit net devient négatif OU le CPA dépasse le breakeven)
  if (
    (deltaSpendPct >= 10 && currentWeek.netProfitFcfa < 0) ||
    (deltaSpendPct >= 10 && currentWeek.realCpaDollars >= currentWeek.cpaBreakevenDollars) ||
    (deltaSpendPct >= 15 && currentWeek.realCpaDollars >= currentWeek.cpaBreakevenDollars * 0.90 && currentWeek.netProfitFcfa < 10000)
  ) {
    healthStatus = "overscaling_danger";
    healthLabel = "🚨 Over-scaling Détecté";
    healthBadgeClass = "bg-rose-600 text-white border-rose-700";
    summaryTitle = `Alerte Over-scaling : ${deltaSpendPct >= 0 ? "+" : ""}${deltaSpendPct.toFixed(1)} % de Budget Ads pour ${deltaProfitFcfa < 0 ? "-" : "+"}${Math.abs(deltaProfitFcfa).toLocaleString("fr-FR")} FCFA de Marge`;
    diagnosis = `Vous dépensez plus en publicité (${currentWeek.adSpendDollars} $ vs ${previousWeek.adSpendDollars} $, soit +${deltaSpendPct.toFixed(1)} %), mais vos pièces livrées ne suivent pas (${currentWeek.deliveredUnits} vs ${previousWeek.deliveredUnits} pcs). Votre CPA réel a bondi de +${deltaRealCpaPct.toFixed(1)} % pour atteindre ${currentWeek.realCpaDollars.toFixed(2)} $ (proche du breakeven ${currentWeek.cpaBreakevenDollars.toFixed(2)} $). Le taux de closing est tombé à ${(currentWeek.closingRate * 100).toFixed(1)} %, détruisant votre rentabilité.`;
    actionRecommendation = `Arrêtez d'augmenter le budget. Redescendez immédiatement au budget de ${previousWeek.adSpendDollars} $ (palier précédent) et renouvelez vos créatifs publicitaires ou requalifiez votre tunnel WhatsApp/Closeuses.`;
  }
  // Cas 2 : Rendements décroissants / saturation naissante (Profit encore positif mais érosion)
  // Le budget a augmenté (> +10%) mais les livraisons stagnent (<= +3%) OU le profit recule
  else if (
    (deltaSpendPct >= 10 && deltaDeliveredPct <= 3 && currentWeek.realCpaDollars > currentWeek.cpaTargetDollars) ||
    (deltaSpendPct >= 10 && deltaProfitPct < 0)
  ) {
    healthStatus = "warning_diminishing";
    healthLabel = "⚠️ Rendements Décroissants";
    healthBadgeClass = "bg-amber-500 text-white border-amber-600";
    summaryTitle = `Palier de Saturation : +${deltaSpendPct.toFixed(1)} % de Budget mais livraisons stagnantes (${deltaDeliveredPct >= 0 ? "+" : ""}${deltaDeliveredPct.toFixed(1)} %)`;
    diagnosis = `Chaque dollar supplémentaire injecté rapporte de moins en moins de livraisons. Le CPA réel (${currentWeek.realCpaDollars.toFixed(2)} $) s'éloigne de votre cible (${currentWeek.cpaTargetDollars.toFixed(2)} $). Votre profit stagne ou fléchit de ${deltaProfitPct.toFixed(1)} %.`;
    actionRecommendation = `Gelez le budget publicitaire au niveau actuel pendant 5 à 7 jours. Ne scalez pas davantage tant que les livraisons en cours ne sont pas encaissées et que le closing ne s'est pas stabilisé.`;
  }
  // Cas 3 : Scaling sain et rentable
  // Le budget a augmenté (> +8%) ET le profit a augmenté (> +5%) avec CPA sous contrôle
  else if (
    deltaSpendPct >= 8 &&
    deltaProfitPct >= 5 &&
    currentWeek.realCpaDollars <= currentWeek.cpaTargetDollars * 1.15
  ) {
    healthStatus = "healthy_scaling";
    healthLabel = "✅ Scaling Sain & Rentable";
    healthBadgeClass = "bg-emerald-600 text-white border-emerald-700";
    summaryTitle = `Scaling Réussi : +${deltaSpendPct.toFixed(1)} % de Budget $\\to$ +${deltaProfitPct.toFixed(1)} % de Profit Net`;
    diagnosis = `L'augmentation de votre budget Ads (${currentWeek.adSpendDollars} $ vs ${previousWeek.adSpendDollars} $) s'est traduite par une hausse rentable des livraisons (+${deltaDeliveredPct.toFixed(1)} %) et une marge nette accrue (+${deltaProfitFcfa.toLocaleString("fr-FR")} FCFA). Votre CPA réel de ${currentWeek.realCpaDollars.toFixed(2)} $ reste parfaitement maîtrisé par rapport à votre cible de ${currentWeek.cpaTargetDollars.toFixed(2)} $.`;
    actionRecommendation = `Validation du palier. Vous pouvez continuer à augmenter le budget de +15 % à +20 % sur le prochain cycle de 4 jours si le taux de closing reste au-dessus de 40 %.`;
  }
  // Cas 4 : Sous-diffusion / opportunité inexploitée
  else if (
    currentWeek.realCpaDollars <= currentWeek.cpaTargetDollars * 0.85 &&
    currentWeek.netProfitFcfa > 50000 &&
    currentWeek.adSpendDollars < 200
  ) {
    healthStatus = "under_budget";
    healthLabel = "🚀 Sous-diffusion (À Scaler)";
    healthBadgeClass = "bg-blue-600 text-white border-blue-700";
    summaryTitle = "Opportunité de Croissance : CPA Réel Très Bas";
    diagnosis = `Votre CPA réel de ${currentWeek.realCpaDollars.toFixed(2)} $ est largement sous votre CPA cible (${currentWeek.cpaTargetDollars.toFixed(2)} $). Votre rentabilité unitaire est excellente mais votre budget publicitaire (${currentWeek.adSpendDollars} $) bride votre volume.`;
    actionRecommendation = "Augmentez le budget Ads de +25 % à +30 % dès maintenant pour maximiser votre marge absolue.";
  }
  // Cas 5 : Phase de stabilisation
  else {
    healthStatus = "stable";
    healthLabel = "⏸️ Phase de Stabilisation";
    healthBadgeClass = "bg-slate-700 text-white border-slate-800";
    summaryTitle = "Métriques Stables";
    diagnosis = `Budget Ads stable (${currentWeek.adSpendDollars} $) avec ${currentWeek.deliveredUnits} pièces livrées et un profit net de ${currentWeek.netProfitFcfa.toLocaleString("fr-FR")} FCFA.`;
    actionRecommendation = "Maintenez la surveillance des cohortes de livraison.";
  }

  return {
    currentWeek,
    previousWeek,
    deltaSpendDollars,
    deltaSpendPct,
    deltaOrdersCount,
    deltaOrdersPct,
    deltaDeliveredUnits,
    deltaDeliveredPct,
    deltaRealCpaDollars,
    deltaRealCpaPct,
    deltaProfitFcfa,
    deltaProfitPct,
    profitElasticity,
    healthStatus,
    healthLabel,
    healthBadgeClass,
    summaryTitle,
    diagnosis,
    actionRecommendation,
  };
}

/**
 * Historique hebdomadaire de scaling (vide en production, alimenté par les données réelles de la boutique).
 */
export const DEFAULT_WEEKLY_SCALING_HISTORY: WeeklyScalingSnapshot[] = [];

