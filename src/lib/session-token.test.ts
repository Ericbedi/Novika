import { describe, it, expect, beforeEach } from "vitest";
import { signSessionToken, verifySessionToken } from "./session-token";

describe("session-token (cookie signé)", () => {
  beforeEach(() => {
    process.env.AUTH_COOKIE_SECRET = "secret-de-test-0123456789";
  });

  it("accepte un jeton valide", async () => {
    const t = await signSessionToken({ email: "A@B.com", role: "owner" });
    const p = await verifySessionToken(t);
    expect(p?.email).toBe("a@b.com");
    expect(p?.role).toBe("owner");
  });

  it("refuse un jeton modifié (changement de rôle)", async () => {
    const t = (await signSessionToken({ email: "a@b.com", role: "closer" }))!;
    const [body, sig] = t.split(".");
    const forged = btoa(JSON.stringify({ email: "a@b.com", role: "owner", exp: 9999999999 })).replace(/=+$/, "");
    expect(await verifySessionToken(`${forged}.${sig}`)).toBeNull();
    expect(await verifySessionToken(`${body}.x`)).toBeNull();
  });

  it("refuse un jeton expiré, vide ou signé avec une autre clé", async () => {
    const expired = await signSessionToken({ email: "a@b.com", role: "owner" }, -10);
    expect(await verifySessionToken(expired)).toBeNull();
    expect(await verifySessionToken("")).toBeNull();
    expect(await verifySessionToken("true")).toBeNull();
    const t = await signSessionToken({ email: "a@b.com", role: "owner" });
    process.env.AUTH_COOKIE_SECRET = "autre-cle";
    expect(await verifySessionToken(t)).toBeNull();
  });
});
