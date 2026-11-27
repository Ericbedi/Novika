import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHomeConfig } from "@/lib/storefront-home-config";

export const dynamic = "force-dynamic";

/** Personnalisation publique de la page d'accueil (textes, police, couleurs) lue par la vitrine. */
export async function GET(req: NextRequest) {
  const store = (req.nextUrl.searchParams.get("store") || "").replace(/[^a-z0-9-]/gi, "").slice(0, 60);
  if (!store) return NextResponse.json({ success: true, config: {} });
  try {
    const supabase = await createClient();
    const { data } = await (supabase as any).rpc("shop_home_public", { p_slug: store });
    return NextResponse.json(
      { success: true, config: sanitizeHomeConfig(data) },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } }
    );
  } catch {
    return NextResponse.json({ success: true, config: {} });
  }
}
