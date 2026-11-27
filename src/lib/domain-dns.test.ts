import { afterEach, describe, expect, it, vi } from "vitest";
import { domainPointsToPlatform } from "./domain-dns";

const mockDoh = (map: Record<string, unknown[]>) =>
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const u = new URL(url);
    const key = `${u.searchParams.get("type")}:${u.searchParams.get("name")}`;
    return { ok: true, json: async () => ({ Answer: map[key] || [] }) } as Response;
  }));

afterEach(() => vi.unstubAllGlobals());

describe("vérification DNS du domaine", () => {
  it("accepte un A vers l'IP Vercel", async () => {
    mockDoh({ "A:boutique.com": [{ type: 1, data: "76.76.21.21" }] });
    expect((await domainPointsToPlatform("boutique.com")).ok).toBe(true);
  });
  it("accepte un CNAME vers vercel-dns", async () => {
    mockDoh({ "CNAME:www.boutique.com": [{ type: 5, data: "cname.vercel-dns.com." }] });
    expect((await domainPointsToPlatform("www.boutique.com")).ok).toBe(true);
  });
  it("refuse un domaine qui pointe ailleurs ou sans enregistrement", async () => {
    mockDoh({ "A:boutique.com": [{ type: 1, data: "1.2.3.4" }] });
    expect((await domainPointsToPlatform("boutique.com")).ok).toBe(false);
    mockDoh({});
    expect((await domainPointsToPlatform("vide.com")).ok).toBe(false);
  });
});
