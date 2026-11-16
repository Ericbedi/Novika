import { NextRequest, NextResponse } from "next/server";
import { isSlugAvailable } from "@/server/data/store-repository";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") || "";
  const storeId = url.searchParams.get("storeId") || undefined;

  if (!slug) {
    return NextResponse.json({ available: false, error: "Slug manquant" }, { status: 400 });
  }

  const clean = slug.toLowerCase().trim();
  if (!/^[a-z0-9-]{3,40}$/.test(clean)) {
    return NextResponse.json({
      available: false,
      error: "Le format doit contenir 3 à 40 caractères minuscules, chiffres et tirets.",
    });
  }

  const available = isSlugAvailable(clean, storeId);
  return NextResponse.json({
    available,
    slug: clean,
    error: available ? undefined : "Ce lien de boutique est déjà réservé.",
  });
}
