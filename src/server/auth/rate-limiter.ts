/**
 * Limiteur de débit & Protection contre les attaques par force brute (Prompt 18)
 * - Suivi par adresse e-mail et par adresse IP
 * - Verrouillage temporaire progressif (30s, 60s, 300s)
 * - Alerte au propriétaire après échecs répétés
 */

import { getOwnerEmail } from "@/config/owner";
import { logAuthAudit } from "@/lib/audit-auth";

interface AttemptRecord {
  failures: number;
  lockedUntil: number;
  lastAttempt: number;
}

const ATTEMPTS_BY_KEY = new Map<string, AttemptRecord>();

// Nettoyage périodique toutes les 15 minutes des anciennes entrées inactives
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ATTEMPTS_BY_KEY.entries()) {
      if (now - record.lastAttempt > 30 * 60 * 1000) {
        ATTEMPTS_BY_KEY.delete(key);
      }
    }
  }, 15 * 60 * 1000);
}

function getLockoutDurationMs(failures: number): number {
  if (failures >= 10) return 5 * 60 * 1000; // 5 minutes
  if (failures >= 8) return 60 * 1000; // 1 minute
  if (failures >= 5) return 30 * 1000; // 30 secondes
  return 0;
}

export function checkLoginRateLimit(identifier: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
  failures: number;
} {
  const key = identifier.toLowerCase().trim();
  const record = ATTEMPTS_BY_KEY.get(key);

  if (!record) {
    return { allowed: true, failures: 0 };
  }

  const now = Date.now();
  if (record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: remainingSeconds,
      failures: record.failures,
    };
  }

  return { allowed: true, failures: record.failures };
}

export function recordLoginFailure(
  email: string,
  ip?: string
): { locked: boolean; retryAfterSeconds?: number; failures: number } {
  const keys = [email.toLowerCase().trim()];
  if (ip && ip.trim()) keys.push(`ip:${ip.trim()}`);

  let maxFailures = 0;
  let maxLockedUntil = 0;

  for (const key of keys) {
    const existing = ATTEMPTS_BY_KEY.get(key) || {
      failures: 0,
      lockedUntil: 0,
      lastAttempt: 0,
    };

    existing.failures += 1;
    existing.lastAttempt = Date.now();

    const lockoutDuration = getLockoutDurationMs(existing.failures);
    if (lockoutDuration > 0) {
      existing.lockedUntil = Date.now() + lockoutDuration;
    }

    ATTEMPTS_BY_KEY.set(key, existing);

    if (existing.failures > maxFailures) maxFailures = existing.failures;
    if (existing.lockedUntil > maxLockedUntil) maxLockedUntil = existing.lockedUntil;
  }

  // Alerte journal d'audit si >= 5 échecs consécutifs
  if (maxFailures >= 5) {
    logAuthAudit({
      event: "login_failure",
      userEmailMasked: email,
      ip: ip || "unknown",
      details: `Tentatives excessives d'accès (${maxFailures} échecs). Verrouillage appliqué. Alerte propriétaire: ${getOwnerEmail()}`,
    });
  }

  const now = Date.now();
  const locked = maxLockedUntil > now;
  const retryAfterSeconds = locked ? Math.ceil((maxLockedUntil - now) / 1000) : 0;

  return {
    locked,
    retryAfterSeconds: locked ? retryAfterSeconds : undefined,
    failures: maxFailures,
  };
}

export function recordLoginSuccess(email: string, ip?: string): void {
  ATTEMPTS_BY_KEY.delete(email.toLowerCase().trim());
  if (ip && ip.trim()) ATTEMPTS_BY_KEY.delete(`ip:${ip.trim()}`);
}
