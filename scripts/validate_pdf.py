#!/usr/bin/env python3
"""Validate one or more PDFs: header/trailer integrity, loadable page tree, page count >= 1, non-trivial size.

Usage: validate_pdf.py FILE [FILE...]  -> prints 'FILE OK pages=N'; exits nonzero on any failure.
"""
import sys
from pathlib import Path

def main() -> int:
    if len(sys.argv) < 2:
        print("usage: validate_pdf.py FILE [FILE...]", file=sys.stderr)
        return 2
    failed = False
    try:
        from pypdf import PdfReader
    except ImportError:
        print("pypdf is required for PDF validation (pip install pypdf)", file=sys.stderr)
        return 2
    for name in sys.argv[1:]:
        path = Path(name)
        label = path.name
        try:
            data = path.read_bytes()
            problems = []
            if not data.startswith(b"%PDF-"):
                problems.append("missing %PDF header")
            if b"%%EOF" not in data[-2048:]:
                problems.append("missing %%EOF trailer")
            if len(data) < 2000:
                problems.append(f"suspiciously small ({len(data)} bytes)")
            if problems:
                raise ValueError("; ".join(problems))
            reader = PdfReader(str(path))
            pages = len(reader.pages)
            if pages < 1:
                raise ValueError("zero pages")
            box = reader.pages[0].mediabox
            print(f"{label} OK pages={pages} size={float(box.width):.0f}x{float(box.height):.0f}pt bytes={len(data)}")
        except Exception as exc:  # noqa: BLE001 - report any per-file failure
            failed = True
            print(f"{label} INVALID: {exc}", file=sys.stderr)
    return 1 if failed else 0

if __name__ == "__main__":
    sys.exit(main())
