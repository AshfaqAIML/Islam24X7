"use client";

import Link from "next/link";
import { BookOpen, FileText, ListTree } from "lucide-react";
import type { SearchHit } from "@/types/knowledge-base";
import { cn } from "@/lib/utils";

export type HitKind = "book" | "chapter" | "page";

/**
 * Classify a hit from its citation shape (all demo/live book citations):
 *  - book citation without chapter → Book
 *  - book citation with chapter, without page → Chapter
 *  - book citation with page → Page
 */
export function hitKind(hit: SearchHit): HitKind {
  const source = hit.citation.source;
  if (source.type !== "book") return "book";
  if (source.page != null) return "page";
  if (source.chapterId) return "chapter";
  return "book";
}

/** Reader deep link for a hit — book detail for books, reader for chapter/page. */
export function hitHref(hit: SearchHit): string {
  const source = hit.citation.source;
  if (source.type !== "book") return "/library";
  const { bookId, chapterId, page } = source;
  if (chapterId) {
    return `/library/${bookId}/read?chapter=${encodeURIComponent(chapterId)}${
      page != null ? `&page=${page}` : ""
    }`;
  }
  return `/library/${bookId}`;
}

const kindMeta: Record<HitKind, { label: string; icon: typeof BookOpen }> = {
  book: { label: "Book", icon: BookOpen },
  chapter: { label: "Chapter", icon: ListTree },
  page: { label: "Page", icon: FileText },
};

/**
 * One search result: kind chip + breadcrumb + title + highlighted excerpt.
 * The excerpt carries <mark> highlights supplied by the search service
 * (HTML-escaped by construction in demo mode; trusted KB backend in live).
 */
export function SearchResultCard({
  hit,
  className,
}: {
  hit: SearchHit;
  className?: string;
}) {
  const kind = hitKind(hit);
  const Icon = kindMeta[kind].icon;

  if (hit.citation.source.type !== "book") return null;
  const source = hit.citation.source;
  const breadcrumb =
    kind === "page" && source.chapterTitle
      ? `${source.bookTitle} · ${source.chapterTitle}`
      : kind === "chapter"
        ? source.bookTitle
        : "";

  return (
    <li className={cn("list-none", className)}>
      <Link
        href={hitHref(hit)}
        className={cn(
          "focus-ring group block rounded-xl border bg-card p-4 transition-all",
          "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-5"
        )}
      >
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium",
              kind === "book" && "border-primary/30 bg-primary/5 text-primary",
              kind === "chapter" &&
                "border-gold/40 bg-gold/10 text-gold-foreground dark:text-gold",
              kind === "page" && "border-border bg-muted/60 text-muted-foreground"
            )}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            {kindMeta[kind].label}
          </span>
          {breadcrumb ? (
            <span className="min-w-0 truncate" aria-hidden="true">
              {breadcrumb}
            </span>
          ) : null}
        </div>

        <h3 className="mt-2 font-serif text-base font-semibold leading-snug transition-colors group-hover:text-primary sm:text-lg">
          {hit.title}
        </h3>

        <p
          className="search-excerpt mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: hit.excerpt }}
        />
      </Link>
    </li>
  );
}
