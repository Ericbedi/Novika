import { Product } from "@/server/data/types";
import { getShopProducts } from "./products-store";

export interface BlogPost {
  id: string;
  storeSlug: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML ou Markdown assaini
  featuredImage?: string;
  authorName: string;
  publishedAt: string; // ISO date
  readingTimeMinutes: number;
  tags: string[];
  associatedProductIds: string[];
  status: "published" | "draft";
  commentsEnabled: boolean; // false par défaut
}

const memoryBlogPosts = new Map<string, BlogPost[]>();

export function clearShopBlogMemory(): void {
  memoryBlogPosts.clear();
}

export function getShopBlogStorageKey(shopSlug: string): string {
  return `novika_store_blog_${shopSlug}`;
}

const DEMO_BLOG_POSTS: BlogPost[] = [
  {
    id: "post_01",
    storeSlug: "lome-glow",
    title: "5 rituels naturels pour illuminer votre teint au quotidien",
    slug: "5-rituels-naturels-pour-illuminer-votre-teint",
    excerpt:
      "Découvrez comment associer les bienfaits de la vitamine C et des huiles végétales locales pour un teint frais, éclatant et sans taches.",
    content: `
      <p>Avoir une peau saine et lumineuse ne nécessite pas des dizaines de produits chimiques. En Afrique de l'Ouest, nos traditions regorgent d'ingrédients nobles parfaitement adaptés à notre climat tropical.</p>
      <h3>1. Le nettoyage doux matin et soir</h3>
      <p>L'accumulation de poussière et de sébum obstrue les pores. Utilisez une eau florale ou un nettoyant doux sans sulfates pour préserver le film hydrolipidique de votre épiderme.</p>
      <h3>2. L'action ciblée de la vitamine C et du Niacinamide</h3>
      <p>Pour atténuer les taches pigmentaires et unifier le grain de peau, appliquez un sérum concentré en actifs antioxydants chaque matin avant votre crème protectrice.</p>
      <h3>3. L'hydratation scellée</h3>
      <p>N'oubliez jamais de sceller l'hydratation avec quelques gouttes d'huile végétale pure comme l'huile de ricin ou de jojoba, particulièrement le soir avant le coucher.</p>
      <p>Prenez soin de vous en toute sérénité : nos produits certifiés sont livrés directement chez vous avec paiement en espèces à la livraison.</p>
    `,
    featuredImage: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c",
    authorName: "Rédaction Beauté & Santé",
    publishedAt: "2026-11-10T10:00:00Z",
    readingTimeMinutes: 4,
    tags: ["Soins Visage", "Beauté Naturelle", "Conseils"],
    associatedProductIds: ["prod_02"],
    status: "published",
    commentsEnabled: false,
  },
  {
    id: "post_02",
    storeSlug: "lome-glow",
    title: "Pourquoi le café aux champignons médicinaux transforme la concentration au travail",
    slug: "cafe-champignons-medicinaux-concentration-travail",
    excerpt:
      "Lion's Mane, Chaga et Reishi : comment cette boisson millénaire élimine les coups de fatigue de l'après-midi sans palpitations.",
    content: `
      <p>Vous ressentez souvent une chute d'énergie brutale vers 14h ? La surconsommation de café classique entraîne des pics d'adrénaline suivis de crashes énergétiques désagréables.</p>
      <h3>L'alliance du bien-être et de la caféine propre</h3>
      <p>Le café enrichi au Lion's Mane stimule les fonctions cognitives et la mémoire de travail sans provoquer de nervosité. Le Reishi et le Chaga renforcent quant à eux les défenses immunitaires naturelles.</p>
      <h3>Une préparation rapide et savoureuse</h3>
      <p>Une simple cuillère diluée dans de l'eau chaude le matin vous garantit 6 heures de clarté mentale ininterrompue pour vos journées professionnelles exigeantes.</p>
    `,
    featuredImage: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be",
    authorName: "Dr. Koffi Mensah · Nutritionniste",
    publishedAt: "2026-11-14T08:30:00Z",
    readingTimeMinutes: 3,
    tags: ["Nutrition", "Bien-être", "Énergie"],
    associatedProductIds: ["prod_01"],
    status: "published",
    commentsEnabled: false,
  },
];

/**
 * Récupère tous les articles de blog pour une boutique donnée.
 */
export function getShopBlogPosts(shopSlug: string): BlogPost[] {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(getShopBlogStorageKey(shopSlug));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Erreur de lecture du blog local:", e);
    }
  }

  if (memoryBlogPosts.has(shopSlug)) {
    return memoryBlogPosts.get(shopSlug)!;
  }

  if (shopSlug === "lome-glow") {
    return DEMO_BLOG_POSTS;
  }

  return [];
}

/**
 * Récupère un article par son slug exact dans la boutique.
 * Zéro repli sur un autre article.
 */
export function getBlogPostBySlug({
  shopSlug,
  slug,
  allowDraft = false,
}: {
  shopSlug: string;
  slug: string;
  allowDraft?: boolean;
}): BlogPost | null {
  if (!shopSlug || !slug) return null;

  const posts = getShopBlogPosts(shopSlug);
  const target = slug.trim().toLowerCase();

  const found = posts.find((p) => p.slug.toLowerCase() === target || p.id.toLowerCase() === target);
  if (!found) return null;

  if (!allowDraft && found.status !== "published") {
    return null;
  }

  return found;
}

/**
 * Sauvegarde ou met à jour un article de blog.
 */
export function saveShopBlogPost(shopSlug: string, post: BlogPost): BlogPost {
  const posts = getShopBlogPosts(shopSlug);
  const postId = post.id || `post_${Date.now()}`;
  const finalSlug = post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const updated: BlogPost = {
    ...post,
    id: postId,
    slug: finalSlug,
    commentsEnabled: false, // Règles strictes : commentaires désactivés par défaut
  };

  const existingIndex = posts.findIndex((p) => p.id === postId);
  let updatedList: BlogPost[];

  if (existingIndex >= 0) {
    updatedList = [...posts];
    updatedList[existingIndex] = updated;
  } else {
    updatedList = [updated, ...posts];
  }

  memoryBlogPosts.set(shopSlug, updatedList);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getShopBlogStorageKey(shopSlug), JSON.stringify(updatedList));
    } catch (e) {
      console.error("Erreur de sauvegarde locale du blog:", e);
    }
  }

  return updated;
}
