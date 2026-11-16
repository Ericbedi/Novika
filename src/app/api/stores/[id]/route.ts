import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getStoreById,
  updateStore,
  deleteStore,
} from "@/server/data/store-repository";
import { UserRole } from "@/server/data/types";

const UpdateStoreSchema = z.object({
  userRole: z.enum(["owner", "admin", "manager", "closer", "rider", "courier", "agency"]),
  userId: z.string().min(1),
  clientVersion: z.number().optional(),
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(250).optional(),
  slug: z.string().min(3).max(40).regex(/^[a-z0-9-]+$/).optional(),
  whatsappNumber: z.string().min(8).max(20).optional(),
  contactEmail: z.string().email().optional(),
  logo: z.string().optional(),
  country: z.string().length(2).optional(),
  status: z.enum(["active", "archived"]).optional(),
});

const DeleteStoreSchema = z.object({
  userRole: z.enum(["owner", "admin", "manager", "closer", "rider", "courier", "agency"]),
  confirmName: z.string().min(1),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getStoreById(id);

  if (!store) {
    return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
  }

  return NextResponse.json({ store });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateStoreSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données de modification invalides", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { userRole, userId, clientVersion, ...updates } = parsed.data;

    const result = updateStore({
      storeId: id,
      userRole: userRole as UserRole,
      userId,
      clientVersion,
      updates,
    });

    if (!result.success) {
      const isForbidden = result.error?.includes("Accès refusé");
      const isConflict = result.error?.includes("modifiée par quelqu'un d'autre");
      const statusCode = isForbidden ? 403 : isConflict ? 409 : 400;

      return NextResponse.json({ error: result.error }, { status: statusCode });
    }

    return NextResponse.json({
      success: true,
      store: result.store,
      redirectCreated: result.redirectCreated,
      message: "Boutique mise à jour avec succès",
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = DeleteStoreSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres de confirmation invalides" },
        { status: 400 }
      );
    }

    const { userRole, confirmName } = parsed.data;

    const result = deleteStore({
      storeId: id,
      userRole: userRole as UserRole,
      confirmName,
    });

    if (!result.success) {
      const isForbidden = result.error?.includes("Accès refusé");
      const statusCode = isForbidden ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status: statusCode });
    }

    return NextResponse.json({
      success: true,
      message: "Suppression traitée avec succès",
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
