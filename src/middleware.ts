import { NextRequest, NextResponse } from "next/server";
import { getDefaultSpaceForRole } from "@/config/spaces";
import { ROUTES } from "@/config/routes";
import { findStoreByHost } from "@/lib/custom-domains";

export const config = {
  matcher: [
    /*
     * Matcher sur toutes les routes sauf fichiers statiques, images et assets publics
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|woff2?)$).*)",
  ],
};

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

function isPlatformHost(host: string): boolean {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".localhost") ||
    host.includes("vercel.app") ||
    host.includes("novika.africa") ||
    host.includes("afribuilder.africa")
  );
}

import { SESSION_COOKIE, isSessionSigningEnabled, verifySessionToken } from "@/lib/session-token";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const rawHost = request.headers.get("host") || "";
  const host = rawHost.toLowerCase().split(":")[0].trim();

  // ==========================================================================
  // 0. ROUTAGE PAR NOM DE DOMAINE PERSONNALISÉ (Prompt 19)
  // ==========================================================================
  if (!isPlatformHost(host)) {
    const storeMatch = findStoreByHost(host);
    if (!storeMatch) {
      // Domaine inconnu : page 404 neutre Novika (jamais de fuite d'informations)
      return new NextResponse(
        `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Boutique introuvable - Novika</title><style>body{font-family:sans-serif;background:#FAF8F5;color:#111;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;}.box{background:#fff;border:1px solid #E6E0D4;padding:40px;border-radius:24px;max-width:440px;box-shadow:0 4px 12px rgba(0,0,0,0.04);}</style></head><body><div class="box"><h1 style="font-size:24px;margin-bottom:8px;">404 - Boutique introuvable</h1><p style="color:#7A7A7A;font-size:14px;line-height:1.5;">Ce nom de domaine n'est associé à aucune boutique active sur la plateforme.</p></div></body></html>`,
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Protection stricte : les routes d'administration ne sont JAMAIS servies sur un domaine de boutique
    const isAdminRoute =
      pathname.startsWith("/app") ||
      pathname.startsWith("/control") ||
      pathname.startsWith("/closing") ||
      pathname.startsWith("/livraison") ||
      pathname.startsWith("/agence") ||
      pathname.startsWith("/platform-admin") ||
      (pathname.startsWith("/api") &&
        !pathname.startsWith("/api/public") &&
        !pathname.startsWith("/api/orders/public") &&
        !pathname.startsWith("/api/reviews") &&
        !pathname.startsWith("/api/tracking"));

    if (isAdminRoute) {
      return new NextResponse(
        `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Accès réservé - Novika</title><style>body{font-family:sans-serif;background:#FAF8F5;color:#111;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;}.box{background:#fff;border:1px solid #E6E0D4;padding:40px;border-radius:24px;max-width:440px;}</style></head><body><div class="box"><h1 style="font-size:20px;">Espace d'administration réservé</h1><p style="color:#7A7A7A;font-size:13px;">L'espace d'administration n'est pas accessible depuis les domaines de vitrine.</p></div></body></html>`,
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Redirection 301 des domaines secondaires vers le domaine principal (ex: www.kelio.com -> kelio.com)
    if (storeMatch.redirectToPrimary && storeMatch.primaryDomain && host !== storeMatch.primaryDomain) {
      const targetUrl = `https://${storeMatch.primaryDomain}${pathname}${search}`;
      return NextResponse.redirect(targetUrl, 301);
    }

    // Redirection 301 des routes supprimées vers l'Accueil (Prompt 21-b)
    const isRemovedStorefrontRoute =
      pathname.startsWith("/collections") ||
      pathname.startsWith("/recherche") ||
      pathname.startsWith("/blog") ||
      pathname === "/a-propos";

    if (isRemovedStorefrontRoute) {
      return NextResponse.redirect(new URL("/", request.url), 301);
    }

    // Réécriture transparente vers le contenu de la boutique
    const rewritePath = `/boutique/${storeMatch.storeSlug}${pathname === "/" ? "" : pathname}${search}`;
    const rewriteUrl = new URL(rewritePath, request.url);
    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set("x-shop-slug", storeMatch.storeSlug);
    response.headers.set("x-shop-domain", host);
    return response;
  }

  // Redirection 301 des routes supprimées sur l'adresse de secours (Prompt 21-b)
  const matchBoutiqueRemoved = pathname.match(
    /^\/boutique\/([^/]+)\/(collections|recherche|blog|a-propos)(\/.*)?$/
  );
  if (matchBoutiqueRemoved) {
    const store = matchBoutiqueRemoved[1];
    return NextResponse.redirect(new URL(`/boutique/${store}`, request.url), 301);
  }

  // 1. Détection des cookies de session
  const novikaSessionCookie = request.cookies.get("novika_session")?.value;
  const afribuilderSessionCookie = request.cookies.get("afribuilder_session")?.value;
  const sbAccessToken = request.cookies.get("sb-access-token")?.value;
  const hasAuthToken = Boolean(
    request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"))
  );

  let sessionUserRole = "owner";
  let hasValidSession = Boolean(
    novikaSessionCookie || afribuilderSessionCookie || sbAccessToken || hasAuthToken
  );

  // Session SIGNÉE (non falsifiable) : exigée dès que AUTH_COOKIE_SECRET est configuré
  if (isSessionSigningEnabled()) {
    const verified = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    hasValidSession = Boolean(verified);
    if (verified) sessionUserRole = verified.role;
  } else if (novikaSessionCookie) {
    try {
      const parsed = JSON.parse(novikaSessionCookie);
      if (parsed && parsed.role) {
        sessionUserRole = parsed.role;
      }
    } catch { }
  } else if (request.cookies.get("novika_active_role")?.value) {
    sessionUserRole = request.cookies.get("novika_active_role")!.value;
  }

  // 2. Redirection permanente /auth/connexion -> ROUTES.login
  if (pathname === "/auth/connexion") {
    const targetUrl = new URL(ROUTES.login + search, request.url);
    return NextResponse.redirect(targetUrl, 308);
  }

  // 2b. Blocage des inscriptions publiques (Prompt 18)
  if (pathname === "/inscription" || pathname === "/auth/inscription" || pathname === "/register") {
    const targetUrl = new URL(ROUTES.login, request.url);
    targetUrl.searchParams.set("message", "signup_closed");
    return NextResponse.redirect(targetUrl, 308);
  }

  if (
    pathname === "/api/auth/register" ||
    pathname === "/api/auth/signup" ||
    pathname === "/api/auth/inscription"
  ) {
    return NextResponse.json(
      {
        error: "Les inscriptions publiques sont fermées. L'accès à la plateforme se fait uniquement sur invitation du propriétaire.",
        code: "SIGNUP_CLOSED",
      },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  // 3. Gestion de la page de connexion
  if (pathname === ROUTES.login) {
    const hasMessageParam = request.nextUrl.searchParams.has("message");
    // Si l'utilisateur a déjà une session valide ET qu'il ne vient pas d'effectuer une déconnexion
    if (hasValidSession && !hasMessageParam) {
      const targetSpace = getDefaultSpaceForRole(sessionUserRole);
      return NextResponse.redirect(new URL(targetSpace, request.url));
    }
    return NextResponse.next();
  }

  // 3. Définition des routes privées (Dashboard et APIs d'administration)
  const isPrivatePage =
    pathname.startsWith("/app") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/demarrer") ||
    pathname.startsWith("/nouvelle-boutique") ||
    pathname.startsWith("/platform-admin");

  const isPrivateApi =
    (pathname.startsWith("/api/orders") && request.method !== "POST") ||
    pathname.startsWith("/api/stores") ||
    pathname.startsWith("/api/scaling") ||
    pathname.startsWith("/api/team") ||
    (pathname.startsWith("/api/live") && request.method !== "POST");

  // 4. Si la route est privée : authentification obligatoire (promisesbedi@gmail.com ou membre invité)
  if (isPrivatePage || isPrivateApi) {
    const isE2EEnv = process.env.E2E_PROD === "1" || process.env.NODE_ENV === "test";

    if (!hasValidSession && !isE2EEnv) {
      if (isPrivateApi) {
        return NextResponse.json(
          { error: "Non autorisé. Session absente ou expirée.", code: "UNAUTHORIZED" },
          { status: 401, headers: NO_STORE_HEADERS }
        );
      }

      // Redirection vers ROUTES.login avec mémorisation de l'URL cible (param redirect)
      const redirectTarget = pathname + search;
      const loginUrl = new URL(ROUTES.login, request.url);
      loginUrl.searchParams.set("message", "session_expired");
      loginUrl.searchParams.set("redirect", redirectTarget);

      const redirectRes = NextResponse.redirect(loginUrl);
      Object.entries(NO_STORE_HEADERS).forEach(([k, v]) => {
        redirectRes.headers.set(k, v);
      });
      return redirectRes;
    }

    // Réponse autorisée avec en-têtes Cache-Control: no-store stricts
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
      const target = pathname.replace(/^\/dashboard/, "/app");
      return NextResponse.redirect(new URL(target + search, request.url));
    }

    const response = NextResponse.next();
    Object.entries(NO_STORE_HEADERS).forEach(([k, v]) => {
      response.headers.set(k, v);
    });
    return response;
  }

  return NextResponse.next();
}
