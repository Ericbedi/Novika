import { UserSession, EmailVerificationToken } from "@/server/data/auth-types";

export const MOCK_USERS: UserSession[] = [
  {
    userId: "usr_owner_verified",
    fullName: "Promises Bedi",
    email: "direction@lome-glow.com",
    country: "TG",
    phone: "+22890123456",
    isEmailVerified: true,
    role: "owner",
    storeSlug: "lome-glow",
    createdAt: "2026-10-01T08:00:00Z",
  },
  {
    userId: "usr_new_unverified",
    fullName: "Amadou Diallo",
    email: "amadou.test@afribuilder.com",
    country: "SN",
    phone: "+221771234567",
    isEmailVerified: false, // Compte non vérifié
    role: "owner",
    storeSlug: "dakar-express",
    createdAt: "2026-11-15T12:00:00Z",
  },
];

export const MOCK_VERIFICATION_TOKENS: EmailVerificationToken[] = [
  {
    id: "ev_amadou_valid",
    email: "amadou.test@afribuilder.com",
    codeHash: Buffer.from("749216").toString("base64"),
    rawCode: "749216", // Code test à 6 chiffres
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // Valide 10 min
    attemptsLeft: 5,
    isVerified: false,
    resendCooldownUntil: new Date(Date.now() + 45 * 1000).toISOString(),
  },
  {
    id: "ev_expired_token",
    email: "expired.user@afribuilder.com",
    codeHash: Buffer.from("112233").toString("base64"),
    rawCode: "112233",
    expiresAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // Déjà expiré
    attemptsLeft: 5,
    isVerified: false,
    resendCooldownUntil: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];
