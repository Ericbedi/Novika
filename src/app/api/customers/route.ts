import { NextRequest, NextResponse } from "next/server";
import { authorizeShop } from "@/server/auth/shop-access";
import type { Customer } from "@/server/data/types";

export const dynamic = "force-dynamic";

/** Clients réels de la boutique, avec statut calculé (VIP, régulier, nouveau, à risque). */
export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("store") || "";
  const a = await authorizeShop(req, store);
  if (!a.ok) return a.res;
  if (!["owner", "admin", "manager", "closer"].includes(a.role)) return NextResponse.json({ success: false, error: "Accès refusé." }, { status: 403 });
  const { data, error } = await (a.supabase as any).rpc("customers_list_server", { p_secret: a.secret, p_slug: store });
  if (error || !data?.success) return NextResponse.json({ success: false, error: "Lecture impossible." }, { status: 500 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customers = (data.customers as any[]).map((c) => {
    const delivered = Number(c.delivered_count) || 0;
    const failed = Number(c.failed_count) || 0;
    const orders = Number(c.orders_count) || 0;
    const status = failed >= 2 && failed > delivered ? "risk" : delivered >= 3 ? "vip" : orders >= 2 ? "regular" : "new";
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      country: c.country || "TG",
      city: c.city || "",
      address: c.address || "",
      ordersCount: orders,
      deliveredCount: delivered,
      failedCount: failed,
      totalSpent: Number(c.total_spent) || 0,
      lastOrderDate: c.last_order || c.created_at,
      status,
    };
  });
  return NextResponse.json({ success: true, customers: customers as unknown as Customer[] });
}
