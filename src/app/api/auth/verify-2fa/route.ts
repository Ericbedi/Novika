import { SESSION_COOKIE, signSessionToken } from "@/lib/session-token";
import { NextRequest, NextResponse } from "next/server";
import { verify2FACode } from "@/server/auth/password-security";
import { createServerSession } from "@/server/auth/session-manager";
import { recordLoginSuccess } from "@/server/auth/rate-limiter";
import { isOwnerEmail, getOwnerEmail } from "@/config/owner";
import { checkAllowlist } from "@/server/auth/team-invitations";
import { logAuthAudit } from "@/lib/audit-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (!email || !code) {
      return NextResponse.json(
        { error: "L'adresse e-mail et le code à 6 chiffres sont obligatoires." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Vérification du code 2FA
    const verification = verify2FACode(normalizedEmail, code);
    if (!verification.success) {
      logAuthAudit({
        event: "login_failure",
        userEmailMasked: normalizedEmail,
        ip: clientIp,
        details: "Échec de validation du code 2FA.",
      });

      return NextResponse.json(
        { error: verification.error || "Code de validation 2FA incorrect ou expiré." },
        { status: 401 }
      );
    }

    // Détermination du rôle
    const isOwner = isOwnerEmail(normalizedEmail);
    const allowlistCheck = checkAllowlist(normalizedEmail);

    let userRole = "owner";
    if (isOwner) {
      userRole = "owner";
    } else if (allowlistCheck.member) {
      userRole = allowlistCheck.member.role;
    } else if (normalizedEmail.includes("admin")) {
      userRole = "admin";
    }

    // Création de session
    recordLoginSuccess(normalizedEmail, clientIp);
    const session = createServerSession({
      userEmail: normalizedEmail,
      role: userRole,
      ipAddress: clientIp,
      deviceInfo: req.headers.get("user-agent") || "Navigateur Web (2FA validée)",
    });

    logAuthAudit({
      event: "login_success",
      userEmailMasked: normalizedEmail,
      role: userRole,
      ip: clientIp,
      details: "Validation 2FA réussie. Session établie.",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: session.id,
        email: normalizedEmail,
        fullName: isOwner ? "Promises Bedi (Propriétaire)" : normalizedEmail.split("@")[0],
        role: userRole,
        hasStores: true,
        stores: [
          {
            id: "store_tg_01",
            name: "Lomé Glow Cosmétiques",
            slug: "lome-glow",
            country: "TG",
            currency: "XOF",
          },
        ],
      },
    });

    const sessionPayload = JSON.stringify({
      id: session.id,
      email: normalizedEmail,
      role: userRole,
      createdAt: Date.now(),
    });

    const signedToken = await signSessionToken({ email: normalizedEmail, role: userRole });
    if (signedToken) {
      response.cookies.set(SESSION_COOKIE, signedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    response.cookies.set("novika_session", sessionPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set("novika_active_role", userRole, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    response.cookies.set("novika_user_email", normalizedEmail, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    response.cookies.set("afribuilder_session", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
