# Audit Exhaustif des Sélecteurs d'Images & URLs de Médias (Prompts 17-G & 17-H)

Date de l'audit : 20 Novembre 2026  
Projet : Novika COD Platform

---

## 1. Synthèse de l'audit

L'analyse de l'ensemble du codebase (`src/**/*.ts`, `src/**/*.tsx`) a identifié tous les points où des `window.prompt`, des saisies manuelles d'URL d'image ou des `input type="file"` isolés sans prévisualisation unifiée étaient utilisés. 

Tous ces points sont désormais remplacés par le composant unifié **`ImagePicker`** (`src/components/media/ImagePicker.tsx`) et le hook **`useImageUpload`**.

---

## 2. Inventaire détaillé par écran et par composant

| Fichier source | Écran / Contexte | Élément existant identifié | Ce qui est remplacé / Solution unifiée |
| :--- | :--- | :--- | :--- |
| **`src/components/products/rich-description-editor.tsx`** | Éditeur riche de description (Fiche produit) | `prompt("Entrez l'URL de l'image...")` (Ligne 102) & `prompt("Entrez le lien de la vidéo...")` (Ligne 109) | Remplacé par modale Novika 3 onglets (Importer, Médiathèque, Depuis un lien avec protection SSRF) et modale dédiée vidéo (YouTube/Vimeo). |
| **`src/app/app/[store]/produits/product-form-client.tsx`** | Galerie produits & Supports multimédias (Fiche produit) | `<input type="file" multiple ...>` isolé + modale médiathèque basique | Remplacé par `ImagePicker` (mode `multiple`, glisser-déposer, ordre drag-and-drop, aperçus, quota boutique, compression WebP). |
| **`src/app/app/[store]/produits/product-form-client.tsx`** | Photos par Variante de produit (Taille, Couleur, etc.) | Sélection d'image par modal basique ou URL | Intégré avec `ImagePicker` (mode `single`, ratio carré, assignation instantanée par variante). |
| **`src/app/app/[store]/boutique-en-ligne/storefront-client.tsx`** | Identité boutique (Logo et Favicon) | `<input id={fileInputId} type="file" ...>` sans médiathèque | Remplacé par `ImagePicker` (`context="logo"` et `context="favicon"`, recadrage, validation PNG/WebP/ICO, pas de SVG). |
| **`src/components/app/edit-store-drawer.tsx`** | Tiroir latéral de modification de boutique (Logo) | `<input type="file" accept="image/..." ...>` isolé | Remplacé par `ImagePicker` (`context="logo"`, ratio 1:1, téléversement direct). |
| **`src/app/app/[store]/boutique-en-ligne/bannieres/banners-client.tsx`** | Bannières promotionnelles & Carrousel (Desktop & Mobile) | `<input type="file" onChange={handleSimulateUpload} ...>` | Remplacé par `ImagePicker` (`context="banner"`, ratio 16:9 desktop et 4:5 mobile, recadrage et compression). |
| **`src/app/app/[store]/produits/collections/`** | Image de couverture de collection | Champ texte URL ou upload basique | Remplacé par `ImagePicker` (`context="collection"`, affichage dans le catalogue). |
| **`src/components/storefront/theme-sections/`** | Sections du thème (Image avec texte, Carrousel, Collage) | Champs `desktopImage` et `mobileImage` | Intégré avec le sélecteur `ImagePicker` relié à la médiathèque de la boutique. |
| **`src/app/app/[store]/finances/depenses/depenses-client.tsx`** | Justificatifs de dépenses & Reçus | `<input type="file" ...>` basique | Remplacé par `ImagePicker` (`context="receipt"`, aperçu du ticket, validation 5 Mo). |
| **`src/app/app/[store]/produits/nouveau-ia/ai-product-generator-client.tsx`** | Générateur de fiches IA (Photo source produit) | `<input type="file" ...>` | Remplacé par `ImagePicker` (prise de photo sur mobile / caméra ou galerie). |

---

## 3. Règles de sécurité et d'ingénierie appliquées

1. **Suppression totale des prompts natifs du navigateur** :
   - Aucun appel à `window.prompt` ou `alert` n'est autorisé pour insérer un média.
   - Les modales sont intégrées dans l'interface Novika avec style unifié et accessible.
2. **Formats autorisés & Refus stricts** :
   - Formats acceptés : JPEG (`image/jpeg`), PNG (`image/png`), WebP (`image/webp`), GIF (`image/gif`).
   - Favicon : PNG ou ICO.
   - **Refus formel du SVG** (`image/svg+xml`) pour prévenir les attaques d'injection de scripts XML (XSS).
3. **Plafond de taille** :
   - 5 Mo maximum par image. Message d'erreur clair en français si dépassé.
4. **Vérification du vrai type du fichier (Magic Bytes)** :
   - Vérification des signatures binaires côté serveur (`\xFF\xD8\xFF` pour JPEG, `\x89PNG` pour PNG, `RIFF...WEBP` pour WebP, `GIF8` pour GIF).
5. **Protection SSRF stricte (« Depuis un lien »)** :
   - Résolution DNS et blocage des adresses IP privées, locales ou de métadonnées cloud (`127.0.0.1`, `localhost`, `10.*`, `172.16-31.*`, `192.168.*`, `169.254.169.254`).
   - Téléchargement côté serveur et copie dans notre stockage Supabase (aucun lien externe conservé).
6. **Compteur d'utilisation & Anti-casse** :
   - Chaque média en base possède un `usageCount`. Une image ne peut être supprimée physiquement du stockage que si `usageCount === 0`.
   - Migration par lots des anciennes images Shopify/CSV avec statut et reprise sur erreur.
