import { NextRequest, NextResponse } from "next/server";
import {
  getStoreDomains,
  saveStoreDomains,
  validateDomainFormat,
  isDomainTakenAcrossPlatform,
  CustomDomain,
} from "@/lib/custom-domains";
import { addDomainToVercel, removeDomainFromVercel } from "@/lib/vercel-domains-api";
import { canManageSettings } from "@/config/permissions";
import { UserRole } from "@/server/data/types";

export async function GET(req: NextRequest) {
  const storeSlug = req.nextUrl.searchParams.get("storeSlug") || "lome-glow";
  const domains = getStoreDomains(storeSlug);
  return NextResponse.json({ success: true, domains });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeSlug, domain, isPrimary = false, role = "owner" } = body;

    // 1. Contrôle des autorisations (Propriétaire et Co-admin uniquement)
    const userRole = role as UserRole;
    if (!canManageSettings(userRole)) {
      return NextResponse.json(
        { error: "Accès refusé. La gestion des noms de domaine est réservée aux administrateurs.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    if (!storeSlug) {
      return NextResponse.json({ error: "Boutique requise.", code: "MISSING_STORE" }, { status: 400 });
    }

    // 2. Validation stricte du format
    const validation = validateDomainFormat(domain);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error, code: "INVALID_DOMAIN" }, { status: 400 });
    }

    const cleanDomain = validation.normalized;

    // 3. Unicité stricte sur toute la plateforme (Prompt 19)
    const uniqueness = isDomainTakenAcrossPlatform(cleanDomain, storeSlug);
    if (uniqueness.isTaken) {
      return NextResponse.json(
        {
          error: `Le domaine « ${cleanDomain} » est déjà utilisé par une autre boutique sur la plateforme.`,
          code: "DOMAIN_ALREADY_EXISTS",
        },
        { status: 409 }
      );
    }

    // 4. Appel de l'API Vercel (ou simulation sécurisée)
    const vercelResult = await addDomainToVercel(cleanDomain);
    if (!vercelResult.success) {
      return NextResponse.json(
        { error: vercelResult.error || "Échec d'enregistrement chez Vercel.", code: "VERCEL_ERROR" },
        { status: 502 }
      );
    }

    // 5. Enregistrement dans le registre de la boutique
    const currentDomains = getStoreDomains(storeSlug);

    // Si le nouveau domaine est défini comme principal, les autres passent en secondaire
    const updatedList: CustomDomain[] = currentDomains.map((d) =>
      isPrimary ? { ...d, isPrimary: false, redirectToPrimary: true } : d
    );

    const newRecord: CustomDomain = {
      id: `dom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      storeSlug,
      domain: cleanDomain,
      isPrimary: isPrimary || currentDomains.length === 0, // Premier domaine = principal par défaut
      redirectToPrimary: !isPrimary && currentDomains.length > 0,
      status: "pending_dns",
      dnsRecords: vercelResult.dnsRecords,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updatedList.push(newRecord);
    saveStoreDomains(storeSlug, updatedList);

    return NextResponse.json({ success: true, domain: newRecord });
  } catch (err: any) {
    console.error("[API Domains] Erreur d'ajout :", err);
    return NextResponse.json({ error: err.message || "Erreur interne du serveur.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const storeSlug = searchParams.get("storeSlug");
    const domainId = searchParams.get("id");
    const domainName = searchParams.get("domain");

    if (!storeSlug || (!domainId && !domainName)) {
      return NextResponse.json({ error: "Identifiant ou nom de domaine requis.", code: "INVALID_PARAMS" }, { status: 400 });
    }

    const currentDomains = getStoreDomains(storeSlug);
    const target = currentDomains.find((d) => d.id === domainId || d.domain === domainName);

    if (!target) {
      return NextResponse.json({ error: "Domaine introuvable.", code: "NOT_FOUND" }, { status: 404 });
    }

    // Détachement chez Vercel
    await removeDomainFromVercel(target.domain);

    const remaining = currentDomains.filter((d) => d.id !== target.id);
    // Si on a supprimé le domaine principal, promouvoir le premier restant
    if (target.isPrimary && remaining.length > 0) {
      remaining[0].isPrimary = true;
      remaining[0].redirectToPrimary = false;
    }

    saveStoreDomains(storeSlug, remaining);

    return NextResponse.json({ success: true, removedDomain: target.domain });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur lors du retrait.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
