import { NextRequest, NextResponse } from "next/server";
import { validateDomainFormat, generateDefaultDnsRecords } from "@/lib/custom-domains";
import { addDomainToVercel, removeDomainFromVercel } from "@/lib/vercel-domains-api";
import { authorizeShop } from "@/server/auth/shop-access";

export const dynamic = "force-dynamic";

const ADMINS = ["owner", "admin"];

export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("storeSlug") || "";
  const a = await authorizeShop(req, store);
  if (!a.ok) return a.res;
  if (!ADMINS.includes(a.role)) return NextResponse.json({ error: "Accès réservé aux administrateurs.", code: "FORBIDDEN" }, { status: 403 });
  const { data, error } = await (a.supabase as any).rpc("shop_domains_list_server", { p_secret: a.secret, p_slug: store });
  if (error || !data?.success) return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
  return NextResponse.json({ success: true, domains: data.domains });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const storeSlug = String(body.storeSlug || "");
    const a = await authorizeShop(req, storeSlug);
    if (!a.ok) return a.res;
    if (!ADMINS.includes(a.role)) {
      return NextResponse.json({ error: "Accès refusé. La gestion des noms de domaine est réservée aux administrateurs.", code: "FORBIDDEN" }, { status: 403 });
    }

    const validation = validateDomainFormat(String(body.domain || ""));
    if (!validation.isValid) return NextResponse.json({ error: validation.error, code: "INVALID_DOMAIN" }, { status: 400 });
    const domain = validation.normalized;

    // Rattachement chez Vercel (si le jeton est configuré) ; sinon on fournit les enregistrements DNS standard
    const vercel = await addDomainToVercel(domain);
    if (!vercel.success) return NextResponse.json({ error: vercel.error || "Échec d'enregistrement chez Vercel.", code: "VERCEL_ERROR" }, { status: 502 });
    const records = vercel.dnsRecords.length ? vercel.dnsRecords : generateDefaultDnsRecords(domain);

    const { data, error } = await (a.supabase as any).rpc("shop_domain_add_server", {
      p_secret: a.secret, p_slug: storeSlug, p_domain: domain, p_primary: body.isPrimary === true, p_records: records,
    });
    if (error) return NextResponse.json({ error: "Enregistrement impossible.", code: "INTERNAL_ERROR" }, { status: 500 });
    if (!data?.success) return NextResponse.json({ error: data?.error || "Ajout impossible.", code: data?.code || "ERROR" }, { status: data?.code === "DOMAIN_ALREADY_EXISTS" ? 409 : 422 });
    return NextResponse.json({ success: true, domain: data.domain });
  } catch {
    return NextResponse.json({ error: "Erreur interne du serveur.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const storeSlug = req.nextUrl.searchParams.get("storeSlug") || "";
  const a = await authorizeShop(req, storeSlug);
  if (!a.ok) return a.res;
  if (!ADMINS.includes(a.role)) return NextResponse.json({ error: "Accès réservé aux administrateurs.", code: "FORBIDDEN" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id") || "";
  const name = (req.nextUrl.searchParams.get("domain") || "").toLowerCase();
  const list = await (a.supabase as any).rpc("shop_domains_list_server", { p_secret: a.secret, p_slug: storeSlug });
  const target = (list.data?.domains || []).find((d: any) => d.id === id || d.domain === name);
  if (!target) return NextResponse.json({ error: "Domaine introuvable.", code: "NOT_FOUND" }, { status: 404 });

  await removeDomainFromVercel(target.domain);
  const { data } = await (a.supabase as any).rpc("shop_domain_remove_server", { p_secret: a.secret, p_slug: storeSlug, p_domain: target.domain });
  if (!data?.success) return NextResponse.json({ error: "Suppression impossible.", code: "INTERNAL_ERROR" }, { status: 500 });
  return NextResponse.json({ success: true, removedDomain: target.domain });
}
