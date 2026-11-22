import { NextRequest, NextResponse } from "next/server";

// Aucune donnée simulée : tant que le suivi réel des visiteurs et des commandes
// n'est pas branché sur la base de données, tout est à zéro.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopSlug = searchParams.get("shopSlug") || "";

  return NextResponse.json({
    shopSlug,
    activeVisitors: 0,
    activeWindowMinutes: 5,
    todayOrdersCount: 0,
    todaySalesAmount: 0,
    currency: "XOF",
    pageViewsDistribution: { home: 0, catalog: 0, product: 0, checkout: 0 },
    newVsReturning: { newVisitorsPercent: 0, returningPercent: 0 },
    countries: [],
    otherCountriesCount: 0,
    recentOrderPulses: [],
  });
}
