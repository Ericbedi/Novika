/**
 * Jeton de session signé (HMAC-SHA256, Web Crypto : compatible middleware Edge et routes Node).
 * Impossible à fabriquer sans AUTH_COOKIE_SECRET (variable serveur uniquement).
 */
export interface SessionTokenPayload {
  email: string;
  role: string;
  exp: number; // secondes epoch
}

export const SESSION_COOKIE = "novika_auth";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;
const enc = new TextEncoder();

function toB64Url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return toB64Url(new Uint8Array(sig));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isSessionSigningEnabled(): boolean {
  return Boolean(process.env.AUTH_COOKIE_SECRET);
}

export async function signSessionToken(
  payload: { email: string; role: string },
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<string | null> {
  const secret = process.env.AUTH_COOKIE_SECRET;
  if (!secret) return null;
  const body: SessionTokenPayload = {
    email: payload.email.trim().toLowerCase(),
    role: payload.role,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = toB64Url(enc.encode(JSON.stringify(body)));
  const signature = await sign(secret, encoded);
  return `${encoded}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionTokenPayload | null> {
  const secret = process.env.AUTH_COOKIE_SECRET;
  if (!secret || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const expected = await sign(secret, parts[0]);
    if (!safeEqual(expected, parts[1])) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64Url(parts[0]))) as SessionTokenPayload;
    if (!payload.email || !payload.role || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
