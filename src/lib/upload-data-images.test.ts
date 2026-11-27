import { describe, it, expect, vi, afterEach } from "vitest";
import { ensureProductImagesRemote } from "./upload-data-images";
import type { Product } from "@/server/data/types";

afterEach(() => vi.unstubAllGlobals());

describe("ensureProductImagesRemote", () => {
  it("remplace les images base64 par l'adresse publique renvoyée par le stockage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string) => {
        if (String(input).startsWith("data:")) return { blob: async () => new Blob(["x"], { type: "image/png" }) };
        return { ok: true, json: async () => ({ success: true, url: "https://cdn.test/p/1.png" }) };
      })
    );
    const p = { id: "p1", name: "T", images: ["data:image/png;base64,AAAA", "https://x.test/a.jpg"] } as unknown as Product;
    const r = await ensureProductImagesRemote("kelio", p);
    expect(r.changed).toBe(true);
    expect(r.product.images).toEqual(["https://cdn.test/p/1.png", "https://x.test/a.jpg"]);
  });

  it("garde l'image locale si l'envoi échoue (et le signale)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string) =>
        String(input).startsWith("data:")
          ? { blob: async () => new Blob(["x"], { type: "image/png" }) }
          : { ok: false, json: async () => ({}) }
      )
    );
    const p = { id: "p1", name: "T", images: ["data:image/png;base64,AAAA"] } as unknown as Product;
    const r = await ensureProductImagesRemote("kelio", p);
    expect(r.changed).toBe(false);
    expect(r.failed).toBe(1);
  });
});
