import type { Metadata } from "next";
import { Suspense } from "react";
import { LibraryBrowser } from "@/components/library/library-browser";
import { Skeleton } from "@/components/ui/skeleton";
import { StarLattice } from "@/components/decor/islamic-pattern";

export const metadata: Metadata = {
  title: "Library",
  description:
    "Browse the Islamic library — Fiqh, Tafsir, Aqeedah, Seerah, history and more. Demo preview: real volumes arrive with the Knowledge Base.",
};

export default function LibraryPage() {
  return (
    <main className="flex-1">
      {/* Page header */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent"
        />
        <StarLattice
          tile={64}
          className="absolute inset-0 h-full w-full text-gold opacity-[0.06]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-foreground/80 dark:text-gold/90">
            The Library
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Browse the shelves
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Fiqh, Tafsir, Aqeedah, Seerah, history and more — search, filter
            and favorite. Serving labeled demo records until the Knowledge
            Base connects.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <Suspense fallback={<BrowserSkeleton />}>
          <LibraryBrowser />
        </Suspense>
      </div>
    </main>
  );
}

function BrowserSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <Skeleton className="h-11 w-full" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
