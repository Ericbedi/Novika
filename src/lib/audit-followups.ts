export interface FollowupAuditEntry {
  id: string;
  orderId: string;
  orderNumber: string;
  action: "call_outcome" | "reschedule" | "reject" | "reopen" | "reassign";
  outcome?: string;
  performedBy: {
    id: string;
    name: string;
    role: string;
  };
  reason?: string;
  notes?: string;
  timestamp: string;
}

const auditEntries: FollowupAuditEntry[] = [];

export function logFollowupAudit(entry: Omit<FollowupAuditEntry, "id" | "timestamp">): FollowupAuditEntry {
  const fullEntry: FollowupAuditEntry = {
    ...entry,
    id: `aud_fol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  auditEntries.unshift(fullEntry);
  return fullEntry;
}

export function getFollowupAuditLogs(orderId?: string): FollowupAuditEntry[] {
  if (orderId) {
    return auditEntries.filter((e) => e.orderId === orderId);
  }
  return [...auditEntries];
}
