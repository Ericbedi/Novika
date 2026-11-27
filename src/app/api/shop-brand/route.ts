import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Identité publique d'une boutique (couleur, style, accroche, WhatsApp) : lue par la vitrine. */
export async function GET(req: NextRequest) {
  const store = (req.nextUrl.searchParams.get("store") || "").replace(/[^a-z0-9-]/gi, "").slice(0, 60);
  if (!store) return NextResponse.json({ success: true, brand: {} });
  try {
    const supabase = await createClient();
    const { data } = await (supabase as any).rpc("shop_brand_public", { p_slug: store });
    return NextResponse.json(
      { success: true, name: data?.name || null, brand: (({ emailSender: _hidden, ...rest }) => rest)((data?.brand || {}) as Record<string, unknown>) },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
    );
  } catch {
    return NextResponse.json({ success: true, brand: {} });
  }
}
