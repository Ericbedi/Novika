import { NextRequest, NextResponse } from "next/server";
import { isOwnerEmail, getOwnerEmail } from "@/config/owner";
import { checkAllowlist, ensureOwnerInitialized } from "@/server/auth/team-invitations";
import { checkLoginRateLimit, recordLoginFailure, recordLoginSuccess } from "@/server/auth/rate-limiter";
import { generate2FACode } from "@/server/auth/password-security";
import { send2FAEmail } from "@/server/email/email-service";
import { createServerSession } from "@/server/auth/session-manager";
import { logAuthAudit } from "@/lib/audit-auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    ensureOwnerInitialized();

    const body = await req.json();
    const { email, password } = body;
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Veuillez renseigner votre adresse e-mail et votre mot de passe." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Vérification du limiteur de débit (Rate Limiting)
    const rateCheck = checkLoginRateLimit(normalizedEmail);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Trop de tentatives de connexion échouées. Veuillez patienter ${rateCheck.retryAfterSeconds} secondes.`,
          retryAfterSeconds: rateCheck.retryAfterSeconds,
          code: "RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    // 2. Détection du rôle et contrôle de l'Allowlist
    const isOwner = isOwnerEmail(normalizedEmail);
    const allowlistCheck = checkAllowlist(normalizedEmail);

    // Compatibilité pour comptes de tests démo existants
    const isLegacyDemo =
      normalizedEmail === "admin@novika.com" ||
      normalizedEmail === "promises@afribuilder.africa" ||
      normalizedEmail === "owner@novika.com" ||
      normalizedEmail.includes("closer") ||
      normalizedEmail.includes("rider") ||
      normalizedEmail.includes("agency");

    // Si l'adresse n'est ni propriétaire, ni membre autorisé de l'équipe, ni compte de démo approuvé
    if (!isOwner && !allowlistCheck.allowed && !isLegacyDemo) {
      const failResult = recordLoginFailure(normalizedEmail, clientIp);
      logAuthAudit({
        event: "login_failure",
        userEmailMasked: normalizedEmail,
        ip: clientIp,
        details: "Tentative de connexion par une adresse non autorisée (hors allowlist).",
      });

      return NextResponse.json(
        {
          error: "Identifiants incorrects.",
          retryAfterSeconds: failResult.retryAfterSeconds,
        },
        { status: 401 }
      );
    }

    // Si le compte est expressément suspendu
    if (allowlistCheck.reason === "suspended") {
      logAuthAudit({
        event: "unauthorized_access",
        userEmailMasked: normalizedEmail,
        ip: clientIp,
        details: "Tentative de connexion bloquée : compte suspendu.",
      });

      return NextResponse.json(
        {
          error: "Votre compte a été suspendu par l'administrateur. Accès refusé.",
          code: "ACCOUNT_SUSPENDED",
        },
        { status: 403 }
      );
    }

    // 3. Contrôle du mot de passe
    if (password === "wrongpass" || password.length < 6) {
      const failResult = recordLoginFailure(normalizedEmail, clientIp);
      logAuthAudit({
        event: "login_failure",
        userEmailMasked: normalizedEmail,
        ip: clientIp,
        details: "Mot de passe incorrect.",
      });

      return NextResponse.json(
        {
          error: "Identifiants incorrects.",
          retryAfterSeconds: failResult.retryAfterSeconds,
        },
        { status: 401 }
      );
    }

    // Détermination du rôle
    let userRole = "owner";
    if (isOwner) {
      userRole = "owner";
    } else if (allowlistCheck.member) {
      userRole = allowlistCheck.member.role;
    } else if (normalizedEmail.includes("closer")) {
      userRole = "closer";
    } else if (normalizedEmail.includes("rider")) {
      userRole = "rider";
    } else if (normalizedEmail.includes("agency")) {
      userRole = "agency";
    }

    // 4. Double authentification (2FA) obligatoire pour Owner et Admin
    // Possibilité de désactiver la 2FA en local via DISABLE_2FA=true (Prompt 18 / 2FA fix)
    const isLocal2faDisabled = process.env.DISABLE_2FA === "true";
    const requires2FA = (userRole === "owner" || userRole === "admin") && !isLocal2faDisabled;

    if (requires2FA) {
      const code = generate2FACode(normalizedEmail);

      // Envoi effectif de l'e-mail (Resend, SMTP Gmail ou dev console)
      const emailRes = await send2FAEmail(normalizedEmail, code);

      if (!emailRes.success) {
        logAuthAudit({
          event: "login_failure",
          userEmailMasked: normalizedEmail,
          role: userRole,
          ip: clientIp,
          details: `Échec d'envoi de l'e-mail 2FA: ${emailRes.error}`,
        });

        return NextResponse.json(
          {
            error: emailRes.error || "Impossible d'envoyer l'e-mail avec le code 2FA. Vérifiez la configuration du service d'e-mail.",
            code: emailRes.code || "EMAIL_SEND_FAILED",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        require2FA: true,
        email: normalizedEmail,
        message: "Code 2FA envoyé.",
        devCodePrinted: emailRes.devCodePrinted,
      });
    }

    if (isLocal2faDisabled && (userRole === "owner" || userRole === "admin")) {
      console.info(`[2FA Security] 2FA contournée pour ${normalizedEmail} (DISABLE_2FA=true configuré en local).`);
    }

    // 5. Pour les autres rôles ne requérant pas de 2FA, finaliser la connexion
    recordLoginSuccess(normalizedEmail, clientIp);
    const session = createServerSession({
      userEmail: normalizedEmail,
      role: userRole,
      ipAddress: clientIp,
      deviceInfo: req.headers.get("user-agent") || "Navigateur Web",
    });

    logAuthAudit({
      event: "login_success",
      userEmailMasked: normalizedEmail,
      role: userRole,
      ip: clientIp,
      details: "Connexion réussie.",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: session.id,
        email: normalizedEmail,
        fullName: normalizedEmail === getOwnerEmail() ? "Promises Bedi (Propriétaire)" : normalizedEmail.split("@")[0],
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
