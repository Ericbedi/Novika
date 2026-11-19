import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canReopenOrder } from "@/lib/followups";
import { logFollowupAudit } from "@/lib/audit-followups";
import { MOCK_ORDERS } from "@/mock-data/orders";
import { UserRole } from "@/server/data/types";

const ReopenSchema = z.object({
  orderId: z.string().min(1, "L'identifiant de la commande est requis"),
  userRole: z.enum(["owner", "admin", "manager", "closer", "rider", "courier", "agency"]),
  userName: z.string().default("Admin"),
  reason: z.string().min(3, "Un motif est obligatoire pour rouvrir une commande."),
  isCorrectedPhoneSubmitted: z.boolean().optional(),
  correctedPhone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ReopenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }

    const { orderId, userRole, userName, reason, isCorrectedPhoneSubmitted, correctedPhone } =
      parsed.data;

    const order = MOCK_ORDERS.find((o) => o.id === orderId) || {
      id: orderId,
      orderNumber: "CMD-REOPEN",
      customerName: "Client",
      customerPhone: "+22500000000",
      country: "CI" as const,
      city: "Abidjan",
      deliveryAddress: "Cocody",
      items: [],
      subtotal: 10000,
      shippingFee: 1000,
      totalAmount: 11000,
      status: "rejected" as const,
      reopenCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const check = canReopenOrder({
      userRole: userRole as UserRole,
      order,
      isCorrectedPhoneSubmitted: Boolean(isCorrectedPhoneSubmitted),
    });

    if (!check.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: check.reason || "Vous n'avez pas l'autorisation de rouvrir cette commande.",
        },
        { status: 403 }
      );
    }

    // Réouverture accordée
    const updatedOrder = {
      ...order,
      status: "pending" as const,
      customerPhone: correctedPhone || order.customerPhone,
      reopenCount: (order.reopenCount || 0) + 1,
      isReopenedByAdmin: userRole !== "closer",
      notes: `${order.notes || ""}\n[Réouverture par ${userName} (${userRole})]: ${reason}`.trim(),
      updatedAt: new Date().toISOString(),
    };

    logFollowupAudit({
      orderId: order.id,
      orderNumber: order.orderNumber,
      action: "reopen",
      performedBy: { id: "user_req", name: userName, role: userRole },
      reason,
      notes: correctedPhone ? `Nouveau numéro: ${correctedPhone}` : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Commande réouverte avec succès.",
      updatedOrder,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
