# OCR module — searchable PDFs and text from scanned books

Scanned books (like the Tibyan-ul-Quran and Hadith sets in `Books/`) are
pictures of pages: zero extractable text, nothing to copy. This module adds
real text with OCR:

| Goal | Command | Result |
|---|---|---|
| Same look, but searchable/selectable | `--to pdf` (default) | Original page images + invisible text layer |
| Edit/reformat the text | `--to txt` (or `docx`) | Reflowable text; export PDF from Word/LibreOffice |

```powershell
# What can actually run here?
python -m ocr engines

# OCR one book to a searchable PDF (Urdu + Arabic + English)
python -m ocr run Books/Quran/tibyan-ul-quran-vol-01.pdf -o out/ --to pdf --lang urd+ara+eng

# Whole folder, text output, 4 files at once, resume after interruptions
python -m ocr run Books/Hadees/Translation --to txt --jobs 4

# Plan without running (validates inputs + engine)
python -m ocr run Books/Quran --dry-run
```

## Engines (auto-detected, best first)

1. **ocrmypdf** — whole-file searchable PDFs. Needs the `ocrmypdf` program
   (Windows: WSL/Docker; Linux: `pip install ocrmypdf` + tesseract).
2. **tesseract** — searchable PDF, plain text, per-page words. **Recommended
   for our books** (see trial below).
3. **easyocr** — Python library (`pip install easyocr`; first run downloads
   models). Works with zero setup, but 3–5× slower and lower confidence
   than Tesseract on Urdu print.

### Windows setup that actually works (verified Sep 2026)

1. Install the [UB Mannheim build](https://github.com/UB-Mannheim/tesseract/wiki)
   (default location is auto-detected, no PATH edit needed).
2. Download `urd.traineddata` + `ara.traineddata` from
   `tesseract-ocr/tessdata_best` into a folder with `eng` + `osd`, e.g.
   `C:\Users\<you>\Tesseract-OCR\tessdata\`.
3. Copy `tessconfigs/`, `configs/` and `pdf.ttf` from the install's
   `tessdata/` into that folder too — **without them Tesseract silently
   returns plain text instead of TSV** and per-page OCR finds nothing.
4. Persist it once: `setx TESSDATA_PREFIX "C:\Users\<you>\Tesseract-OCR\tessdata"`
   (new shells pick it up; pass it inline for the current one).

### Trial results, same pages (Tibyan p.50–51, Bukhari p.50–51, `--lang urd+ara`)

| Engine | Tibyan chars / conf | Bukhari chars / conf | 2 pages time |
|---|---|---|---|
| easyocr (CPU) | 4,897 / 0.18 | 3,174 / 0.12 | ~5 min |
| tesseract (best) | 4,497 / **0.56** | 2,803 / **0.40** | ~1 min |

Tesseract wins on confidence (3×) and speed (4–5×). Both outputs are
~75–80% Urdu-script text — real drafts, still needing proofreading.

Full-set math (21,500+ pages at ~15–30 s/page on CPU): several days even
with `--jobs 8`. Recommended path: one full volume overnight as the pilot
(e.g. Bukhari vol 1 ≈ 1,000 pages), proofread it, then decide the rest.

With none installed, every command fails with the exact install recipe —
run `python -m ocr engines` to see yours. `python -m ocr langs` lists the
`--lang` codes (`urd+ara+eng` default; `ur`, `arabic` style aliases work).

## How it works

- Page images render at `--dpi` (default 300) via PyMuPDF.
- `ocrmypdf`/`tesseract` consume whole files directly (fastest path).
- Otherwise each page goes through the word-level engine and PyMuPDF embeds
  the words as invisible text — pixel-identical pages, searchable copy.
- Every run writes `<name>.ocr-manifest.json` (engine, languages, page
  count, characters, mean confidence, timings, input SHA-256) and skips
  finished outputs on re-run (`--resume`, default; `--force` redoes).

## Honest limits (read before trusting output)

- **OCR always makes mistakes** — worse on handwriting, faint print, and
  dense Urdu/Arabic ligatures. The manifest's `avg_confidence` is a rough
  signal, not a guarantee.
- Nothing here verifies religious text. Treat OCR output as a **draft for
  proofreading**: fix mistakes in the DOCX/TXT, then export the final PDF.
  Never present raw OCR as authenticated scripture, hadith, or fatwa.
- The website only lists OCR'd text as citable after the human-reviewed
  text is ingested — raw `.ocr.pdf` files are for reading/searching, and
  their provenance stays attached via the manifest.

## Layout

```
ocr/
  __main__.py     python -m ocr
  cli.py          run / engines / langs commands (flags only, no config file)
  engines.py      ocrmypdf / tesseract / easyocr / fake backends
  languages.py    --lang parsing + per-engine code maps
  processor.py    per-file jobs, resume, manifests
  searchable.py   invisible-text PDF assembly (PyMuPDF)
  report.py       run summaries
tests/test_ocr_module.py   engine-free test suite
```
