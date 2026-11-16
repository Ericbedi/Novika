import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopSlug = searchParams.get("shopSlug") || "lome-glow";

  // Agrégats de visiteurs en direct (simulés réalistes pour la boutique active)
  const isLome = shopSlug === "lome-glow";

  const liveData = {
    shopSlug,
    activeVisitors: isLome ? 14 : 9,
    activeWindowMinutes: 5,
    todayOrdersCount: isLome ? 18 : 11,
    todaySalesAmount: isLome ? 435000 : 275000,
    currency: "XOF",
    pageViewsDistribution: {
      home: 35,
      catalog: 28,
      product: 25,
      checkout: 12,
    },
    newVsReturning: {
      newVisitorsPercent: 68,
      returningPercent: 32,
    },
    countries: [
      { code: "TG", name: "Togo", flag: "🇹🇬", visitors: isLome ? 6 : 2, percent: isLome ? 42 : 22, lat: 6.1375, lng: 1.2123 },
      { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", visitors: isLome ? 4 : 5, percent: isLome ? 28 : 55, lat: 5.36, lng: -4.0083 },
      { code: "SN", name: "Sénégal", flag: "🇸🇳", visitors: 2, percent: 15, lat: 14.6928, lng: -17.4467 },
      { code: "BJ", name: "Bénin", flag: "🇧🇯", visitors: 1, percent: 8, lat: 6.3654, lng: 2.4183 },
      { code: "CM", name: "Cameroun", flag: "🇨🇲", visitors: 1, percent: 7, lat: 4.0511, lng: 9.7679 },
    ],
    otherCountriesCount: 0,
    recentOrderPulses: [
      { id: "ord_pulse_1", country: "Togo", flag: "🇹🇬", amount: 25000, currency: "XOF", time: "Il y a 1 min", lat: 6.1375, lng: 1.2123 },
      { id: "ord_pulse_2", country: "Côte d'Ivoire", flag: "🇨🇮", amount: 38000, currency: "XOF", time: "Il y a 4 min", lat: 5.36, lng: -4.0083 },
      { id: "ord_pulse_3", country: "Sénégal", flag: "🇸🇳", amount: 19500, currency: "XOF", time: "Il y a 7 min", lat: 14.6928, lng: -17.4467 },
    ],
  };

  return NextResponse.json(liveData);
}
