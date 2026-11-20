/**
 * Service d'envoi d'e-mails pour Novika (Prompt 18 & Prompt 17-O/2FA)
 * 
 * Supporte :
 * 1. Resend (si RESEND_API_KEY configuré) via l'API REST officielle
 * 2. SMTP Gmail / SMTP personnalisé (si SMTP_HOST ou GMAIL_USER configuré) via nodemailer
 * 3. Mode développement / local :
 *    - Affichage obligatoire et ultra-visible du code dans le terminal du serveur
 *    - Bypass via DISABLE_2FA=true
 */

import nodemailer from "nodemailer";

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: string;
  devCodePrinted?: boolean;
}

/**
 * Envoie un code de validation 2FA à 6 chiffres par e-mail.
 */
export async function send2FAEmail(to: string, code: string): Promise<EmailSendResult> {
  const normalizedEmail = to.trim().toLowerCase();
  const isDev = process.env.NODE_ENV !== "production";

  // Toujours afficher le code dans le terminal en développement pour ne jamais bloquer l'accès
  if (isDev || process.env.DEBUG_2FA === "true") {
    console.log("\n=======================================================");
    console.log(`🔑 [2FA NOVIKA] CODE DE SÉCURITÉ POUR : ${normalizedEmail}`);
    console.log(`🔑 [2FA NOVIKA] CODE À 6 CHIFFRES      : ${code}`);
    console.log(`🔑 [2FA NOVIKA] VALABLE PENDANT         : 10 minutes`);
    console.log("=======================================================\n");
  }

  // 1. Priorité 1 : Resend API
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && resendApiKey.trim()) {
    try {
      const fromEmail = process.env.EMAIL_FROM || "Novika Sécurité <securite@novika.africa>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey.trim()}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [normalizedEmail],
          subject: `Votre code de validation Novika : ${code}`,
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #FAF8F5; padding: 32px; border-radius: 16px; max-width: 500px; margin: auto;">
              <h1 style="color: #111; font-size: 20px; font-weight: 800; margin-bottom: 8px;">Vérification de sécurité Novika</h1>
              <p style="color: #555; font-size: 14px; line-height: 1.5;">Bonjour,</p>
              <p style="color: #555; font-size: 14px; line-height: 1.5;">Votre code de sécurité à 6 chiffres pour accéder à votre espace Novika est :</p>
              <div style="background-color: #ffffff; border: 1px solid #E6E0D4; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #111;">${code}</span>
              </div>
              <p style="color: #888; font-size: 12px; line-height: 1.4;">Ce code est valable pendant <strong>10 minutes</strong>. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
              <hr style="border: none; border-top: 1px solid #E6E0D4; margin: 24px 0;" />
              <p style="color: #999; font-size: 11px;">Plateforme Novika · Gestion e-commerce privée</p>
            </div>
          `,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data?.message || data?.error || `Erreur Resend HTTP ${res.status}`;
        console.error("[EmailService Resend Error]:", errorMsg);
        return {
          success: false,
          error: `Échec d'envoi par e-mail : ${errorMsg}`,
          code: "RESEND_FAILED",
          devCodePrinted: isDev,
        };
      }

      return {
        success: true,
        messageId: data.id,
        devCodePrinted: isDev,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erreur réseau Resend";
      console.error("[EmailService Resend Exception]:", errorMsg);
      return {
        success: false,
        error: `Erreur de connexion à Resend : ${errorMsg}`,
        code: "RESEND_NETWORK_ERROR",
        devCodePrinted: isDev,
      };
    }
  }

  // 2. Priorité 2 : SMTP Gmail ou SMTP Personnalisé
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST || (process.env.GMAIL_USER ? "smtp.gmail.com" : undefined);
  const smtpPort = Number(process.env.SMTP_PORT) || 587;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const fromAddress = process.env.EMAIL_FROM || `Novika Sécurité <${smtpUser}>`;
      const info = await transporter.sendMail({
        from: fromAddress,
        to: normalizedEmail,
        subject: `Votre code de validation Novika : ${code}`,
        text: `Bonjour,\n\nVotre code de sécurité Novika est : ${code}\nCe code est valable 10 minutes.\n\nNovika Plateforme`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #FAF8F5; padding: 32px; border-radius: 16px; max-width: 500px; margin: auto;">
            <h1 style="color: #111; font-size: 20px; font-weight: 800; margin-bottom: 8px;">Vérification de sécurité Novika</h1>
            <p style="color: #555; font-size: 14px; line-height: 1.5;">Bonjour,</p>
            <p style="color: #555; font-size: 14px; line-height: 1.5;">Votre code de sécurité à 6 chiffres pour accéder à votre espace Novika est :</p>
            <div style="background-color: #ffffff; border: 1px solid #E6E0D4; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #111;">${code}</span>
            </div>
            <p style="color: #888; font-size: 12px; line-height: 1.4;">Ce code est valable pendant <strong>10 minutes</strong>. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
          </div>
        `,
      });

      return {
        success: true,
        messageId: info.messageId,
        devCodePrinted: isDev,
      };
    } catch (smtpErr: unknown) {
      const errorMsg = smtpErr instanceof Error ? smtpErr.message : "Erreur SMTP";
      console.error("[EmailService SMTP Error]:", errorMsg);
      return {
        success: false,
        error: `Échec d'envoi SMTP : ${errorMsg}`,
        code: "SMTP_FAILED",
        devCodePrinted: isDev,
      };
    }
  }

  // 3. Aucun service configuré
  if (isDev) {
    // En développement local : on signale que le service e-mail n'est pas encore configuré
    // mais le code a été imprimé dans la console
    return {
      success: true,
      messageId: "dev-console-fallback",
      devCodePrinted: true,
    };
  }

  // En production : refuser l'opération et signaler l'absence de service configuré
  return {
    success: false,
    error: "Aucun service d'e-mail configuré sur le serveur (RESEND_API_KEY ou SMTP requis).",
    code: "NO_EMAIL_PROVIDER",
    devCodePrinted: false,
  };
}
