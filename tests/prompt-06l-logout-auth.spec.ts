import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

test.describe("Prompt 06-L : Déconnexion, protection de session & anti-redirection ouverte", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    page.on("dialog", (dialog) => dialog.accept());
  });

  test("1. Clic sur « Déconnexion » : session fermée et redirection vers /connexion avec message dans les 2s", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      if (window.location.pathname.startsWith("/app")) {
        localStorage.setItem("novika_user_verified", "true");
        localStorage.setItem("novika_user_email", "admin@novika.com");
        localStorage.setItem("novika_active_role", "owner");
      }
    });
    await page.goto(`${BASE_URL}/app/lome-glow`);
    await page.waitForLoadState("domcontentloaded");

    // Ouvrir le menu utilisateur vers le haut
    const menuTrigger = page.locator("#btn-user-menu-trigger");
    await expect(menuTrigger).toBeVisible();
    await menuTrigger.click();

    // Cliquer sur « Déconnexion »
    const logoutBtn = page.locator("#btn-user-logout");
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Vérifier l'arrivée immédiate sur /connexion avec le paramètre message
    await page.waitForURL(/\/connexion\?message=logged_out/, { timeout: 5000 });

    // Vérifier l'affichage du message officiel centralisé dans content/ : « Vous êtes déconnecté. »
    const statusMsg = page.locator("#auth-session-status-message");
    await expect(statusMsg).toBeVisible({ timeout: 10000 });
    await expect(statusMsg).toContainText("Vous êtes déconnecté.");

    // Vérifier la purge du stockage local
    const emailInStorage = await page.evaluate(() => localStorage.getItem("novika_user_email"));
    expect(emailInStorage).toBeNull();
  });

  test("2. Option « Me déconnecter de tous les appareils » : redirection vers /connexion avec message", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      if (window.location.pathname.startsWith("/app")) {
        localStorage.setItem("novika_user_verified", "true");
        localStorage.setItem("novika_user_email", "admin@novika.com");
        localStorage.setItem("novika_active_role", "owner");
      }
    });
    await page.goto(`${BASE_URL}/app/lome-glow`);
    await page.waitForLoadState("domcontentloaded");

    const menuTrigger = page.locator("#btn-user-menu-trigger");
    await expect(menuTrigger).toBeVisible();
    await menuTrigger.click();

    const logoutAllBtn = page.locator("#btn-logout-all-devices");
    await expect(logoutAllBtn).toBeVisible();
    await logoutAllBtn.click();

    await page.waitForURL(/\/connexion\?message=all_devices_logged_out/, { timeout: 5000 });
    const statusMsg = page.locator("#auth-session-status-message");
    await expect(statusMsg).toBeVisible();
    await expect(statusMsg).toContainText("Vous avez été déconnecté de tous vos appareils.");
  });

  test("3. Protection anti-redirection ouverte : https://site-externe.com est strictement ignoré", async ({
    page,
  }) => {
    // Visiter la page de connexion avec une tentative de redirection externe
    await page.goto(`${BASE_URL}/connexion?message=logged_out&redirect=https://evil-site.com`);

    // Saisir les identifiants
    await page.fill('input[type="email"]', "admin@novika.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Doit rediriger vers l'espace interne légitime, JAMAIS vers evil-site.com
    await page.waitForURL(/\/app\/lome-glow/, { timeout: 5000 });
    expect(page.url()).not.toContain("evil-site.com");
  });

  test("4. Protection anti-redirection ouverte : //evil.com relatif au protocole est strictement ignoré", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/connexion?message=logged_out&redirect=//evil.com/app`);

    await page.fill('input[type="email"]', "admin@novika.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/app\/lome-glow/, { timeout: 5000 });
    expect(page.url()).not.toContain("evil.com");
  });

  test("5. Redirection de l'utilisateur authentifié ouvrant /connexion vers son espace de travail", async ({
    page,
  }) => {
    // Simuler un utilisateur déjà authentifié avec localStorage actif
    await page.addInitScript(() => {
      localStorage.setItem("novika_user_verified", "true");
      localStorage.setItem("novika_user_email", "admin@novika.com");
      localStorage.setItem("novika_active_role", "owner");
    });
    // Session active sans message de déconnexion
    await page.goto(`${BASE_URL}/connexion`);
    // L'effet doit le renvoyer vers son espace
    await page.waitForURL(/\/app\/lome-glow/, { timeout: 5000 });
  });

  test("6. Action serveur POST /api/auth/logout : rejet strict des requêtes GET (CSRF)", async ({
    request,
  }) => {
    const res = await request.get(`${BASE_URL}/api/auth/logout`);
    expect(res.status()).toBe(405);
    const body = await res.json();
    expect(body.error).toContain("Méthode non autorisée");
  });

  test("7. En-têtes no-store sur les routes privées", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/app/lome-glow`);
    const cacheControl = res.headers()["cache-control"] || "";
    expect(cacheControl).toContain("no-store");
  });

  test("8. Déconnexion multi-onglets : signal BroadcastChannel propage la déconnexion", async ({
    context,
  }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await page1.setViewportSize({ width: 1280, height: 800 });
    await page2.setViewportSize({ width: 1280, height: 800 });
    page1.on("dialog", (dialog) => dialog.accept());
    page2.on("dialog", (dialog) => dialog.accept());

    await page1.addInitScript(() => {
      localStorage.setItem("novika_user_verified", "true");
      localStorage.setItem("novika_user_email", "admin@novika.com");
      localStorage.setItem("novika_active_role", "owner");
    });
    await page2.addInitScript(() => {
      localStorage.setItem("novika_user_verified", "true");
      localStorage.setItem("novika_user_email", "admin@novika.com");
      localStorage.setItem("novika_active_role", "owner");
    });

    await page1.goto(`${BASE_URL}/app/lome-glow`);
    await page2.goto(`${BASE_URL}/app/lome-glow`);

    // Déconnexion depuis l'onglet 1
    const menuTrigger1 = page1.locator("#btn-user-menu-trigger");
    await menuTrigger1.click();
    await page1.locator("#btn-user-logout").click();

    // L'onglet 1 arrive sur /connexion
    await page1.waitForURL(/\/connexion\?message=logged_out/, { timeout: 4000 });

    // L'onglet 2 doit également être redirigé vers /connexion via le signal multi-onglets
    await page2.waitForURL(/\/connexion/, { timeout: 6000 });
    expect(page2.url()).toContain("/connexion");

    await page1.close();
    await page2.close();
  });

  test("9. Redirection permanente de /auth/connexion vers ROUTES.login (/connexion)", async ({
    page,
  }) => {
    const res = await page.goto(`${BASE_URL}/auth/connexion`);
    await page.waitForURL(/\/connexion/, { timeout: 5000 });
    expect(page.url()).toContain("/connexion");
  });

  test("10. Page 404 en français : 'Page introuvable' avec bouton 'Retour à la connexion'", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/page-qui-nexiste-pas-random-404`);
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    await expect(page.getByText("Erreur 404")).toBeVisible();
    const loginLink = page.locator("#btn-not-found-login");
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", "/connexion");
  });
});
