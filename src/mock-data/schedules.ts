import { DaySchedule, TeamSchedule, DutyStatus, MemberDutyInfo } from "@/server/data/schedule-types";
import { MOCK_TEAM } from "@/mock-data/team";

export const DEFAULT_DAY_SCHEDULES: DaySchedule[] = [
  { dayOfWeek: 1, dayName: "Lundi", isWorking: true, startTime: "07:00", endTime: "18:00" },
  { dayOfWeek: 2, dayName: "Mardi", isWorking: true, startTime: "07:00", endTime: "18:00" },
  { dayOfWeek: 3, dayName: "Mercredi", isWorking: true, startTime: "07:00", endTime: "18:00" },
  { dayOfWeek: 4, dayName: "Jeudi", isWorking: true, startTime: "07:00", endTime: "18:00" },
  { dayOfWeek: 5, dayName: "Vendredi", isWorking: true, startTime: "07:00", endTime: "18:00" },
  { dayOfWeek: 6, dayName: "Samedi", isWorking: true, startTime: "07:00", endTime: "18:00" },
  { dayOfWeek: 7, dayName: "Dimanche", isWorking: false, startTime: "07:00", endTime: "18:00" }, // Règle stricte : désactivé par défaut
];

// Stockage mémoire des plannings (persisté en sessionStorage / localStorage côté client si disponible)
let IN_MEMORY_SCHEDULES: Record<string, TeamSchedule[]> = {};

export function getShopSchedules(shopId: string): TeamSchedule[] {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(`novika_schedules_${shopId}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
  }

  if (!IN_MEMORY_SCHEDULES[shopId]) {
    IN_MEMORY_SCHEDULES[shopId] = [
      {
        id: `sched_${shopId}_default`,
        shopId,
        scope: "shop",
        days: JSON.parse(JSON.stringify(DEFAULT_DAY_SCHEDULES)),
        timezone: shopId.includes("abidjan") ? "Africa/Abidjan" : "Africa/Lome",
        updatedBy: "Propriétaire",
        updatedAt: new Date().toISOString(),
      },
    ];
  }
  return IN_MEMORY_SCHEDULES[shopId];
}

export function saveShopSchedule(schedule: TeamSchedule): TeamSchedule {
  const shopId = schedule.shopId;
  const existing = getShopSchedules(shopId);
  const idx = existing.findIndex(
    (s) => s.scope === schedule.scope && s.role === schedule.role && s.memberId === schedule.memberId
  );

  if (idx >= 0) {
    existing[idx] = { ...schedule, updatedAt: new Date().toISOString() };
  } else {
    existing.push({ ...schedule, id: `sched_${Date.now()}`, updatedAt: new Date().toISOString() });
  }

  IN_MEMORY_SCHEDULES[shopId] = existing;
  if (typeof window !== "undefined") {
    localStorage.setItem(`novika_schedules_${shopId}`, JSON.stringify(existing));
  }
  return schedule;
}

export function resetShopSchedule(shopId: string, scope: "shop" | "role" | "member", targetId?: string): TeamSchedule {
  const defaultDays = JSON.parse(JSON.stringify(DEFAULT_DAY_SCHEDULES));
  const newSched: TeamSchedule = {
    id: `sched_${shopId}_${scope}_${targetId || "default"}`,
    shopId,
    scope,
    role: scope === "role" ? (targetId as any) : undefined,
    memberId: scope === "member" ? targetId : undefined,
    days: defaultDays,
    timezone: shopId.includes("abidjan") ? "Africa/Abidjan" : "Africa/Lome",
    updatedBy: "Propriétaire",
    updatedAt: new Date().toISOString(),
  };

  return saveShopSchedule(newSched);
}

/**
 * Calcule si un membre est actuellement en service ou non
 * Résout la hiérarchie : 1. Surcharge Membre -> 2. Surcharge Rôle -> 3. Défaut Boutique
 */
export function calculateDutyStatus(
  shopId: string,
  memberId: string,
  role: string,
  refDate: Date = new Date()
): DutyStatus {
  const schedules = getShopSchedules(shopId);

  // 1. Recherche surcharge membre
  const memberSched = schedules.find((s) => s.scope === "member" && s.memberId === memberId);
  // 2. Recherche surcharge rôle
  const roleSched = schedules.find((s) => s.scope === "role" && s.role === role);
  // 3. Planning boutique
  const shopSched = schedules.find((s) => s.scope === "shop") || {
    days: DEFAULT_DAY_SCHEDULES,
    timezone: "Africa/Lome",
  };

  const activeDays = memberSched?.days || roleSched?.days || shopSched.days;

  // Jour de la semaine JS : 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  // Convertir en DayOfWeek Kelio : 1 = Lundi, ..., 7 = Dimanche
  const jsDay = refDate.getDay();
  const dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7 = jsDay === 0 ? 7 : (jsDay as 1 | 2 | 3 | 4 | 5 | 6);

  const todayConfig = activeDays.find((d) => d.dayOfWeek === dayOfWeek);
  if (!todayConfig || !todayConfig.isWorking) {
    return "off_duty";
  }

  // Comparer l'heure actuelle (format HH:mm)
  const currentHours = String(refDate.getHours()).padStart(2, "0");
  const currentMinutes = String(refDate.getMinutes()).padStart(2, "0");
  const currentTime = `${currentHours}:${currentMinutes}`;

  if (currentTime >= todayConfig.startTime && currentTime <= todayConfig.endTime) {
    return "on_duty";
  }

  return "off_duty";
}

/**
 * Résumé de disponibilité de l'équipe pour un magasin
 */
export function getTeamDutyOverview(shopId: string): {
  total: number;
  onDuty: number;
  offDuty: number;
  members: MemberDutyInfo[];
} {
  const members: MemberDutyInfo[] = MOCK_TEAM.map((m) => {
    const status = calculateDutyStatus(shopId, m.id, m.role);
    return {
      memberId: m.id,
      memberName: m.name,
      role: m.role,
      dutyStatus: status,
      statusLabel: status === "on_duty" ? "En service" : "Hors service",
      currentDayWorking: true,
      todayStart: "07:00",
      todayEnd: "18:00",
      timezone: "Africa/Lome",
    };
  });

  const onDuty = members.filter((m) => m.dutyStatus === "on_duty").length;
  const offDuty = members.length - onDuty;

  return {
    total: members.length,
    onDuty,
    offDuty,
    members,
  };
}
