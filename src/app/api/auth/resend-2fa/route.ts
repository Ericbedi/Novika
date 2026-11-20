import { NextRequest, NextResponse } from "next/server";
import { generate2FACode } from "@/server/auth/password-security";
import { send2FAEmail } from "@/server/email/email-service";
import { logAuthAudit } from "@/lib/audit-auth";

// Store en mémoire pour imposer un cooldown de 60 secondes entre deux renvois
const LAST_RESEND_TIMESTAMP = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (!email) {
      return NextResponse.json(
        { error: "L'adresse e-mail est obligatoire." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = Date.now();
    const lastSend = LAST_RESEND_TIMESTAMP.get(normalizedEmail) || 0;
    const elapsedSeconds = Math.floor((now - lastSend) / 1000);

    // Cooldown de 60 secondes requis
    if (elapsedSeconds < 60 && lastSend > 0) {
      const waitSeconds = 60 - elapsedSeconds;
      return NextResponse.json(
        {
          error: `Veuillez patienter encore ${waitSeconds}s avant de demander un nouveau code.`,
          waitSeconds,
          code: "COOLDOWN_ACTIVE",
        },
        { status: 429 }
      );
    }

    const code = generate2FACode(normalizedEmail);
    const emailRes = await send2FAEmail(normalizedEmail, code);

    if (!emailRes.success) {
      logAuthAudit({
        event: "login_failure",
        userEmailMasked: normalizedEmail,
        ip: clientIp,
        details: `Échec du renvoi de l'e-mail 2FA: ${emailRes.error}`,
      });

      return NextResponse.json(
        {
          error: emailRes.error || "Impossible d'envoyer le code par e-mail. Vérifiez la configuration du service d'e-mail.",
          code: emailRes.code || "EMAIL_SEND_FAILED",
        },
        { status: 500 }
      );
    }

    LAST_RESEND_TIMESTAMP.set(normalizedEmail, now);

    logAuthAudit({
      event: "login_success",
      userEmailMasked: normalizedEmail,
      ip: clientIp,
      details: "Nouveau code 2FA envoyé avec succès.",
    });

    return NextResponse.json({
      success: true,
      message: "Un nouveau code 2FA a été généré et envoyé.",
      devCodePrinted: emailRes.devCodePrinted,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
