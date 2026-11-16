/**
 * Types pour la gestion des horaires de travail de l'équipe (Prompts 05-D & 05-H)
 */

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = Lundi, 7 = Dimanche

export interface DaySchedule {
  dayOfWeek: DayOfWeek;
  dayName: string;
  isWorking: boolean;
  startTime: string; // Format "HH:mm", ex: "07:00"
  endTime: string;   // Format "HH:mm", ex: "18:00"
}

export type ScheduleScope = "shop" | "role" | "member";

export interface TeamSchedule {
  id: string;
  shopId: string;
  scope: ScheduleScope;
  role?: "closer" | "rider" | "agency" | "admin" | "owner";
  memberId?: string;
  days: DaySchedule[];
  timezone: string; // IANA timezone, ex: "Africa/Lome", "Africa/Abidjan"
  updatedBy: string;
  updatedAt: string;
}

export type DutyStatus = "on_duty" | "off_duty" | "duty_soon";

export interface MemberDutyInfo {
  memberId: string;
  memberName: string;
  role: string;
  dutyStatus: DutyStatus;
  statusLabel: string;
  currentDayWorking: boolean;
  todayStart: string;
  todayEnd: string;
  timezone: string;
}
