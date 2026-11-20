import { describe, it, expect, beforeEach } from "vitest";
import {
  validateDomainFormat,
  generateDefaultDnsRecords,
  isSubdomain,
  isDomainTakenAcrossPlatform,
  clearCustomDomainsMemory,
  saveStoreDomains,
  getStoreDomains,
  findStoreByHost,
  VERCEL_APEX_IP,
  VERCEL_CNAME_TARGET,
  CustomDomain,
} from "./custom-domains";
import {
  NOVIKA_SIMPLE_DEFAULTS,
  createNovikaSimpleSections,
  getSectionDefaultSettings,
} from "./theme-engine/novika-simple";
import { isSectionEmpty } from "./theme-engine/schemas";

describe("Prompt 19 : Domaines Personnalisés & Multi-Boutiques", () => {
  beforeEach(() => {
    clearCustomDomainsMemory();
  });

  describe("Validation stricte du format de nom de domaine", () => {
    it("accepte un domaine racine valide (apex)", () => {
      const res = validateDomainFormat("kelio.com");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("kelio.com");
    });

    it("accepte un sous-domaine valide (www ou sous-domaine)", () => {
      const res = validateDomainFormat("www.kelio.com");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("www.kelio.com");

      const subRes = validateDomainFormat("shop.kaelis-afrik.com");
      expect(subRes.isValid).toBe(true);
      expect(subRes.normalized).toBe("shop.kaelis-afrik.com");
    });

    it("nettoie automatiquement les protocoles https:// et slash de fin", () => {
      const res = validateDomainFormat("https://kelio.com/");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("kelio.com");
    });

    it("refuse les adresses IP numériques", () => {
      const res = validateDomainFormat("192.168.1.50");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("adresse IP");
    });

    it("refuse les domaines sans extension TLD valide", () => {
      const res = validateDomainFormat("maboutique");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("extension");
    });

    it("refuse les caractères spéciaux, accents ou espaces", () => {
      const res = validateDomainFormat("café-bénin.com");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("caractères non autorisés");
    });

    it("refuse les domaines réservés par la plateforme Novika", () => {
      expect(validateDomainFormat("novika.com").isValid).toBe(false);
      expect(validateDomainFormat("novika.africa").isValid).toBe(false);
      expect(validateDomainFormat("admin.novika.africa").isValid).toBe(false);
      expect(validateDomainFormat("localhost").isValid).toBe(false);
      expect(validateDomainFormat("novika-delta.vercel.app").isValid).toBe(false);
    });
  });

  describe("Génération des enregistrements DNS Vercel", () => {
    it("détecte correctement un domaine apex vs sous-domaine", () => {
      expect(isSubdomain("kelio.com")).toBe(false);
      expect(isSubdomain("www.kelio.com")).toBe(true);
      expect(isSubdomain("boutique.kelio.com")).toBe(true);
    });

    it("génère un enregistrement A @ pointant vers 76.76.21.21 pour un domaine apex", () => {
      const records = generateDefaultDnsRecords("kelio.com");
      expect(records).toHaveLength(1);
      expect(records[0].type).toBe("A");
      expect(records[0].name).toBe("@");
      expect(records[0].value).toBe(VERCEL_APEX_IP);
      expect(records[0].value).toBe("76.76.21.21");
    });

    it("génère un enregistrement CNAME pointant vers cname.vercel-dns.com pour www", () => {
      const records = generateDefaultDnsRecords("www.kelio.com");
      expect(records).toHaveLength(1);
      expect(records[0].type).toBe("CNAME");
      expect(records[0].name).toBe("www");
      expect(records[0].value).toBe(VERCEL_CNAME_TARGET);
      expect(records[0].value).toBe("cname.vercel-dns.com");
    });
  });

  describe("Unicité stricte inter-boutiques sur la plateforme", () => {
    it("interdit qu'un domaine déjà utilisé soit attribué à une seconde boutique", () => {
      const domA: CustomDomain = {
        id: "dom_1",
        storeSlug: "lome-glow",
        domain: "kelio.com",
        isPrimary: true,
        status: "active",
        dnsRecords: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveStoreDomains("lome-glow", [domA]);

      // Vérifier depuis la boutique B
      const checkOther = isDomainTakenAcrossPlatform("kelio.com", "abidjan-bio");
      expect(checkOther.isTaken).toBe(true);
      expect(checkOther.takenByStore).toBe("lome-glow");

      // Vérifier depuis la même boutique (autorisé)
      const checkSame = isDomainTakenAcrossPlatform("kelio.com", "lome-glow");
      expect(checkSame.isTaken).toBe(false);
    });
  });

  describe("Routage Host Header et Redirection 301 secondaire", () => {
    it("retrouve la boutique associée et identifie le domaine principal pour redirection 301", () => {
      const primary: CustomDomain = {
        id: "dom_primary",
        storeSlug: "kaelis",
        domain: "kaelis.com",
        isPrimary: true,
        status: "active",
        dnsRecords: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const secondary: CustomDomain = {
        id: "dom_secondary",
        storeSlug: "kaelis",
        domain: "www.kaelis.com",
        isPrimary: false,
        redirectToPrimary: true,
        status: "active",
        dnsRecords: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveStoreDomains("kaelis", [primary, secondary]);

      // Hôte principal
      const matchPrimary = findStoreByHost("kaelis.com");
      expect(matchPrimary).not.toBeNull();
      expect(matchPrimary?.storeSlug).toBe("kaelis");
      expect(matchPrimary?.isPrimary).toBe(true);

      // Hôte secondaire avec redirection vers principal
      const matchSecondary = findStoreByHost("www.kaelis.com");
      expect(matchSecondary).not.toBeNull();
      expect(matchSecondary?.storeSlug).toBe("kaelis");
      expect(matchSecondary?.isPrimary).toBe(false);
      expect(matchSecondary?.redirectToPrimary).toBe(true);
      expect(matchSecondary?.primaryDomain).toBe("kaelis.com");
    });
  });
});

describe("Prompt 21-b : Vitrine à 3 pages & Modèle « Novika Simple »", () => {
  it("génère exactement les 8 sections du modèle Novika Simple", () => {
    const sections = createNovikaSimpleSections();
    expect(sections).toHaveLength(8);

    const types = sections.map((s) => s.type);
    expect(types).toEqual([
      "announcement_bar",
      "hero_banner",
      "featured_products",
      "image_with_text",
      "rich_text",
      "reassurance",
      "verified_reviews",
      "whatsapp_block",
    ]);
  });

  it("masque automatiquement les sections vides pour les visiteurs publics", () => {
    // 1. Barre annonce sans messages
    expect(isSectionEmpty("announcement_bar", { messages: [] })).toBe(true);
    expect(
      isSectionEmpty("announcement_bar", {
        messages: [{ text: "Livraison COD" }],
      })
    ).toBe(false);

    // 2. Héros sans titre ni image
    expect(isSectionEmpty("hero_banner", { headline: "", subheadline: "", desktopImage: "" })).toBe(true);
    expect(isSectionEmpty("hero_banner", { headline: "Mon Produit" })).toBe(false);

    // 3. Image with text sans titre ni texte ni image
    expect(isSectionEmpty("image_with_text", { title: "", bodyText: "", imageUrl: "" })).toBe(true);
    expect(isSectionEmpty("image_with_text", { title: "Offre Spéciale" })).toBe(false);

    // 4. Rich text sans contenu
    expect(isSectionEmpty("rich_text", { title: "", content: "" })).toBe(true);
    expect(isSectionEmpty("rich_text", { content: "<p>Notre histoire</p>" })).toBe(false);

    // 5. Reassurance sans items
    expect(isSectionEmpty("reassurance", { items: [] })).toBe(true);
    expect(
      isSectionEmpty("reassurance", {
        items: [{ title: "Paiement à la livraison", description: "100% Cash" }],
      })
    ).toBe(false);

    // 6. WhatsApp sans numéro
    expect(isSectionEmpty("whatsapp_block", { phoneNumber: "" })).toBe(true);
    expect(isSectionEmpty("whatsapp_block", { phoneNumber: "+22890000000" })).toBe(false);
  });

  it("permet la restauration du contenu d'origine via getSectionDefaultSettings", () => {
    const heroDefaults = getSectionDefaultSettings("hero_banner");
    expect(heroDefaults).not.toBeNull();
    expect(heroDefaults?.headline).toBe("Découvrez notre sélection exclusive");
    expect(heroDefaults?.button1Text).toBe("Voir les produits");

    const reaDefaults = getSectionDefaultSettings("reassurance");
    expect(reaDefaults).not.toBeNull();
    expect(reaDefaults?.items).toHaveLength(3);
    expect(reaDefaults?.items[0].title).toBe("Livraison Rapide");
  });
});
