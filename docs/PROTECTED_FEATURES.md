# Registre des Fonctionnalités Protégées (Règle R0)

> **Règle R0 absolue** : Ne jamais supprimer, remplacer ou dégrader une fonctionnalité existante.
> Avant toute intervention, ce document doit être lu et l'état des tests vérifié.

Dernière mise à jour : 2026-11-20
État global des tests : 27 suites passées, 308 tests passés avec succès (+ 3 tests Playwright E2E).

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

