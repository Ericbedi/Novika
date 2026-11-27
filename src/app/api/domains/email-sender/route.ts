import { NextRequest, NextResponse } from "next/server";
import { createSendDomain, getSendDomain, resendConfigured, verifySendDomain } from "@/server/email/resend-domains";
import { authorizeShop } from "@/server/auth/shop-access";

export const dynamic = "force-dynamic";

async function load(a: any, store: string) {
  const [brandRes, domRes] = await Promise.all([
    a.supabase.rpc("shop_brand_public", { p_slug: store }),
    a.supabase.rpc("shop_domains_list_server", { p_secret: a.secret, p_slug: store }),
  ]);
  return { sender: brandRes.data?.brand?.emailSender || null, domains: (domRes.data?.domains || []).map((d: { domain: string }) => d.domain) as string[] };
}

async function saveSender(a: any, store: string, value: unknown) {
  await a.supabase.rpc("shop_set_brand_server", { p_secret: a.secret, p_slug: store, p_brand: { emailSender: value } });
}

export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("storeSlug") || "";
  const a = await authorizeShop(req, store);
  if (!a.ok) return a.res;
  if (!["owner", "admin"].includes(a.role)) return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  const { sender } = await load(a, store);
  return NextResponse.json({ success: true, configured: resendConfigured(), sender: sender ? { domain: sender.domain, address: sender.address, status: sender.status, records: sender.records || [] } : null });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const store = String(body.storeSlug || "");
  const a = await authorizeShop(req, store);
  if (!a.ok) return a.res;
  if (!["owner", "admin"].includes(a.role)) return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  if (!resendConfigured()) return NextResponse.json({ error: "L'envoi d'e-mails n'est pas encore activé sur la plateforme (clé Resend manquante).", code: "NOT_CONFIGURED" }, { status: 503 });

  const { sender, domains } = await load(a, store);

  if (body.action === "setup") {
    const domain = String(body.domain || "").toLowerCase().trim();
    const local = String(body.localPart || "contact").toLowerCase().trim();
    if (!domains.includes(domain)) return NextResponse.json({ error: "Ce domaine n'appartient pas à votre boutique." }, { status: 404 });
    if (!/^[a-z0-9][a-z0-9._-]{0,40}$/.test(local)) return NextResponse.json({ error: "Nom d'adresse invalide (lettres, chiffres, . _ -)." }, { status: 400 });
    const created = await createSendDomain(domain);
    if (!created.ok) return NextResponse.json({ error: created.error }, { status: 502 });
    const value = { domain, address: `${local}@${domain}`, status: "pending", resendId: created.domain.id, records: created.domain.records };
    await saveSender(a, store, value);
    return NextResponse.json({ success: true, sender: { ...value, resendId: undefined } });
  }

  if (body.action === "verify") {
    if (!sender?.resendId) return NextResponse.json({ error: "Configurez d'abord le domaine d'envoi." }, { status: 400 });
    const v = await verifySendDomain(sender.resendId);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 502 });
    const status = v.domain.status === "verified" ? "verified" : v.domain.status === "failed" ? "failed" : "pending";
    const value = { ...sender, status, records: v.domain.records.length ? v.domain.records : sender.records };
    await saveSender(a, store, value);
    return NextResponse.json({ success: true, sender: { domain: value.domain, address: value.address, status, records: value.records } });
  }

  if (body.action === "remove") {
    await saveSender(a, store, null);
    return NextResponse.json({ success: true, sender: null });
  }
  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
