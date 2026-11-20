import { test } from "@playwright/test";

test("Capture des écrans Prompt 18", async ({ page }) => {
  const artifactDir = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

  // 1. Page d'accueil sobre de connexion
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${artifactDir}/prompt-18-landing-sober-login.png` });

  // 2. Page d'invitation /rejoindre (token de test valide)
  await page.goto("http://localhost:3000/rejoindre?token=inv_preview_7days");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${artifactDir}/prompt-18-join-invitation.png` });

  // 3. Section Réglages -> Équipe
  await page.goto("http://localhost:3000/app/lome-glow/reglages/equipe");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${artifactDir}/prompt-18-team-settings.png` });
});
