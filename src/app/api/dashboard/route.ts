import { NextRequest, NextResponse } from "next/server";
import { authorizeShop } from "@/server/auth/shop-access";

export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86400000;

/** Chiffres du tableau de bord sur la période + la période précédente (pour les variations). */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const store = sp.get("store") || "";
  const a = await authorizeShop(req, store);
  if (!a.ok) return a.res;
  if (!["owner", "admin", "manager"].includes(a.role)) return NextResponse.json({ success: false, error: "Accès réservé à la direction." }, { status: 403 });
  const from = sp.get("from") || "";
  const to = sp.get("to") || "";
  if (!DATE.test(from) || !DATE.test(to) || from > to) return NextResponse.json({ success: false, error: "Période invalide." }, { status: 400 });
  const span = Math.round((Date.parse(to) - Date.parse(from)) / DAY) + 1;
  if (span > 366) return NextResponse.json({ success: false, error: "Période trop longue." }, { status: 400 });
  const prevTo = new Date(Date.parse(from) - DAY).toISOString().slice(0, 10);
  const prevFrom = new Date(Date.parse(from) - span * DAY).toISOString().slice(0, 10);
  const db = a.supabase as any;
  const [curV, prevV] = await Promise.all([
    db.rpc("visitor_stats_server", { p_secret: a.secret, p_slug: store, p_from: from, p_to: to }),
    db.rpc("visitor_stats_server", { p_secret: a.secret, p_slug: store, p_from: prevFrom, p_to: prevTo }),
  ]);
  const [cur, prev] = await Promise.all([
    db.rpc("dashboard_stats_server", { p_secret: a.secret, p_slug: store, p_from: from, p_to: to }),
    db.rpc("dashboard_stats_server", { p_secret: a.secret, p_slug: store, p_from: prevFrom, p_to: prevTo }),
  ]);
  if (cur.error || !cur.data?.success) return NextResponse.json({ success: false, error: "Lecture impossible." }, { status: 500 });
  const withVisitors = (stats: any, v: any) => {
    if (!stats?.success) return stats;
    const per = (v?.success ? v.days : {}) || {};
    return { ...stats, days: (stats.days || []).map((d: any) => ({ ...d, visitors: Number(per[d.date]) || 0 })), visitors_total: Number(v?.total) || 0,
      funnel: v?.success ? { visitors: Number(v.total) || 0, catalog: Number(v.reached_catalog) || 0, product: Number(v.reached_product) || 0, checkout: Number(v.reached_checkout) || 0 } : null };
  };
  return NextResponse.json({ success: true, current: withVisitors(cur.data, curV.data), previous: prev.data?.success ? withVisitors(prev.data, prevV.data) : null });
}
