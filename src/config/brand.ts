/**
 * Brand configuration — the single source of truth for identity.
 * Replace values here (or via env) to re-brand the whole product.
 * No component should hard-code the brand name.
 */
export const brand = {
  /** Full product name (working name — easy to replace). */
  name: "Islamic Knowledge",
  /** Compact name for icons / tight spaces. */
  shortName: "Ilm",
  tagline: "Read • Search • Learn • Study",
  description:
    "A modern Islamic knowledge platform: Quran, Hadith, a structured Islamic library, and an AI research assistant grounded in verified sources.",
  /** One-line benefits used by the APK prompt / store-style surfaces. */
  benefits: [
    "Read Quran & Hadith with trusted references",
    "A growing library of Islamic books",
    "Ask AI questions grounded in real sources",
    "Bookmarks, notes & reading progress",
  ],
  /** Key theme colors mirrored from globals.css — used for manifest/meta. */
  themeColorLight: "#f8f6ef",
  themeColorDark: "#10201c",
  themeColor: "#0d4d3a",
  gold: "#c9a227",
  /** Social paths */
  ogImage: "/icons/og-image.jpg",
  appIcon: "/icons/icon-512.png",
} as const;

export type Brand = typeof brand;
