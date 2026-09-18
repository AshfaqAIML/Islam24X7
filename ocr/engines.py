"""OCR engines behind one interface — auto-detected, best first.

Order: ``ocrmypdf`` (whole searchable PDFs, original look) →
``tesseract`` CLI (searchable PDF / text / per-page words) →
``easyocr`` (Python library, per-page words) → none, with an exact
install recipe per engine from :meth:`Engine.missing_hint`.

Only engines actually installed on the machine are used; nothing here
imports optional dependencies at module load.
"""

from __future__ import annotations

import csv
import io
import shutil
import subprocess
from dataclasses import dataclass
from typing import Any, Protocol

from ocr.languages import easyocr_langs, tesseract_langs

DEFAULT_DPI = 300
SUBPROCESS_TIMEOUT = 600  # seconds per file op; page TSV uses a shorter one


@dataclass(frozen=True)
class Word:
    """One OCR'd word. Box is pixels in a ``dpi`` rendering of the page."""

    text: str
    x0: float
    y0: float
    x1: float
    y1: float
    conf: float  # 0..1
    dpi: int = DEFAULT_DPI


class Engine(Protocol):
    """Minimal surface the processor needs."""

    name: str
    supports_pages: bool

    def is_available(self) -> bool: ...
    def missing_hint(self) -> str: ...


class OcrMypdfEngine:
    """Whole-file searchable PDFs via the ``ocrmypdf`` CLI (Method 1)."""

    name = "ocrmypdf"
    supports_pages = False

    def is_available(self) -> bool:
        return shutil.which("ocrmypdf") is not None

    def missing_hint(self) -> str:
        return (
            "ocrmypdf not found. Windows: run it under WSL "
            "(apt install ocrmypdf tesseract-ocr tesseract-ocr-urd "
            "tesseract-ocr-ara) or Docker. Linux: pip install ocrmypdf "
            "(needs the tesseract binary + language packs)."
        )

    def run_file(
        self,
        src: str,
        dst: str,
        langs: tuple[str, ...],
        *,
        deskew: bool = True,
        clean: bool = True,
        force: bool = False,
    ) -> None:
        args = ["ocrmypdf", "-l", tesseract_langs(langs), "--optimize", "1"]
        if deskew:
            args.append("--deskew")
        if clean:
            args.append("--clean")
        if force:
            args.append("--force-ocr")
        args += [src, dst]
        proc = subprocess.run(args, capture_output=True, text=True, timeout=SUBPROCESS_TIMEOUT)
        if proc.returncode != 0:
            raise RuntimeError(f"ocrmypdf failed: {proc.stderr.strip()[-2000:]}")


class TesseractEngine:
    """Tesseract CLI: whole-file PDF/TXT plus per-page TSV words."""

    name = "tesseract"
    supports_pages = True

    def is_available(self) -> bool:
        return shutil.which("tesseract") is not None

    def missing_hint(self) -> str:
        return (
            "tesseract not found. Windows: install the UB Mannheim build "
            "(github.com/UB-Mannheim/tesseract/wiki) and tick the Urdu "
            "(urd) + Arabic (ara) script/data boxes during setup. Linux: "
            "apt install tesseract-ocr tesseract-ocr-urd tesseract-ocr-ara. "
            "Then re-run `python -m ocr engines`."
        )

    def _run(
        self, args: list[str], timeout: int = SUBPROCESS_TIMEOUT
    ) -> subprocess.CompletedProcess[str]:
        proc = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
        if proc.returncode != 0:
            raise RuntimeError(
                f"tesseract failed ({' '.join(args[:4])}…): {proc.stderr.strip()[-2000:]}"
            )
        return proc

    def run_searchable_pdf(self, src: str, dst_base: str, langs: tuple[str, ...]) -> str:
        """``tesseract in.pdf outbase -l urd+ara pdf`` → returns out pdf path."""
        self._run(["tesseract", src, dst_base, "-l", tesseract_langs(langs), "pdf"])
        return dst_base + ".pdf"

    def run_text(self, src: str, langs: tuple[str, ...]) -> str:
        """Whole-file plain text via stdout."""
        proc = self._run(["tesseract", src, "stdout", "-l", tesseract_langs(langs)])
        return proc.stdout

    def ocr_page(self, png_bytes: bytes, langs: tuple[str, ...]) -> list[Word]:
        """TSV words for one rendered page image (fed via stdin pipe)."""
        full = subprocess.run(
            ["tesseract", "stdin", "stdout", "-l", tesseract_langs(langs), "tsv"],
            input=png_bytes,
            capture_output=True,
            timeout=180,
        )
        if full.returncode != 0:
            raise RuntimeError(f"tesseract TSV failed: {full.stderr.decode()[-2000:]}")
        return parse_tsv(full.stdout.decode(errors="replace"))

    def page_text(self, png_bytes: bytes, langs: tuple[str, ...]) -> str:
        full = subprocess.run(
            ["tesseract", "stdin", "stdout", "-l", tesseract_langs(langs)],
            input=png_bytes,
            capture_output=True,
            timeout=180,
        )
        if full.returncode != 0:
            raise RuntimeError(f"tesseract text failed: {full.stderr.decode()[-2000:]}")
        return full.stdout.decode(errors="replace")


def parse_tsv(tsv: str) -> list[Word]:
    """Parse ``tesseract … tsv`` output level-5 (word) rows into Words."""
    words: list[Word] = []
    reader = csv.DictReader(io.StringIO(tsv), delimiter="\t")
    for row in reader:
        try:
            if row.get("level") != "5":
                continue
            text = (row.get("text") or "").strip()
            if not text:
                continue
            conf = float(row.get("conf") or -1) / 100.0
            words.append(
                Word(
                    text=text,
                    x0=float(row["left"]),
                    y0=float(row["top"]),
                    x1=float(row["left"]) + float(row["width"]),
                    y1=float(row["top"]) + float(row["height"]),
                    conf=max(0.0, min(1.0, conf)),
                )
            )
        except (KeyError, ValueError, TypeError):
            continue
    return words


class EasyOcrEngine:
    """EasyOCR Python library (per-page words). Good for Urdu/Arabic prints."""

    name = "easyocr"
    supports_pages = True
    _reader: Any = None
    _reader_langs: tuple[str, ...] = ()

    def is_available(self) -> bool:
        try:
            import easyocr  # type: ignore[import-untyped]  # noqa: F401

            return True
        except ImportError:
            return False

    def missing_hint(self) -> str:
        return (
            "easyocr not installed. Run: pip install easyocr "
            "(first run downloads ~100-200 MB of recognition models; "
            "a GPU is much faster, CPU works for trials)."
        )

    def _reader_for(self, langs: tuple[str, ...]) -> Any:
        import easyocr

        if self._reader is None or self._reader_langs != langs:
            self._reader = easyocr.Reader(easyocr_langs(langs), gpu=False)
            self._reader_langs = langs
        return self._reader

    def ocr_page(self, png_bytes: bytes, langs: tuple[str, ...]) -> list[Word]:
        import numpy as np
        from PIL import Image

        reader = self._reader_for(langs)
        image = np.array(Image.open(io.BytesIO(png_bytes)).convert("RGB"))
        results = reader.readtext(image)
        words: list[Word] = []
        for box, text, conf in results:
            xs = [p[0] for p in box]
            ys = [p[1] for p in box]
            words.append(
                Word(
                    text=str(text).strip(),
                    x0=min(xs),
                    y0=min(ys),
                    x1=max(xs),
                    y1=max(ys),
                    conf=float(conf),
                )
            )
        return [w for w in words if w.text]


class FakeEngine:
    """Deterministic stand-in for tests and `--dry-run` planning."""

    name = "fake"
    supports_pages = True

    def __init__(self, text: str = "نمونہ test 123") -> None:
        self._text = text

    def is_available(self) -> bool:
        return True

    def missing_hint(self) -> str:
        return "fake engine is always available (tests only)."

    def ocr_page(self, png_bytes: bytes, langs: tuple[str, ...]) -> list[Word]:
        _ = (png_bytes, langs)
        return [
            Word(text=t, x0=10.0 * i, y0=10.0, x1=10.0 * i + 50.0, y1=30.0, conf=0.99)
            for i, t in enumerate(self._text.split())
        ]


ENGINES: tuple[type[OcrMypdfEngine] | type[TesseractEngine] | type[EasyOcrEngine], ...] = (
    OcrMypdfEngine,
    TesseractEngine,
    EasyOcrEngine,
)


def pick_engine(explicit: str | None) -> Engine:
    """``auto`` (default): first installed engine. Otherwise the named one."""
    if explicit and explicit != "auto":
        table = {cls.__new__(cls).name: cls for cls in ENGINES}
        if explicit not in table:
            raise ValueError(f"Unknown engine {explicit!r}. Valid: auto, {', '.join(table)}")
        engine = table[explicit]()
        if not engine.is_available():
            raise RuntimeError(engine.missing_hint())
        return engine
    for cls in ENGINES:
        engine = cls()
        if engine.is_available():
            return engine
    lines = [
        f"[{cls.__new__(cls).name}] {cls.__new__(cls).missing_hint()}"
        for cls in ENGINES
    ]
    raise RuntimeError("No OCR engine installed.\n\n" + "\n\n".join(lines))
