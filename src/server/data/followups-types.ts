import { OrderStatus } from "./types";

export type FollowupType = "rescheduled" | "unreachable";

export type FollowupStatus = "pending" | "completed" | "expired" | "cancelled";

export type PostponeReason = "salary" | "travel" | "indisposed" | "other";

export const POSTPONE_REASON_LABELS: Record<PostponeReason, string> = {
  salary: "Attente salaire / Tontine",
  travel: "En voyage / Déplacement",
  indisposed: "Indisponible / En réunion",
  other: "Autre motif convenu",
};

export type CallOutcomeType =
  | "confirmed"
  | "rescheduled"
  | "unreachable"
  | "rejected"
  | "rejected_invalid_number";

export type FollowupCallOutcome = CallOutcomeType;

export const CALL_OUTCOME_LABELS: Record<CallOutcomeType, string> = {
  confirmed: "Confirmée (Passe en préparation)",
  rescheduled: "Reportée (Programmer un rappel)",
  unreachable: "Injoignable (Calcul automatique cadence)",
  rejected: "Rejetée par le client (Refus explicite)",
  rejected_invalid_number: "Faux numéro / Numéro invalide",
};

export interface Followup {
  id: string;
  orderId: string;
  orderNumber: string;
  shopId: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  totalAmount: number;
  city: string;
  assignedTo: {
    id: string;
    name: string;
    phone?: string;
  };
  type: FollowupType;
  dueAt: string; // ISO 8601 string
  attemptNo: number; // 1 to 4
  status: FollowupStatus;
  postponeReason?: PostponeReason;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  notifiedAt?: string;
}

export interface CloserPerformanceStats {
  closerId: string;
  closerName: string;
  totalAssigned: number;
  confirmedCount: number;
  rescheduledCount: number;
  rejectedCount: number;
  lostCount: number;
  rejectionRate: number; // percentage (0 to 100)
  avgProcessingMinutes: number;
  isHighRejectionAlert: boolean;
}

export interface WorkingHoursConfig {
  startHour: number; // default 7 (07:00)
  endHour: number; // default 18 (18:00)
  timezone: string; // e.g. "Africa/Abidjan", "Africa/Lome", "Africa/Dakar"
  allowSunday?: boolean; // default false, unless owner activates
}
