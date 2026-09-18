"""Searchable-PDF assembly with PyMuPDF (Method 1, engine-agnostic).

Copies every source page image verbatim, then lays the OCR words on top as
*invisible* text (PDF render mode 3). The book looks pixel-identical to the
scan but gains selectable, searchable, copyable text — the same result
``ocrmypdf`` produces, built from any word-level engine.
"""

from __future__ import annotations

import pymupdf

from ocr.engines import Word

POINTS_PER_INCH = 72.0


def build_searchable_pdf(
    src_pdf: str,
    dst_pdf: str,
    pages_words: list[list[Word]],
    dpi: int,
) -> dict[str, int]:
    """Copy ``src_pdf`` pages and embed invisible OCR words.

    Returns ``{"embedded": n, "failed": m}``. A word fails only when the
    font subsystem rejects its script — the page image itself is always
    preserved, so output is never worse than the input.
    """
    scale = POINTS_PER_INCH / dpi
    embedded = 0
    failed = 0
    with pymupdf.open(src_pdf) as src, pymupdf.open() as dst:  # type: ignore[no-untyped-call]
        if len(src) != len(pages_words):
            raise ValueError(
                f"word lists ({len(pages_words)}) != pages ({len(src)})"
            )
        for i, page in enumerate(src):
            out = dst.new_page(width=page.rect.width, height=page.rect.height)
            out.show_pdf_page(out.rect, src, i)
            for word in pages_words[i]:
                x0 = word.x0 * scale
                y0 = word.y0 * scale
                y1 = word.y1 * scale
                fontsize = max(4.0, min(72.0, y1 - y0))
                try:
                    # Baseline sits slightly above the box bottom.
                    out.insert_text(
                        pymupdf.Point(x0, y1 - (y1 - y0) * 0.2),  # type: ignore[no-untyped-call]
                        word.text,
                        fontsize=fontsize,
                        render_mode=3,  # invisible: searchable but not drawn
                    )
                    embedded += 1
                except Exception:
                    failed += 1
        dst.set_metadata(
            {
                "producer": "Islam24X7 OCR module (invisible text layer)",
                "creator": "Islam24X7 OCR module",
            }
        )
        dst.save(dst_pdf, garbage=4, deflate=True)
    return {"embedded": embedded, "failed": failed}


def page_text(words: list[Word]) -> str:
    """Reading-order-ish plain text for one page (top-to-bottom lines)."""
    rows: dict[int, list[Word]] = {}
    for word in words:
        rows.setdefault(int(word.y0 // 12), []).append(word)
    lines = []
    for key in sorted(rows):
        line = sorted(rows[key], key=lambda w: w.x0)
        lines.append(" ".join(w.text for w in line))
    return "\n".join(lines)


def write_text_file(words_per_page: list[list[Word]], dst_txt: str) -> int:
    """Plain-text dump (form feeds between pages). Returns char count."""
    parts = [page_text(words) for words in words_per_page]
    text = "\n\f\n".join(parts)
    with open(dst_txt, "w", encoding="utf-8") as fh:
        fh.write(text)
    return len(text)


def write_docx_file(words_per_page: list[list[Word]], dst_docx: str, title: str) -> int:
    """Reflowable DOCX (Method 2 starting point). Needs ``python-docx``."""
    try:
        from docx import Document  # type: ignore[import-not-found]
    except ImportError as exc:
        raise RuntimeError(
            "python-docx not installed. Run: pip install python-docx"
        ) from exc
    doc = Document()
    doc.add_heading(title, level=1)
    chars = 0
    for words in words_per_page:
        text = page_text(words)
        chars += len(text)
        for line in text.split("\n"):
            if line.strip():
                doc.add_paragraph(line)
        doc.add_page_break()
    doc.save(dst_docx)
    return chars
