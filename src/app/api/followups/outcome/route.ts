import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processOrderCallOutcome, DEFAULT_WORKING_HOURS } from "@/lib/followups";
import { logFollowupAudit } from "@/lib/audit-followups";
import { MOCK_ORDERS } from "@/mock-data/orders";
import { Followup } from "@/server/data/followups-types";
import { Order } from "@/server/data/types";

// In-memory runtime state for followups across tests and requests
let globalFollowups: Followup[] = [];

const OutcomeSchema = z.object({
  orderId: z.string().min(1, "L'identifiant de la commande est requis"),
  outcome: z.enum([
    "confirmed",
    "rescheduled",
    "unreachable",
    "rejected",
    "rejected_invalid_number",
  ]),
  closer: z.object({
    id: z.string().default("cls_01"),
    name: z.string().default("Aïcha Diallo"),
    role: z.string().default("closer"),
  }),
  postponeDate: z.string().optional(),
  postponeReason: z.enum(["salary", "travel", "indisposed", "other"]).optional(),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = OutcomeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }

    const { orderId, outcome, closer, postponeDate, postponeReason, rejectionReason, notes } =
      parsed.data;

    // Validation conditionnelle stricte
    if (outcome === "rejected" && (!rejectionReason || rejectionReason.trim().length === 0)) {
      return NextResponse.json(
        { success: false, error: "Le motif de rejet est obligatoire." },
        { status: 400 }
      );
    }

    if (outcome === "rescheduled") {
      if (!postponeReason) {
        return NextResponse.json(
          { success: false, error: "Le motif du report est obligatoire." },
          { status: 400 }
        );
      }
      if (!postponeDate) {
        return NextResponse.json(
          { success: false, error: "La date de report est obligatoire." },
          { status: 400 }
        );
      }
    }

    // Trouver ou créer la commande cible
    let targetOrder = MOCK_ORDERS.find((o) => o.id === orderId);
    if (!targetOrder) {
      targetOrder = {
        id: orderId,
        orderNumber: `CMD-${orderId.substring(0, 6).toUpperCase()}`,
        customerName: "Client Exemple",
        customerPhone: "+2250700000000",
        country: "CI",
        city: "Abidjan",
        deliveryAddress: "Cocody",
        items: [
          {
            id: "it_1",
            productId: "prod_01",
            productName: "Produit AfriBuilder",
            quantity: 1,
            unitPrice: 15000,
            totalPrice: 15000,
          },
        ],
        subtotal: 15000,
        shippingFee: 1500,
        totalAmount: 16500,
        status: "pending",
        assignedCloser: { id: closer.id, name: closer.name },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const result = processOrderCallOutcome({
      order: targetOrder,
      outcome,
      existingFollowups: globalFollowups,
      closer: { id: closer.id, name: closer.name },
      postponeDate: postponeDate ? new Date(postponeDate) : undefined,
      postponeReason,
      rejectionReason,
      notes,
      workingHours: DEFAULT_WORKING_HOURS,
      now: new Date(),
    });

    // Mettre à jour l'état mémoire des relances
    globalFollowups = globalFollowups.map((f) =>
      result.cancelledFollowupIds.includes(f.id) ? { ...f, status: "cancelled" } : f
    );

    if (result.createdFollowup) {
      globalFollowups.unshift(result.createdFollowup);
    }

    // Enregistrer le journal d'audit
    logFollowupAudit({
      orderId: targetOrder.id,
      orderNumber: targetOrder.orderNumber,
      action: outcome === "rejected" || outcome === "rejected_invalid_number" ? "reject" : outcome === "rescheduled" ? "reschedule" : "call_outcome",
      outcome,
      performedBy: closer,
      reason: rejectionReason || postponeReason,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      updatedOrder: result.updatedOrder,
      createdFollowup: result.createdFollowup,
      cancelledFollowupIds: result.cancelledFollowupIds,
      stockRestored: result.stockRestored,
      isClosed: result.isClosed,
      activeFollowupsCount: globalFollowups.filter((f) => f.status === "pending").length,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}

export function getMemoryFollowups() {
  return globalFollowups;
}

export function setMemoryFollowups(newList: Followup[]) {
  globalFollowups = newList;
}
