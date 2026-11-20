# Registre des Fonctionnalités Protégées (Règle R0)

> **Règle R0 absolue** : Ne jamais supprimer, remplacer ou dégrader une fonctionnalité existante.
> Avant toute intervention, ce document doit être lu et l'état des tests vérifié.

Dernière mise à jour : 2026-11-20
État global des tests : 28 suites passées, 323 tests unitaires passés avec succès (+ 9 tests Playwright E2E).

---

## 1. Mode Privé & Sécurité de l'Équipe (Prompt 18)
- **Description** : Plateforme fermée aux inscriptions publiques. Propriétaire unique (`promisesbedi@gmail.com`). Accès équipe par invitation avec token 7 jours. 2FA TOTP pour les rôles sensibles (owner, admin, manager). Suspension immédiate révoquant toutes les sessions. Protection brute-force rate-limiting.
- **Fichiers clés** :
  - `src/server/auth/private-mode-service.ts`
  - `src/server/auth/role-service.ts`
  - `src/server/auth/team-invitations.ts`
  - `src/app/auth/login/page.tsx`
  - `src/app/auth/rejoindre/page.tsx`
  - `src/app/app/parametres/equipe/page.tsx`
- **Tests** :
  - `src/server/auth/prompt-18-private-mode.test.ts` (19 tests)

---

## 2. Multi-Boutiques & Domaines Personnalisés (Prompt 19)
- **Description** : Multi-boutiques isolées par `shop_id`. Domaines personnalisés avec redirection 301 automatique (ex: `kelio.com`, `www.kelio.com`), vérification DNS (CNAME / A record `76.76.21.21`), intégration API Vercel Domains, isolation 404 stricte sur les vitrines pour interdire l'accès à l'administration `/app` via le domaine vitrine. Vue synthèse Propriétaire (Commandes du jour, livrées, CA livré).
- **Fichiers clés** :
  - `src/server/domains/domain-service.ts`
  - `src/app/api/domains/route.ts`
  - `src/app/app/boutiques/page.tsx`
  - `src/app/app/[store]/parametres/domaines/page.tsx`
  - `src/app/app/[store]/parametres/domaines/domains-manager-client.tsx`
  - `src/middleware.ts`
- **Tests** :
  - `src/lib/prompt-19-21b.test.ts` (15 tests)
  - `tests/prompt-19-21b.spec.ts` (E2E)

---

## 3. Vitrine 3 Pages & Modèle Novika Simple (Prompt 21-b)
- **Description** : Vitrine strictement limitée à 3 pages publiques : Accueil (`/boutique/[store]`), Catalogue (`/boutique/[store]/catalogue`), Contact (`/boutique/[store]/contact`). Toutes les autres routes (`/collections`, `/faq`, `/a-propos`, `/avis`, `/suivi-commande`) redirigent automatiquement en 301. Modèle « Novika Simple » en 8 sections avec masquage automatique des sections vides pour les visiteurs publics et restauration du contenu d'origine.
- **Fichiers clés** :
  - `src/app/boutique/[store]/page.tsx`
  - `src/app/boutique/[store]/catalogue/page.tsx`
  - `src/app/boutique/[store]/contact/page.tsx`
  - `src/app/boutique/[store]/[...slug]/page.tsx` (redirections 301)
  - `src/lib/theme-engine/novika-simple.ts`
  - `src/lib/theme-engine/default-theme.ts`
  - `src/components/storefront/theme-sections/ThemeSectionRenderer.tsx`
- **Tests** :
  - `src/lib/prompt-19-21b.test.ts` (15 tests)
  - `src/lib/theme-engine/theme-engine.test.ts` (19 tests)

---

## 4. Import CSV / Shopify & Cartographie Intelligente (Prompt 17-i)
- **Description** : Importation de fichiers CSV (Shopify ou standard) avec aperçu avant import, cartographie automatique des colonnes, assainissement HTML et détection d'erreurs.
- **Fichiers clés** :
  - `src/lib/csv-import-engine.ts`
  - `src/lib/shopify-csv-mapper.ts`
  - `src/components/products/csv-import-modal.tsx`
- **Tests** :
  - `src/lib/prompt-17i-csv-import.test.ts` (5 tests)
  - `src/lib/shopify-csv-mapper.test.ts` (8 tests)

---

## 5. Médiathèque & Sélecteur d'Image Unifié (Prompt 17-h & 17-g)
- **Description** : Sélecteur d'images avec onglets Importer (upload direct / glisser-déposer), Médiathèque (images réutilisables de la boutique), et Lien externe sécurisé. Validation stricte du type MIME réel (Magic bytes), conversion WebP pour les images statiques, préservation des GIFs animés.
- **Fichiers clés** :
  - `src/components/media/image-picker-modal.tsx`
  - `src/app/api/media/upload/route.ts`
  - `src/app/api/media/fetch-url/route.ts`
  - `src/lib/image-utils.ts`
- **Tests** :
  - `src/lib/image-utils.test.ts` (8 tests)
  - `src/lib/prompt-15-product-gallery.test.ts` (8 tests)

---

## 6. Nettoyage HTML Serveur Strict (Prompt 17-f)
- **Description** : Désinfection HTML des descriptions produits avec liste blanche stricte de balises et attributs, conversion `h1` -> `h2`, suppression des styles/scripts/iframes malveillants, sécurisation des liens externes (`rel="noopener noreferrer nofollow"`), protection SSRF des médias.
- **Fichiers clés** :
  - `src/lib/server-html-sanitizer.ts`
  - `src/components/products/rich-description-editor.tsx`
  - `src/components/products/description-comparison-modal.tsx`
- **Tests** :
  - `src/lib/server-html-sanitizer.test.ts` (44 tests)
  - `src/lib/html-sanitizer.test.ts` (7 tests)

---

## 7. Gestion des Stocks, Alertes COD & Corbeille (Prompt 16-b & 14-b)
- **Description** : Suivi des stocks par variante et globale, seuils d'alerte rupture, corbeille produit avec soft delete (`deletedAt`), rétention 30 jours et purge automatique.
- **Fichiers clés** :
  - `src/lib/stock-settings.ts`
  - `src/lib/products-store.ts`
  - `src/lib/product-indicators.ts`
- **Tests** :
  - `src/lib/stock-settings.test.ts` (20 tests)
  - `src/lib/prompt-14b-products-trash.test.ts` (8 tests)
  - `src/lib/product-indicators.test.ts` (5 tests)

---

## 8. Permissions RBAC & Journal d'Audit (Prompt 17-c, 17-d, 18)
- **Description** : Contrôle d'accès strict par rôle (`owner`, `admin`, `manager`, `closer`, `rider`). Journalisation immuable des actions sensibles (suppression, modification de prix, export, invitations).
- **Fichiers clés** :
  - `src/config/permissions.ts`
  - `src/server/auth/role-service.ts`

---

## 9. Édition Produit, Isolation Stricte & Éditeur Stable (Prompt 17-J)
- **Description** :
  - Résolution stricte par `id` ET `shop_id` actif sur `/produits/{id}/modifier` et `/produits/{id}`. Zéro repli silencieux vers `MOCK_PRODUCTS[0]` : affichage immédiat de l'écran « Produit introuvable ».
  - Remontage complet React garanti par `key={`${storeSlug}-${product.id}`}` dans `ProductEditContainer`.
  - Brouillons locaux isolés avec clé `draft_${shop_id}_${product_id}` et vérification de concordance.
  - Éditeur de description stable avec `isInternalUpdateRef` interdisant la réécriture d'`innerHTML` pendant la frappe, désinfection HTML reportée à l'enregistrement et à l'affichage vitrine, raccourcis clavier natifs.
  - Support complet des animations GIF (préservation de l'extension `.gif`, limite rehaussée à 8 Mo, Magic Bytes `GIF87a`/`GIF89a`).
- **Fichiers clés** :
  - `src/app/app/[store]/produits/product-edit-container.tsx`
  - `src/app/app/[store]/produits/[id]/page.tsx`
  - `src/app/app/[store]/produits/[id]/modifier/page.tsx`
  - `src/app/app/[store]/produits/product-form-client.tsx`
  - `src/components/products/rich-description-editor.tsx`
  - `src/lib/image-utils.ts`
  - `src/app/api/media/upload/route.ts`
  - `src/app/api/media/upload-from-url/route.ts`
- **Tests** :
  - `src/lib/prompt-17j-product-edit.test.ts` (13 tests)
  - `tests/prompt-17j-product-edit.spec.ts` (3 tests E2E)

---

## 10. Résolution Canonique des Produits Vitrine & URLs Unifiées (Prompt 17-K)
- **Description** :
  - Générateur d'URL unique `getProductPublicUrl(product, shop, options)` utilisé PARTOUT (listes, aperçus, fiches, catalogue, sections de thèmes, liens courts). Aucune URL construite manuellement. Prise en compte prioritaire des domaines personnalisés actifs (ex. `https://kelio.com/produits/{slug}`).
  - Migration non destructive : slugs et codes courts uniques de 6 caractères (`shortCode` / `short_code`) générés automatiquement sans altérer les existants.
  - Résolution tolérante : la route produit accepte indifféremment l'`id`, le `slug` ou le `short_code` (insensible à la casse et aux accents). Redirection automatique 301 vers l'URL canonique `/produits/{slug}`.
  - Gestion des statuts de publication : les produits actifs sont publiés par défaut (`published_to_storefront: true`). Les produits en brouillon ou non publiés affichent l'écran dédié « Produit indisponible » (sans erreur 404 générique et sans suggestion de concurrents).
  - Mode prévisualisation administrateur : jeton de prévisualisation signé (1h de validité) ou `?preview=true` affichant la fiche produit avec bandeau d'alerte supérieur et balise `noindex, nofollow`.
  - Page 404 personnalisée aux couleurs de la boutique : affiche le logo, le nom de la boutique, un bouton de retour à l'accueil et au catalogue, ainsi qu'un diagnostic technique réservé à l'administrateur connecté.
  - Route singulière `/boutique/[store]/produit/[id]` redirigeant automatiquement en 301 vers la route canonique plurielle `/boutique/[store]/produits/[id]`.
- **Fichiers clés** :
  - `src/lib/storefront-urls.ts`
  - `src/lib/products-store.ts`
  - `src/server/data/types.ts`
  - `src/app/boutique/[store]/produits/[id]/page.tsx`
  - `src/app/boutique/[store]/produit/[id]/page.tsx`
  - `src/app/app/[store]/produits/products-list-client.tsx`
  - `src/app/app/[store]/produits/product-form-client.tsx`
  - `src/app/boutique/[store]/catalogue/page.tsx`
  - `src/components/storefront/theme-sections/FeaturedProductSection.tsx`
  - `src/components/storefront/theme-sections/FeaturedProductsSection.tsx`
- **Tests** :
  - `src/lib/prompt-17k-product-storefront.test.ts` (15 tests unitaires)
  - `tests/prompt-17k-product-storefront.spec.ts` (6 tests Playwright E2E)

---

## 11. Bloc « Bénéfices du produit », Retrait des formules automatiques & Bouton unique de rupture de stock (Prompt 17-L)
- **Description** :
  - **Retrait des formules automatiques** : Plus aucune formule (1 unité, duo -15%, famille -25%), étiquette ou réduction n'est injectée automatiquement sur la vitrine. Les offres de quantité créées par l'administrateur restent possibles et fonctionnelles, mais sont masquées par défaut grâce au paramètre `showQuantityOffers: false` (toggle « Afficher les offres sur la vitrine » dans le formulaire produit).
  - **Sélecteur simple (− 1 +)** : Lorsque les offres sont désactivées ou inexistantes, un sélecteur de quantité ergonomique (− 1 +) est affiché sur la fiche produit vitrine.
  - **Nouveau bloc « Bénéfices du produit »** :
    - Carte d'administration dans `product-form-client.tsx` : titre personnalisable (défaut « Pourquoi vous allez l'aimer »), liste de 3 à 8 bénéfices avec sélecteur de 10 icônes sobres (`check`, `sparkles`, `shield`, `heart`, `zap`, `star`, `leaf`, `smile`, `flame`, `clock`), titre court, description facultative (1 phrase), boutons monter/descendre/supprimer, phrase de conclusion facultative (`footerNote`).
    - Bouton « Générer avec l'IA » : endpoint sécurisé `/api/products/ai/generate-benefits` formulant 3 à 5 bénéfices concrets selon le nom, la description et la catégorie du produit, avec interdiction stricte de promesses médicales, faux chiffres ou garanties imaginaires.
    - Aperçu en direct dans le formulaire.
    - Rendu sur la vitrine (`NovikaProductPage.tsx`) au-dessus du formulaire de commande ; masquage total et propre sans conteneur vide si aucun bénéfice n'est renseigné.
  - **Bouton unique de rupture de stock** :
    - Rendu d'un SEUL bouton pleine largeur `Rupture de stock` (`[data-testid="btn-out-of-stock-single"]`) lorsque le produit est épuisé, éliminant tout doublon de boutons désactivés.
    - Logique de stock affinée : un produit n'est en rupture que si le suivi de stock est actif (`trackStock !== false && trackQuantity !== false`) ET que le stock disponible est `<= 0`.
- **Fichiers clés** :
  - `src/server/data/types.ts` (`ProductBenefitItem`, `ProductBenefitsBlock`, `showQuantityOffers`, `benefits`)
  - `src/app/api/products/ai/generate-benefits/route.ts`
  - `src/components/storefront/product/NovikaProductPage.tsx`
  - `src/app/boutique/[store]/produits/[id]/page.tsx`
  - `src/app/app/[store]/produits/product-form-client.tsx`
  - `src/mock-data/products.ts`
  - `src/lib/storefront-urls.ts` (polyfilling sécurisé Base64/Base64URL pour client/serveur)
- **Tests** :
  - `src/lib/prompt-17l-benefits.test.ts` (9 tests unitaires)
  - `tests/prompt-17l-benefits.spec.ts` (4 tests Playwright E2E)

---

## 12. Aperçu mobile iPhone 15 Pro Max par défaut & Multi-appareils dans l'éditeur (Prompt 17-M)
- **Description** :
  - **Sélecteur d'appareil complet** :
    - « iPhone 15 Pro Max » (430 × 932 px) **PAR DÉFAUT**.
    - « iPhone 13 » (390 × 844 px).
    - « Android petit écran » (360 × 800 px).
    - « Tablette » (768 × 1024 px).
    - « Ordinateur » (1280 × 800 px / 100% responsive).
  - **Mémorisation par utilisateur** : Périphérique et orientation mémorisés dans le `localStorage` sous la clé `novika_preview_device_settings`, conservés à la réouverture avec repli résilient en mémoire si indisponible.
  - **Cadres réalistes (DeviceFrame)** :
    - Rendu fidèle avec Dynamic Island animée pour iPhone 15 Pro Max (`[data-testid="device-dynamic-island"]`).
    - Encoche réaliste (Notch) pour iPhone 13 (`[data-testid="device-notch"]`).
    - Poinçon de caméra (Punch hole) pour Android petit écran (`[data-testid="device-punch-hole"]`).
    - Cadre épuré pour Tablette (`[data-testid="device-tablet-camera"]`) et barre de navigateur macOS pour Ordinateur (`[data-testid="device-desktop-browser-bar"]`).
    - Bascule d'orientation Portrait / Paysage (`[data-testid="btn-toggle-orientation"]`) avec inversion dynamique des dimensions.
    - Bouton « Ouvrir dans un nouvel onglet à cette taille » (`[data-testid="btn-open-preview-window"]`) ouvrant une popup JavaScript aux dimensions exactes du périphérique.
  - **Intégration transverse** :
    - **Éditeur de thème** (`storefront-client.tsx`) : barre `PreviewDeviceSelector` et prévisualisation encapsulée dans `DeviceFrame`.
    - **Afficher en tant que client** (`products-list-client.tsx`) : bouton `[data-testid="btn-view-as-customer"]` ouvrant la modale plein écran `ClientPreviewModal` avec iframe vitrine, sélecteur d'appareil et bascule d'orientation.
  - **Zones sûres & Ergonomie tactile sur la vitrine** :
    - Prise en compte de `env(safe-area-inset-top)` et `env(safe-area-inset-bottom)` dans `layout.tsx` (`viewportFit: "cover"`), `globals.css` et la barre mobile fixe `StickyMobileCta.tsx`.
    - Zéro défilement horizontal garanti sur les 3 largeurs clés (360 px, 390 px, 430 px).
    - Taille de police des champs de formulaire `>= 16px` sur mobile pour éliminer le zoom automatique intempestif d'iOS Safari (`text-base sm:text-xs`).
    - Hauteur minimale des boutons d'action tactile `>= 44px` (norme tactile Apple Human Interface Guidelines).
- **Fichiers clés** :
  - `src/lib/preview-device.ts` (modèles de périphériques, calcul des dimensions, persistence et utilitaires de popup)
  - `src/components/preview/PreviewDeviceSelector.tsx`
  - `src/components/preview/DeviceFrame.tsx`
  - `src/components/preview/ClientPreviewModal.tsx`
  - `src/app/app/[store]/boutique-en-ligne/storefront-client.tsx`
  - `src/app/app/[store]/produits/products-list-client.tsx`
  - `src/components/storefront/product/StickyMobileCta.tsx`
  - `src/components/storefront/product/NovikaProductPage.tsx`
  - `src/components/storefront/standard-order-form.tsx`
  - `src/app/globals.css` & `src/app/layout.tsx`
- **Tests** :
  - `src/lib/prompt-17m-preview-device.test.ts` (9 tests unitaires)
  - `tests/prompt-17m-preview-devices.spec.ts` (5 tests Playwright E2E)

### 13. Prompt 17-N : Affichage Vitrine Publique Catalogue & Fiche Produit Kelio (Rôle Anonyme)
- **Objectif** : Résoudre l'affichage du catalogue (`/boutique/kelio/catalogue`) et de la fiche produit (`/boutique/kelio/produits/accompagnez-votre-equilibre-glycemique`) pour un visiteur anonyme (rôle `anon`) sans régression sur l'existant.
- **Diagnostics & Causes résolues** :
  1. *RLS Supabase `anon`* : Création de la politique de lecture publique `stock_levels_public_view` sur `stock_levels`, `quantity_offers_public_view` sur `quantity_offers`, et vue publique `product_availability` avec `LEFT JOIN` (évite qu'une jointure interne élimine des produits sans variante ou stock renseigné).
  2. *Publication vitrine* : Ajout de la colonne `published_to_storefront BOOLEAN NOT NULL DEFAULT true` dans la table `products`.
  3. *Résolution boutique & produits* : Enregistrement de la boutique `kelio` dans `MOCK_STORES` et `store-repository.ts`, et de son produit phare `Accompagnez votre équilibre glycémique` dans `KELIO_PRODUCTS` et `products-store.ts`.
  4. *Hydration Error & Crash Incident `ERR-9AN3N5`* : Remplacement des balises invalides `<head>` imbriquées dans des balises `<div>` par des balises directes `<title>` et `<meta>` compatibles React 19 et Next.js 15 dans `produits/[id]/page.tsx`, `layout.tsx` et `apercu/produit/[id]/page.tsx`.
- **Fichiers clés** :
  - `src/mock-data/products.ts` (`KELIO_PRODUCTS`)
  - `src/mock-data/stores.ts` (enregistrement boutique `kelio`)
  - `src/server/data/store-repository.ts` (`seedInitialStores`)
  - `src/lib/products-store.ts` (`getShopProductsRaw`)
  - `src/app/boutique/[store]/catalogue/page.tsx`
  - `src/app/boutique/[store]/produits/[id]/page.tsx`
  - `src/app/boutique/[store]/layout.tsx`
  - `src/app/boutique/[store]/apercu/produit/[id]/page.tsx`
  - Migration Supabase : `prompt_17n_public_storefront_rls_and_views`
- **Tests** :
  - `src/lib/prompt-17n-kelio-storefront.test.ts` (6 tests unitaires au vert)
  - Suite globale Vitest : 31 fichiers, 347 tests passés au vert
  - Vérification E2E Playwright : capture d'écran catalogue, fiche produit desktop et mobile iPhone 15 Pro Max





