import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_WEEKLY_SCALING_HISTORY } from "@/lib/scaling";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeSlug = searchParams.get("store") || "lome-glow";

    const supabase = await createClient();

    // Query weekly snapshots from Supabase
    const { data: dbSnapshots, error } = await supabase
      .from("weekly_scaling_snapshots")
      .select("*")
      .order("week_number", { ascending: true });

    if (!error && dbSnapshots && dbSnapshots.length > 0) {
      const formatted = dbSnapshots.map((s) => ({
        weekKey: s.week_key,
        weekNumber: s.week_number,
        startDate: s.start_date,
        endDate: s.end_date,
        adSpendDollars: Number(s.ad_spend_dollars),
        dollarRate: Number(s.dollar_rate),
        ordersCount: s.orders_count,
        deliveredUnits: s.delivered_units,
        pendingUnits: s.pending_units,
        closingRate: Number(s.closing_rate),
        realCpaDollars: Number(s.real_cpa_dollars),
        cpaTargetDollars: Number(s.cpa_target_dollars),
        cpaBreakevenDollars: Number(s.cpa_breakeven_dollars),
        netProfitFcfa: Number(s.net_profit_fcfa),
        isCurrent: Boolean(s.is_current),
        products: (s.products_summary as any) || [],
      }));

      return NextResponse.json({
        success: true,
        source: "supabase",
        snapshots: formatted,
      });
    }
  } catch (err) {
    console.warn("[Scaling API] Supabase fallback to default mock history:", err);
  }

  return NextResponse.json({
    success: true,
    source: "local",
    snapshots: DEFAULT_WEEKLY_SCALING_HISTORY,
  });
}
