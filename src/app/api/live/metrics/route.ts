import { NextRequest, NextResponse } from "next/server";
import { authorizeShop } from "@/server/auth/shop-access";

export const dynamic = "force-dynamic";

// Capitales approximatives pour placer les visiteurs sur le globe
const GEO: Record<string, [string, number, number]> = {
  TG: ["Togo", 6.13, 1.22], BJ: ["Bénin", 6.37, 2.39], CI: ["Côte d'Ivoire", 5.36, -4.01], SN: ["Sénégal", 14.69, -17.45],
  GH: ["Ghana", 5.6, -0.19], NG: ["Nigeria", 9.08, 7.4], BF: ["Burkina Faso", 12.37, -1.52], ML: ["Mali", 12.64, -8.0],
  NE: ["Niger", 13.51, 2.11], CM: ["Cameroun", 3.87, 11.52], GA: ["Gabon", 0.42, 9.47], CG: ["Congo", -4.27, 15.28],
  CD: ["RD Congo", -4.32, 15.31], GN: ["Guinée", 9.64, -13.58], MA: ["Maroc", 34.02, -6.84], DZ: ["Algérie", 36.75, 3.06],
  TN: ["Tunisie", 36.8, 10.18], FR: ["France", 48.86, 2.35], BE: ["Belgique", 50.85, 4.35], US: ["États-Unis", 38.9, -77.04],
  CA: ["Canada", 45.42, -75.7], GB: ["Royaume-Uni", 51.5, -0.12], DE: ["Allemagne", 52.52, 13.4], ES: ["Espagne", 40.42, -3.7],
  IT: ["Italie", 41.9, 12.5], CH: ["Suisse", 46.95, 7.45], MG: ["Madagascar", -18.88, 47.5], TD: ["Tchad", 12.13, 15.05],
};
const flag = (cc: string) => cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))) : "🌍";

export async function GET(req: NextRequest) {
  const shopSlug = req.nextUrl.searchParams.get("shopSlug") || "";
  const a = await authorizeShop(req, shopSlug);
  if (!a.ok) return a.res;
  if (!["owner", "admin", "manager"].includes(a.role)) return NextResponse.json({ error: "Accès réservé à la direction." }, { status: 403 });

  const { data } = await (a.supabase as any).rpc("live_metrics_server", { p_secret: a.secret, p_slug: shopSlug });
  const m = data?.success ? data : null;
  const active = Number(m?.active) || 0;
  const pages = (m?.pages || {}) as Record<string, number>;
  const pv = (k: string) => (active > 0 ? Math.round(((Number(pages[k]) || 0) / active) * 100) : 0);
  const byCountry = (m?.countries || {}) as Record<string, number>;
  const totalC = Object.values(byCountry).reduce((s, n) => s + Number(n), 0);
  const known = Object.entries(byCountry).filter(([c]) => GEO[c]).sort((x, y) => Number(y[1]) - Number(x[1]));
  const countries = known.slice(0, 12).map(([c, n]) => ({
    code: c, name: GEO[c][0], flag: flag(c), visitors: Number(n), percent: totalC ? Math.round((Number(n) / totalC) * 100) : 0, lat: GEO[c][1], lng: GEO[c][2],
  }));
  const home = (m?.recent_orders || []) as { id: string; amount: number; currency: string; city: string; at: string }[];

  return NextResponse.json({
    shopSlug,
    activeVisitors: active,
    activeVisitors10: Number(m?.active10) || 0,
    activeVisitors15: Number(m?.active15) || 0,
    activeWindowMinutes: 5,
    todayOrdersCount: Number(m?.today_orders) || 0,
    todaySalesAmount: Number(m?.today_sales) || 0,
    currency: "XOF",
    pageViewsDistribution: { home: pv("home"), catalog: pv("catalog"), product: pv("product"), checkout: pv("checkout") },
    // Sans cookie, un visiteur de retour ne peut pas être reconnu : on n'invente pas ce chiffre
    newVsReturning: { newVisitorsPercent: 0, returningPercent: 0 },
    countries,
    otherCountriesCount: Math.max(0, Object.keys(byCountry).length - countries.length),
    recentOrderPulses: home.map((o) => ({
      id: o.id, country: o.city || "—", flag: "🛒", amount: Number(o.amount) || 0, currency: o.currency || "XOF",
      time: o.at, lat: 6.13, lng: 1.22,
    })),
  });
}
