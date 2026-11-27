import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/server/auth/request-auth";
import {
  classifyQuery,
  lookupIp,
  lookupDomain,
  reverseDomains,
  checkNovikaDns,
  RobtexError,
} from "@/server/robtex/client";

export const dynamic = "force-dynamic";

/** Analyse d'un domaine ou d'une adresse IP via Robtex (réservé aux membres connectés). */
export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !["owner", "admin", "manager"].includes(auth.role)) {
    return NextResponse.json({ success: false, error: "Accès refusé." }, { status: 401 });
  }
  const q = classifyQuery(req.nextUrl.searchParams.get("q") || "");
  if (!q) {
    return NextResponse.json({ success: false, error: "Entrez un domaine (exemple.com) ou une adresse IPv4." }, { status: 400 });
  }
  try {
    if (q.kind === "ip") {
      const [info, domains] = await Promise.all([lookupIp(q.value), reverseDomains(q.value).catch(() => [])]);
      return NextResponse.json({ success: true, kind: "ip", query: q.value, ip: info, sharedDomains: domains });
    }
    const dns = await lookupDomain(q.value);
    const firstIp = dns.a[0];
    const [ip, shared] = firstIp
      ? await Promise.all([lookupIp(firstIp).catch(() => null), reverseDomains(firstIp).catch(() => [])])
      : [null, []];
    return NextResponse.json({
      success: true,
      kind: "domain",
      query: q.value,
      dns,
      ip,
      sharedDomains: shared.filter((d) => d !== q.value),
      novika: checkNovikaDns(dns),
    });
  } catch (e) {
    if (e instanceof RobtexError) {
      return NextResponse.json({ success: false, error: e.message, code: e.code }, { status: e.code === "RATE_LIMITED" ? 429 : 502 });
    }
    return NextResponse.json({ success: false, error: "Erreur d'analyse." }, { status: 500 });
  }
}
