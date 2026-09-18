"""Standalone OCR module — searchable PDFs and text from scanned books.

Run without installing anything extra::

    python -m ocr engines          # show available OCR engines
    python -m ocr run BOOK.pdf -o OUT/ --to pdf --lang urd+ara+eng

Method 1 (default, ``--to pdf``) keeps the original page images and adds an
invisible text layer, so the book looks identical but becomes searchable,
selectable and copyable. Method 2 (``--to txt`` / ``--to docx``) extracts
reflowable text for editing; export to PDF from Word/LibreOffice afterwards.

Needs at least one OCR engine: ``ocrmypdf``, Tesseract, or EasyOCR.
``python -m ocr engines`` tells you exactly what to install.
"""

__version__ = "0.1.0"
