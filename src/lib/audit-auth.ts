/**
 * Journal d'audit de sécurité des sessions et déconnexions (Prompt 06-L)
 * Enregistrement append-only sans données personnelles inutiles.
 */

export type AuthAuditEventType =
  | "voluntary_logout"
  | "all_devices_logout"
  | "session_expired"
  | "unauthorized_access"
  | "login_success"
  | "login_failure";

export interface AuthAuditEntry {
  id: string;
  timestamp: string;
  event: AuthAuditEventType;
  userEmailMasked?: string;
  role?: string;
  ip?: string;
  userAgent?: string;
  details?: string;
}

// Journal mémoire append-only pour la session du serveur
const AUDIT_LOGS_MEMORY: AuthAuditEntry[] = [];

export function logAuthAudit(entry: Omit<AuthAuditEntry, "id" | "timestamp">): AuthAuditEntry {
  let maskedEmail = entry.userEmailMasked;
  if (maskedEmail && maskedEmail.includes("@")) {
    const [user, domain] = maskedEmail.split("@");
    maskedEmail = `${user.slice(0, 2)}***@${domain}`;
  }

  const fullEntry: AuthAuditEntry = {
    id: `audit_auth_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...entry,
    userEmailMasked: maskedEmail,
  };

  AUDIT_LOGS_MEMORY.push(fullEntry);
  if (AUDIT_LOGS_MEMORY.length > 500) {
    AUDIT_LOGS_MEMORY.shift();
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(`[AuthAudit] ${fullEntry.event}:`, fullEntry);
  }

  return fullEntry;
}

export function getAuthAuditLogs(): AuthAuditEntry[] {
  return [...AUDIT_LOGS_MEMORY];
}
