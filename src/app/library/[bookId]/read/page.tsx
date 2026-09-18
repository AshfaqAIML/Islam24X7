import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBook, getBookChapters } from "@/services/books";
import { formatBytes } from "@/config/uploads";
import { ReaderView } from "@/components/reader/reader-view";
import { PdfReaderView } from "@/components/reader/pdf-reader-view";

interface PageProps {
  params: Promise<{ bookId: string }>;
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

export default async function ReadPage({ params }: PageProps) {
  const { bookId } = await params;
  const [book, chapters] = await Promise.all([
    getBook(bookId),
    getBookChapters(bookId),
  ]);
  if (!book) notFound();

  // Real ingested volumes read as embedded PDFs until text extraction
  // (chapters, search, citations) lands.
  const fileUrl = (book as { fileUrl?: string }).fileUrl;
  const fileSize = (book as { fileSize?: number }).fileSize;
  if (isPdfUrl(fileUrl)) {
    return (
      <main className="flex flex-1 flex-col">
        <PdfReaderView
          bookId={book.id}
          bookTitle={book.title}
          fileUrl={fileUrl}
          fileSizeLabel={
            typeof fileSize === "number" && fileSize > 0
              ? formatBytes(fileSize)
              : undefined
          }
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
