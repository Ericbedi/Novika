import { NextRequest, NextResponse } from "next/server";
import { resendInvitation } from "@/server/auth/team-invitations";
import { isOwnerEmail } from "@/config/owner";

export async function POST(req: NextRequest) {
  try {
    const callerEmail = req.cookies.get("novika_user_email")?.value;
    const callerRole = req.cookies.get("novika_active_role")?.value;

    const isAuthorized = isOwnerEmail(callerEmail) || callerRole === "owner" || callerRole === "admin";
    if (!isAuthorized) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const body = await req.json();
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json({ error: "Identifiant d'invitation manquant." }, { status: 400 });
    }

    const result = resendInvitation(invitationId, callerEmail || "Admin");
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      invitation: result.invitation,
      message: "Invitation renvoyée avec succès. Le lien est à nouveau valable 7 jours.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
