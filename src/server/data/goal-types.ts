// Types pour les Objectifs de chiffre d'affaires encaissé Novika

export type GoalMetric = "collected_real" | "delivered_gross";
export type GoalPeriodType = "month" | "week" | "custom";
export type GoalScope = "store" | "country" | "product" | "closer" | "consolidated";

export interface GoalMilestone {
  percentage: number; // e.g. 75, 100, 120
  targetAmount: number;
  label: string;
  bonusAmount?: number;
}

export interface GoalProgress {
  confirmedCollected: number; // Segment 1 (vert) : Espèces remises ou virement vérifié
  deliveredPending: number;   // Segment 2 (ambre) : Livré mais argent pas encore en main
  inTransitWeighted: number;  // Segment 3 (bleu) : Commandes en cours pondérées par le taux historique
  totalTarget: number;
  currentTotal: number;       // confirmedCollected + deliveredPending
  percentAchieved: number;    // % basé sur confirmedCollected
  projectedTotal: number;     // Projection fin de période
  projectedPercent: number;
}

export interface GoalPace {
  elapsedDays: number;
  totalDays: number;
  daysRemaining: number;
  expectedPercentToday: number; // Repère linéaire sur la barre (pace line)
  status: "ahead" | "on_track" | "behind"; // "En avance", "Dans le rythme", "En retard"
  statusLabel: string;
  remainingAmount: number;
  requiredDailyRate: number;
  currentDailyRate: number;
}

export interface RevenueGoal {
  id: string;
  storeId: string;
  title: string;
  metric: GoalMetric;
  periodType: GoalPeriodType;
  startDate: string; // ISO
  endDate: string;   // ISO
  scope: GoalScope;
  scopeId?: string;  // e.g. closerId or productId
  targetAmount: number;
  currency: string;
  milestones: GoalMilestone[];
  isLocked: boolean;
  hasBonus: boolean;
  progress: GoalProgress;
  pace: GoalPace;
  status: "active" | "completed" | "expired";
}
