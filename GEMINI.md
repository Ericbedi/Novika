# GEMINI.md — Novika

> **Fichier de référence technique et fonctionnelle pour tout modèle d'IA et développeur travaillant sur le projet Novika.**
> Ce document reflète fidèlement l'état réel du code, des composants, de la sécurité et des suites de tests vérifiées.

---

## 1. Ce que fait l'application

**Novika** (anciennement AfriBuilder) est une plateforme SaaS e-commerce tout-en-un multi-boutiques, multi-pays et multi-devises, spécialement conçue pour les marchands et entrepreneurs d'Afrique subsaharienne et du Maghreb opérant selon le modèle de vente en **Paiement à la Livraison (Cash On Delivery - COD)**.

### Contexte métier et flux opérationnel
Le commerce en ligne en Afrique francophone repose massivement sur l'acquisition via la publicité payante (Meta Ads / TikTok Ads), la qualification rapide (WhatsApp ou formulaire web simplifié) et le paiement en espèces à la livraison. Novika optimise chaque maillon de cette chaîne pour maximiser le taux de livraison effectif et sécuriser l'argent encaissé.

### Acteurs et Rôles de la plateforme
1. **Admin (Propriétaire / Owner)** :
   - Crée et pilote plusieurs boutiques indépendantes.
   - Configure les pays vendus, les devises, les zones de livraison et les intégrations (Pixels Meta, CAPI, Webhooks).
   - Définit les objectifs de chiffre d'affaires réellement encaissé.
   - Arbitre la rentabilité de ses produits et campagnes via le simulateur de scaling.
   - Seul habilité à modifier les horaires de service de l'équipe, activer le travail dominical ou initier la suppression définitive du compte.
2. **Co-admin** :
   - Gestion opérationnelle étendue de la boutique et des commandes.
   - Ne possède pas les prérogatives du propriétaire (suppression de compte, transfert d'équipe).
3. **Manager** :
   - Supervise les commandes, les performances des closeuses et les livraisons.
   - Consulte les horaires d'équipe en lecture seule sans pouvoir les modifier.
4. **Closeuse (Télé-opératrice de vente)** :
   - Traite les commandes entrantes, appelle les clients pour confirmation/qualification.
   - Assigne les commandes confirmées aux livreurs ou aux agences de transport.
   - N'a aucun accès aux marges financières brutes, aux réglages sensibles ou aux analytics confidentiels.
5. **Livreur (Coursier urbain)** :
   - Dispose d'une interface mobile légère pour sa tournée du jour.
   - Met à jour les statuts de livraison en temps réel (En route, Livré avec code de preuve, Reporté, Injoignable, Retourné).
   - Encaisse les espèces lors de la remise du colis.
6. **Agence de livraison / Transporteur interurbain** :
   - Reçoit les lots de colis pour les expéditions en province ou corridors inter-villes.
   - Valide la réception et le statut d'acheminement des colis expédiés.
7. **Client final (Acheteur)** :
   - Commande sans création de compte sur une vitrine ultra-rapide.
   - Saisie fluide avec pays présélectionné (ou sélection par drapeau SVG), ville en texte libre, et frais de livraison offerts par défaut.
   - Suit l'avancement de son colis via un lien public anonyme `/suivi/{token}` sécurisé et sans GPS invasif.

### Principes métier fondamentaux
- **Zéro blocage de commande** : Aucune commande n'est jamais bloquée par une détection géographique imprécise ou des horaires d'ouverture. Les commandes hors service sont acceptées et placées en file de qualification prioritaire pour la reprise du service.
- **Livraison gratuite par défaut pour l'acheteur** : Les frais de transport standard ($L$) sont intégrés dans la structure de marge du vendeur. Seules les zones d'expédition lointaines ou interurbaines configurées peuvent exiger un prépaiement partiel d'expédition.
- **Gestion monétaire stricte** : Le Franc CFA d'Afrique de l'Ouest (**XOF**) et le Franc CFA d'Afrique Centrale (**XAF**) sont deux devises strictement distinctes. Les montants sont manipulés sous forme d'entiers stricts (zéro virgule flottante) pour bannir toute erreur d'arrondi sur les flux financiers.

---

## 2. Fonctionnalités implémentées

Toutes les fonctionnalités listées ci-dessous sont **effectivement codées, intégrées dans l'application et couvertes par des suites de tests automatisées (Vitest / Playwright)**.

### A. Boutiques et Multi-pays
| Fonctionnalité | Détail & Emplacement | Statut |
|---|---|---|
| **Multi-boutiques & Navigation** | Sélecteur de boutique active, cartes de boutiques avec menu d'actions complet : Basculer, Aperçu vitrine (œil), Modifier, Dupliquer, Archiver, Supprimer (`src/app/app/boutiques`). « Gérer mes boutiques » placé en bas de barre latérale avant Réglages. | `Fait` |
| **Drawer de modification rapide** | Panneau latéral (drawer) réactif pour modifier le nom, le slug unique, le numéro WhatsApp et le statut sans recharger la page (`src/components/app/edit-store-drawer.tsx`). | `Fait` |
| **54 pays d'Afrique officiels** | Liste complète des 54 nations africaines, tri alphabétique unifié selon les règles locales françaises (`Intl.Collator('fr')`), drapeaux SVG locaux haute résolution (`country-flag-icons`), sans segmentation artificielle (`src/config/countries.ts`, `src/lib/countries.ts`). | `Fait` |
| **Éditeur de vitrine — Section 1** | Formulaire « Informations de la boutique » déplacé en Section 1 de l'éditeur de vitrine (`src/app/app/[store]/boutique-en-ligne/storefront-editor-client.tsx`) : nom commercial, slug, logo, pays principal, devise, WhatsApp (E.164), et pays vendus activables (`shop_countries`). | `Fait` |
| **Redirection 301 des anciens réglages** | Redirection d'URL propre depuis `/app/[store]/reglages/pays` vers `/app/[store]/boutique-en-ligne#section-info` (`src/app/app/[store]/reglages/pays/page.tsx`). | `Fait` |
| **Grille de réglages modernisée** | Réglages généraux organisés en 8 cartes thématiques avec sélecteur de navigation dropdown compact sur mobile (`src/app/app/[store]/reglages/settings-client.tsx`). | `Fait` |

### B. Produits et Catalogue
| Fonctionnalité | Détail & Emplacement | Statut |
|---|---|---|
| **Fiche produit optimisée COD** | Images, description, prix de vente, coût d'achat, variantes, et recalcul strict des totaux (`src/components/storefront/cod-product-page-template.tsx`). | `Fait` |
| **Gestion du niveau de stock** | Indicateurs d'état (En stock, Stock bas, En rupture), alertes automatiques déclenchées uniquement lors des changements d'état (`src/mock-data/stock.ts`). | `Fait` |
| **Import CSV de produits** | Moteur d'importation robuste avec parsing des colonnes, mapping de schémas et validation Zod (`src/lib/csv-import-engine.ts`, `src/components/products/csv-import-modal.tsx`). | `Fait` |
| **Couleur d'accent dynamique** | Extraction algorithmique de la couleur dominante de l'image produit pour personnaliser la mise en valeur visuelle du thème (`src/lib/color-extractor.ts`). | `Fait` |

### C. Vitrine, Formulaire de commande et Tracking
| Fonctionnalité | Détail & Emplacement | Statut |
|---|---|---|
| **Page d'accueil & Hero honnête** | Présentation sans fausse preuve sociale, démo interactive du produit, formulations vérifiables issues exclusivement de `content/claims.ts` et `content/landing.fr.ts`. | `Fait` |
| **Bandeau d'annonce défilant** | Marquee infini fluide et continu en tête de vitrine (`src/components/storefront/announcement-banner.tsx`). | `Fait` |
| **Formulaire de commande standardisé** | Saisie ultra-rapide adaptée aux mobiles : sélection du pays par drapeau SVG, ville en saisie libre, assistance WhatsApp en 1 clic, et recalcul garanti côté serveur (`src/components/storefront/standard-order-form.tsx`). | `Fait` |
| **Pixels Meta (Facebook) & CAPI** | Jusqu'à 3 pixels par boutique, validation stricte de l'ID (15-16 chiffres), hachage SHA-256 des données client, limitation possible à des produits ciblés, bouton de test en direct (Code 200), et masquage complet des jetons CAPI (`src/lib/meta-pixels.ts`, `src/app/api/pixels/route.ts`). | `Fait` |
| **Bandeau de consentement cookies** | Protection de la vie privée conforme RGPD/ePrivacy : aucun script publicitaire n'est exécuté sans acceptation expresse de l'utilisateur (`src/components/storefront/cookie-consent-banner.tsx`). | `Fait` |
| **Suivi public par étapes (sans GPS)** | Page publique non indexable `/suivi/{token}` sécurisée par un jeton aléatoire $\ge 128$ bits (expiration 30 jours post-livraison), frise chronologique détaillée en temps réel sans aucune géolocalisation invasive (`src/app/suivi/[token]/page.tsx`, `src/server/data/tracking-store.ts`). | `Fait` |
| **Reçus de commande personnalisés** | Moteur de génération de reçus de commande par client et produit, partageables manuellement via WhatsApp (`src/lib/receipts-engine.ts`, `src/app/recu/[id]/page.tsx`). | `Fait` |

### D. Authentification, Sécurité et Compte
| Fonctionnalité | Détail & Emplacement | Statut |
|---|---|---|
| **Parcours d'accès bêta-testeur** | Demande d'accès, approbation par l'équipe, vérification réelle de l'e-mail par code à 6 chiffres (10 min, max 5 essais) et normalisation canonique pour éliminer les faux doublons (`src/lib/email-canonical.ts`, `src/app/verification/page.tsx`). | `Fait` |
| **Création du mot de passe utilisateur** | Mot de passe créé par l'utilisateur avec validation de sécurité renforcée ($\ge 10$ caractères, vérification k-anonymat contre les mots de passe compromis, interdiction de données personnelles) (`src/app/bienvenue/page.tsx`). | `Fait` |
| **Connexion sécurisée & Anti-bruteforce** | Écran de connexion avec message neutre unique « E-mail ou mot de passe incorrect », limitation de débit, verrouillage temporaire en cas d'échecs répétés, et redirection automatique par rôle (`src/app/connexion/page.tsx`). | `Fait` |
| **Suppression de compte en 4 étapes** | Modal de suppression irréversible dans `/app/compte` : avertissement sur la perte de données, période de grâce de 14 jours, blocage automatique si le propriétaire gère une équipe active sans transfert préalable, confirmation par saisie de phrase et mot de passe (`src/app/app/compte/page.tsx`). | `Fait` |
| **Matrice de permissions centralisée** | Matrice RBAC stricte avec refus par défaut (`src/config/permissions.ts`), protégeant toutes les ressources sensibles (pixels, réglages, finances, équipe, horaires, suppression). | `Fait` |
| **Gestion des horaires de service** | Plages de service d'équipe (07:00–18:00 par défaut, lundi–samedi), dimanche verrouillé sauf dérogation explicite par l'admin propriétaire (`src/server/data/schedule-types.ts`). | `Fait` |

### E. Pilotage, Analytics et Rentabilité
| Fonctionnalité | Détail & Emplacement | Statut |
|---|---|---|
| **Squelettes de chargement instantanés** | Affichage de squelettes visuels sous 50ms sur les 6 vues clés : Dashboard, Produits, Vitrine, Réglages, Performance Produit et Entonnoir (`src/components/app/skeletons.tsx`, fichiers `loading.tsx`). | `Fait` |
| **Globe 3D temps réel asynchrone** | Visualisation WebGL des visiteurs en direct chargée dynamiquement (`LiveGlobeCard`) sans ralentir le rendu du tableau de bord (`src/components/dashboard/live-globe-card.tsx`). | `Fait` |
| **Chiffre d'affaires réellement encaissé** | Cartes KPI compactes calculant uniquement le CA encaissé lors des livraisons réussies (`src/components/finance/revenue-goal-card.tsx`). | `Fait` |
| **Entonnoir de conversion anonyme** | Analyse de déperdition champ par champ sans collecte de données personnelles ni IP (détection de l'abandon au numéro de téléphone) et comparaison du ROI par canal publicitaire (`src/app/app/[store]/stats/entonnoir/funnel-client.tsx`). | `Fait` |
| **Simulateur de scaling produit** | Calculateur mathématique exact intégrant prix de vente, coût produit, livraison, emballage, coût des retours et taux de confirmation/livraison, avec 5 verdicts automatisés et alertes audio (`src/lib/scaling.ts`, `src/app/app/[store]/performance-produit/scaling-client.tsx`). | `Fait` |
| **Calendrier & Analyse Weekly (Over-scaling)** | Widget calendrier hebdomadaire en tête de page, popover multi-semaines (S43-S46), détection mathématique du **Scaling Sain vs Over-scaling** (sur-diffusion destructrice de marge), matrice comparative WoW avec deltas et bannière d'alerte (`src/lib/scaling.ts`, `src/app/app/[store]/performance-produit/scaling-client.tsx`). | `Fait` |

---

## 3. Structure des fichiers

L'arborescence du projet est organisée selon les standards Next.js App Router, avec une séparation stricte entre composants d'interface, logique métier, configurations globales et suites de tests.

```
novika/
├── GEMINI.md                                  # Ce fichier de référence technique
├── content/                                   # Textes marketing et affirmations vérifiées
│   ├── claims.ts                              # Source unique des revendications produit
│   └── landing.fr.ts                          # Textes de la page d'accueil en français
├── public/                                    # Fichiers statiques publics
│   ├── sounds/                                # Alertes sonores (novika-order.mp3, etc.)
│   └── icons/                                 # Favicons et icônes PWA
├── src/
│   ├── app/                                   # Routes Next.js App Router
│   │   ├── (public)/                          # Pages vitrine et landing
│   │   │   ├── page.tsx                       # Page d'accueil officielle Novika
│   │   │   └── boutique/[store]/              # Vitrines publiques des boutiques marchandes
│   │   ├── acces/                             # Demande d'accès bêta et remerciements
│   │   ├── connexion/                         # Page de connexion sécurisée
│   │   ├── inscription/                       # Inscription et création de compte
│   │   ├── verification/                      # Vérification d'e-mail par code à 6 chiffres
│   │   ├── bienvenue/                         # Écran de création du mot de passe
│   │   ├── suivi/[token]/                     # Suivi public de commande sécurisé sans GPS
│   │   ├── recu/[id]/                         # Page publique de reçu de commande
│   │   ├── app/                               # Espace d'administration et d'équipe
│   │   │   ├── layout.tsx                     # Shell d'application (desktop + mobile bottom nav)
│   │   │   ├── boutiques/                     # Gestion des boutiques (cartes + drawer d'édition)
│   │   │   ├── compte/                        # Paramètres de compte et suppression en 4 étapes
│   │   │   └── [store]/                       # Espace dédié à la boutique active
│   │   │       ├── page.tsx                   # Tableau de bord principal
│   │   │       ├── loading.tsx                # Squelette de chargement instantané dashboard
│   │   │       ├── commandes/                 # Gestion et qualification des commandes
│   │   │       ├── produits/                  # Catalogue, variantes, fiches produits
│   │   │       ├── boutique-en-ligne/         # Éditeur de vitrine (Section 1 = Infos boutique)
│   │   │       ├── livraisons/                # Gestion des tournées livreurs et agences
│   │   │       ├── performance-produit/       # Simulateur de scaling et rentabilité
│   │   │       ├── stats/entonnoir/           # Entonnoir de conversion anonyme
│   │   │       └── reglages/                  # Réglages généraux (8 cartes thématiques)
│   │   └── api/                               # Points de terminaison API serveur
│   │       ├── auth/                          # Endpoints d'authentification et session
│   │       ├── beta/                          # Gestion des invitations et accès bêta
│   │       ├── events/                        # Télémétrie d'entonnoir anonyme (zéro PII/IP)
│   │       ├── orders/                        # Validation et recalcul de commandes
│   │       ├── pixels/                        # Gestion et test des Pixels Meta (CAPI)
│   │       └── tracking/                      # Données de suivi sécurisées
│   ├── components/                            # Composants React modulaires
│   │   ├── app/                               # Composants d'application (tableaux, badges, tiroirs)
│   │   │   ├── edit-store-drawer.tsx          # Tiroir de modification rapide de boutique
│   │   │   ├── skeletons.tsx                  # Squelettes de chargement instantanés (< 50ms)
│   │   │   └── shell/                         # Barres de navigation desktop et mobile
│   │   ├── dashboard/                         # Composants du tableau de bord (globe 3D, KPI, graphiques)
│   │   ├── finance/                           # Cartes d'objectifs de CA et finances
│   │   ├── landing/                           # Hero avec démo produit, animations, globe
│   │   ├── layout/                            # Command palette, notifications, navigation
│   │   ├── products/                          # Modal d'import CSV, sélecteurs de variantes
│   │   ├── storefront/                        # Composants de la vitrine publique
│   │   │   ├── standard-order-form.tsx        # Formulaire de commande COD avec drapeau SVG
│   │   │   ├── meta-pixel-runner.tsx          # Exécuteur des événements Meta Pixels / CAPI
│   │   │   ├── cookie-consent-banner.tsx      # Bandeau de consentement conforme vie privée
│   │   │   └── announcement-banner.tsx        # Marquee d'annonce infini
│   │   └── ui/                                # Primitives UI (boutons, dialogues, sélecteurs, drapeaux)
│   ├── config/                                # Sources uniques de configuration
│   │   ├── brand.ts                           # Identité de marque et nom d'application
│   │   ├── permissions.ts                     # Matrice RBAC des rôles et ressources
│   │   ├── countries.ts                       # Référentiel des 54 pays africains (ISO, devises, indicatifs)
│   │   ├── sounds.ts                          # Constantes des alertes sonores
│   │   └── navigation.ts                      # Liens de navigation et barres de menus
│   ├── lib/                                   # Utilitaires métier et sécurité
│   │   ├── meta-pixels.ts                     # Validation des pixels Meta, hash SHA-256 et CAPI
│   │   ├── scaling.ts                         # Formules mathématiques du simulateur de scaling
│   │   ├── email-canonical.ts                 # Normalisation canonique d'adresses e-mail
│   │   ├── order-form-security.ts             # Recalcul des montants et validation de panier
│   │   ├── tracking-security.ts               # Sécurité des jetons de suivi 128-bit
│   │   ├── notification-sound.ts              # Gestion audio avec verrou multi-onglets
│   │   ├── money.ts                           # Manipulation des entiers monétaires (XOF, XAF)
│   │   └── color-extractor.ts                 # Extraction de couleur dominante pour les thèmes
│   ├── mock-data/                             # Données de démonstration typées et réalistes
│   └── server/data/                           # Dépôts de données en mémoire et magasins serveur
├── supabase/migrations/                       # Migrations SQL, politiques RLS, vues de sécurité
└── tests/                                     # Suites de tests automatisées
    ├── bundle-05px-05q.spec.ts                # Tests E2E : Pixels Meta, CAPI, Squelettes instantanés
    ├── bundle-05a-05e-05d-05g-05z.spec.ts     # Tests E2E : Mot de passe, Entonnoir, Compte, Scaling, Pays
    ├── bundle-05n-05r-05f-05v-05x.spec.ts     # Tests E2E : Éditeur Section 1, Reçus, Formulaire COD
    ├── store-management-edit.spec.ts          # Tests E2E : Modification de boutique et drawer
    └── unitaires (dans src/lib/*.test.ts)     # Tests Vitest : math scaling, meta pixels, phone, money
```

---

## 4. Technologies utilisées

| Catégorie | Technologie & Version | Rôle & Justification |
|---|---|---|
| **Framework Fullstack** | **Next.js 16.4.6** (React 19.3.0) | App Router avec Turbopack, Server Actions, Route Handlers, et streaming de squelettes via Suspense. |
| **Moteur de Style** | **Tailwind CSS 4.3.3** (`@tailwindcss/turbopack`) | Architecture CSS zero-runtime, système de design basé sur des tokens de 4px, densité compacte. |
| **Typage & Rigueur** | **TypeScript 5.x** | Mode strict sans compromis, interdiction de `any` sur les flux monétaires ou de sécurité. |
| **Composants d'interface** | **Radix UI / Shadcn UI** | Primitives accessibles et personnalisables (Dialogs, Popovers, Sheets, Dropdowns). |
| **Iconographie & Drapeaux** | **Lucide React** & **country-flag-icons** | Icônes vectorielles ultra-légères et drapeaux SVG locaux pour tous les pays d'Afrique (affichage garanti sous Windows). |
| **Visualisation 3D** | **Cobe WebGL 2.0.1** | Globe interactif ultra-léger pour le monitoring des visiteurs en direct sans saturer le GPU. |
| **Graphiques statistiques** | **Recharts 3.10.1** | Courbes de performance, graphiques de conversion et représentations de métriques financières. |
| **Validation de données** | **Zod 4.6.7** | Validation systématique côté client et côté serveur des payloads API et formulaires. |
| **Téléphonie internationale** | **libphonenumber-js** | Validation stricte et formatage des numéros WhatsApp africains au standard international E.164. |
| **Sécurité cryptographique** | **Web Crypto API (SubtleCrypto)** | Hachage SHA-256 pour Meta CAPI, génération de jetons d'invitation et tokens de suivi $\ge 128$ bits. |
| **Base de données & Auth** | **Supabase (PostgreSQL 15+)** | Politiques RLS (Row Level Security), temps réel via Realtime, stockage d'images, vues `security_invoker`. |
| **Tests automatisés** | **Playwright 1.65.1** & **Vitest 5.1.0** | Tests de bout en bout simulant les terminaux mobiles et ordinateurs, et tests unitaires mathématiques. |

---

## 5. Décisions de design et d'ergonomie

1. **Grille de tokens de 4px et Densité d'information** :
   - Espacements verticaux et horizontaux réduits pour afficher un maximum de données exploitables sans sensation d'encombrement.
   - Les cartes KPI utilisent des hauteurs uniformes et s'alignent sur une seule rangée sans cassure disgracieuse.
2. **Zéro défilement horizontal sur mobile (320px à 412px)** :
   - Règle absolue : aucun élément ne doit déborder de la largeur de l'écran sur mobile.
   - Utilisation de barres de navigation inférieures (Bottom Navigation) sur mobile pour une manipulation confortable au pouce, remplaçant la barre latérale escamotable.
3. **Édition contextuelle par Tiroirs (Drawers)** :
   - Les modifications rapides (propriétés d'une boutique, filtres de dates, sélection de statut) s'ouvrent dans des tiroirs latéraux sur desktop ou des modales plein écran sur mobile, préservant le contexte visuel de l'utilisateur.
4. **Honnêteté et Clarté Psychologique** :
   - Bannissement total des faux avis clients, faux décomptes d'urgence ou fausses preuves d'achat.
   - Messages d'erreur de connexion rigoureusement neutres pour empêcher l'énumération de comptes par des attaquants.
5. **Protection de la vie privée dès la conception (Privacy by Design)** :
   - Aucune adresse IP d'acheteur n'est enregistrée en base de données.
   - Les données transmises aux Pixels Meta via l'API de conversions (CAPI) sont systématiquement normalisées et hachées en SHA-256.
   - Zéro géolocalisation GPS imposée aux clients ou aux coursiers : le suivi s'effectue exclusivement par paliers d'étapes logistiques.
6. **Recalcul des montants garanti côté serveur** :
   - Le total à payer, les réductions et les frais de livraison sont obligatoirement recalculés par le serveur lors de la soumission de commande, neutralisant toute tentative de manipulation des prix côté client.

---

## 6. Formules mathématiques clés du Scaling COD

Toute modification touchant au simulateur de rentabilité (`src/lib/scaling.ts`) doit respecter strictement les équations ci-dessous :

### Notations
- $P$ : Prix de vente du produit au client (FCFA)
- $A$ : Coût d'achat unitaire fournisseur (FCFA)
- $L$ : Frais de livraison standard supportés par le vendeur (FCFA)
- $B$ : Frais d'emballage unitaire (FCFA)
- $r$ : Coût d'un retour ou d'un échec de livraison (FCFA)
- $c$ : Taux de confirmation des commandes (en %)
- $d$ : Taux de livraison effectif parmi les commandes expédiées (en %)
- $S$ : Budget publicitaire quotidien (en USD)
- $T$ : Taux de conversion de devise (ex: 600 FCFA pour 1 USD)

### Formules
1. **Marge unitaire nette brute** :
   $$M = P - A - L - B$$
2. **Coût d'achat Meta maximum acceptable (CPA Meta Max)** :
   $$\text{CPA}_{\text{Meta}} = \frac{M \cdot (1 - c)}{1 + \frac{r}{L}}$$
3. **CPA Breakeven (Seuil de rentabilité publicitaire en USD)** :
   $$\text{CPA}_{\text{be}} = \frac{M \cdot (1 - c)}{T}$$
4. **CPA Cible (Marge nette visée de 30% à 40%)** :
   $$\text{CPA}_{\text{target}} = \text{CPA}_{\text{be}} \times 0.65$$
5. **Volume quotidien de commandes au point mort** :
   $$Q_{\text{be}} = \frac{S \times T}{M \cdot (1 - c)}$$
6. **Volume quotidien de commandes pour atteindre la cible** :
   $$Q_{\text{target}} = \frac{S}{\text{CPA}_{\text{target}}}$$

---

## 7. Instructions pour un futur modèle d'IA

Lorsque vous travaillez sur ce référentiel de code, appliquez rigoureusement les directives suivantes :

1. **Ne cassez jamais les sources uniques de vérité** :
   - Identité et nom de marque $\to$ `src/config/brand.ts`
   - Matrice de contrôle d'accès et rôles $\to$ `src/config/permissions.ts`
   - Référentiel des 54 pays africains et devises $\to$ `src/config/countries.ts`
   - Constantes audio $\to$ `src/config/sounds.ts`
   - Revendications marketing autorisées $\to$ `content/claims.ts`
2. **Rigueur monétaire absolue** :
   - Ne confondez jamais **XOF** et **XAF** : ce sont deux devises distinctes même si leur parité avec l'Euro est identique.
   - Les valeurs financières sont obligatoirement manipulées en entiers stricts représentant l'unité minimale de la monnaie. N'introduisez aucun nombre flottant IEEE 754 dans les calculs de prix, marges ou commissions.
3. **Sécurité et RLS en profondeur** :
   - Chaque nouvelle table créée dans Supabase doit impérativement posséder sa politique RLS activée, garantissant une isolation étanche par boutique (`store_id`).
   - Ne vous fiez jamais au seul frontend ou middleware : toute action sensible (pixels, finances, modifications d'équipe, suppressions) doit vérifier le rôle de l'utilisateur et son appartenance à la boutique directement côté serveur.
4. **Validation systématique par Zod** :
   - Toute nouvelle route API ou mutation Server Action doit valider ses paramètres d'entrée avec un schéma Zod dédié.
   - Les tokens sensibles (secrets CAPI, mots de passe, tokens d'invitation) ne doivent jamais transiter dans le DOM ni être exposés aux composants clients.
5. **Contrat de non-régression visuelle** :
   - Lors de la création ou retouche d'un composant, vérifiez qu'aucun débordement horizontal (`overflow-x`) n'apparaît sur les résolutions mobiles (320px, 360px, 375px, 390px).
   - Les squelettes de chargement instantanés doivent être conservés pour préserver l'expérience utilisateur ultra-fluide sur réseau mobile 3G/4G instable.
6. **Vérification par les tests avant conclusion** :
   - Avant de marquer une tâche comme terminée, exécutez la suite de tests correspondante (`npm test` pour Vitest ou `npx playwright test <spec>` pour Playwright).
   - Ne supprimez ni ne désactivez aucun test existant pour contourner un échec : corrigez le code d'implémentation.
7. **Liens de fichiers dans vos explications** :
   - Toute mention d'un fichier source doit être accompagnée d'un lien cliquable au format GitHub Markdown avec le schéma `file:///` en utilisant des slashes avant (`/`).

---

## 8. Historique des validations clés

- **Prompt 05-A** : Parcours d'accès vérifié, création de mot de passe k-anonyme, connexion neutre sans énumération.
- **Prompt 05-E** : Entonnoir de conversion anonyme, détection des abandons par champ, zéro fuite d'IP.
- **Prompt 05-D** : Modal de suppression de compte en 4 étapes, période de grâce de 14 jours, protection des équipes orphelines.
- **Prompt 05-G** : Formules mathématiques exactes de scaling COD, 5 verdicts automatiques, alertes sonores.
- **Prompt 05-Z** : 54 pays africains avec drapeaux SVG en Section 1 de l'éditeur de vitrine, redirection 301 des anciens réglages.
- **Prompt 05-Px** : Support de 3 Pixels Meta par boutique, hachage SHA-256 CAPI, masquage des secrets, bandeau cookies.
- **Prompt 05-Q** : Squelettes de chargement instantanés (< 50ms) sur les 6 écrans clés, WebGL Cobe asynchrone.
- **Extension Calendrier & Analyse Weekly (Over-scaling)** : Sélecteur de semaine en tête de page, détection automatique de l'Over-scaling vs Scaling Sain, bannière d'alerte rouge avec diagnostic et action requise, matrice comparative multi-semaines (S43 à S46) et synchronisation dynamique des KPI cards.
- **Prompt 17-J (Correction Édition Produit, Isolation des Fiches & Éditeur Stable)** :
  - **Résolution stricte par ID unique & Boutique** : Routes canoniques `/produits/{id}/modifier` et `/produits/{id}`, chargement strictement filtré par `id` ET `shop_id` actif. En cas d'identifiant introuvable : écran d'erreur clair « Produit introuvable », **JAMAIS** de repli silencieux vers `MOCK_PRODUCTS[0]` ou un autre produit.
  - **Isolation des composants & remontage React** : `ProductEditContainer` enveloppe le formulaire avec `key={`${storeSlug}-${product.id}`}` forçant la réinitialisation complète de l'arbre d'état React.
  - **Brouillons locaux isolés** : Clés `draft_${shop_id}_${product_id}` avec contrôle strict de concordance pour interdire tout chargement de brouillon orphelin ou d'une autre fiche.
  - **Éditeur de description stable** : Composant client avec `isInternalUpdateRef` interdisant la réécriture d'`innerHTML` pendant la frappe, suppression de la désinfection HTML à chaque frappe (nettoyage réservé à l'enregistrement `handleSave` et à l'affichage vitrine), raccourcis clavier natifs (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+Z, Ctrl+Y, Ctrl+K).
  - **Support complet des animations GIF** : Préservation impérative de l'extension `.gif` et de l'animation lors du téléversement (aucun écrasement en WebP statique), validation des Magic Bytes (`GIF87a`/`GIF89a`), et plafond rehaussé à 8 Mo pour les animations.
- **Prompt 17-K (Résolution Canonique des Produits Vitrine & URLs Unifiées)** :
  - **Générateur d'URL unique `getProductPublicUrl`** : Centralisé dans `src/lib/storefront-urls.ts`, utilisé partout (liste de produits, icône œil, « Afficher en tant que client », fiches, catalogue, sections de thèmes, liens courts). Aucune URL construite à la main ailleurs.
  - **Gestion prioritaire des domaines personnalisés** : Si un domaine personnalisé actif existe pour la boutique (ex: `kelio.com`), l'URL est générée à la racine `https://kelio.com/produits/{slug}` ; sinon elle utilise l'adresse de secours `/boutique/{shop_slug}/produits/{slug}`.
  - **Migration non destructive automatique** : Slugs et codes courts de 6 caractères (`shortCode` / `short_code`) générés automatiquement pour tous les produits sans altérer les valeurs existantes (`ensureProductSlugAndShortCode`).
  - **Résolution tolérante de la route produit** : La route accepte indifféremment l'`id`, le `slug` ou le `short_code` avec insensibilité à la casse et aux accents (`findProductInShopRaw`). Redirection 301 automatique vers l'URL canonique `/produits/{slug}`.
  - **État de publication & écran « Produit indisponible »** : Les produits actifs sont publiés par défaut (`published_to_storefront: true`). Les produits en brouillon ou non publiés affichent l'écran dédié « Produit indisponible » (sans 404 générique et sans suggestion de concurrents).
  - **Aperçu administrateur sécurisé** : Jeton signé (1 heure de validité) ou paramètre `?preview=true` permettant à l'administrateur de prévisualiser un produit brouillon avec bandeau d'avertissement et balise `noindex, nofollow`.
  - **Page 404 propre à la boutique** : Affiche le logo et le nom de la boutique, un bouton de retour à l'accueil et au catalogue, et une boîte de diagnostic technique visible uniquement par l'administrateur connecté.
  - **Rétro-compatibilité 301** : Route singulière `/boutique/[store]/produit/[id]` redirigeant automatiquement vers `/boutique/[store]/produits/[id]`.
- **Intégration Supabase Full-Stack (Novika Cloud)** : Déploiement complet sur instance Supabase PostgreSQL 17 (`zkkenzowvttmlleooqvu`), 27 tables créées avec RLS 100% conforme (0 avertissement de sécurité), types TypeScript stricts générés, Realtime actif sur les commandes avec alerte audio, buckets de stockage d'images configurés et routes d'API serveur reliées.

---

## 9. Intégration Supabase Full-Stack (PostgreSQL 17, RLS 100%, Realtime, Storage)

L'application est entièrement connectée à son infrastructure backend PostgreSQL managée sur **Supabase** via le serveur MCP officiel (`supabase_mcp`).

### Identité du projet Supabase
* **Nom du projet** : `Novika`
* **Identifiant (Project Ref)** : `zkkenzowvttmlleooqvu`
* **Région** : `eu-west-1` (Irlande / Europe de l'Ouest)
* **Moteur de base de données** : PostgreSQL 17.11
* **URL de l'API** : `https://zkkenzowvttmlleooqvu.supabase.co`

### Connecteurs Next.js 16 App Router
Tous les connecteurs sont isolés dans `src/lib/supabase/` et typés avec les schémas stricts générés dans `src/types/database.types.ts` :
1. **Client Navigateur (`src/lib/supabase/client.ts`)** :
   - Utilise `createBrowserClient<Database>` de `@supabase/ssr`.
   - Gère les souscriptions temps réel (Realtime) et interactions interactives côté client.
2. **Client Serveur (`src/lib/supabase/server.ts`)** :
   - Utilise `createServerClient<Database>` avec `await cookies()` (obligatoire sous Next.js 16).
   - Utilisé dans les Route Handlers (`src/app/api/`) et Server Components pour interroger la base avec le contexte de session utilisateur.
3. **Middleware de rafraîchissement (`src/lib/supabase/middleware.ts`)** :
   - Rafraîchit les jetons JWT des sessions actives et synchronise les cookies d'authentification.

### Référentiel des 27 Tables Supabase Déployées
Toutes les tables ont **Row Level Security (RLS) activé à 100%** et ont été auditées via `get_advisors(type: "security")` avec **zéro avertissement (0 security lints)** :

| Domaine | Tables Supabase Déployées | Rôle & Contenu |
|---|---|---|
| **Monnaie & Géographie** | `currencies`, `countries`, `shops`, `shop_countries` | Référentiel des devises (XOF, XAF distincts), 54 pays africains, boutiques et pays desservis. |
| **Logistique & Zones COD** | `carriers`, `pickup_points`, `shipping_zones`, `payment_methods`, `shipments`, `payment_proofs` | Transporteurs locaux, points relais, zones tarifaires par ville, modes de paiement et preuves de règlement. |
| **Équipe & Permissions** | `country_teams`, `team_members`, `invitation_quotas`, `join_requests` | Membres de l'équipe, rôles RBAC (`owner`, `admin`, `manager`, `closer`, `rider`, `agency`), quotas d'invitations et demandes d'accès. |
| **Catalogue & Produits** | `products`, `stores` | Produits, variantes, stocks, prix de revient, prix de vente et offres promotionnelles. |
| **Commandes & Finances** | `orders`, `order_items`, `order_financials`, `weekly_scaling_snapshots` | Commandes COD, articles commandés, marges nettes réelles et historique hebdomadaire de scaling publicitaire. |
| **Vitrine & Marketing** | `storefronts`, `themes`, `pages`, `announcement_banners`, `meta_pixels` | Thèmes graphiques, vitrines personnalisées, bannières d'annonces et configuration de 3 Pixels Meta avec CAPI chiffré. |
| **Sécurité & Accès** | `tracking_tokens`, `beta_invitations` | Jetons 128-bit de suivi public par étapes (sans GPS) et invitations bêta sécurisées. |

### Supabase Storage (Stockage d'images)
Deux buckets publics ont été provisionnés avec limitation de taille et filtrage des types MIME :
* `store-assets` (Max 5 Mo) : Logos de boutique, favicons et bannières promotionnelles (JPEG, PNG, WebP, SVG).
* `product-images` (Max 10 Mo) : Galeries photos des produits du catalogue (JPEG, PNG, WebP, GIF).

### Supabase Realtime & Alertes Audio
* **Publication `supabase_realtime`** : Activée sur les tables `orders` et `tracking_tokens`.
* **Écoute instantanée** : Dans `src/components/layout/app-shell.tsx`, une souscription écoute les événements `INSERT` sur la table `orders` pour déclencher immédiatement le son `notificationSound.playOrderSound()` (`public/sounds/novika-order.mp3`).
* **Suivi de commande live** : Dans `src/app/suivi/[token]/tracking-client.tsx`, les transitions de statut logistique sont reçues en direct pour faire avancer la frise sans rechargement.

### Prompt 17-L : Bénéfices du produit, formules & rupture de stock
* **Suppression des formules automatiques** : Masquage par défaut via `showQuantityOffers: false` (récupérable par switch d'administration).
* **Sélecteur simple (− 1 +)** : Quantité sélectionnée unitairement quand aucune offre n'est configurée ou active.
* **Bloc « Bénéfices du produit »** : Modifiable dans `product-form-client.tsx` (titre, jusqu'à 8 bénéfices avec icônes sobres, description courte, conclusion facultative).
* **Générateur IA (`/api/products/ai/generate-benefits`)** : Génère 3 à 5 bénéfices concrets sans promesses médicales ni chiffres inventés.
* **Bouton unique rupture de stock** : Rendu d'un bouton unique pleine largeur si le stock suivi est épuisé (`<= 0`).

