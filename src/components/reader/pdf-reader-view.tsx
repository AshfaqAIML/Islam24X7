import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * In-app reader for real ingested volumes (scanned PDFs without extracted
 * text yet). Embeds the file so it reads with the browser's native PDF
 * viewer — page navigation, zoom and mobile gestures included.
 * Falls back to an honest download card when embedding is unavailable.
 */
export function PdfReaderView({
  bookId,
  bookTitle,
  fileUrl,
  fileSizeLabel,
}: {
  bookId: string;
  bookTitle: string;
  fileUrl: string;
  fileSizeLabel?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[70svh] w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/library/${bookId}`}
          className="focus-ring inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to book
        </Link>
        <Button asChild size="sm" variant="outline" className="gap-2">
          <a href={fileUrl} download>
            <Download className="h-4 w-4" aria-hidden="true" />
            Download{fileSizeLabel ? ` (${fileSizeLabel})` : ""}
          </a>
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
        <h1 className="line-clamp-1 font-serif text-xl font-semibold tracking-tight sm:text-2xl">
          {bookTitle}
        </h1>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Scanned volume — read page by page below. Text search, chapters and
        AI citations arrive with text processing.
      </p>

      <div className="mt-4 min-h-[75svh] flex-1 overflow-hidden rounded-xl border bg-muted/30">
        <embed
          src={fileUrl}
          type="application/pdf"
          className="h-[75svh] w-full"
          aria-label={`${bookTitle} (PDF)`}
        />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Reader not showing?{" "}
        <a
          href={fileUrl}
          download
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Download the PDF instead
        </a>
        .
      </p>
    </div>
  );
}
