import { describe, it, expect } from "vitest";
import {
  sanitizeHtml,
  isWhitelistedIframeSrc,
  cleanHtmlToPlainText,
} from "./html-sanitizer";

describe("HTML Sanitizer - Sécurité & Filtres (Prompt 17 - Phase 17-B)", () => {
  it("bloque impitoyablement les scripts malveillants inline et blocs", () => {
    const malicious = '<p>Super produit</p><script>alert("hack")</script><b>Qualité supérieure</b>';
    const result = sanitizeHtml(malicious);
    expect(result.cleanHtml).not.toContain("<script>");
    expect(result.cleanHtml).not.toContain("alert(");
    expect(result.cleanHtml).toContain("<p>Super produit</p>");
    expect(result.cleanHtml).toContain("<b>Qualité supérieure</b>");
    expect(result.removedElementsCount).toBeGreaterThan(0);
  });

  it("supprime les gestionnaires d'événements javascript inline (onerror, onclick, onload...)", () => {
    const attack = '<img src="valid.jpg" onerror="alert(1)" onclick="stealCookies()" alt="Image">';
    const result = sanitizeHtml(attack);
    expect(result.cleanHtml).not.toContain("onerror");
    expect(result.cleanHtml).not.toContain("onclick");
    expect(result.cleanHtml).toContain('src="valid.jpg"');
    expect(result.cleanHtml).toContain('alt="Image"');
  });

  it("autorise les iframes de vidéos YouTube et Vimeo sur liste blanche", () => {
    const youtubeIframe =
      '<div class="video-container"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315" frameborder="0" allowfullscreen></iframe></div>';
    const vimeoIframe =
      '<iframe src="https://player.vimeo.com/video/76979871" width="640" height="360" frameborder="0"></iframe>';

    const ytResult = sanitizeHtml(youtubeIframe);
    expect(ytResult.cleanHtml).toContain("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(ytResult.cleanHtml).toContain("<iframe");

    const vimeoResult = sanitizeHtml(vimeoIframe);
    expect(vimeoResult.cleanHtml).toContain("https://player.vimeo.com/video/76979871");
    expect(vimeoResult.cleanHtml).toContain("<iframe");
  });

  it("bloque et neutralise les iframes non autorisées (phishing, malware, domaines tiers)", () => {
    const maliciousIframe = '<iframe src="https://attacker-phishing.com/login" width="500"></iframe>';
    const result = sanitizeHtml(maliciousIframe);
    expect(result.cleanHtml).not.toContain("attacker-phishing.com");
    expect(result.cleanHtml).not.toContain("<iframe");
    expect(result.warnings.some((w) => w.includes("YouTube et Vimeo"))).toBe(true);
  });

  it("valide correctement isWhitelistedIframeSrc", () => {
    expect(isWhitelistedIframeSrc("https://www.youtube.com/embed/abc1234")).toBe(true);
    expect(isWhitelistedIframeSrc("https://youtube.com/embed/xyz987")).toBe(true);
    expect(isWhitelistedIframeSrc("https://www.youtube-nocookie.com/embed/vid123")).toBe(true);
    expect(isWhitelistedIframeSrc("https://player.vimeo.com/video/123456789")).toBe(true);

    expect(isWhitelistedIframeSrc("https://google.com")).toBe(false);
    expect(isWhitelistedIframeSrc("https://evil.youtube.com.attacker.com")).toBe(false);
    expect(isWhitelistedIframeSrc("javascript:alert(1)")).toBe(false);
    expect(isWhitelistedIframeSrc("")).toBe(false);
  });

  it("préserve les balises de mise en forme autorisées (h1, h2, h3, p, table, ul, ol, li, a, img)", () => {
    const complexHtml = `
      <h1>Titre Principal</h1>
      <h2>Sous-titre</h2>
      <p>Voici un paragraphe avec du <strong>gras</strong> et de l'<em>italique</em>.</p>
      <table border="1">
        <thead>
          <tr><th>Caractéristique</th><th>Valeur</th></tr>
        </thead>
        <tbody>
          <tr><td>Poids</td><td>250g</td></tr>
        </tbody>
      </table>
      <a href="https://novika.store" target="_blank" rel="noopener noreferrer">Lien sécurisé</a>
    `;
    const result = sanitizeHtml(complexHtml);
    expect(result.cleanHtml).toContain("<h1>Titre Principal</h1>");
    expect(result.cleanHtml).toContain("<h2>Sous-titre</h2>");
    expect(result.cleanHtml).toContain("<strong>gras</strong>");
    expect(result.cleanHtml).toContain("<table");
    expect(result.cleanHtml).toContain('target="_blank"');
    expect(result.cleanHtml).toContain('rel="noopener noreferrer"');
  });

  it("cleanHtmlToPlainText convertit proprement le HTML en texte brut", () => {
    const html = "<h1>Titre</h1><p>Description détaillée du <b>produit</b> avec <a href='#'>lien</a>.</p>";
    const text = cleanHtmlToPlainText(html);
    expect(text).toContain("Titre");
    expect(text).toContain("Description détaillée du produit avec lien.");
    expect(text).not.toContain("<h1>");
    expect(text).not.toContain("<b>");
  });
});
