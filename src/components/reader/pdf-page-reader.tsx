"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { readingProgressStore } from "@/lib/reading-progress-store";
import { cn } from "@/lib/utils";

/**
 * Page-by-page reader for real scanned volumes.
 *
 * These PDFs contain no extractable text (pictures of pages), so instead of
 * fabricating text we render the actual pages with PDF.js — the same
 * flip-through feel as the text reader (page jump, zoom, progress, resume)
 * with honest scanned content. Works in every browser including Android
 * WebViews, where native PDF embeds don't.
 */

// Pinned worker served from CDN (the app is online whenever it reads).
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@6.3.289/build/pdf.worker.min.mjs";

const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 2, 2.5];

export function PdfPageReader({
  bookId,
  bookTitle,
  fileUrl,
  fileSizeLabel,
  initialPage,
  knownPageCount,
}: {
  bookId: string;
  bookTitle: string;
  fileUrl: string;
  fileSizeLabel?: string;
  initialPage?: number;
  knownPageCount?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [total, setTotal] = useState(knownPageCount ?? 0);
  // Resume where the reader left off (store wins over the ?page= link).
  const [page, setPage] = useState(() => {
    const saved =
      typeof window === "undefined"
        ? null
        : readingProgressStore.get(bookId);
    return Math.max(1, saved?.page ?? initialPage ?? 1);
  });
  const [zoomIdx, setZoomIdx] = useState(1); // 1x
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [jumpValue, setJumpValue] = useState("");

  // Load document once.
  useEffect(() => {
    let cancelled = false;
    const task = pdfjsLib.getDocument({ url: fileUrl, cMapPacked: true });
    task.promise.then((doc) => {
      if (cancelled) {
        void doc.cleanup();
        return;
      }
      docRef.current = doc;
      setTotal(doc.numPages);
      setPage((p) => Math.min(Math.max(1, p), doc.numPages));
      setStatus("ready");
    });
    task.promise.catch(() => {
      if (!cancelled) {
        setError("Could not open this volume in the reader.");
        setStatus("error");
      }
    });
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      void task.destroy().catch(() => {});
      const doc = docRef.current;
      docRef.current = null;
      if (doc) void doc.cleanup();
    };
  }, [fileUrl, bookId]);

  // Render current page.
  useEffect(() => {
    if (status !== "ready") return;
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas) return;
    let cancelled = false;
    renderTaskRef.current?.cancel();
    doc
      .getPage(page)
      .then((pdfPage) => {
        if (cancelled) return;
        const scale = ZOOM_STEPS[zoomIdx] ?? 1;
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const viewport = pdfPage.getViewport({ scale: scale * dpr });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        const task = pdfPage.render({ canvas, viewport });
        renderTaskRef.current = task;
        return task.promise;
      })
      .catch(() => {
        /* superseded render or destroyed doc — next render wins */
      });
    return () => {
      cancelled = true;
    };
  }, [page, zoomIdx, status]);

  // Persist progress (powers Home → Continue reading → Resume).
  useEffect(() => {
    if (status !== "ready" || total <= 0) return;
    readingProgressStore.save({
      bookId,
      bookTitle,
      page,
      pageCount: total,
      percent: Math.min(100, (page / total) * 100),
    });
  }, [page, total, status, bookId, bookTitle]);

  const goTo = useCallback(
    (next: number) => {
      if (total <= 0) return;
      setPage(Math.min(Math.max(1, next), total));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [total]
  );

  // Arrow-key navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(page + 1);
      else if (e.key === "ArrowLeft") goTo(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, goTo]);

  const percent = total > 0 ? Math.min(100, (page / total) * 100) : 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:py-8">
      {/* Header */}
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
        <FileText className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <h1 className="line-clamp-1 font-serif text-xl font-semibold tracking-tight sm:text-2xl">
          {bookTitle}
        </h1>
      </div>

      {/* Controls */}
      <div className="sticky top-16 z-10 mt-3 rounded-xl border bg-background/90 p-2 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous page"
              disabled={page <= 1 || status !== "ready"}
              onClick={() => goTo(page - 1)}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
            <form
              className="flex items-center gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number.parseInt(jumpValue, 10);
                if (Number.isFinite(n)) goTo(n);
                setJumpValue("");
              }}
            >
              <Input
                value={jumpValue}
                onChange={(e) => setJumpValue(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder={String(page)}
                aria-label={`Go to page (1 to ${total || "…"})`}
                inputMode="numeric"
                className="h-8 w-16 text-center text-sm tabular-nums"
              />
              <span className="text-xs tabular-nums text-muted-foreground">
                / {total > 0 ? total.toLocaleString() : "…"}
              </span>
            </form>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next page"
              disabled={status !== "ready" || (total > 0 && page >= total)}
              onClick={() => goTo(page + 1)}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Zoom out"
              disabled={zoomIdx <= 0}
              onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
            >
              <ZoomOut className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground">
              {Math.round((ZOOM_STEPS[zoomIdx] ?? 1) * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Zoom in"
              disabled={zoomIdx >= ZOOM_STEPS.length - 1}
              onClick={() =>
                setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))
              }
            >
              <ZoomIn className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <Progress value={percent} className="mt-2 h-1" aria-label={`Page ${page} of ${total}`} />
      </div>

      {/* Page */}
      <div className="mt-4 flex min-h-[60svh] flex-1 items-start justify-center overflow-auto rounded-xl border bg-muted/30 p-2 sm:p-4">
        {status === "loading" ? (
          <div className="flex flex-col items-center gap-3 self-center py-16 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            Opening page {page}
            {total > 0 ? ` of ${total.toLocaleString()}` : ""}…
          </div>
        ) : status === "error" ? (
          <div className="flex max-w-sm flex-col items-center gap-3 self-center py-16 text-center">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
            <p className="text-sm font-medium">{error}</p>
            <Button asChild size="sm">
              <a href={fileUrl} download>
                <Download className="h-4 w-4" aria-hidden="true" />
                Download the PDF instead
              </a>
            </Button>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className={cn("w-full max-w-3xl rounded-md bg-white shadow-md")}
            aria-label={`Page ${page} of ${bookTitle} (scanned)`}
            role="img"
          />
        )}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Scanned pages — use ← → keys or the controls above. Your place is
        remembered for Continue reading.
      </p>
    </div>
  );
}
