# Matrice de Couverture Complète — Thème Vitrine « Novika Classique »
*(Conforme aux exigences des Prompts 12 et 12-b · 100% composants React + Tailwind originaux · 0 code tiers)*

Dernière mise à jour : 19 Novembre 2026 (Phase 1)

---

## Statuts de la matrice
- **FAIT** : Implémenté, typé, validé par schéma Zod et couvert par tests automatisés.
- **EN COURS** : En cours d'intégration dans la phase actuelle.
- **REMPLACÉ** : Fonctionnalité adaptée au modèle africain COD avec remplaçant moderne sécurisé.
- **NON REPRIS** : Délibérément écarté pour les besoins du commerce COD africain (avec motif explicite).

---

## A. Réglages généraux du thème (par boutique)

| Élément / Réglage | Description / Options | Statut | Remarques / Composant |
| :--- | :--- | :--- | :--- |
| **Modes de l'éditeur** | Basculement 1-clic « Simple » (palettes, polices, arrondi) et « Avancé » (détails complets) | **FAIT** | Intégré dans l'éditeur latéral `ThemeSectionEditorModal` |
| **Logo & Favicon** | URL image, largeur du logo (80px - 320px), favicon (.ico / .png / .svg) | **FAIT** | Stocké dans `ThemeGeneralSettings.layout` |
| **Palettes de couleurs (jusqu'à 5)** | Fond, dégradé, texte, bouton, texte bouton, bouton secondaire, ombre | **FAIT** | 5 palettes complètes par preset, sélectionnable par section |
| **Typographie** | Polices libres sans redevance (Poppins, Inter, Plus Jakarta Sans, Montserrat), échelle titres et corps | **FAIT** | Servies via `next/font`, ratios typographiques modulaires |
| **Mise en page** | Largeur de page (narrow 1024px, standard 1200px, wide 1440px, full 100%), espacement des sections | **FAIT** | `SectionWrapper.tsx` avec conteneur adaptatif |
| **Grilles responsive** | Espacement horizontal et vertical des grilles cartes produits et colonnes | **FAIT** | Géré avec Tailwind `gap-3.5` (mobile) à `gap-6` (desktop) |
| **Animations** | Apparition au défilement, effet de survol, respect strict de `prefers-reduced-motion` | **FAIT** | Classes CSS `motion-reduce:transition-none` |
| **Boutons** | Épaisseur (1-3px), opacité, arrondi (none, sm, md, lg, full), ombre (2xs, xs, sm, md) | **FAIT** | `buttonRadius` et styles de boutons unifiés |
| **Pastilles de variantes** | Alignement, bordure, rayon de courbure et feedback actif | **FAIT** | Sélecteur de variantes dans `NovikaProductPage.tsx` |
| **Champs de saisie** | Bordure, rayon d'arrondi, focus ring, ombre discrète | **FAIT** | Standardisé sur le formulaire COD et l'éditeur |
| **Cartes produit** | Style standard ou carte avec padding, marge image, alignement texte, rayon, ombre | **FAIT** | `FeaturedProductsSection.tsx` et `catalogue/page.tsx` |
| **Cartes de collection** | Ratio d'image (1:1, 4:3, 16:9), texte centré/gauche, ombre | **FAIT** | `FeaturedCollectionsSection.tsx` |
| **Cartes d'articles de blog** | Ratio d'image, titre, extrait, auteur, date (Phase 2) | **EN COURS (Phase 2)** | Planifié pour la Phase 2 |
| **Conteneurs de texte & médias** | Bordures, arrondis et ombres des modales et drawers | **FAIT** | `ThemeSectionEditorModal` et tiroirs latéraux |
| **Badges de statut** | Badges « Promo » (rose-600) et « Stock bas » (amber-500) basés sur le stock réel | **FAIT** | Calcul automatique sans faux décompte d'urgence |
| **Informations de marque** | Accroche, description de la boutique, logo | **FAIT** | `FooterSection.tsx` et pied de page |
| **Réseaux sociaux** | Liens Facebook, Instagram, YouTube, TikTok, X, WhatsApp, Snapchat, Pinterest | **FAIT** | `FooterSection.tsx` et en-tête |
| **Recherche** | Recherche prédictive, affichage du prix et de la marque | **FAIT** | Command Palette & filtre catalogue temps-réel |
| **Format de devise** | Affichage du code (FCFA, XOF, XAF, GNF, etc.), entiers stricts sans décimales pour XOF/XAF | **FAIT** | `formatFcfa` dans `src/lib/money.ts` |
| **Récapitulatif de commande** | Remplace le panier traditionnel : affichage marque, note pour la commande, palette | **FAIT** | Formulaire COD direct 1-clic `StandardOrderForm.tsx` |

---

## B. Sections de la bibliothèque (masquées si vides)

| Section | Type technique | Statut | Règle « Vide » & Particularités |
| :--- | :--- | :--- | :--- |
| **En-tête de vitrine** | `header` | **FAIT** | Logo, menu, recherche, bouton WhatsApp, sélecteur de pays, en-tête collant |
| **Bandeau d'annonce** | `announcement_bar` | **FAIT** | Masqué si messages vides. Défilement infini, vitesse, lien, palette |
| **Pied de page** | `footer` | **FAIT** | Masqué si sans contenu. Moyens de paiement en texte brut (« Paiement à la livraison », « Mobile Money »), aucun logo tiers non autorisé |
| **Bannière d'accueil** | `hero_banner` | **FAIT** | Masqué si image/titre vides. 1-2 images (ordi/mobile), calque sombre 0-90%, jusqu'à 2 boutons |
| **Diaporama (Slideshow)** | `slideshow` | **FAIT** | 1 à 5 diapositives, calque réglable, vitesse, flèches, responsive |
| **Image avec texte** | `image_with_text` | **FAIT** | Masqué si vide. Position gauche/droite, largeur 33/50/66%, titre, texte, CTA |
| **Colonnes d'information** | `multi_columns` | **FAIT** | Masqué si vide. 2 à 4 colonnes, icône/image, balayage tactile mobile |
| **Multi-lignes** | `multi_lines` | **FAIT** | Alternance de lignes image/texte pour présentation de marque |
| **Collage d'images** | `image_collage` | **FAIT** | Grille asymétrique 3-4 images pour mise en valeur visuelle |
| **Collections en vedette** | `featured_collections` | **FAIT** | Masqué si aucune collection configurée. Grille avec ratio et colonnes |
| **Produits en vedette** | `featured_products` | **FAIT** | Masqué si aucun produit. Badges « Promo » et « Stock bas » réels automatiques |
| **Produit unique en vedette** | `featured_product` | **FAIT** | Zoom sur un article vedette avec formulaire COD intégré direct |
| **Bandeau défilant (Marquee)** | `marquee` | **FAIT** | Masqué si vide. Texte ou logos de confiance, vitesse, palette |
| **Réassurance COD** | `reassurance` | **FAIT** | Masqué si vide. 3 à 4 blocs icône + titre + texte (Livraison rapide, Paiement après vérification) |
| **Avis vérifiés** | `verified_reviews` | **FAIT** | Strictement réservé aux vraies commandes livrées en base (`isVerifiedBuyer === true`) |
| **Témoignages** | `testimonials` | **FAIT** | Avis saisis par l'admin, étiquetés obligatoirement « Témoignage », jamais « Achat vérifié » |
| **Tableau comparatif** | `comparison_table` | **FAIT** | Avertissement d'intégrité commerciale si 0 critère neutre/égalitaire |
| **FAQ (Questions fréquentes)** | `faq` | **FAIT** | Masqué si vide. Accordéon accessible WAI-ARIA, questions/réponses |
| **Texte riche** | `rich_text` | **FAIT** | Masqué si vide. HTML strictement assaini via `sanitizeHtml` (liste blanche) |
| **Séparateur de sections** | `divider` | **FAIT** | Ligne pleine, tirets, vague SVG ou espacement vide |
| **Vidéo responsive** | `video` | **FAIT** | YouTube, Vimeo ou MP4 hébergé, options muet et lecture auto |
| **Bloc WhatsApp** | `whatsapp_block` | **FAIT** | Masqué si numéro vide. Message pré-rempli encodé, badge de disponibilité |
| **Constructeur de section (Builder)** | `builder_block` | **FAIT** | Blocs modulaires (texte, accordéon, colonnes, icône+texte) SANS code HTML libre |
| **Formulaire de contact** | `contact_form` | **FAIT** | Protection anti-spam, envoi vers WhatsApp/email sans exposer d'identifiants |
| **Inscription aux offres** | `newsletter_signup` | **FAIT** | Case de consentement explicite, désinscription en 1-clic |

---

## C. Page produit (Fiche d'achat COD)

| Élément | Description / Spécification | Statut |
| :--- | :--- | :--- |
| **Galerie média** | Dispositions (miniatures horizontales, grille), zoom au clic, miniatures tactiles mobile | **FAIT** |
| **Composant ProductImage** | Remplacement neutre SVG vectoriel si image absente ou défaillante (zéro icône cassée) | **FAIT** |
| **Bloc d'informations collant** | Colonne d'achat collante sur desktop (`sticky top-6`) | **FAIT** |
| **Blocs ordonnables** | Titre, avis réels, prix, prix barré réel (zéro faux prix), variantes, formulaire COD | **FAIT** |
| **Formulaire de commande COD** | Intégré directement sur la page produit (remplace le panier e-commerce classique) | **FAIT** |
| **Bouton collant mobile** | Bouton « Commander · {prix} » fixé en bas d'écran sur smartphone (390px, zone tactile $\ge 44\text{px}$) | **FAIT** |
| **Bloc d'urgence authentique** | « Plus que X en stock » uniquement si le stock réel $\le 10$. Aucun compte à rebours fictif | **FAIT** |
| **Offres et packs (Prompt 05-V)** | Packs 1 unité, 2 unités (-15%), 3 unités (-25%) calculés sur le prix réel | **FAIT** |
| **3 Modèles de page produit** | « Standard », « Page de vente longue » (avec FAQ/témoignages/comparatif), « Minimal » | **FAIT** |

---

## D. Pages de la vitrine

| Page | Route / Emplacement | Statut | Description |
| :--- | :--- | :--- | :--- |
| **Accueil boutique** | `/boutique/[store]` | **FAIT** | Vitrine pilotée par le moteur de thème et les sections ordonnées |
| **Fiche produit** | `/boutique/[store]/produit/[id]` | **FAIT** | Fiche d'achat COD avec chargement par identifiant exact et 404 si introuvable |
| **Page collection** | `/boutique/[store]/collection/[slug]` & `/catalogue` | **FAIT** | Bannière de collection, filtres (prix, stock, collection), tri |
| **Pages de contenu légal** | `/boutique/[store]/page/[slug]` | **FAIT** | CGV, Livraison & Retours, Confidentialité, Notre histoire, Contact |
| **Page 404 Vitrine** | `src/app/not-found.tsx` & page 404 vitrine | **FAIT** | En français avec bouton de retour au catalogue ou à l'accueil |
| **Page En préparation** | `/boutique/[store]/preparation` | **FAIT** | Remplace l'ancienne page de mot de passe Shopify |

---

## E. Éléments NON repris (avec motif explicite & solution de remplacement)

| Fonction d'origine Shopify | Statut | Motif d'exclusion | Solution de remplacement Novika |
| :--- | :--- | :--- | :--- |
| **Code HTML / JavaScript libre & Applications tierces injectées** | **REMPLACÉ** | Risque critique de sécurité (XSS, vol de sessions, scripts malveillants de tracking) | Blocs constructeurs modulaires sécurisés + Module Intégrations contrôlé (Meta Pixel CAPI, Google Analytics, WhatsApp) |
| **Cartes cadeaux (Gift Cards)** | **NON REPRIS** | Inadapté au modèle africain de vente en paiement à la livraison (COD) sans cartes bancaires | Codes promo directs et offres par lots de quantité (Packs 2 ou 3 unités) |
| **Retrait en magasin / Disponibilité en boutique physique** | **NON REPRIS** | Novika est spécialisé dans le commerce en ligne COD avec expédition ou coursier à domicile | Zones de livraison définies par corridor, relais agence et livreurs dédiés |
| **Commande rapide en liste (Grille B2B grossiste)** | **NON REPRIS** | Vitrine destinée aux acheteurs particuliers B2C | Formulaire COD 1-clic optimisé mobile pour achat direct |
| **Comptes clients (Inscription, login avec mot de passe, adresses enregistrées)** | **REMPLACÉ** | Friction d'achat majeure en Afrique où >85% des commandes se font sans compte | Page de suivi public sécurisée `/suivi/[token]` sans inscription, avec lien WhatsApp direct |
| **Page protégée par mot de passe (Storefront password)** | **REMPLACÉ** | Expérience utilisateur frustrante pour les prospects | Mode « Boutique en préparation » propre avec aperçu privé sécurisé réservé à l'administrateur |

---

## F. Avancement par Phases

- [x] **Phase 1** : Réglages généraux du thème (Simple & Avancé), En-tête et Pied de page configurables, Sections d'accueil modulaires, Fiche produit COD avec `ProductImage` et 3 modèles de page, Page collection avec filtres et tri, Pages de contenu, 404 et Boutique en préparation, Mode Éditeur en direct.
- [ ] **Phase 2** : Recherche prédictive avancée, filtres multi-critères, formulaire de contact enrichi, inscription aux offres avec lien marketing (Prompt 09), Blog (articles, auteur, date, partage), Sélecteur de pays multi-devises, Duplication et export JSON du thème, Traduction multilingue (FR / EN).
- [ ] **Phase 3** *(optionnelle, sur demande)* : Panier multi-produits côté client avec formulaire COD unique.
