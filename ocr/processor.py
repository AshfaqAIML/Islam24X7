"""Per-file OCR jobs: skip-if-done resume, manifests, honest stats.

One input PDF produces, per ``--to`` selection, any of::

    <stem>.ocr.pdf    searchable PDF (original look + invisible text)
    <stem>.txt        plain reflowable text
    <stem>.docx       reflowable Word text (needs python-docx)

Plus ``<stem>.ocr-manifest.json`` (provenance + quality stats).

Resume is file-level and real: with ``--resume`` (default), outputs that
already exist are verified ( PDF opens + has the right page count, text
non-empty ) and skipped; ``--force`` redoes everything.
"""

from __future__ import annotations

import hashlib
import json
import os
import time
from dataclasses import asdict, dataclass, field
from typing import Any

import pymupdf

from ocr import searchable
from ocr.engines import (
    DEFAULT_DPI,
    EasyOcrEngine,
    Engine,
    OcrMypdfEngine,
    TesseractEngine,
    Word,
)
from ocr.languages import describe

MANIFEST_SUFFIX = ".ocr-manifest.json"


@dataclass
class JobManifest:
    input: str
    input_sha256: str
    input_bytes: int
    pages: int
    engine: str
    langs: str
    dpi: int
    outputs: dict[str, str] = field(default_factory=dict)
    skipped: list[str] = field(default_factory=list)
    chars: int | None = None
    avg_confidence: float | None = None
    embedded_words: int = 0
    failed_words: int = 0
    duration_s: float = 0.0
    status: str = "ready"


def sha256_of(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _open_pdf(path: str) -> Any:
    return pymupdf.open(path)  # type: ignore[no-untyped-call]


def page_count(src: str) -> int:
    with _open_pdf(src) as doc:
        return len(doc)


def render_page_png(src: str, pageno: int, dpi: int) -> bytes:
    """Render one source page to PNG bytes (feeds page-level engines)."""
    with _open_pdf(src) as doc:
        pix = doc[pageno].get_pixmap(dpi=dpi)
        return bytes(pix.tobytes("png"))


def _pdf_unsupported(exc: Exception) -> bool:
    """True when this Tesseract build cannot read PDFs itself.

    (Some Windows builds lack Leptonica PDF support.) The page loop —
    render PNG, pipe via stdin — always works instead.
    """
    text = str(exc).lower()
    return "pdf reading is not supported" in text or "can't open pdf" in text


def _looks_complete_pdf(path: str, pages: int) -> bool:
    try:
        with _open_pdf(path) as doc:
            return len(doc) == pages and os.path.getsize(path) > 1024
    except Exception:
        return False


def _looks_complete_text(path: str) -> bool:
    try:
        return os.path.getsize(path) > 0
    except OSError:
        return False


def _page_words(engine: Engine, png: bytes, langs: tuple[str, ...]) -> list[Word]:
    if isinstance(engine, (TesseractEngine, EasyOcrEngine)):
        return engine.ocr_page(png, langs)
    method = getattr(engine, "ocr_page", None)  # FakeEngine + future engines
    if callable(method):
        return list(method(png, langs))
    raise RuntimeError(f"Engine {engine.name} cannot OCR single pages")


def _all_page_words(
    engine: Engine,
    src: str,
    total_pages: int,
    dpi: int,
    langs: tuple[str, ...],
    say: object,
) -> list[list[Word]]:
    out: list[list[Word]] = []
    info = getattr(say, "info", None)
    base = os.path.basename(src)
    for pageno in range(total_pages):
        png = render_page_png(src, pageno, dpi)
        out.append(_page_words(engine, png, langs))
        if callable(info) and ((pageno + 1) % 50 == 0 or pageno + 1 == total_pages):
            info(f"[{base}] OCR page {pageno + 1}/{total_pages}")
    return out


def process_file(
    src: str,
    out_dir: str,
    *,
    to: tuple[str, ...] = ("pdf",),
    langs: tuple[str, ...] = ("urd", "ara", "eng"),
    engine: Engine | None = None,
    dpi: int = DEFAULT_DPI,
    resume: bool = True,
    log: object = None,
) -> JobManifest:
    """OCR one PDF. Returns the manifest (also written beside outputs)."""
    if engine is None:
        raise ValueError("engine is required (pick via ocr.engines.pick_engine)")
    started = time.monotonic()
    stem = os.path.splitext(os.path.basename(src))[0]
    os.makedirs(out_dir, exist_ok=True)

    total_pages = page_count(src)
    manifest = JobManifest(
        input=os.path.abspath(src),
        input_sha256=sha256_of(src),
        input_bytes=os.path.getsize(src),
        pages=total_pages,
        engine=engine.name,
        langs=describe(langs),
        dpi=dpi,
    )

    want = {t.lower() for t in to}
    if want == {"all"}:
        want = {"pdf", "txt", "docx"}
    unknown = want - {"pdf", "txt", "docx"}
    if unknown:
        raise ValueError(f"Unknown --to target(s): {sorted(unknown)}")

    def say(message: str) -> None:
        info = getattr(log, "info", None)
        if callable(info):
            info(message)

    words: list[list[Word]] | None = None  # page words, computed lazily

    def get_words() -> list[list[Word]]:
        nonlocal words
        if words is None:
            words = _all_page_words(engine, src, total_pages, dpi, langs, log)
        return words

    # -- PDF: whole-file fast path when the engine offers one, else the
    #    PyMuPDF page loop (image kept + invisible words embedded).
    if "pdf" in want:
        dst_pdf = os.path.join(out_dir, f"{stem}.ocr.pdf")
        if resume and _looks_complete_pdf(dst_pdf, total_pages):
            manifest.skipped.append("pdf")
            manifest.outputs["pdf"] = os.path.abspath(dst_pdf)
            say(f"[{stem}] searchable PDF exists — skipping (use --force to redo)")
        elif isinstance(engine, OcrMypdfEngine):
            engine.run_file(src, dst_pdf, langs)
            manifest.outputs["pdf"] = os.path.abspath(dst_pdf)
        elif isinstance(engine, TesseractEngine):
            base, _ = os.path.splitext(dst_pdf)
            try:
                manifest.outputs["pdf"] = os.path.abspath(
                    engine.run_searchable_pdf(src, base, langs)
                )
            except RuntimeError as exc:
                if not _pdf_unsupported(exc):
                    raise
                say(f"[{stem}] this tesseract build can't read PDFs — page loop")
                stats = searchable.build_searchable_pdf(src, dst_pdf, get_words(), dpi)
                manifest.embedded_words = stats["embedded"]
                manifest.failed_words = stats["failed"]
                manifest.outputs["pdf"] = os.path.abspath(dst_pdf)
        else:
            stats = searchable.build_searchable_pdf(src, dst_pdf, get_words(), dpi)
            manifest.embedded_words = stats["embedded"]
            manifest.failed_words = stats["failed"]
            manifest.outputs["pdf"] = os.path.abspath(dst_pdf)

    # -- TXT: whole-file text when offered, else joined page words.
    if "txt" in want:
        dst_txt = os.path.join(out_dir, f"{stem}.txt")
        if resume and _looks_complete_text(dst_txt):
            manifest.skipped.append("txt")
            manifest.outputs["txt"] = os.path.abspath(dst_txt)
        else:
            if isinstance(engine, TesseractEngine) and words is None:
                try:
                    text = engine.run_text(src, langs)
                except RuntimeError as exc:
                    if not _pdf_unsupported(exc):
                        raise
                    text = "\n\f\n".join(searchable.page_text(p) for p in get_words())
            else:
                text = "\n\f\n".join(searchable.page_text(p) for p in get_words())
            with open(dst_txt, "w", encoding="utf-8") as fh:
                fh.write(text)
            manifest.chars = len(text)
            manifest.outputs["txt"] = os.path.abspath(dst_txt)

    # -- DOCX: from real page words (page breaks = real page boundaries).
    if "docx" in want:
        dst_docx = os.path.join(out_dir, f"{stem}.docx")
        if resume and _looks_complete_text(dst_docx):
            manifest.skipped.append("docx")
            manifest.outputs["docx"] = os.path.abspath(dst_docx)
        else:
            manifest.chars = searchable.write_docx_file(get_words(), dst_docx, stem)
            manifest.outputs["docx"] = os.path.abspath(dst_docx)

    have_words = words is not None and any(words)
    if have_words:
        assert words is not None
        confs = [w.conf for page in words for w in page]
        manifest.avg_confidence = round(sum(confs) / len(confs), 4) if confs else None
        if manifest.chars is None:
            manifest.chars = sum(len(searchable.page_text(p)) for p in words)
    manifest.duration_s = round(time.monotonic() - started, 1)

    manifest_path = os.path.join(out_dir, f"{stem}{MANIFEST_SUFFIX}")
    with open(manifest_path, "w", encoding="utf-8") as fh:
        json.dump(asdict(manifest), fh, indent=1, ensure_ascii=False)
    return manifest
