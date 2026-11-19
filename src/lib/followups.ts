import {
  Followup,
  FollowupCallOutcome,
  FollowupStatus,
  FollowupType,
  PostponeReason,
  CallOutcomeType,
  CloserPerformanceStats,
  WorkingHoursConfig,
} from "@/server/data/followups-types";
import { Order } from "@/server/data/types";

export const DEFAULT_WORKING_HOURS: WorkingHoursConfig = {
  startHour: 7, // 07:00
  endHour: 18, // 18:00
  timezone: "Africa/Abidjan",
  allowSunday: false,
};

export const MAX_RESCHEDULES_LIMIT = 3;
export const MAX_RESCHEDULE_DAYS_AHEAD = 30;

/**
 * Normalise et vérifie si une date tombe pendant les heures de travail d'équipe (07:00 - 18:00, Lundi-Samedi).
 */
export function isWithinWorkingHours(
  date: Date,
  config: WorkingHoursConfig = DEFAULT_WORKING_HOURS
): boolean {
  const day = date.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  if (day === 0 && !config.allowSunday) {
    return false;
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeVal = hours + minutes / 60;

  return timeVal >= config.startHour && timeVal < config.endHour;
}

/**
 * Décale une date vers la prochaine plage horaire ouvrable valide.
 * Si en dehors des horaires (ou dimanche), saute au prochain matin d'ouverture à startHour:00.
 */
export function adjustToNextWorkingSlot(
  date: Date,
  config: WorkingHoursConfig = DEFAULT_WORKING_HOURS
): Date {
  const adjusted = new Date(date.getTime());

  while (true) {
    const day = adjusted.getDay();
    const hours = adjusted.getHours();
    const minutes = adjusted.getMinutes();
    const timeVal = hours + minutes / 60;

    // Si dimanche et non autorisé : sauter au lundi matin à l'ouverture
    if (day === 0 && !config.allowSunday) {
      adjusted.setDate(adjusted.getDate() + 1);
      adjusted.setHours(config.startHour, 0, 0, 0);
      continue;
    }

    // Si avant l'ouverture du jour : caler à l'ouverture du même jour
    if (timeVal < config.startHour) {
      adjusted.setHours(config.startHour, 0, 0, 0);
      return adjusted;
    }

    // Si après la fermeture du jour : passer au lendemain matin à l'ouverture
    if (timeVal >= config.endHour) {
      adjusted.setDate(adjusted.getDate() + 1);
      adjusted.setHours(config.startHour, 0, 0, 0);
      continue;
    }

    // Tombe bien dans les heures ouvrables
    return adjusted;
  }
}

/**
 * Calcule l'échéance de relance en ajoutant des heures tout en respectant strictement les heures de bureau.
 */
export function addWorkingHours(
  fromDate: Date,
  hoursToAdd: number,
  config: WorkingHoursConfig = DEFAULT_WORKING_HOURS
): Date {
  let current = adjustToNextWorkingSlot(fromDate, config);
  let remainingHours = hoursToAdd;

  while (remainingHours > 0) {
    const hours = current.getHours();
    const minutes = current.getMinutes();
    const currentSlotRemaining = config.endHour - (hours + minutes / 60);

    if (remainingHours <= currentSlotRemaining) {
      current = new Date(current.getTime() + remainingHours * 3600 * 1000);
      remainingHours = 0;
    } else {
      // Épuise la journée en cours et reporte le reste au lendemain matin
      remainingHours -= currentSlotRemaining;
      current.setDate(current.getDate() + 1);
      current.setHours(config.startHour, 0, 0, 0);
      current = adjustToNextWorkingSlot(current, config);
    }
  }

  return adjustToNextWorkingSlot(current, config);
}

/**
 * Cadence pour les Injoignables :
 * - Essai 1 : Réception de commande (dès que la closeuse l'appelle)
 * - Essai 2 : 2 heures plus tard (dans les horaires de travail)
 * - Essai 3 : Le lendemain matin (08:00)
 * - Essai 4 (dernier) : Le surlendemain matin (08:00) avec relance WhatsApp conseillée
 * - Après 4e essai sans réponse : statut final « Perdue – injoignable », fermeture automatique.
 */
export function calculateNextCadenceAttempt(
  currentAttempt: number,
  baseDate: Date = new Date(),
  config: WorkingHoursConfig = DEFAULT_WORKING_HOURS
): {
  dueAt: string;
  attemptNo: number;
  isFinalLoss: boolean;
  suggestWhatsApp: boolean;
} {
  const nextAttemptNo = currentAttempt + 1;

  if (nextAttemptNo > 4) {
    return {
      dueAt: baseDate.toISOString(),
      attemptNo: currentAttempt,
      isFinalLoss: true,
      suggestWhatsApp: false,
    };
  }

  let targetDate: Date;

  if (nextAttemptNo === 2) {
    // Essai 2 : 2 heures plus tard (dans les heures ouvrables)
    targetDate = addWorkingHours(baseDate, 2, config);
  } else if (nextAttemptNo === 3) {
    // Essai 3 : Le lendemain matin à 08:00 (ou startHour)
    const nextDay = new Date(baseDate.getTime());
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(Math.max(config.startHour, 8), 0, 0, 0);
    targetDate = adjustToNextWorkingSlot(nextDay, config);
  } else {
    // Essai 4 : Le surlendemain (2 jours après) matin à 08:00
    const inTwoDays = new Date(baseDate.getTime());
    inTwoDays.setDate(inTwoDays.getDate() + 2);
    inTwoDays.setHours(Math.max(config.startHour, 8), 0, 0, 0);
    targetDate = adjustToNextWorkingSlot(inTwoDays, config);
  }

  return {
    dueAt: targetDate.toISOString(),
    attemptNo: nextAttemptNo,
    isFinalLoss: false,
    suggestWhatsApp: nextAttemptNo === 4,
  };
}

/**
 * Validation des reports :
 * - Max 3 reports par commande
 * - Date au plus tard 30 jours dans le futur
 * - Motif obligatoire
 */
export function validateRescheduleRequest({
  scheduledDate,
  currentRescheduleCount = 0,
  postponeReason,
  maxReschedules = MAX_RESCHEDULES_LIMIT,
  maxDaysAhead = MAX_RESCHEDULE_DAYS_AHEAD,
  now = new Date(),
}: {
  scheduledDate: Date;
  currentRescheduleCount?: number;
  postponeReason?: string;
  maxReschedules?: number;
  maxDaysAhead?: number;
  now?: Date;
}): { valid: boolean; error?: string } {
  if (currentRescheduleCount >= maxReschedules) {
    return {
      valid: false,
      error: `Limite de ${maxReschedules} reports atteinte pour cette commande. Vous devez confirmer ou rejeter.`,
    };
  }

  if (!postponeReason || postponeReason.trim() === "") {
    return {
      valid: false,
      error: "Le motif du report est obligatoire.",
    };
  }

  if (scheduledDate.getTime() <= now.getTime()) {
    return {
      valid: false,
      error: "La date de report doit être dans le futur.",
    };
  }

  const maxFutureDate = new Date(now.getTime() + maxDaysAhead * 24 * 3600 * 1000);
  if (scheduledDate.getTime() > maxFutureDate.getTime()) {
    return {
      valid: false,
      error: `La date de report ne peut pas dépasser ${maxDaysAhead} jours dans le futur.`,
    };
  }

  return { valid: true };
}

/**
 * Traitement complet d'une issue d'appel (Prompt 05-RL).
 */
export function processOrderCallOutcome({
  order,
  outcome,
  existingFollowups = [],
  closer,
  postponeDate,
  postponeReason,
  rejectionReason,
  notes,
  workingHours = DEFAULT_WORKING_HOURS,
  now = new Date(),
}: {
  order: Order;
  outcome: CallOutcomeType;
  existingFollowups?: Followup[];
  closer: { id: string; name: string; phone?: string };
  postponeDate?: Date;
  postponeReason?: PostponeReason;
  rejectionReason?: string;
  notes?: string;
  workingHours?: WorkingHoursConfig;
  now?: Date;
}): {
  updatedOrder: Order;
  createdFollowup?: Followup;
  cancelledFollowupIds: string[];
  stockRestored: boolean;
  isClosed: boolean;
  message: string;
} {
  // Idempotence : trouver tous les rappels actifs pour cette commande
  const activeFollowups = existingFollowups.filter(
    (f) => f.orderId === order.id && f.status === "pending"
  );
  const cancelledFollowupIds = activeFollowups.map((f) => f.id);

  const currentAttempts = order.followupCount || 0;
  const currentReschedules = order.rescheduleCount || 0;

  if (outcome === "confirmed") {
    // 1. Confirmée -> La commande avance (statut "confirmed" ou "prepared"), fin des relances
    const updatedOrder: Order = {
      ...order,
      status: "confirmed",
      updatedAt: now.toISOString(),
      notes: notes ? `${order.notes || ""}\n[Confirmée]: ${notes}`.trim() : order.notes,
    };

    return {
      updatedOrder,
      cancelledFollowupIds,
      stockRestored: false,
      isClosed: false,
      message: "Commande confirmée avec succès. Elle passe en préparation.",
    };
  }

  if (outcome === "rescheduled") {
    // 2. Reportée -> date et heure obligatoires + note + motif
    const validation = validateRescheduleRequest({
      scheduledDate: postponeDate || new Date(now.getTime() + 24 * 3600 * 1000),
      currentRescheduleCount: currentReschedules,
      postponeReason,
      now,
    });

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const adjustedSlot = adjustToNextWorkingSlot(
      postponeDate || new Date(now.getTime() + 24 * 3600 * 1000),
      workingHours
    );

    const newRescheduleCount = currentReschedules + 1;
    const newAttemptNo = currentAttempts + 1;

    const createdFollowup: Followup = {
      id: `fol_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      shopId: "shop_01",
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      productName: order.items[0]?.productName || "Produit commande",
      totalAmount: order.totalAmount,
      city: order.city,
      assignedTo: closer,
      type: "rescheduled",
      dueAt: adjustedSlot.toISOString(),
      attemptNo: newAttemptNo,
      status: "pending",
      postponeReason,
      notes,
      createdAt: now.toISOString(),
    };

    const updatedOrder: Order = {
      ...order,
      status: "postponed",
      followupCount: newAttemptNo,
      rescheduleCount: newRescheduleCount,
      scheduledDate: adjustedSlot.toLocaleDateString("fr-FR"),
      updatedAt: now.toISOString(),
      notes: notes ? `${order.notes || ""}\n[Report #${newRescheduleCount}]: ${notes}`.trim() : order.notes,
    };

    return {
      updatedOrder,
      createdFollowup,
      cancelledFollowupIds,
      stockRestored: false,
      isClosed: false,
      message: `Rappel programmé pour le ${adjustedSlot.toLocaleString("fr-FR")}.`,
    };
  }

  if (outcome === "unreachable") {
    // 3. Injoignable -> calcul automatique selon la cadence
    const cadence = calculateNextCadenceAttempt(currentAttempts, now, workingHours);

    if (cadence.isFinalLoss) {
      // 4e essai échoué -> Clôture automatique en « Perdue – injoignable »
      const updatedOrder: Order = {
        ...order,
        status: "lost_unreachable",
        followupCount: 4,
        rejectionReason: "Injoignable après 4 tentatives cadencées",
        updatedAt: now.toISOString(),
        notes: `${order.notes || ""}\n[Cadence épuisée]: 4 tentatives infructueuses. Commande classée Perdue.`.trim(),
      };

      return {
        updatedOrder,
        cancelledFollowupIds,
        stockRestored: true, // Remise automatique en stock
        isClosed: true,
        message: "4e tentative sans réponse : commande automatiquement clôturée en « Perdue – injoignable ». Stock remis en rayon.",
      };
    }

    const createdFollowup: Followup = {
      id: `fol_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      shopId: "shop_01",
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      productName: order.items[0]?.productName || "Produit commande",
      totalAmount: order.totalAmount,
      city: order.city,
      assignedTo: closer,
      type: "unreachable",
      dueAt: cadence.dueAt,
      attemptNo: cadence.attemptNo,
      status: "pending",
      notes: notes || "Client injoignable (tentative cadencée)",
      createdAt: now.toISOString(),
    };

    const updatedOrder: Order = {
      ...order,
      status: "unreachable",
      followupCount: cadence.attemptNo,
      updatedAt: now.toISOString(),
      notes: notes ? `${order.notes || ""}\n[Tentative #${cadence.attemptNo}]: Injoignable`.trim() : order.notes,
    };

    return {
      updatedOrder,
      createdFollowup,
      cancelledFollowupIds,
      stockRestored: false,
      isClosed: false,
      message: `Tentative enregistrée (${cadence.attemptNo}/4). Prochain appel programmé le ${new Date(cadence.dueAt).toLocaleString("fr-FR")}.`,
    };
  }

  if (outcome === "rejected") {
    // 4. Rejetée par le client -> statut final « Rejetée », motif obligatoire, AUCUNE relance, stock remis
    if (!rejectionReason || rejectionReason.trim() === "") {
      throw new Error("Le motif de rejet est obligatoire.");
    }

    const updatedOrder: Order = {
      ...order,
      status: "rejected",
      rejectionReason,
      updatedAt: now.toISOString(),
      notes: `${order.notes || ""}\n[Rejetée client]: ${rejectionReason} ${notes ? `(${notes})` : ""}`.trim(),
    };

    return {
      updatedOrder,
      cancelledFollowupIds,
      stockRestored: true,
      isClosed: true,
      message: "Commande clôturée en « Rejetée ». Tous les rappels sont annulés et le stock est remis en place.",
    };
  }

  if (outcome === "rejected_invalid_number") {
    // 5. Faux numéro / numéro invalide
    const updatedOrder: Order = {
      ...order,
      status: "rejected_invalid_number",
      rejectionReason: "Faux numéro / Numéro invalide",
      updatedAt: now.toISOString(),
      notes: `${order.notes || ""}\n[Faux numéro]: Impossible de joindre ce numéro. ${notes || ""}`.trim(),
    };

    return {
      updatedOrder,
      cancelledFollowupIds,
      stockRestored: true,
      isClosed: true,
      message: "Commande clôturée en « Rejetée – numéro invalide ». Stock remis en place.",
    };
  }

  throw new Error(`Issue d'appel inconnue: ${outcome}`);
}

/**
 * Réouverture d'une commande rejetée :
 * - Closeuse : Uniquement possible si 'rejected_invalid_number' ET que le client a envoyé son numéro vérifié (une seule fois).
 * - Admin / Manager : Toujours possible avec motif obligatoire.
 */
export function canReopenOrder({
  userRole,
  order,
  isCorrectedPhoneSubmitted = false,
}: {
  userRole: "owner" | "admin" | "manager" | "closer" | "rider" | "courier" | "agency";
  order: Order;
  isCorrectedPhoneSubmitted?: boolean;
}): { allowed: boolean; reason?: string } {
  if (userRole === "owner" || userRole === "admin" || userRole === "manager") {
    return { allowed: true };
  }

  if (userRole === "closer") {
    if (order.status === "rejected_invalid_number") {
      if ((order.reopenCount || 0) >= 1) {
        return {
          allowed: false,
          reason: "Cette commande a déjà été réouverte une fois. Seul un administrateur peut intervenir.",
        };
      }
      if (isCorrectedPhoneSubmitted) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "La réouverture par la closeuse exige un nouveau numéro transmis par le client via le suivi.",
      };
    }

    return {
      allowed: false,
      reason: "Une closeuse ne peut pas rouvrir une commande rejetée par le client. Seul l'administrateur a ce droit.",
    };
  }

  return { allowed: false, reason: "Votre rôle ne permet pas la réouverture de commandes." };
}

/**
 * Calcul des statistiques par closeuse pour le tableau anti-abus Manager / Admin.
 */
export function calculateCloserPerformanceStats(
  orders: Order[],
  followups: Followup[]
): CloserPerformanceStats[] {
  const closersMap = new Map<
    string,
    {
      name: string;
      confirmed: number;
      rescheduled: number;
      rejected: number;
      lost: number;
      total: number;
      delays: number[];
    }
  >();

  // Analyser les commandes
  for (const order of orders) {
    if (!order.assignedCloser) continue;
    const cid = order.assignedCloser.id;
    const current = closersMap.get(cid) || {
      name: order.assignedCloser.name,
      confirmed: 0,
      rescheduled: 0,
      rejected: 0,
      lost: 0,
      total: 0,
      delays: [],
    };

    current.total += 1;
    if (order.status === "confirmed" || order.status === "prepared" || order.status === "delivered") {
      current.confirmed += 1;
    } else if (order.status === "postponed") {
      current.rescheduled += 1;
    } else if (order.status === "rejected" || order.status === "rejected_invalid_number") {
      current.rejected += 1;
    } else if (order.status === "lost_unreachable") {
      current.lost += 1;
    }

    closersMap.set(cid, current);
  }

  // Calculer les délais moyens de traitement des rappels
  for (const f of followups) {
    if (f.status === "completed" && f.completedAt && f.assignedTo) {
      const diffMinutes = Math.max(
        0,
        Math.round((new Date(f.completedAt).getTime() - new Date(f.dueAt).getTime()) / 60000)
      );
      const c = closersMap.get(f.assignedTo.id);
      if (c) {
        c.delays.push(diffMinutes);
      }
    }
  }

  // Moyenne de rejet de l'équipe
  let teamTotalResolved = 0;
  let teamTotalRejected = 0;

  for (const [, c] of closersMap) {
    const resolved = c.confirmed + c.rejected + c.lost;
    teamTotalResolved += resolved;
    teamTotalRejected += c.rejected;
  }

  const teamAvgRejectionRate = teamTotalResolved > 0 ? (teamTotalRejected / teamTotalResolved) * 100 : 0;

  const result: CloserPerformanceStats[] = [];

  for (const [closerId, c] of closersMap) {
    const resolved = c.confirmed + c.rejected + c.lost;
    const rejectionRate = resolved > 0 ? Math.round((c.rejected / resolved) * 100) : 0;

    const avgMinutes =
      c.delays.length > 0
        ? Math.round(c.delays.reduce((a, b) => a + b, 0) / c.delays.length)
        : 12;

    // Alerte si taux de rejet supérieur à 35% ET supérieur de 10 points à la moyenne de l'équipe
    const isHighRejectionAlert = resolved >= 3 && (rejectionRate > 35 || rejectionRate > teamAvgRejectionRate + 15);

    result.push({
      closerId,
      closerName: c.name,
      totalAssigned: c.total,
      confirmedCount: c.confirmed,
      rescheduledCount: c.rescheduled,
      rejectedCount: c.rejected,
      lostCount: c.lost,
      rejectionRate,
      avgProcessingMinutes: avgMinutes,
      isHighRejectionAlert,
    });
  }

  return result;
}

/**
 * Détection des rappels en retard :
 * - > 30 minutes sans action : alerte manager
 * - > 2 heures sans action : éligible à réassignation immédiate
 * - > 48 heures pour les reports : classé expiré
 */
export function checkOverdueFollowups(
  followups: Followup[],
  now: Date = new Date()
): {
  dueNowCount: number;
  managerAlertFollowups: Followup[];
  reassignableFollowups: Followup[];
  expiredFollowups: Followup[];
} {
  const managerAlertFollowups: Followup[] = [];
  const reassignableFollowups: Followup[] = [];
  const expiredFollowups: Followup[] = [];
  let dueNowCount = 0;

  for (const f of followups) {
    if (f.status !== "pending") continue;

    const dueTime = new Date(f.dueAt).getTime();
    const elapsedMinutes = (now.getTime() - dueTime) / 60000;

    if (elapsedMinutes >= 0) {
      dueNowCount += 1;
    }

    if (f.type === "rescheduled" && elapsedMinutes >= 48 * 60) {
      expiredFollowups.push(f);
    } else if (elapsedMinutes >= 120) {
      reassignableFollowups.push(f);
      managerAlertFollowups.push(f);
    } else if (elapsedMinutes >= 30) {
      managerAlertFollowups.push(f);
    }
  }

  return {
    dueNowCount,
    managerAlertFollowups,
    reassignableFollowups,
    expiredFollowups,
  };
}
