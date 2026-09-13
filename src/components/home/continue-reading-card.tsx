import Link from "next/link";
import { ArrowRight, Bookmark, BookOpen, NotebookPen } from "lucide-react";
import { routes } from "@/config/site";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SoonChip } from "@/components/common/states";

/**
 * "Continue reading" surface — honest empty state during construction.
 * Reading progress, bookmarks and notes sync from Phase 8; no history is
 * ever simulated.
 */
export function ContinueReadingCard() {
  return (
    <Card className="h-full border-dashed bg-transparent shadow-none">
      <CardContent className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-muted-foreground/40">
          <BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-serif font-semibold">Continue reading</h3>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
            Nothing on your shelf yet. Your place in every book — plus
            bookmarks, highlights and notes — will live here as soon as the
            Library and Reader ship.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
            Bookmarks
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" />
            Notes
          </span>
          <SoonChip phase={8} />
        </div>
        <Button asChild variant="outline" size="sm" className="mt-1">
          <Link href={routes.library}>
            Browse the library
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
