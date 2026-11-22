import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken, type SessionTokenPayload } from "@/lib/session-token";

/** Identité authentifiée d'une requête API (jeton signé), ou null. */
export async function getAuthFromRequest(req: NextRequest): Promise<SessionTokenPayload | null> {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}
