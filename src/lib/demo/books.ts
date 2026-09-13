/**
 * ⚠️ DEMO DATA — clearly-labeled development placeholders. ⚠️
 *
 * STRICT RULE: this file must NEVER contain real Quran verses, hadith text,
 * real scholar names, or real book titles/authors presented as authentic.
 * Every record is flagged `isDemo: true` and rendered with a visible
 * "Demo" badge. Production content comes exclusively from the Knowledge
 * Base backend (see docs/ARCHITECTURE.md).
 */
import type { Book, BookCategory, BookLanguage } from "@/types/knowledge-base";

export interface DemoBook extends Book {
  isDemo: true;
  coverHue: number;
}

const demoBook = (
  id: string,
  title: string,
  category: BookCategory,
  language: BookLanguage,
  pageCount: number,
  coverHue: number,
  addedAt: string
): DemoBook => ({
  id,
  title: `${title} (Demo)`,
  author: "Placeholder Author",
  category,
  language,
  pageCount,
  coverHue,
  addedAt,
  isDemo: true,
  description:
    "Placeholder record used to preview the library design system. Real books, authors and covers arrive from the Islamic Knowledge Base.",
});

export const demoBooks: DemoBook[] = [
  demoBook("demo-fiqh-1", "Sample Fiqh Handbook", "fiqh", "en", 214, 165, "2025-11-20"),
  demoBook("demo-tafsir-1", "Sample Tafsir Volume", "tafsir", "ar", 512, 42, "2025-11-28"),
  demoBook("demo-seerah-1", "Sample Seerah Study", "seerah", "en", 340, 85, "2025-12-02"),
];

export const demoCategoryLabels: Record<BookCategory, string> = {
  "quran-sciences": "Quran Sciences",
  tafsir: "Tafsir",
  hadith: "Hadith",
  fiqh: "Fiqh",
  aqeedah: "Aqeedah",
  seerah: "Seerah",
  history: "History",
  ethics: "Ethics",
  family: "Family",
  "islamic-studies": "Islamic Studies",
  dua: "Dua",
  other: "Other",
};
