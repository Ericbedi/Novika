"use client";

import React from "react";
import { ThemeSection, ThemeGeneralSettings } from "@/lib/theme-engine/types";
import { isSectionEmpty } from "@/lib/theme-engine/schemas";
import { SectionWrapper } from "./SectionWrapper";
import { AnnouncementBarSection } from "./AnnouncementBarSection";
import { HeroBannerSection } from "./HeroBannerSection";
import { ImageWithTextSection } from "./ImageWithTextSection";
import { MultiColumnsSection } from "./MultiColumnsSection";
import { FeaturedProductsSection } from "./FeaturedProductsSection";
import { MarqueeSection } from "./MarqueeSection";
import { ReassuranceSection } from "./ReassuranceSection";
import { VerifiedReviewsSection } from "./VerifiedReviewsSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { ComparisonTableSection } from "./ComparisonTableSection";
import { FaqSection } from "./FaqSection";
import { RichTextSection } from "./RichTextSection";
import { DividerSection } from "./DividerSection";
import { VideoSection } from "./VideoSection";
import { WhatsAppBlockSection } from "./WhatsAppBlockSection";
import { FooterSection } from "./FooterSection";
import { SlideshowSection } from "./SlideshowSection";
import { MultiLinesSection } from "./MultiLinesSection";
import { ImageCollageSection } from "./ImageCollageSection";
import { FeaturedProductSection } from "./FeaturedProductSection";
import { ContactFormSection } from "./ContactFormSection";
import { NewsletterSignupSection } from "./NewsletterSignupSection";
import { BuilderBlockSection } from "./BuilderBlockSection";
import { Product } from "@/server/data/types";
import { CustomerReview } from "@/server/data/storefront-types";

interface ThemeSectionRendererProps {
  section: ThemeSection;
  generalSettings: ThemeGeneralSettings;
  products?: Product[];
  reviews?: CustomerReview[];
  storeName?: string;
  storeSlug: string;
  isEditMode?: boolean;
  onEditSection?: (section: ThemeSection) => void;
}

export function ThemeSectionRenderer({
  section,
  generalSettings,
  products = [],
  reviews = [],
  storeName = "Novika",
  storeSlug,
  isEditMode = false,
  onEditSection,
}: ThemeSectionRendererProps) {
  if (!section.isVisible && !isEditMode) {
    return null;
  }

  // Sélectionner la palette de couleur assignée à la section
  const palette =
    generalSettings.palettes.find((p) => p.id === section.paletteId) ||
    generalSettings.palettes[0];

  const isEmpty = isSectionEmpty(section.type, section.settings);

  // Le bandeau d'annonce a son propre conteneur pleine largeur
  if (section.type === "announcement_bar") {
    if (isEmpty && !isEditMode) return null;
    return (
      <div className="relative group">
        {isEditMode && onEditSection && (
          <button
            type="button"
            onClick={() => onEditSection(section)}
            className="absolute top-1 right-2 z-50 text-[10px] font-black px-2 py-0.5 rounded bg-amber-400 text-black shadow-xs cursor-pointer"
          >
            Modifier bandeau
          </button>
        )}
        <AnnouncementBarSection
          settings={section.settings as any}
          palette={palette}
          isEditMode={isEditMode}
        />
      </div>
    );
  }

  // Le footer a son propre conteneur pleine largeur
  if (section.type === "footer") {
    if (isEmpty && !isEditMode) return null;
    return (
      <div className="relative group">
        {isEditMode && onEditSection && (
          <button
            type="button"
            onClick={() => onEditSection(section)}
            className="absolute top-4 right-4 z-50 text-[11px] font-black px-3 py-1.5 rounded-xl bg-amber-400 text-black shadow-md cursor-pointer"
          >
            Modifier le pied de page
          </button>
        )}
        <FooterSection
          settings={section.settings as any}
          palette={palette}
          storeName={storeName}
        />
      </div>
    );
  }

  // Le bandeau défilant (Marquee) est pleine largeur sans SectionWrapper
  if (section.type === "marquee") {
    if (isEmpty && !isEditMode) return null;
    return (
      <div className="relative group">
        {isEditMode && onEditSection && (
          <button
            type="button"
            onClick={() => onEditSection(section)}
            className="absolute top-2 right-4 z-50 text-[11px] font-black px-3 py-1 rounded-xl bg-amber-400 text-black shadow-md cursor-pointer"
          >
            Modifier le défilement
          </button>
        )}
        <MarqueeSection settings={section.settings as any} palette={palette} />
      </div>
    );
  }

  return (
    <SectionWrapper
      id={section.id}
      palette={palette}
      pageWidth={generalSettings.layout.pageWidth}
      spacing={generalSettings.layout.sectionSpacing}
      cardRadius={generalSettings.layout.cardRadius}
      isEditMode={isEditMode}
      isEmpty={isEmpty}
      onEdit={() => onEditSection?.(section)}
      sectionName={section.name}
    >
      {section.type === "hero_banner" && (
        <HeroBannerSection
          settings={section.settings as any}
          palette={palette}
          buttonRadius={generalSettings.layout.buttonRadius}
        />
      )}

      {section.type === "image_with_text" && (
        <ImageWithTextSection
          settings={section.settings as any}
          palette={palette}
          cardRadius={generalSettings.layout.cardRadius}
          buttonRadius={generalSettings.layout.buttonRadius}
        />
      )}

      {section.type === "multi_columns" && (
        <MultiColumnsSection
          settings={section.settings as any}
          palette={palette}
          cardRadius={generalSettings.layout.cardRadius}
        />
      )}

      {section.type === "featured_products" && (
        <FeaturedProductsSection
          settings={section.settings as any}
          palette={palette}
          products={products}
          storeSlug={storeSlug}
          cardRadius={generalSettings.layout.cardRadius}
          buttonRadius={generalSettings.layout.buttonRadius}
        />
      )}

      {section.type === "reassurance" && (
        <ReassuranceSection
          settings={section.settings as any}
          palette={palette}
          cardRadius={generalSettings.layout.cardRadius}
        />
      )}

      {section.type === "verified_reviews" && (
        <VerifiedReviewsSection
          settings={section.settings as any}
          palette={palette}
          reviews={reviews}
          cardRadius={generalSettings.layout.cardRadius}
        />
      )}

      {section.type === "testimonials" && (
        <TestimonialsSection
          settings={section.settings as any}
          palette={palette}
          cardRadius={generalSettings.layout.cardRadius}
        />
      )}

      {section.type === "comparison_table" && (
        <ComparisonTableSection
          settings={section.settings as any}
          palette={palette}
          cardRadius={generalSettings.layout.cardRadius}
          isEditMode={isEditMode}
        />
      )}

      {section.type === "faq" && (
        <FaqSection
          settings={section.settings as any}
          palette={palette}
          cardRadius={generalSettings.layout.cardRadius}
        />
      )}

      {section.type === "rich_text" && (
        <RichTextSection settings={section.settings as any} palette={palette} />
      )}

      {section.type === "divider" && (
        <DividerSection settings={section.settings as any} palette={palette} />
      )}

      {section.type === "video" && (
        <VideoSection
          settings={section.settings as any}
          palette={palette}
          cardRadius={generalSettings.layout.cardRadius}
        />
      )}

      {section.type === "whatsapp_block" && (
        <WhatsAppBlockSection
          settings={section.settings as any}
          palette={palette}
          cardRadius={generalSettings.layout.cardRadius}
          buttonRadius={generalSettings.layout.buttonRadius}
        />
      )}

      {section.type === "slideshow" && (
        <SlideshowSection
          settings={section.settings as any}
          palette={palette}
          buttonRadius={generalSettings.layout.buttonRadius}
        />
      )}

      {section.type === "multi_lines" && (
        <MultiLinesSection
          settings={section.settings as any}
          palette={palette}
          cardRadius={generalSettings.layout.cardRadius}
        />
      )}

      {section.type === "image_collage" && (
        <ImageCollageSection
          settings={section.settings as any}
          palette={palette}
          cardRadius={generalSettings.layout.cardRadius}
        />
      )}

      {section.type === "featured_product" && (
        <FeaturedProductSection
          settings={section.settings as any}
          palette={palette}
          products={products}
          storeSlug={storeSlug}
          cardRadius={generalSettings.layout.cardRadius}
          buttonRadius={generalSettings.layout.buttonRadius}
        />
      )}

      {section.type === "contact_form" && (
        <ContactFormSection
          settings={section.settings as any}
          palette={palette}
          cardRadius={generalSettings.layout.cardRadius}
          buttonRadius={generalSettings.layout.buttonRadius}
        />
      )}

      {section.type === "newsletter_signup" && (
        <NewsletterSignupSection
          settings={section.settings as any}
          palette={palette}
          cardRadius={generalSettings.layout.cardRadius}
          buttonRadius={generalSettings.layout.buttonRadius}
        />
      )}

      {section.type === "builder_block" && (
        <BuilderBlockSection
          settings={section.settings as any}
          palette={palette}
          cardRadius={generalSettings.layout.cardRadius}
        />
      )}
    </SectionWrapper>
  );
}
