import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateOrderStatusWithAudit } from "@/server/data/tracking-store";
import { ALL_TRACKING_STATUSES, TrackingStatus } from "@/server/data/tracking-types";
import { UserRole } from "@/server/data/types";

const UpdateOrderStatusSchema = z.object({
  tokenOrId: z.string().min(1, "Identifiant ou jeton requis"),
  targetStatus: z.enum(ALL_TRACKING_STATUSES as unknown as [string, ...string[]]),
  userRole: z.enum(["owner", "admin", "manager", "closer", "rider", "courier", "agency"]),
  userId: z.string().min(1, "Identifiant utilisateur requis"),
  userName: z.string().min(1, "Nom d'utilisateur requis"),
  proofCodeEntered: z.string().optional(),
  reason: z.string().max(300).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UpdateOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      tokenOrId,
      targetStatus,
      userRole,
      userId,
      userName,
      proofCodeEntered,
      reason,
    } = parsed.data;

    const result = updateOrderStatusWithAudit({
      tokenOrId,
      targetStatus: targetStatus as TrackingStatus,
      userRole: userRole as UserRole,
      userId,
      userName,
      proofCodeEntered,
      reason,
    });

    if (!result.success) {
      const isForbidden = result.error?.includes("Action non autorisée");
      const isNotFound = result.error?.includes("introuvable");
      const statusCode = isForbidden ? 403 : isNotFound ? 404 : 400;

      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      auditEntry: result.auditEntry,
      message: `Statut mis à jour vers "${targetStatus}"`,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
