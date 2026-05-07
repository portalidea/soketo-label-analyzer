"use client";

import { useSearchParams } from "next/navigation";

export type EmbedPlatform = "ios" | "android" | "web";
export type EmbedLang = "it" | "en" | "es";
export type EmbedTheme = "light" | "dark";

export type EmbedContext = {
  isEmbedded: boolean;
  platform: EmbedPlatform | null;
  userId: string | null;
  lang: EmbedLang;
  theme: EmbedTheme;
  hideHeader: boolean;
  hideFooter: boolean;
  hideSoketoCTA: boolean;
};

const VALID_PLATFORMS: EmbedPlatform[] = ["ios", "android", "web"];
const VALID_LANGS: EmbedLang[] = ["it", "en", "es"];
const VALID_THEMES: EmbedTheme[] = ["light", "dark"];

export function useEmbedded(): EmbedContext {
  const params = useSearchParams();
  const isEmbedded = params.get("embedded") === "true";

  const platformParam = params.get("platform");
  const platform =
    platformParam && (VALID_PLATFORMS as string[]).includes(platformParam)
      ? (platformParam as EmbedPlatform)
      : null;

  const langParam = params.get("lang");
  const lang =
    langParam && (VALID_LANGS as string[]).includes(langParam)
      ? (langParam as EmbedLang)
      : "it";

  const themeParam = params.get("theme");
  const theme =
    themeParam && (VALID_THEMES as string[]).includes(themeParam)
      ? (themeParam as EmbedTheme)
      : "light";

  return {
    isEmbedded,
    platform,
    userId: params.get("user_id"),
    lang,
    theme,
    hideHeader: isEmbedded || params.get("hide_header") === "true",
    hideFooter: isEmbedded || params.get("hide_footer") === "true",
    hideSoketoCTA: params.get("hide_cta") === "true",
  };
}
