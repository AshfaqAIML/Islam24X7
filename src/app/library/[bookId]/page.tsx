import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  FileText,
  Languages,
  Layers,
  Lock,
} from "lucide-react";
import { getBook, getBookChapters } from "@/services/books";
import { demoCategoryLabels, demoLanguageLabels } from "@/lib/demo/books";
import { routes } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DemoBadge, SoonChip } from "@/components/common/states";
import { StarLattice } from "@/components/decor/islamic-pattern";
import { FavoriteButton } from "@/components/library/favorite-button";

interface PageProps {
  params: Promise<{ bookId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bookId } = await params;
  const book = await getBook(bookId);
  if (!book) return { title: "Book not found" };
  return {
    title: book.title,
    description:
      book.description?.slice(0, 160) ??
      "Book details in the Islamic Knowledge library.",
  };
}

export default async function BookDetailPage({ params }: PageProps) {
  const { bookId } = await params;
  const [book, chapters] = await Promise.all([
    getBook(bookId),
    getBookChapters(bookId),
  ]);

  if (!book) notFound();

  const hue = (book as { coverHue?: number }).coverHue ?? 165;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Link
          href={routes.library}
          className="focus-ring inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to library
        </Link>

        <div className="mt-5 grid gap-6 md:grid-cols-[auto,1fr]">
          {/* Cover */}
          <div className="mx-auto w-40 md:mx-0 md:w-48">
            <div
              className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-lg"
              aria-hidden="true"
            >
              <span
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(145deg, oklch(0.34 0.07 ${hue}), oklch(0.48 0.09 ${hue}))`,
                }}
              />
              <StarLattice
                tile={48}
                className="absolute inset-0 h-full w-full text-white opacity-20"
              />
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-white">
                <BookOpen className="h-6 w-6 opacity-80" />
                <span className="font-serif text-sm leading-snug opacity-95">
                  {demoCategoryLabels[book.category] ?? book.category}
                </span>
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {book.isDemo ? <DemoBadge /> : null}
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {demoCategoryLabels[book.category] ?? book.category}
              </span>
            </div>
            <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
              {book.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {book.author}
              {book.translator ? ` · translated by ${book.translator}` : ""}
            </p>

            <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" aria-hidden="true" />
                <dt className="sr-only">Pages</dt>
                <dd>{book.pageCount ?? "—"} pages</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Languages className="h-4 w-4" aria-hidden="true" />
                <dt className="sr-only">Language</dt>
                <dd>{demoLanguageLabels[book.language] ?? book.language}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4" aria-hidden="true" />
                <dt className="sr-only">Chapters</dt>
                <dd>{chapters.length} chapters</dd>
              </div>
              {book.addedAt ? (
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  <dt className="sr-only">Added</dt>
                  <dd>
                    <time dateTime={book.addedAt}>{book.addedAt}</time>
                  </dd>
                </div>
              ) : null}
            </dl>

            {/* Actions */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Button
                size="lg"
                disabled
                aria-describedby="reader-phase-note"
                className="gap-2"
              >
                <Lock className="h-4 w-4" aria-hidden="true" />
                Open reader
              </Button>
              <FavoriteButton bookId={book.id} bookTitle={book.title} size="lg" />
            </div>
            <p
              id="reader-phase-note"
              className="mt-2 text-xs text-muted-foreground"
            >
              The premium reader — table of contents, highlights, notes and
              reading progress — ships in Phase 4. This page is its
              deep-link anchor: <code className="rounded bg-muted px-1">/library/{book.id}/read</code>
            </p>
          </div>
        </div>

        {/* Description */}
        <Card className="mt-8">
          <CardContent className="p-5 sm:p-6">
            <h2 className="font-serif text-lg font-semibold">About this volume</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {book.description}
            </p>
          </CardContent>
        </Card>

        {/* Chapters */}
        <section aria-labelledby="chapters-heading" className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="chapters-heading" className="font-serif text-lg font-semibold">
              Table of contents
            </h2>
            <SoonChip phase={4} />
          </div>
          <Card>
            <CardContent className="p-0">
              <ol className="divide-y">
                {chapters.map((ch) => (
                  <li
                    key={ch.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary font-serif text-sm font-semibold text-secondary-foreground">
                        {ch.number ?? "•"}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {ch.title}
                        </span>
                        {ch.pageCount ? (
                          <span className="block text-xs text-muted-foreground">
                            {ch.pageCount} pages
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground/70">
                      opens in reader
                    </span>
                  </li>
                ))}
                {chapters.length === 0 ? (
                  <li className="px-5 py-6 text-center text-sm text-muted-foreground">
                    Chapter data for this volume arrives with the Knowledge
                    Base.
                  </li>
                ) : null}
              </ol>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-8" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          This is a labeled demo record used to design the library experience.
          It does not represent any real Islamic work. Real volumes, covers and
          full texts stream from the Knowledge Base once{" "}
          <code className="rounded bg-muted px-1">KNOWLEDGE_BASE_API_URL</code>{" "}
          is configured.
        </p>
      </div>
    </main>
  );
}
