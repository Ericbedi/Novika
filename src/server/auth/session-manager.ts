/**
 * Gestionnaire de sessions serveur & Révocation multi-appareils (Prompt 18)
 * - Durée limitée
 * - Invalidation immédiate sur suspension
 * - « Déconnecter partout »
 */

export interface ServerSession {
  id: string;
  userEmail: string;
  role: string;
  deviceInfo?: string;
  ipAddress?: string;
  isValid: boolean;
  createdAt: number;
  lastSeenAt: number;
}

const ACTIVE_SESSIONS = new Map<string, ServerSession>();

// Durée maximale d'une session : 14 jours d'inactivité
const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function createServerSession(params: {
  userEmail: string;
  role: string;
  deviceInfo?: string;
  ipAddress?: string;
}): ServerSession {
  const normalizedEmail = params.userEmail.trim().toLowerCase();
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const session: ServerSession = {
    id: sessionId,
    userEmail: normalizedEmail,
    role: params.role,
    deviceInfo: params.deviceInfo || "Navigateur Web",
    ipAddress: params.ipAddress || "127.0.0.1",
    isValid: true,
    createdAt: Date.now(),
    lastSeenAt: Date.now(),
  };

  ACTIVE_SESSIONS.set(sessionId, session);
  return session;
}

export function validateServerSession(sessionId: string): {
  valid: boolean;
  session?: ServerSession;
  reason?: "not_found" | "revoked" | "expired";
} {
  const session = ACTIVE_SESSIONS.get(sessionId);
  if (!session) {
    return { valid: false, reason: "not_found" };
  }

  if (!session.isValid) {
    return { valid: false, reason: "revoked" };
  }

  const now = Date.now();
  if (now - session.lastSeenAt > SESSION_MAX_AGE_MS) {
    session.isValid = false;
    return { valid: false, reason: "expired" };
  }

  // Mettre à jour lastSeenAt
  session.lastSeenAt = now;
  return { valid: true, session };
}

export function revokeServerSession(sessionId: string): boolean {
  const session = ACTIVE_SESSIONS.get(sessionId);
  if (session) {
    session.isValid = false;
    return true;
  }
  return false;
}

/**
 * Invalide immédiatement TOUTES les sessions d'un utilisateur
 * Utilisé lors d'une suspension ou via « Déconnecter partout »
 */
export function revokeAllUserSessions(userEmail: string): number {
  const normalized = userEmail.trim().toLowerCase();
  let count = 0;
  for (const session of ACTIVE_SESSIONS.values()) {
    if (session.userEmail === normalized && session.isValid) {
      session.isValid = false;
      count += 1;
    }
  }
  return count;
}

export function getUserActiveSessions(userEmail: string): ServerSession[] {
  const normalized = userEmail.trim().toLowerCase();
  const sessions: ServerSession[] = [];
  const now = Date.now();

  for (const session of ACTIVE_SESSIONS.values()) {
    if (session.userEmail === normalized && session.isValid && now - session.lastSeenAt <= SESSION_MAX_AGE_MS) {
      sessions.push(session);
    }
  }

  return sessions;
}
