"""Command line: ``python -m ocr run …`` / ``engines`` / ``langs``."""

from __future__ import annotations

import concurrent.futures
import glob
import logging
import os
import sys

import click

from ocr import __version__
from ocr.engines import ENGINES, EasyOcrEngine, pick_engine
from ocr.languages import DEFAULT_LANGS, LANGUAGES, describe, parse_langs
from ocr.processor import process_file
from ocr.report import print_summary

log = logging.getLogger("ocr")


def _collect(inputs: tuple[str, ...]) -> list[str]:
    """Files and directories (sorted, PDFs + common scan formats)."""
    exts = (".pdf", ".png", ".jpg", ".jpeg", ".tif", ".tiff")
    found: list[str] = []
    for raw in inputs:
        if os.path.isdir(raw):
            for root, _, files in os.walk(raw):
                for f in sorted(files):
                    if f.lower().endswith(exts):
                        found.append(os.path.join(root, f))
        else:
            for match in sorted(glob.glob(raw)):
                if os.path.isfile(match):
                    found.append(match)
    # De-dupe, keep order.
    seen: set[str] = set()
    out = []
    for path in found:
        key = os.path.abspath(path).lower()
        if key not in seen:
            seen.add(key)
            out.append(path)
    return out


@click.group()
@click.version_option(__version__, prog_name="ocr")
def main() -> None:
    """OCR scanned books → searchable PDFs / text. See docs/ocr-module.md."""


@main.command()
@click.argument("inputs", nargs=-1, required=True)
@click.option("--out-dir", "-o", default=None, help="Output folder (default: <input>_ocr).")
@click.option(
    "--to",
    default="pdf",
    show_default=True,
    help="Output kind(s), comma separated: pdf, txt, docx, all.",
)
@click.option(
    "--lang",
    default="+".join(DEFAULT_LANGS),
    show_default=True,
    help="Languages, e.g. urd+ara+eng. `python -m ocr langs` lists codes.",
)
@click.option(
    "--engine",
    default="auto",
    show_default=True,
    help="ocrmypdf, tesseract, easyocr, or auto (first installed).",
)
@click.option("--dpi", default=300, show_default=True, help="Render DPI for page OCR.")
@click.option("--jobs", default=1, show_default=True, help="Files in parallel.")
@click.option("--resume/--force", default=True, show_default=True,
              help="Skip finished outputs vs redo.")
@click.option("--dry-run", is_flag=True, help="Plan only: validate inputs/engine, no OCR.")
def run(
    inputs: tuple[str, ...],
    out_dir: str | None,
    to: str,
    lang: str,
    engine: str,
    dpi: int,
    jobs: int,
    resume: bool,
    dry_run: bool,
) -> None:
    """OCR scanned PDFs into searchable PDFs / text.

    Example::

        python -m ocr run Books/Quran/Tibyan-vol-01.pdf -o out/ --to pdf --lang urd
    """
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    try:
        langs = parse_langs(lang)
    except ValueError as exc:
        raise click.BadParameter(str(exc)) from exc
    targets = tuple(t.strip() for t in to.split(",") if t.strip()) or ("pdf",)

    files = _collect(inputs)
    if not files:
        raise click.ClickException("No input files found (PDF/PNG/JPG/TIFF).")
    if out_dir is None:
        first = files[0]
        base = os.path.dirname(first) if os.path.dirname(first) else "."
        out_dir = os.path.join(base, os.path.splitext(os.path.basename(first))[0] + "_ocr")

    picked = pick_engine(engine)
    if isinstance(picked, EasyOcrEngine) and jobs > 1:
        click.echo("Note: easyocr holds one model — running files sequentially.")
        jobs = 1
    click.echo(f"Engine: {picked.name} · langs: {describe(langs)} · out: {out_dir}")
    if dry_run:
        for path in files:
            click.echo(f"  would OCR: {path}")
        return

    results = []
    if jobs > 1:
        with concurrent.futures.ThreadPoolExecutor(max_workers=jobs) as pool:
            futs = {
                pool.submit(
                    process_file, path, out_dir,
                    to=targets, langs=langs, engine=picked, dpi=dpi, resume=resume, log=log,
                ): path
                for path in files
            }
            for fut in concurrent.futures.as_completed(futs):
                try:
                    results.append(fut.result())
                except Exception as exc:  # keep going; report at the end
                    click.echo(f"FAILED {futs[fut]}: {exc}", err=True)
    else:
        for path in files:
            try:
                results.append(
                    process_file(path, out_dir, to=targets, langs=langs,
                                 engine=picked, dpi=dpi, resume=resume, log=log)
                )
            except Exception as exc:
                click.echo(f"FAILED {path}: {exc}", err=True)
    print_summary(results)
    if len(results) != len(files):
        sys.exit(1)


@main.command(name="engines")
def list_engines() -> None:
    """Show OCR engines, availability, and install recipes."""
    for cls in ENGINES:
        engine = cls()
        status = "READY" if engine.is_available() else "missing"
        click.echo(f"[{engine.name}] {status}")
        if not engine.is_available():
            click.echo(f"    {engine.missing_hint()}")


@main.command(name="langs")
def list_langs() -> None:
    """Show valid --lang codes."""
    for code in sorted(LANGUAGES):
        label, easy = LANGUAGES[code]
        click.echo(f"{code:5} {label:12} (easyocr: {easy})")


if __name__ == "__main__":
    main()
