import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getShopCountries,
  updateShopCountryEligibility,
} from "@/server/data/shop-countries";
import { UserRole } from "@/server/data/types";
import { ALL_54_AFRICAN_COUNTRIES } from "@/config/countries";

const UpdateCountrySchema = z.object({
  shopId: z.string().min(1),
  countryCode: z.string().length(2),
  enabled: z.boolean(),
  userRole: z.enum(["owner", "admin", "manager", "closer", "rider", "courier", "agency"]).default("owner"),
  userId: z.string().optional().default("admin_user"),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shopId = url.searchParams.get("shopId") || "lome-lux";

  const records = getShopCountries(shopId);
  const recordMap = new Map(records.map((r) => [r.countryCode, r]));

  // Combine avec les métadonnées complètes des 54 pays
  const result = ALL_54_AFRICAN_COUNTRIES.map((c) => {
    const rec = recordMap.get(c.code);
    return {
      ...c,
      enabled: rec ? rec.enabled : false,
      updatedAt: rec?.updatedAt,
    };
  });

  return NextResponse.json({
    shopId,
    countries: result,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UpdateCountrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { shopId, countryCode, enabled, userRole, userId } = parsed.data;

    const res = updateShopCountryEligibility(
      shopId,
      countryCode,
      enabled,
      userRole as UserRole,
      userId
    );

    if (!res.success) {
      const statusCode = res.error?.includes("Accès refusé") ? 403 : 400;
      return NextResponse.json({ error: res.error }, { status: statusCode });
    }

    return NextResponse.json({
      success: true,
      record: res.record,
      message: `Pays ${countryCode} mis à jour avec succès.`,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
