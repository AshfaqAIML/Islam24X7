"""Tests for the standalone OCR module — no OCR engine needed.

Page rendering uses synthetic PDFs built with PyMuPDF; word-level OCR is
exercised through FakeEngine and a canned Tesseract TSV sample.
"""

from __future__ import annotations

import json
import os

import fitz
import pytest
from click.testing import CliRunner
from ocr import searchable
from ocr.cli import _collect, main
from ocr.engines import FakeEngine, Word, parse_tsv
from ocr.languages import describe, easyocr_langs, parse_langs, tesseract_langs
from ocr.processor import MANIFEST_SUFFIX, process_file


def make_pdf(path: str, pages: int = 2) -> str:
    with fitz.open() as doc:
        for i in range(pages):
            page = doc.new_page(width=400, height=500)
            page.draw_rect(fitz.Rect(50, 50 + i * 10, 350, 200))
            page.insert_text(fitz.Point(60, 100), f"visible {i}")
        doc.save(path)
    return path


# --- languages -------------------------------------------------------------


def test_parse_langs_defaults():
    assert parse_langs(None) == ("urd", "ara", "eng")
    assert parse_langs("") == ("urd", "ara", "eng")


def test_parse_langs_aliases_and_separators():
    assert parse_langs("ur+ar+en") == ("urd", "ara", "eng")
    assert parse_langs("urdu, arabic english") == ("urd", "ara", "eng")
    assert parse_langs("urd+urd+ara") == ("urd", "ara")


def test_parse_langs_invalid_lists_codes():
    with pytest.raises(ValueError, match="Valid codes"):
        parse_langs("klingon")


def test_engine_mappings():
    assert tesseract_langs(("urd", "ara")) == "urd+ara"
    assert easyocr_langs(("urd", "ara")) == ["ur", "ar"]
    assert describe(("urd",)) == "Urdu"


# --- TSV -------------------------------------------------------------------


SAMPLE_TSV = (
    "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num"
    "\tleft\ttop\twidth\theight\tconf\ttext\n"
    "1\t1\t0\t0\t0\t0\t0\t0\t400\t500\t-1\t\n"
    "5\t1\t1\t1\t1\t1\t10\t20\t60\t18\t96.5\tHello\n"
    "5\t1\t1\t1\t1\t2\t80\t20\t40\t18\t-1\t\n"
    "5\t1\t1\t1\t1\t3\t130\t20\t50\t18\t88.0\tworld\n"
)


def test_parse_tsv_words_only():
    words = parse_tsv(SAMPLE_TSV)
    assert [(w.text, round(w.conf, 2)) for w in words] == [
        ("Hello", 0.96),
        ("world", 0.88),
    ]
    assert words[0].x0 == 10 and words[0].y1 == 38


# --- searchable PDF --------------------------------------------------------


def test_build_searchable_pdf_keeps_pages_and_adds_text(tmp_path):
    src = make_pdf(str(tmp_path / "in.pdf"), pages=2)
    dst = str(tmp_path / "in.ocr.pdf")
    per_page = [
        [Word(text="alpha", x0=10, y0=10, x1=60, y1=26, conf=0.9)],
        [Word(text="beta", x0=10, y0=10, x1=50, y1=26, conf=0.8)],
    ]
    stats = searchable.build_searchable_pdf(src, dst, per_page, dpi=100)
    assert stats == {"embedded": 2, "failed": 0}
    with fitz.open(dst) as doc:
        assert len(doc) == 2
        assert "alpha" in doc[0].get_text()
        assert "beta" in doc[1].get_text()
        # Original visible content preserved underneath.
        assert "visible 0" in doc[0].get_text()


def test_build_searchable_pdf_rejects_mismatched_pages(tmp_path):
    src = make_pdf(str(tmp_path / "in.pdf"), pages=2)
    with pytest.raises(ValueError, match="!="):
        searchable.build_searchable_pdf(src, str(tmp_path / "o.pdf"), [[]], dpi=100)


def test_page_text_orders_lines():
    words = [
        Word(text="second", x0=300, y0=10, x1=350, y1=26, conf=1.0),
        Word(text="first", x0=10, y0=10, x1=50, y1=26, conf=1.0),
        Word(text="next-line", x0=10, y0=60, x1=70, y1=76, conf=1.0),
    ]
    assert searchable.page_text(words) == "first second\nnext-line"


# --- processor -------------------------------------------------------------


def test_process_file_fake_engine_end_to_end(tmp_path):
    src = make_pdf(str(tmp_path / "book.pdf"), pages=3)
    out = str(tmp_path / "out")
    manifest = process_file(
        src, out, to=("pdf", "txt"), langs=("eng",),
        engine=FakeEngine("hello world"), dpi=72,
    )
    assert manifest.pages == 3
    assert manifest.engine == "fake"
    assert manifest.embedded_words == 6  # 2 words x 3 pages
    assert manifest.chars and manifest.chars > 0
    assert os.path.isfile(os.path.join(out, "book.ocr.pdf"))
    assert os.path.isfile(os.path.join(out, "book.txt"))
    assert os.path.isfile(os.path.join(out, f"book{MANIFEST_SUFFIX}"))
    with open(os.path.join(out, f"book{MANIFEST_SUFFIX}"), encoding="utf-8") as fh:
        saved = json.load(fh)
    assert saved["pages"] == 3 and saved["engine"] == "fake"


def test_process_file_resume_skips_finished(tmp_path):
    src = make_pdf(str(tmp_path / "book.pdf"), pages=1)
    out = str(tmp_path / "out")
    first = process_file(src, out, to=("pdf",), engine=FakeEngine(), dpi=72)
    assert first.skipped == []
    second = process_file(src, out, to=("pdf",), engine=FakeEngine(), dpi=72)
    assert second.skipped == ["pdf"]


def test_process_file_rejects_unknown_target(tmp_path):
    src = make_pdf(str(tmp_path / "book.pdf"), pages=1)
    with pytest.raises(ValueError, match="Unknown"):
        process_file(src, str(tmp_path / "o"), to=("epub",), engine=FakeEngine())


def test_process_file_requires_engine(tmp_path):
    src = make_pdf(str(tmp_path / "book.pdf"), pages=1)
    with pytest.raises(ValueError, match="engine is required"):
        process_file(src, str(tmp_path / "o"), engine=None)  # type: ignore[arg-type]


# --- CLI -------------------------------------------------------------------


def test_collect_dirs_and_globs(tmp_path):
    (tmp_path / "a.pdf").write_bytes(b"%PDF")
    sub = tmp_path / "sub"
    sub.mkdir()
    (sub / "b.png").write_bytes(b"PNG")
    (sub / "notes.txt").write_text("x")
    found = _collect((str(tmp_path),))
    assert len(found) == 2
    assert found == sorted(found)


def test_cli_help_lists_commands():
    result = CliRunner().invoke(main, ["--help"])
    assert result.exit_code == 0
    assert "run" in result.output and "engines" in result.output


def test_cli_engines_and_langs():
    assert CliRunner().invoke(main, ["engines"]).exit_code == 0
    langs = CliRunner().invoke(main, ["langs"])
    assert langs.exit_code == 0 and "urd" in langs.output
