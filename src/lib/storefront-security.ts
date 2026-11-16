/**
 * Règles de sécurité et de conformité pour la vitrine publique AfriBuilder.
 * Exigence stricte E.1 :
 * Détection des textes d'exemple et BLOCAGE DE PUBLICATION si un texte d'exemple subsiste.
 */

export const SAMPLE_TEXT_PATTERNS = [
  /\[EXEMPLE\]/i,
  /lorem\s+ipsum/i,
  /texte\s+par\s+d[ée]faut/i,
  /votre\s+texte\s+ici/i,
  /exemple\s+de\s+description/i,
  /boutique\s+de\s+d[ée]monstration/i,
  /ins[ée]rer\s+ici/i,
  /remplacer\s+ce\s+texte/i,
  /sample\s+text/i,
];

export interface PublicationCheckResult {
  canPublish: boolean;
  errors: string[];
  sampleTextFound: string[];
}

/**
 * Analyse l'ensemble des textes d'une boutique avant autorisation de mise en ligne.
 * Empêche qu'une boutique soit publiée avec des placeholders ou des faux textes.
 */
export function validateStorefrontForPublishing(storeData: {
  name: string;
  announcement?: string;
  brandStory?: string;
  faq?: { question: string; answer: string }[];
  guarantees?: { title: string; description: string }[];
  hasActiveProducts: boolean;
  hasContactMethod: boolean;
  hasConfiguredCurrency: boolean;
}): PublicationCheckResult {
  const errors: string[] = [];
  const sampleTextFound: string[] = [];

  // 1. Conditions préalables serveur strictes
  if (!storeData.hasActiveProducts) {
    errors.push("Au moins un produit actif et publié est requis pour mettre la boutique en ligne.");
  }
  if (!storeData.hasContactMethod) {
    errors.push("Un moyen de contact direct (numéro WhatsApp ou téléphone) est requis.");
  }
  if (!storeData.hasConfiguredCurrency) {
    errors.push("Une devise principale doit être configurée.");
  }

  // 2. Détection des textes d'exemple
  const checkText = (text: string | undefined, locationLabel: string) => {
    if (!text) return;
    for (const pattern of SAMPLE_TEXT_PATTERNS) {
      if (pattern.test(text)) {
        sampleTextFound.push(`${locationLabel} : Contient "${text.substring(0, 40)}..."`);
      }
    }
  };

  checkText(storeData.name, "Nom de la boutique");
  checkText(storeData.announcement, "Bannière d'annonce défilante");
  checkText(storeData.brandStory, "Histoire de la marque");

  if (storeData.faq) {
    storeData.faq.forEach((item, idx) => {
      checkText(item.question, `FAQ #${idx + 1} Question`);
      checkText(item.answer, `FAQ #${idx + 1} Réponse`);
    });
  }

  if (storeData.guarantees) {
    storeData.guarantees.forEach((g, idx) => {
      checkText(g.title, `Garantie #${idx + 1} Titre`);
      checkText(g.description, `Garantie #${idx + 1} Description`);
    });
  }

  if (sampleTextFound.length > 0) {
    errors.push(
      `Publication bloquée : Des textes d'exemple ou maquettes non remplacés ont été détectés (${sampleTextFound.length} occurrence(s)). Veuillez renseigner le contenu réel de votre marque.`
    );
  }

  return {
    canPublish: errors.length === 0,
    errors,
    sampleTextFound,
  };
}

/**
 * Calcule l'état d'ouverture en direct ("Ouvert maintenant" vs "Fermé")
 * selon le fuseau horaire du pays de la boutique (ex: Afrique de l'Ouest GMT / Afrique centrale GMT+1).
 */
export function getLiveStoreOpenStatus(
  timezoneOffsetHours: number = 0, // GMT 0 pour Lomé/Abidjan/Dakar, +1 pour Douala/Yaoundé
  openHour: number = 8,
  closeHour: number = 19
): {
  isOpen: boolean;
  statusLabel: string;
  nextOpenLabel: string;
} {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const localHours = (utcHours + timezoneOffsetHours + 24) % 24;

  const isOpen = localHours >= openHour && localHours < closeHour;

  if (isOpen) {
    return {
      isOpen: true,
      statusLabel: "Ouvert maintenant",
      nextOpenLabel: `Ferme à ${closeHour}h00`,
    };
  } else {
    return {
      isOpen: false,
      statusLabel: "Fermé actuellement",
      nextOpenLabel: `Ouvre à ${openHour}h00`,
    };
  }
}

/**
 * Construit un lien WhatsApp pré-rempli sécurisé pour la boutique.
 */
export function buildStoreWhatsAppLink(
  rawPhone: string,
  message: string
): string {
  const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
  const encodedText = encodeURIComponent(message.trim());
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
