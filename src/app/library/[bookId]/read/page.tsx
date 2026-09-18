import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBook, getBookChapters } from "@/services/books";
import { ReaderView } from "@/components/reader/reader-view";
import { PdfPageReader } from "@/components/reader/pdf-page-reader";

interface PageProps {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bookId } = await params;
  const book = await getBook(bookId);
  if (!book) return { title: "Book not found" };
  return {
    title: `Reading — ${book.title}`,
    description: "Reader preview with labeled demo pages.",
    robots: { index: false },
  };
}

function isPdfUrl(url: string | undefined): url is string {
  return Boolean(url) && url!.toLowerCase().split("?")[0].endsWith(".pdf");
}

export default async function ReadPage({ params, searchParams }: PageProps) {
  const { bookId } = await params;
  const sp = await searchParams;
  const [book, chapters] = await Promise.all([
    getBook(bookId),
    getBookChapters(bookId),
  ]);
  if (!book) notFound();

  // Real ingested volumes read page-by-page from the actual scanned file
  // until text extraction (chapters, search, citations) lands.
  const fileUrl = (book as { fileUrl?: string }).fileUrl;
  if (isPdfUrl(fileUrl)) {
    const asked = Number.parseInt(sp.page ?? "", 10);
    return (
      <main className="flex flex-1 flex-col">
        <PdfPageReader
          bookId={book.id}
          bookTitle={book.title}
          fileUrl={fileUrl}
          initialPage={Number.isFinite(asked) && asked > 0 ? asked : undefined}
          knownPageCount={book.pageCount ?? undefined}
        />
      </main>
    );
  }

  return (
    <main className="flex-1">
      <ReaderView book={book} chapters={chapters} />
    </main>
  );
}
