import { NextRequest, NextResponse } from "next/server";
import { getDefaultSpaceForRole } from "@/config/spaces";

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

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

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

  if (novikaSessionCookie) {
    try {
      const parsed = JSON.parse(novikaSessionCookie);
      if (parsed && parsed.role) {
        sessionUserRole = parsed.role;
      }
    } catch {}
  } else if (request.cookies.get("novika_active_role")?.value) {
    sessionUserRole = request.cookies.get("novika_active_role")!.value;
  }

  // 2. Gestion de la page /connexion
  if (pathname === "/connexion") {
    const hasMessageParam = request.nextUrl.searchParams.has("message");
    // Si l'utilisateur a déjà une session valide ET qu'il ne vient pas d'effectuer une déconnexion
    if (hasValidSession && !hasMessageParam) {
      const targetSpace = getDefaultSpaceForRole(sessionUserRole);
      return NextResponse.redirect(new URL(targetSpace, request.url));
    }
    return NextResponse.next();
  }

  // 3. Définition des routes privées
  const isPrivatePage =
    pathname.startsWith("/app") ||
    pathname.startsWith("/demarrer") ||
    pathname.startsWith("/platform-admin");

  const isPrivateApi =
    pathname.startsWith("/api/orders") ||
    pathname.startsWith("/api/stores") ||
    pathname.startsWith("/api/scaling") ||
    pathname.startsWith("/api/live");

  // 4. Si la route est privée
  if (isPrivatePage || isPrivateApi) {
    // Exception pour tests E2E / mode démo fondateur de lome-glow
    const isFounderDemoPath = pathname === "/app/lome-glow" || pathname.startsWith("/app/lome-glow/");
    const isE2EEnv = process.env.E2E_PROD === "1" || process.env.NODE_ENV === "test";

    if (!hasValidSession && !isFounderDemoPath && !isE2EEnv) {
      if (isPrivateApi) {
        return NextResponse.json(
          { error: "Non autorisé. Session absente ou expirée.", code: "UNAUTHORIZED" },
          { status: 401, headers: NO_STORE_HEADERS }
        );
      }

      // Redirection vers /connexion avec mémorisation de l'URL cible (param redirect)
      const redirectTarget = pathname + search;
      const loginUrl = new URL("/connexion", request.url);
      loginUrl.searchParams.set("message", "session_expired");
      loginUrl.searchParams.set("redirect", redirectTarget);

      const redirectRes = NextResponse.redirect(loginUrl);
      Object.entries(NO_STORE_HEADERS).forEach(([k, v]) => {
        redirectRes.headers.set(k, v);
      });
      return redirectRes;
    }

    // Réponse autorisée avec en-têtes Cache-Control: no-store stricts
    const response = NextResponse.next();
    Object.entries(NO_STORE_HEADERS).forEach(([k, v]) => {
      response.headers.set(k, v);
    });
    return response;
  }

  return NextResponse.next();
}
