"""Language handling — one ``--lang`` flag, mapped per OCR engine.

Canonical codes follow Tesseract (``urd``, ``ara``, ``eng``, ``fas`` …).
Users write ``--lang urd+ara+eng``; each engine translates to its own
naming (EasyOCR wants ``ur``/``ar``/``en``).
"""

from __future__ import annotations

# Canonical (Tesseract-style) code -> (label, easyocr code).
LANGUAGES: dict[str, tuple[str, str]] = {
    "urd": ("Urdu", "ur"),
    "ara": ("Arabic", "ar"),
    "eng": ("English", "en"),
    "fas": ("Persian", "fa"),
    "hin": ("Hindi", "hi"),
    "tur": ("Turkish", "tr"),
    "ind": ("Indonesian", "id"),
    "ben": ("Bengali", "bn"),
}

# Handy aliases people actually type.
ALIASES: dict[str, str] = {
    "ur": "urd",
    "urdu": "urd",
    "ar": "ara",
    "arabic": "ara",
    "en": "eng",
    "english": "eng",
    "fa": "fas",
    "persian": "fas",
    "hi": "hin",
    "hindi": "hin",
}

DEFAULT_LANGS = ("urd", "ara", "eng")


def parse_langs(spec: str | None) -> tuple[str, ...]:
    """Parse ``urd+ara+eng`` (also ``,`` / space separated, aliases OK).

    Raises ValueError listing every valid code on unknown input.
    """
    if not spec or not spec.strip():
        return DEFAULT_LANGS
    out: list[str] = []
    for raw in spec.replace(",", " ").replace("+", " ").split():
        code = raw.strip().lower()
        code = ALIASES.get(code, code)
        if code not in LANGUAGES:
            valid = ", ".join(sorted(LANGUAGES))
            raise ValueError(f"Unknown language {raw!r}. Valid codes: {valid}")
        if code not in out:
            out.append(code)
    if not out:
        return DEFAULT_LANGS
    return tuple(out)


def tesseract_langs(langs: tuple[str, ...]) -> str:
    """``('urd', 'ara')`` -> ``'urd+ara'`` for ``tesseract -l``."""
    return "+".join(langs)


def easyocr_langs(langs: tuple[str, ...]) -> list[str]:
    """``('urd', 'ara')`` -> ``['ur', 'ar']`` for EasyOCR."""
    return [LANGUAGES[code][1] for code in langs]


def describe(langs: tuple[str, ...]) -> str:
    """Human labels: ``('urd', 'ara')`` -> ``'Urdu, Arabic'``."""
    return ", ".join(LANGUAGES[code][0] for code in langs)
