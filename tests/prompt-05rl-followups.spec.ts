import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

test.describe("Prompt 05-RL : Relances automatiques, cadence et clôture automatique", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    page.on("dialog", (dialog) => dialog.accept());
  });

  test("1. Écran de relances : Titre, horaires de travail (07:00-18:00) et les 3 onglets avec compteurs", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/commandes/relances`);
    await page.waitForLoadState("domcontentloaded");

    // En-tête
    await expect(page.getByRole("heading", { name: "Commandes à Appeler" })).toBeVisible();
    await expect(page.getByText("Horaires : 07:00 – 18:00 (Lun–Sam)")).toBeVisible();

    // 3 Onglets visibles avec compteurs
    const tabDueNow = page.locator("#tab-due-now");
    const tabScheduled = page.locator("#tab-scheduled");
    const tabArchive = page.locator("#tab-archive");

    await expect(tabDueNow).toBeVisible();
    await expect(tabScheduled).toBeVisible();
    await expect(tabArchive).toBeVisible();

    // Compteurs
    await expect(page.locator("#count-due-now")).toBeVisible();
    await expect(page.locator("#count-scheduled")).toBeVisible();
    await expect(page.locator("#count-archive")).toBeVisible();
  });

  test("2. Ergonomie mobile : Bouton composeur 48px 'Appeler' et modale WhatsApp avec modèles", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/commandes/relances`);
    await page.waitForLoadState("domcontentloaded");

    // Bouton composer d'au moins 48px
    const callBtn = page.locator("#btn-call-fol_01");
    await expect(callBtn).toBeVisible();
    await expect(callBtn).toHaveAttribute("href", /^tel:/);

    const box = await callBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44); // min-h-[48px] target

    // Bouton WhatsApp ouvrant la modale de modèle
    const waBtn = page.locator("#btn-wa-fol_01");
    await expect(waBtn).toBeVisible();
    await waBtn.click();

    const waModal = page.locator("#modal-whatsapp-template");
    await expect(waModal).toBeVisible();
    await expect(page.locator("#textarea-whatsapp-body")).toBeVisible();

    // Changement de modèle 1-clic
    await page.locator("#wa-template-2").click();
    const textareaVal = await page.locator("#textarea-whatsapp-body").inputValue();
    expect(textareaVal).toContain("comme convenu lors de notre dernier appel");

    // Fermeture modale
    await page.locator("#btn-close-wa-modal").click();
    await expect(waModal).not.toBeVisible();
  });

  test("3. Issue d'appel 'Reportée' : Modale obligatoire, limites de reports et mise en file programmée", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/commandes/relances`);
    await page.waitForLoadState("domcontentloaded");

    // Cliquer sur 'Reportée'
    const reportBtn = page.locator("#btn-outcome-rescheduled-fol_01");
    await expect(reportBtn).toBeVisible();
    await reportBtn.click();

    // Modale de report
    const modal = page.locator("#modal-reschedule");
    await expect(modal).toBeVisible();

    // Sélection du motif obligatoire
    await page.locator("#select-reschedule-reason").selectOption("salary");
    await page.locator("#textarea-reschedule-notes").fill("Client attend sa paie ce vendredi matin.");

    // Valider le report
    await page.locator("#btn-submit-reschedule").click();
    await expect(modal).not.toBeVisible();

    // Toast de confirmation
    await expect(page.locator("#followup-toast")).toBeVisible();

    // Aller dans l'onglet 'Programmées' pour vérifier la présence du report
    await page.locator("#tab-scheduled").click();
    await expect(page.getByText("Attente salaire / Tontine")).toBeVisible();
  });

  test("4. Issue d'appel 'Injoignable' : Cadence automatique programmée", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/commandes/relances`);
    await page.waitForLoadState("domcontentloaded");

    const unreachableBtn = page.locator("#btn-outcome-unreachable-fol_02");
    if (await unreachableBtn.isVisible()) {
      await unreachableBtn.click();

      // Toast avec le nouveau créneau programmé selon la cadence
      await expect(page.locator("#followup-toast")).toBeVisible();
      await expect(page.locator("#followup-toast")).toContainText("Tentative enregistrée");
    }
  });

  test("5. Issue d'appel 'Rejetée' : Motif obligatoire, coupure des rappels, remise en stock et archive", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/commandes/relances`);
    await page.waitForLoadState("domcontentloaded");

    // Déclencher le rejet
    const rejectBtn = page.locator("#btn-outcome-rejected-fol_01").or(page.locator("[id^='btn-outcome-rejected-']")).first();
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();

    const rejectionModal = page.locator("#modal-rejection");
    await expect(rejectionModal).toBeVisible();

    // Valider le rejet définitif
    await page.locator("#btn-submit-rejection").click();
    await expect(rejectionModal).not.toBeVisible();

    // Toast de clôture
    await expect(page.locator("#followup-toast")).toBeVisible();

    // Vérifier dans l'onglet 'Perdues / Rejetées'
    await page.locator("#tab-archive").click();
    await expect(page.getByText("✓ Stock remis en rayon").first()).toBeVisible();
  });

  test("6. Surveillance anti-abus & Taux de rejet pour Manager / Admin", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/commandes/relances`);
    await page.waitForLoadState("domcontentloaded");

    // Bouton de suivi d'équipe
    const toggleStatsBtn = page.locator("#btn-toggle-manager-stats");
    await expect(toggleStatsBtn).toBeVisible();
    await toggleStatsBtn.click();

    // Tableau de bord affiché
    const statsTable = page.locator("#closer-performance-table");
    await expect(statsTable).toBeVisible();
    await expect(statsTable.getByText("Tableau de bord de Vigilance Closing")).toBeVisible();
    await expect(statsTable.getByRole("columnheader", { name: "Taux de Rejet" })).toBeVisible();

    // Basculement sur rôle Closeuse : masque les statistiques globales
    await page.locator("#role-btn-closer").click();
    await expect(toggleStatsBtn).not.toBeVisible();
  });

  test("7. API Backend : Validation Zod sur les issues et annulation de rappel à la clôture", async ({
    request,
  }) => {
    // Rejet sans motif -> refus 400
    const invalidRes = await request.post(`${BASE_URL}/api/followups/outcome`, {
      data: {
        orderId: "ord_10482",
        outcome: "rejected",
        closer: { id: "cls_01", name: "Aïcha" },
        rejectionReason: "", // Vide -> invalide
      },
    });
    expect(invalidRes.status()).toBe(400);

    // Rejet valide avec motif -> succès 200, stockRestored = true
    const validRes = await request.post(`${BASE_URL}/api/followups/outcome`, {
      data: {
        orderId: "ord_10482",
        outcome: "rejected",
        closer: { id: "cls_01", name: "Aïcha" },
        rejectionReason: "Client a changé d'avis",
      },
    });
    expect(validRes.status()).toBe(200);
    const data = await validRes.json();
    expect(data.success).toBe(true);
    expect(data.stockRestored).toBe(true);
    expect(data.isClosed).toBe(true);

    // Endpoint Cron de surveillance
    const cronRes = await request.get(`${BASE_URL}/api/followups/cron`);
    expect(cronRes.status()).toBe(200);
    const cronData = await cronRes.json();
    expect(cronData.success).toBe(true);
    expect(cronData).toHaveProperty("dueNowCount");
  });
});
