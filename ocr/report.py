"""Human-readable run summaries for the OCR module."""

from __future__ import annotations

from ocr.processor import JobManifest


def _mb(n: int) -> str:
    return f"{n / 1048576:.1f} MB"


def print_summary(manifests: list[JobManifest]) -> None:
    """One table row per file + totals. Honest about unknowns (—)."""
    print(f"{'file':42} {'pages':>6} {'chars':>9} {'conf':>6} {'outputs'}")
    total_pages = 0
    total_chars = 0
    for m in manifests:
        name = m.input.rsplit("/", 1)[-1].rsplit("\\", 1)[-1][:40]
        conf = f"{m.avg_confidence:.2f}" if m.avg_confidence is not None else "—"
        chars = str(m.chars) if m.chars is not None else "—"
        outs = ",".join(sorted(m.outputs))
        skip = " (skipped: " + ",".join(m.skipped) + ")" if m.skipped else ""
        print(f"{name:42} {m.pages:>6} {chars:>9} {conf:>6} {outs}{skip}")
        total_pages += m.pages
        total_chars += m.chars or 0
    print(f"\n{len(manifests)} file(s), {total_pages} pages, {total_chars} chars.")
