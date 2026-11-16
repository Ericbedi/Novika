export type BannerPlacement = "hero_carousel" | "collection" | "promotional_middle";

export type BannerTextPosition =
  | "middle_center"
  | "middle_left"
  | "middle_right"
  | "bottom_left"
  | "bottom_center";

export interface BannerSlide {
  id: string;
  shopId: string;
  placement: BannerPlacement;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  destinationUrl?: string; // Sûr: /produit/..., /catalogue, https://..., wa.me/...
  altText: string; // Obligatoire pour l'accessibilité
  desktopImageUrl: string;
  mobileImageUrl?: string;
  focalPointX: number; // 0 à 100% (ex: 50)
  focalPointY: number; // 0 à 100% (ex: 50)
  overlayOpacity: number; // 0 à 80% pour le voile de lisibilité
  textColor: string; // #FFFFFF ou #111111 calculé pour le contraste
  textPosition: BannerTextPosition;
  displayOrder: number;
  durationSeconds: number; // Min 5 secondes
  isActive: boolean;
  startDate?: string; // ISO string pour planification
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  shopId: string;
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  fileSizeBytes: number;
  width: number;
  height: number;
  url: string;
  thumbnailUrl: string;
  isUsedInBanner: boolean;
  isUsedInProduct: boolean;
  uploadedAt: string;
}

export interface OrgMediaQuota {
  shopId: string;
  planId: "starter" | "pro" | "scale";
  usedBytes: number;
  maxBytes: number; // Ex: 500 Mo en starter, 5 Go en pro
}
