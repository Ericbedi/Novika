import { describe, it, expect } from "vitest";
import {
  isWithinWorkingHours,
  adjustToNextWorkingSlot,
  addWorkingHours,
  calculateNextCadenceAttempt,
  validateRescheduleRequest,
  processOrderCallOutcome,
  canReopenOrder,
  calculateCloserPerformanceStats,
  checkOverdueFollowups,
  DEFAULT_WORKING_HOURS,
} from "./followups";
import { Order } from "@/server/data/types";
import { Followup } from "@/server/data/followups-types";

describe("Prompt 05-RL : Relances automatiques & Clôture des commandes rejetées", () => {
  const baseCloser = { id: "cls_01", name: "Aïcha Diallo" };

  const dummyOrder: Order = {
    id: "ord_1001",
    orderNumber: "CMD-1001",
    customerName: "Mariam Sanogo",
    customerPhone: "+2250700000001",
    country: "CI",
    city: "Abidjan (Cocody)",
    deliveryAddress: "Villa 12",
    items: [
      {
        id: "item_1",
        productId: "prod_01",
        productName: "Café Champignon Vitality",
        quantity: 2,
        unitPrice: 15000,
        totalPrice: 30000,
      },
    ],
    subtotal: 30000,
    shippingFee: 1500,
    totalAmount: 31500,
    status: "pending",
    assignedCloser: baseCloser,
    createdAt: "2026-11-19T08:00:00Z",
    updatedAt: "2026-11-19T08:00:00Z",
  };

  describe("Horaires d'équipe et Fuseaux (07:00-18:00, Lundi-Samedi)", () => {
    it("détecte correctement les heures ouvrables", () => {
      // Mercredi à 10:30 -> valide
      const wednesdayWorkHour = new Date("2026-11-18T10:30:00");
      expect(isWithinWorkingHours(wednesdayWorkHour)).toBe(true);

      // Mercredi à 19:30 -> invalide (hors horaires)
      const wednesdayEvening = new Date("2026-11-18T19:30:00");
      expect(isWithinWorkingHours(wednesdayEvening)).toBe(false);

      // Dimanche à 14:00 -> invalide par défaut
      const sundayAfternoon = new Date("2026-11-15T14:00:00");
      expect(isWithinWorkingHours(sundayAfternoon)).toBe(false);

      // Dimanche avec option activée par l'admin
      expect(isWithinWorkingHours(sundayAfternoon, { ...DEFAULT_WORKING_HOURS, allowSunday: true })).toBe(true);
    });

    it("recale une heure hors service à la prochaine ouverture ouvrable (startHour)", () => {
      // Mercredi soir à 20:00 -> recale au jeudi matin à 07:00
      const wednesdayNight = new Date("2026-11-18T20:00:00");
      const adjusted = adjustToNextWorkingSlot(wednesdayNight);
      expect(adjusted.getDay()).toBe(4); // Jeudi
      expect(adjusted.getHours()).toBe(7);
      expect(adjusted.getMinutes()).toBe(0);

      // Samedi soir à 19:00 -> recale au Lundi matin à 07:00 (saute le dimanche)
      const saturdayNight = new Date("2026-11-21T19:00:00");
      const adjustedWeekend = adjustToNextWorkingSlot(saturdayNight);
      expect(adjustedWeekend.getDay()).toBe(1); // Lundi
      expect(adjustedWeekend.getHours()).toBe(7);
    });

    it("ajoute des heures ouvrables avec débordement sur le lendemain", () => {
      // Mercredi à 17:00 + 2h -> 1h restante avant 18:00, donc 1h le jeudi matin -> Jeudi 08:00
      const wednesdayLate = new Date("2026-11-18T17:00:00");
      const nextSlot = addWorkingHours(wednesdayLate, 2);
      expect(nextSlot.getDay()).toBe(4); // Jeudi
      expect(nextSlot.getHours()).toBe(8);
      expect(nextSlot.getMinutes()).toBe(0);
    });
  });

  describe("Cadence pour les « Injoignables »", () => {
    it("gère rigoureusement la cadence de l'essai 1 à l'essai 4", () => {
      const start = new Date("2026-11-18T09:00:00"); // Mercredi 09:00

      // Essai 1 -> Essai 2 (+2h ouvrables)
      const step2 = calculateNextCadenceAttempt(1, start);
      expect(step2.attemptNo).toBe(2);
      expect(step2.isFinalLoss).toBe(false);
      expect(new Date(step2.dueAt).getHours()).toBe(11);

      // Essai 2 -> Essai 3 (lendemain matin)
      const step3 = calculateNextCadenceAttempt(2, start);
      expect(step3.attemptNo).toBe(3);
      expect(step3.isFinalLoss).toBe(false);
      const d3 = new Date(step3.dueAt);
      expect(d3.getDate()).toBe(start.getDate() + 1);
      expect(d3.getHours()).toBe(8);

      // Essai 3 -> Essai 4 (surlendemain matin avec relance WhatsApp conseillée)
      const step4 = calculateNextCadenceAttempt(3, start);
      expect(step4.attemptNo).toBe(4);
      expect(step4.suggestWhatsApp).toBe(true);
      expect(step4.isFinalLoss).toBe(false);
      const d4 = new Date(step4.dueAt);
      expect(d4.getDate()).toBe(start.getDate() + 2);

      // Après l'essai 4 sans réponse -> clôture automatique en perte définitive
      const finalLoss = calculateNextCadenceAttempt(4, start);
      expect(finalLoss.isFinalLoss).toBe(true);
    });
  });

  describe("Validation des « Reportées » (Limite de 3 reports & 30 jours max)", () => {
    const now = new Date("2026-11-18T10:00:00");

    it("refuse un report sans motif", () => {
      const res = validateRescheduleRequest({
        scheduledDate: new Date("2026-11-20T10:00:00"),
        postponeReason: "",
        now,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("motif");
    });

    it("refuse un report dans le passé", () => {
      const res = validateRescheduleRequest({
        scheduledDate: new Date("2026-11-17T10:00:00"),
        postponeReason: "salary",
        now,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("futur");
    });

    it("refuse un report au-delà de 30 jours", () => {
      const res = validateRescheduleRequest({
        scheduledDate: new Date("2026-12-25T10:00:00"),
        postponeReason: "salary",
        now,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("30 jours");
    });

    it("refuse un 4e report quand le quota de 3 est atteint", () => {
      const res = validateRescheduleRequest({
        scheduledDate: new Date("2026-11-22T10:00:00"),
        currentRescheduleCount: 3,
        postponeReason: "travel",
        now,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Limite de 3 reports");
    });

    it("accepte un report valide", () => {
      const res = validateRescheduleRequest({
        scheduledDate: new Date("2026-11-22T10:00:00"),
        currentRescheduleCount: 1,
        postponeReason: "salary",
        now,
      });
      expect(res.valid).toBe(true);
    });
  });

  describe("Traitement des issues d'appels & Clôture automatique (processOrderCallOutcome)", () => {
    const now = new Date("2026-11-18T10:00:00");

    it("Confirmée : fait avancer la commande et annule les rappels en attente", () => {
      const existingFollowup: Followup = {
        id: "fol_active_1",
        orderId: dummyOrder.id,
        orderNumber: dummyOrder.orderNumber,
        shopId: "shop_01",
        customerName: dummyOrder.customerName,
        customerPhone: dummyOrder.customerPhone,
        productName: "Produit",
        totalAmount: 31500,
        city: "Abidjan",
        assignedTo: baseCloser,
        type: "unreachable",
        dueAt: "2026-11-18T12:00:00Z",
        attemptNo: 1,
        status: "pending",
        createdAt: "2026-11-18T10:00:00Z",
      };

      const result = processOrderCallOutcome({
        order: dummyOrder,
        outcome: "confirmed",
        existingFollowups: [existingFollowup],
        closer: baseCloser,
        now,
      });

      expect(result.updatedOrder.status).toBe("confirmed");
      expect(result.cancelledFollowupIds).toContain("fol_active_1");
      expect(result.stockRestored).toBe(false);
      expect(result.isClosed).toBe(false);
    });

    it("Reportée : crée le nouveau rappel et annule les anciens (idempotence)", () => {
      const existingFollowup: Followup = {
        id: "fol_prev",
        orderId: dummyOrder.id,
        orderNumber: dummyOrder.orderNumber,
        shopId: "shop_01",
        customerName: dummyOrder.customerName,
        customerPhone: dummyOrder.customerPhone,
        productName: "Produit",
        totalAmount: 31500,
        city: "Abidjan",
        assignedTo: baseCloser,
        type: "unreachable",
        dueAt: "2026-11-18T12:00:00Z",
        attemptNo: 1,
        status: "pending",
        createdAt: "2026-11-18T10:00:00Z",
      };

      const postponeDate = new Date("2026-11-20T14:30:00");
      const result = processOrderCallOutcome({
        order: dummyOrder,
        outcome: "rescheduled",
        existingFollowups: [existingFollowup],
        closer: baseCloser,
        postponeDate,
        postponeReason: "salary",
        notes: "Attend son virement le 20",
        now,
      });

      expect(result.updatedOrder.status).toBe("postponed");
      expect(result.updatedOrder.rescheduleCount).toBe(1);
      expect(result.createdFollowup).toBeDefined();
      expect(result.createdFollowup?.type).toBe("rescheduled");
      expect(result.createdFollowup?.postponeReason).toBe("salary");
      expect(result.cancelledFollowupIds).toContain("fol_prev");
    });

    it("Rejetée : annule tous les rappels, remet le stock en place et clôture la commande", () => {
      const activeFollowup: Followup = {
        id: "fol_to_cancel",
        orderId: dummyOrder.id,
        orderNumber: dummyOrder.orderNumber,
        shopId: "shop_01",
        customerName: dummyOrder.customerName,
        customerPhone: dummyOrder.customerPhone,
        productName: "Produit",
        totalAmount: 31500,
        city: "Abidjan",
        assignedTo: baseCloser,
        type: "rescheduled",
        dueAt: "2026-11-19T10:00:00Z",
        attemptNo: 1,
        status: "pending",
        createdAt: "2026-11-18T10:00:00Z",
      };

      const result = processOrderCallOutcome({
        order: dummyOrder,
        outcome: "rejected",
        existingFollowups: [activeFollowup],
        closer: baseCloser,
        rejectionReason: "Je n'ai jamais commandé ce produit",
        now,
      });

      expect(result.updatedOrder.status).toBe("rejected");
      expect(result.updatedOrder.rejectionReason).toBe("Je n'ai jamais commandé ce produit");
      expect(result.cancelledFollowupIds).toContain("fol_to_cancel");
      expect(result.stockRestored).toBe(true); // Stock remis
      expect(result.isClosed).toBe(true);
    });

    it("Injoignable après le 4e essai : passe automatiquement en 'Perdue – injoignable' et remet le stock", () => {
      const orderAtAttempt4: Order = {
        ...dummyOrder,
        followupCount: 4,
      };

      const result = processOrderCallOutcome({
        order: orderAtAttempt4,
        outcome: "unreachable",
        closer: baseCloser,
        now,
      });

      expect(result.updatedOrder.status).toBe("lost_unreachable");
      expect(result.stockRestored).toBe(true);
      expect(result.isClosed).toBe(true);
    });
  });

  describe("Droits de réouverture (canReopenOrder)", () => {
    const rejectedOrder: Order = {
      ...dummyOrder,
      status: "rejected",
      rejectionReason: "Refus client",
    };

    const invalidNumberOrder: Order = {
      ...dummyOrder,
      status: "rejected_invalid_number",
      rejectionReason: "Numéro non attribué",
      reopenCount: 0,
    };

    it("interdit formellement à la closeuse de rouvrir un rejet client", () => {
      const check = canReopenOrder({ userRole: "closer", order: rejectedOrder });
      expect(check.allowed).toBe(false);
    });

    it("autorise la closeuse à rouvrir un numéro invalide UNIQUEMENT si le client a fourni son numéro corrigé", () => {
      // Sans correction fournie
      const checkWithout = canReopenOrder({
        userRole: "closer",
        order: invalidNumberOrder,
        isCorrectedPhoneSubmitted: false,
      });
      expect(checkWithout.allowed).toBe(false);

      // Avec correction fournie via suivi
      const checkWith = canReopenOrder({
        userRole: "closer",
        order: invalidNumberOrder,
        isCorrectedPhoneSubmitted: true,
      });
      expect(checkWith.allowed).toBe(true);

      // Déjà rouverte une fois -> interdit à la closeuse
      const checkAlreadyReopened = canReopenOrder({
        userRole: "closer",
        order: { ...invalidNumberOrder, reopenCount: 1 },
        isCorrectedPhoneSubmitted: true,
      });
      expect(checkAlreadyReopened.allowed).toBe(false);
    });

    it("autorise l'Admin et le Manager à rouvrir", () => {
      expect(canReopenOrder({ userRole: "admin", order: rejectedOrder }).allowed).toBe(true);
      expect(canReopenOrder({ userRole: "owner", order: rejectedOrder }).allowed).toBe(true);
    });
  });

  describe("Contrôle anti-abus & Détection des retards (stats & overdue)", () => {
    it("détecte les rappels en retard (>30min alerte, >2h réassignable, >48h expiré)", () => {
      const now = new Date("2026-11-18T14:00:00Z");

      const followups: Followup[] = [
        {
          id: "f1",
          orderId: "o1",
          orderNumber: "CMD-1",
          shopId: "s1",
          customerName: "Client 1",
          customerPhone: "+22501",
          productName: "P1",
          totalAmount: 10000,
          city: "Abidjan",
          assignedTo: baseCloser,
          type: "unreachable",
          dueAt: "2026-11-18T13:15:00Z", // 45 min en retard -> alerte manager
          attemptNo: 2,
          status: "pending",
          createdAt: "2026-11-18T11:15:00Z",
        },
        {
          id: "f2",
          orderId: "o2",
          orderNumber: "CMD-2",
          shopId: "s1",
          customerName: "Client 2",
          customerPhone: "+22502",
          productName: "P2",
          totalAmount: 15000,
          city: "Abidjan",
          assignedTo: baseCloser,
          type: "rescheduled",
          dueAt: "2026-11-18T11:00:00Z", // 3h en retard -> réassignable + alerte
          attemptNo: 1,
          status: "pending",
          createdAt: "2026-11-17T11:00:00Z",
        },
        {
          id: "f3",
          orderId: "o3",
          orderNumber: "CMD-3",
          shopId: "s1",
          customerName: "Client 3",
          customerPhone: "+22503",
          productName: "P3",
          totalAmount: 20000,
          city: "Abidjan",
          assignedTo: baseCloser,
          type: "rescheduled",
          dueAt: "2026-11-15T10:00:00Z", // > 48h en retard -> expiré
          attemptNo: 1,
          status: "pending",
          createdAt: "2026-11-14T10:00:00Z",
        },
      ];

      const report = checkOverdueFollowups(followups, now);
      expect(report.dueNowCount).toBe(3);
      expect(report.managerAlertFollowups.map((f) => f.id)).toContain("f1");
      expect(report.managerAlertFollowups.map((f) => f.id)).toContain("f2");
      expect(report.reassignableFollowups.map((f) => f.id)).toContain("f2");
      expect(report.expiredFollowups.map((f) => f.id)).toContain("f3");
    });

    it("calcule les statistiques de closing et signale un taux de rejet anormal", () => {
      const orders: Order[] = [
        { ...dummyOrder, id: "1", status: "confirmed", assignedCloser: { id: "c1", name: "Closer Normal" } },
        { ...dummyOrder, id: "2", status: "confirmed", assignedCloser: { id: "c1", name: "Closer Normal" } },
        { ...dummyOrder, id: "3", status: "confirmed", assignedCloser: { id: "c1", name: "Closer Normal" } },
        { ...dummyOrder, id: "4", status: "rejected", assignedCloser: { id: "c1", name: "Closer Normal" } },
        // Closer avec rejets anormaux
        { ...dummyOrder, id: "5", status: "rejected", assignedCloser: { id: "c2", name: "Closer Suspect" } },
        { ...dummyOrder, id: "6", status: "rejected", assignedCloser: { id: "c2", name: "Closer Suspect" } },
        { ...dummyOrder, id: "7", status: "rejected", assignedCloser: { id: "c2", name: "Closer Suspect" } },
        { ...dummyOrder, id: "8", status: "confirmed", assignedCloser: { id: "c2", name: "Closer Suspect" } },
      ];

      const stats = calculateCloserPerformanceStats(orders, []);
      const suspect = stats.find((s) => s.closerId === "c2");
      const normal = stats.find((s) => s.closerId === "c1");

      expect(normal?.rejectionRate).toBe(25);
      expect(normal?.isHighRejectionAlert).toBe(false);

      expect(suspect?.rejectionRate).toBe(75);
      expect(suspect?.isHighRejectionAlert).toBe(true); // Signalé
    });
  });
});
