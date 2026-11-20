import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { generate2FACode, verify2FACode } from "@/server/auth/password-security";
import { send2FAEmail } from "@/server/email/email-service";
import { resolveStorefrontData } from "@/lib/storefront-resolver";
import { getShopProducts } from "@/lib/products-store";
import { POST as loginPostHandler } from "@/app/api/auth/login/route";
import { NextRequest } from "next/server";

describe("Prompt 18 & 2FA Email : Double Authentification & Résolution Vitrine", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("1. Génère et valide un code 2FA à usage unique pour l'e-mail du propriétaire", () => {
    const email = "promisesbedi@gmail.com";
    const code = generate2FACode(email);

    expect(code).toBeDefined();
    expect(code).toMatch(/^\d{6}$/);

    // Première validation réussie
    const verifySuccess = verify2FACode(email, code);
    expect(verifySuccess.success).toBe(true);

    // Réutilisation impossible (usage unique)
    const verifyReuse = verify2FACode(email, code);
    expect(verifyReuse.success).toBe(false);
  });

  it("2. send2FAEmail en environnement de dev affiche le code et réussit avec fallback console", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_HOST;
    delete process.env.GMAIL_USER;

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await send2FAEmail("promisesbedi@gmail.com", "654321");
    expect(result.success).toBe(true);
    expect(result.devCodePrinted).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("3. send2FAEmail en production sans configuration renvoie une erreur explicite", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_HOST;
    delete process.env.GMAIL_USER;
    delete process.env.DEBUG_2FA;

    const result = await send2FAEmail("promisesbedi@gmail.com", "654321");
    expect(result.success).toBe(false);
    expect(result.code).toBe("NO_EMAIL_PROVIDER");
    expect(result.error).toContain("Aucun service d'e-mail configuré");
  });

  it("4. La vitrine publique de Kelio est publiée par défaut avec son produit actif", () => {
    const resolved = resolveStorefrontData("kelio");

    expect(resolved.store.slug).toBe("kelio");
    expect(resolved.store.name).toBe("Kelio");
    expect(resolved.isPreparationMode).toBe(false);
    expect(resolved.activeProducts.length).toBeGreaterThanOrEqual(1);

    const glycemie = resolved.activeProducts.find(
      (p) => p.slug === "accompagnez-votre-equilibre-glycemique"
    );
    expect(glycemie).toBeDefined();
    expect(glycemie?.salePrice).toBe(18500);
  });

  it("5. Une boutique vide non configurée démarre en mode préparation", () => {
    const resolved = resolveStorefrontData("boutique-introuvable-xyz");

    expect(resolved.isPreparationMode).toBe(true);
    expect(resolved.activeProducts.length).toBe(0);
    expect(resolved.storefront.reviews.length).toBe(0);
  });

  it("6. Quand ENABLE_2FA=false, le propriétaire se connecte directement sans étape 2FA", async () => {
    process.env.ENABLE_2FA = "false";

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "promisesbedi@gmail.com",
        password: "ValidPassword123!",
      }),
    });

    const res = await loginPostHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.require2FA).toBeUndefined();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe("promisesbedi@gmail.com");
    expect(data.user.role).toBe("owner");

    // Cookies de session créés
    const setCookie = res.headers.get("set-cookie") || "";
    expect(setCookie).toContain("novika_session");
  });

  it("7. Quand ENABLE_2FA=true, la double authentification 2FA est exigée", async () => {
    process.env.ENABLE_2FA = "true";
    process.env.NODE_ENV = "development";

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "promisesbedi@gmail.com",
        password: "ValidPassword123!",
      }),
    });

    const res = await loginPostHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.require2FA).toBe(true);
    expect(data.email).toBe("promisesbedi@gmail.com");
  });
});
