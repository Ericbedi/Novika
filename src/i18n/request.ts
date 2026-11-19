import { getRequestConfig } from "next-intl/server";

/**
 * Configuration i18n internationale (Prompt 12-b Phase 2)
 * Français (fr) par défaut, Anglais (en) en second.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const reqLocale = await requestLocale;
  const locale: "fr" | "en" = reqLocale === "en" ? "en" : "fr";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "Africa/Abidjan",
  };
});

