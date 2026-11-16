import { RevenueGoal } from "@/server/data/goal-types";

export const MOCK_GOALS: RevenueGoal[] = [
  {
    id: "goal-lome-nov-2026",
    storeId: "lome-glow",
    title: "Objectif du mois — Novembre 2026",
    metric: "collected_real",
    periodType: "month",
    startDate: "2026-11-01",
    endDate: "2026-11-30",
    scope: "store",
    targetAmount: 5000000,
    currency: "FCFA",
    isLocked: true,
    hasBonus: true,
    status: "active",
    milestones: [
      { percentage: 75, targetAmount: 3750000, label: "Palier 75%", bonusAmount: 50000 },
      { percentage: 100, targetAmount: 5000000, label: "Objectif 100%", bonusAmount: 150000 },
      { percentage: 120, targetAmount: 6000000, label: "Stretch 120%", bonusAmount: 250000 },
    ],
    progress: {
      confirmedCollected: 2750000, // 55%
      deliveredPending: 950000,    // 19%
      inTransitWeighted: 600000,   // 12%
      totalTarget: 5000000,
      currentTotal: 3700000,       // 74%
      percentAchieved: 55,
      projectedTotal: 5250000,
      projectedPercent: 105,
    },
    pace: {
      elapsedDays: 16,
      totalDays: 30,
      daysRemaining: 14,
      expectedPercentToday: 53.3, // au 16e jour, attendu ~53%
      status: "ahead",            // Réalisé 55% > 53.3%
      statusLabel: "En avance",
      remainingAmount: 2250000,
      requiredDailyRate: 160714,
      currentDailyRate: 171875,
    },
  },
  {
    id: "goal-lome-oct-2026",
    storeId: "lome-glow",
    title: "Objectif du mois — Octobre 2026",
    metric: "collected_real",
    periodType: "month",
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    scope: "store",
    targetAmount: 4500000,
    currency: "FCFA",
    isLocked: true,
    hasBonus: false,
    status: "completed",
    milestones: [
      { percentage: 100, targetAmount: 4500000, label: "Objectif 100%" },
    ],
    progress: {
      confirmedCollected: 4820000,
      deliveredPending: 0,
      inTransitWeighted: 0,
      totalTarget: 4500000,
      currentTotal: 4820000,
      percentAchieved: 107,
      projectedTotal: 4820000,
      projectedPercent: 107,
    },
    pace: {
      elapsedDays: 31,
      totalDays: 31,
      daysRemaining: 0,
      expectedPercentToday: 100,
      status: "ahead",
      statusLabel: "Atteint",
      remainingAmount: 0,
      requiredDailyRate: 0,
      currentDailyRate: 155483,
    },
  },
];
