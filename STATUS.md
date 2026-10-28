# STATUS.md — Gratitude Without Guilt Printable Pack

## What was built

A complete, free printable pack of thank-you notes — HTML/CSS sources that
render to unbranded, ready-to-print US Letter PDFs, built and verified fully
locally (no signups, no network, no secrets, no personal data).

Ten sheets in `sheets/` (each with a friendly "Wording starters" panel of
fill-in-able sentence openers):

1. `kids-fill-in-cards.html` — two fill-in-the-blank cards for kids
2. `adult-note-designs.html` — two elegant everyday note designs
3. `wedding-thank-you.html` — monogram + cream-gold formal cards
4. `shower-thank-you.html` — baby and bridal shower designs
5. `host-gift-cards.html` — four quarter-size host cards
6. `teacher-thank-you.html` — student and family versions
7. `neighbor-thank-you.html` — porch/mailbox/snow-shovel gratitude
8. `nurse-thank-you.html` — for extraordinary nursing care
9. `envelope-liners.html` — four A2 envelope liner patterns
10. `note-sender-tracker.html` — 20-row tracker (fill → stuff → mail checkboxes), guilt-free by design: no due dates, no streaks

Shared print foundation: `shared/print.css` (letter-size `@page`, dotted
fill-in blanks, dashed cut guides with scissors marks, wording-prompt panels).

## How to run it

```bash
# Build all PDFs into printables/ (WeasyPrint preferred; Chrome fallback):
npm run build

# Verify every sheet renders a valid PDF + shipped output is unbranded:
npm test

# Python deps used by the build/tests (recommended):
pip install weasyprint pypdf
```

Engine auto-detection: `weasyprint`, else `google-chrome`/`chromium`
(`--print-to-pdf`). Env overrides: `PDF_ENGINE=weasy|chrome`,
`CHROME=/path/to/chrome`.

## Verification results

- `npm run build` — **10/10 sheets rendered** to `printables/*.pdf`
  (letter, 612×792pt, 1 page each), plus `BUILD-INFO.txt`.
- Deep validation via pypdf (`scripts/validate_pdf.py`): header, %%EOF
  trailer, page tree parse, page count, size sanity — all pass per sheet.
- `npm test` — **17 tests, 17 pass, 0 fail**:
  - engine availability, sheet count, shared CSS checks
  - per-sheet: fresh render succeeds and passes deep PDF validation
  - no remote assets, no scripts, stylesheets resolve
  - `printables/` exists, holds ≥10 PDFs, branded/personal-data scan clean
  - LICENSE (MIT, exact copyright line) and README credit present
- Visual spot-check (rendered at 55–60 dpi): kids, adult, wedding, host-gift,
  envelope-liners, and tracker sheets all lay out cleanly on one page.

## Notes from development

- The environment's Chrome 156 hangs in this sandbox's `--print-to-pdf` path
  (dbus/GPU init failures), so WeasyPrint 70 is the default engine here; the
  Chrome path is retained and auto-selected for machines where it works.
- WeasyPrint needs classic gradient syntax (no double-position stops) and a
  `@page` rule for letter size; the envelope liner sheet was resized to fit a
  single page after the first render spilled to two.

## Known gaps

- Ornament glyphs (❀ ✤ 🎄 etc.) depend on system emoji fonts; grayscale
  printers will render them as small ink stamps, which looks fine but could
  be replaced with pure-CSS shapes forprinter-perfect results.
- Envelope liners are sized for A2 envelopes only; other sizes (A6, #10,
  square flap) would need additional sheet templates.
- Wording starters are English-only; translations would widen the pack.
- The tracker is print-only — no fillable-PDF form fields (could be added
  with a forms-aware PDF step later).
- No CI wiring; tests are local by design (privacy-first, no publishing).
