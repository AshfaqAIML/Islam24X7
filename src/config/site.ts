import { brand } from "@/config/brand";

/**
 * Site-level configuration: routes, navigation, feature flags.
 */

export type NavItem = {
  label: string;
  href: string;
  /** Module not shipped yet — rendered as disabled with a "Soon" chip. */
  soon?: boolean;
  /** Phase in which the module is planned (used for honest UI during construction). */
  phase?: number;
};

export const routes = {
  home: "/",
  download: "/download",
  // Planned routes (implemented in later phases — never linked as active):
  library: "/library",
  quran: "/quran",
  hadith: "/hadith",
  search: "/search",
  ai: "/ai",
  duas: "/duas",
  azkar: "/azkar",
  prayer: "/prayer",
  qibla: "/qibla",
  tasbeeh: "/tasbeeh",
  more: "/more",
} as const;

export const mainNav: NavItem[] = [
  { label: "Home", href: routes.home },
  { label: "Quran", href: routes.quran, soon: true, phase: 6 },
  { label: "Hadith", href: routes.hadith, soon: true, phase: 7 },
  { label: "Library", href: routes.library, soon: true, phase: 3 },
  { label: "Ask AI", href: routes.ai, soon: true, phase: 9 },
];

/**
 * Modules showcased on the Phase-1 home page.
 * Status is honest: planned phases, no fake content behind them.
 */
export const moduleShowcase = [
  {
    key: "quran",
    title: "Quran",
    description: "Surahs, ayah-by-ayah reading, translations, bookmarks.",
    icon: "book-open-text",
    phase: 6,
  },
  {
    key: "hadith",
    title: "Hadith",
    description: "Collections → books → chapters, with grading where reliable.",
    icon: "scroll-text",
    phase: 7,
  },
  {
    key: "library",
    title: "Library",
    description: "Fiqh, Tafsir, Aqeedah, Seerah, history — browse and read.",
    icon: "library",
    phase: 3,
  },
  {
    key: "reader",
    title: "Reader",
    description: "A premium e-book reader with highlights, notes and progress.",
    icon: "book-marked",
    phase: 4,
  },
  {
    key: "search",
    title: "Global Search",
    description: "One search across Quran, Hadith and the whole library.",
    icon: "search",
    phase: 5,
  },
  {
    key: "ai",
    title: "AI Assistant",
    description: "Ask the library questions — every answer cites its sources.",
    icon: "sparkles",
    phase: 9,
  },
  {
    key: "duas",
    title: "Duas & Azkar",
    description: "Morning & evening remembrance with counters and routines.",
    icon: "hand-heart",
    phase: 10,
  },
  {
    key: "prayer",
    title: "Prayer, Qibla & Tasbeeh",
    description: "Prayer times, Qibla compass, dhikr counter, Hijri calendar.",
    icon: "compass",
    phase: 11,
  },
] as const;

export const featureFlags = {
  /**
   * Mock/demo mode. When true, services return clearly-labeled placeholder
   * data and the UI shows a demo indicator. Real content always comes from
   * the Knowledge Base backend once connected.
   */
  useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true",
} as const;

export const siteConfig = {
  /** Canonical site URL (used for SEO metadata; set in production). */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  name: brand.name,
} as const;
