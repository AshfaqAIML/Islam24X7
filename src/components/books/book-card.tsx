"use client";

import { BookOpen } from "lucide-react";
import type { Book } from "@/types/knowledge-base";
import type { DemoBook } from "@/lib/demo/books";
import { demoCategoryLabels } from "@/lib/demo/books";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DemoBadge } from "@/components/common/states";
import { StarLattice } from "@/components/decor/islamic-pattern";
import { useToast } from "@/hooks/use-toast";

/**
 * Reusable book card. In Phase 1 it is used with clearly-labeled demo data;
 * from Phase 3 it renders real Knowledge Base books and links to the reader.
 */
export function BookCard({
  book,
  onOpen,
  className,
}: {
  book: Book & { coverHue?: number };
  onOpen?: (book: Book) => void;
  className?: string;
}) {
  const { toast } = useToast();
  const hue = book.coverHue ?? 165;

  const handleOpen = () => {
    if (onOpen) {
      onOpen(book);
      return;
    }
    toast({
      title: "Library under construction",
      description:
        "Browsing and reading real books arrives with the Knowledge Base integration (Phase 3).",
    });
  };

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <CardContent className="flex gap-4 p-4">
        {/* Cover (generated placeholder — real covers come from the KB) */}
        <button
          type="button"
          onClick={handleOpen}
          className="focus-ring relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-md text-left sm:w-24"
          aria-label={`Open ${book.title}`}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: `linear-gradient(145deg, oklch(0.34 0.07 ${hue}), oklch(0.48 0.09 ${hue}))`,
            }}
          />
          <StarLattice
            tile={40}
            className="absolute inset-0 h-full w-full text-white opacity-20"
          />
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-1 text-white">
            <BookOpen className="h-4 w-4 opacity-80" aria-hidden="true" />
            <span className="line-clamp-2 text-center font-serif text-[10px] leading-tight opacity-95">
              {demoCategoryLabels[book.category] ?? book.category}
            </span>
          </span>
        </button>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 font-serif text-sm font-semibold leading-snug sm:text-base">
              {book.title}
            </h3>
            {book.isDemo ? <DemoBadge className="mt-0.5 shrink-0" /> : null}
          </div>
          <p className="mb-2 line-clamp-1 text-xs text-muted-foreground sm:text-sm">
            {book.author}
            {book.translator ? ` · tr. ${book.translator}` : ""}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
              {demoCategoryLabels[book.category] ?? book.category}
            </span>
            <span className="uppercase">{book.language}</span>
            {book.pageCount ? <span>· {book.pageCount} pages</span> : null}
          </div>
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={handleOpen}>
              Open
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
