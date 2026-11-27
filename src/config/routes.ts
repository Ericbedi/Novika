/**
 * Source unique de vérité des routes et URLs de l'application Kelio.
 * Aucune URL critique (notamment /connexion) ne doit être écrite en dur.
 */

export const ROUTES = {
  // Authentification et Comptes
  home: "/",
  login: "/connexion",
  signup: "/inscription",
  forgotPassword: "/auth/mot-de-passe-oublie",
  setPassword: "/auth/creer-mot-de-passe",
  verifyEmail: "/auth/verifier-email",
  authCallback: "/auth/callback",
  onboarding: "/demarrer",
  access: "/acces",

  // Espace Vendeur & Boutiques
  app: "/app",
  dashboard: (store: string) => `/app/${store}`,
  orders: (store: string) => `/app/${store}/commandes`,
  followups: (store: string) => `/app/${store}/commandes/relances`,
  products: (store: string) => `/app/${store}/produits`,
  aiProductSheet: (store: string) => `/app/${store}/produits/nouveau-ia`,
  stock: (store: string) => `/app/${store}/produits/stock`,
  suppliers: (store: string) => `/app/${store}/produits/fournisseurs`,
  collections: (store: string) => `/app/${store}/produits/collections`,
  finances: (store: string) => `/app/${store}/finances`,
  settings: (store: string) => `/app/${store}/reglages`,
  team: (store: string) => `/app/${store}/reglages/equipe`,
  pixels: (store: string) => `/app/${store}/pixels`,
  storefrontSettings: (store: string) => `/app/${store}/boutique-en-ligne`,
  banners: (store: string) => `/app/${store}/boutique-en-ligne/bannieres`,

  // Vitrines Publiques
  storefront: (store: string) => `/boutique/${store}`,
  storefrontProduct: (store: string, productId: string) => `/boutique/${store}/produits/${productId}`,

  // Suivi Public
  tracking: (orderNumber: string) => `/suivi/${orderNumber}`,
} as const;

/**
 * Liste des routes statiques publiques ou critiques devant obligatoirement correspondre
 * à une page existante dans src/app/ (testée par un test automatisé).
 */
export const STATIC_PAGES_TO_VERIFY = [
  ROUTES.home,
  ROUTES.login,
  ROUTES.signup,
  ROUTES.forgotPassword,
  ROUTES.setPassword,
  ROUTES.verifyEmail,
  ROUTES.onboarding,
  ROUTES.access,
  ROUTES.app,
] as const;

export default ROUTES;
