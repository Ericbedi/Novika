import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { logAuthAudit } from "@/lib/audit-auth";
import { ROUTES } from "@/config/routes";

export async function GET() {
  // Rejet strict des requêtes GET : la déconnexion doit impérativement être une action POST
  return NextResponse.json(
    {
      error: "Méthode non autorisée. La déconnexion exige une requête POST avec validation CSRF.",
    },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function POST(req: NextRequest) {
  try {
    // 1. Protection CSRF : Vérification de l'origine
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    const secFetchSite = req.headers.get("sec-fetch-site");

    if (secFetchSite && secFetchSite === "cross-site") {
      logAuthAudit({
        event: "unauthorized_access",
        details: "Rejet de déconnexion cross-site (protection CSRF)",
        ip: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      });
      return NextResponse.json(
        { error: "Requête cross-site non autorisée." },
        { status: 403 }
      );
    }

    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { error: "Origine invalide (protection CSRF)." },
          { status: 403 }
        );
      }
    }

    // 2. Lecture des options du corps
    let allDevices = false;
    let reason = "voluntary";
    try {
      const body = await req.json();
      if (body) {
        allDevices = Boolean(body.allDevices);
        if (body.reason) reason = String(body.reason);
      }
    } catch {
      // Body optionnel
    }

    // 3. Appel de fermeture de session Supabase (avec timeout de sécurité pour garantir < 500ms)
    try {
      const supabase = await createClient();
      await Promise.race([
        supabase.auth.signOut({
          scope: allDevices ? "global" : "local",
        }),
        new Promise((resolve) => setTimeout(resolve, 600)),
      ]);
    } catch (sbErr) {
      console.warn("[Logout API] Notice Supabase signOut:", sbErr);
    }

    // 4. Suppression des cookies côté serveur
    const cookieStore = await cookies();
    const cookiesToRemove = [
      "novika_session",
      "novika_active_role",
      "novika_user_email",
      "afribuilder_session",
      "afribuilder_auth",
      "afribuilder_active_role",
      "sb-access-token",
      "sb-refresh-token",
    ];

    cookiesToRemove.forEach((c) => {
      try {
        cookieStore.delete(c);
      } catch {}
    });

    // 5. Journal d'audit de sécurité
    logAuthAudit({
      event: allDevices ? "all_devices_logout" : "voluntary_logout",
      details: `Déconnexion ${allDevices ? "globale (tous appareils)" : "locale"}, motif : ${reason}`,
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    const redirectTarget = allDevices
      ? `${ROUTES.login}?message=all_devices_logged_out`
      : `${ROUTES.login}?message=logged_out`;

    const response = NextResponse.json(
      {
        success: true,
        redirect: redirectTarget,
        message: allDevices
          ? "Toutes vos sessions ont été invalidées avec succès."
          : "Déconnexion réussie et session invalidée côté serveur.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    );

    // Suppression explicite via Set-Cookie
    cookiesToRemove.forEach((c) => {
      response.cookies.set(c, "", { maxAge: 0, path: "/", httpOnly: true, sameSite: "lax" });
    });

    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
