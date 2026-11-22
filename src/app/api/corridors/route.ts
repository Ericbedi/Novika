import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Corridors réels de la boutique : pays de la boutique + activité du jour par pays.
// Aucune valeur simulée. Si la table des commandes n'existe pas encore, les compteurs restent à 0.
export async function GET(req: NextRequest) {
  const store = new URL(req.url).searchParams.get("store") || "";
  const empty = { corridors: [] as { code: string; ordersToday: number; deliveredToday: number }[] };
  if (!store) return NextResponse.json(empty);

  try {
    const supabase = await createClient();
    const { data: shop } = await supabase
      .from("shops")
      .select("id,country_code")
      .eq("slug", store)
      .maybeSingle();
    if (!shop) return NextResponse.json(empty);

    const byCountry = new Map<string, { code: string; ordersToday: number; deliveredToday: number }>();
    const ensure = (code: string) => {
      const c = (code || "").toUpperCase();
      if (!byCountry.has(c)) byCountry.set(c, { code: c, ordersToday: 0, deliveredToday: 0 });
      return byCountry.get(c)!;
    };
    if (shop.country_code) ensure(shop.country_code);

    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // La table « orders » n'existe pas encore dans les types générés : requête non typée
    const { data: orders, error } = await (supabase as any)
      .from("orders")
      .select("country_code,status,created_at,delivered_at")
      .eq("store_id", shop.id)
      .gte("created_at", start.toISOString());
    if (!error && orders) {
      for (const o of orders as { country_code: string | null; status: string; delivered_at: string | null }[]) {
        if (!o.country_code) continue;
        const c = ensure(o.country_code);
        c.ordersToday += 1;
        if (o.status === "delivered") c.deliveredToday += 1;
      }
    }
    return NextResponse.json({ corridors: Array.from(byCountry.values()) });
  } catch {
    return NextResponse.json(empty);
  }
}
