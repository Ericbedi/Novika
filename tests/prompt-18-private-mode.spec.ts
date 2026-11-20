import { test, expect } from "@playwright/test";

test.describe("Prompt 18 : Mode Privé & Sécurité de l'Équipe", () => {
  // 1. Fermeture des inscriptions côté serveur
  test("1. Appel direct API d'inscription refuse l'accès en 403", async ({ request }) => {
    const resRegister = await request.post("/api/auth/register", {
      data: { email: "public.user@gmail.com", password: "Password123!" },
    });
    expect(resRegister.status()).toBe(403);
    const bodyRegister = await resRegister.json();
    expect(bodyRegister.code).toBe("SIGNUP_CLOSED");
    expect(bodyRegister.error).toContain("inscriptions publiques sont fermées");

    const resSignup = await request.post("/api/auth/signup", {
      data: { email: "public.user@gmail.com", password: "Password123!" },
    });
    expect(resSignup.status()).toBe(403);
  });

  // 2. Redirection de la page d'inscription vers la connexion
  test("2. Accéder à /inscription redirige vers la connexion avec message explicite", async ({ page }) => {
    await page.goto("/inscription");
    await expect(page).toHaveURL(/.*\/connexion\?message=signup_closed/);
    const alert = page.locator("#auth-session-status-message");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("inscriptions publiques sont fermées");
  });

  // 3. Page d'accueil sobre sans texte commercial
  test("3. La page d'accueil affiche une interface sobre de connexion (sans pub ni tarifs)", async ({ page }) => {
    await page.goto("/");
    // Vérifie le logo et le titre Connexion
    await expect(page.locator("h1")).toContainText("Connexion");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toContainText("Se connecter");

    // Aucun texte commercial ni de tarification
    await expect(page.locator("text=Tarifs")).not.toBeVisible();
    await expect(page.locator("text=Créer un compte")).not.toBeVisible();
    await expect(page.locator("text=Continuer avec Google")).not.toBeVisible();
  });

  // 4. Vitrine publique accessible sans compte
  test("4. La vitrine publique (/boutique/...) reste accessible sans compte pour les clients", async ({ page }) => {
    await page.goto("/boutique/lome-glow");
    await expect(page).toHaveURL(/.*\/boutique\/lome-glow/);
    // Le catalogue public se charge
    await expect(page.locator("body")).not.toContainText("Veuillez vous connecter");
  });

  // 5. Tentative de connexion inconnue (Allowlist : message neutre)
  test("5. Une adresse hors allowlist reçoit le message neutre 'Identifiants incorrects'", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: { email: "inconnu_total@gmail.com", password: "Password123!" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Identifiants incorrects.");
  });

  // 6. Double authentification (2FA) pour le compte Propriétaire
  test("6. La connexion propriétaire exige le code de double authentification (2FA)", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: { email: "promisesbedi@gmail.com", password: "OwnerPassword2026!" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.require2FA).toBe(true);
    expect(body.email).toBe("promisesbedi@gmail.com");
  });

  // 7. Page d'acceptation d'invitation avec token invalide
  test("7. Un lien d'invitation avec token invalide affiche une erreur sécurisée", async ({ page }) => {
    await page.goto("/rejoindre?token=invalid_token_999");
    await expect(page.locator("text=Lien inaccessible")).toBeVisible();
  });
});
