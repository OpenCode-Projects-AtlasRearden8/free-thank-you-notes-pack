# Gratitude Without Guilt — Free Thank-You Notes Printable Pack

Free printables for gratitude without guilt: warm, fill-in-the-blank thank-you
cards for real life, plus envelope liners and a note-sender tracker page so
every card you fill in actually gets mailed. No guilt, no streaks, no scores —
a late thank-you is still a thank-you.

From **Asdale Dynamics, LLC** — beginner-friendly AI education and practical,
tested, local-first tools. Learn more at dylanasdale.github.io.

## What's inside

The `printables/` folder holds the ready-to-print, unbranded PDFs
(US Letter, black-and-white friendly):

| PDF | What it is |
| --- | --- |
| `kids-fill-in-cards.pdf` | Two fill-in-the-blank cards for kids — grown-ups just hand over the pen |
| `adult-note-designs.pdf` | Two elegant everyday designs: short is fine, warm beats fancy |
| `wedding-thank-you.pdf` | Formal monogram + cream-gold designs, with wedding-specific wording decks |
| `shower-thank-you.pdf` | One baby, one bridal design |
| `host-gift-cards.pdf` | Four quarter-size cards to tuck into flowers, wine, or leftovers |
| `teacher-thank-you.pdf` | From students and from families |
| `neighbor-thank-you.pdf` | For the ladder-lenders and mail-savers |
| `nurse-thank-you.pdf` | For the hands that held steady |
| `envelope-liners.pdf` | Four liner patterns sized for A2 envelopes |
| `note-sender-tracker.pdf` | 20-row tracker: fill in, stuff, stamp, mail — no guilt attached |

Every sheet carries a small **"Wording starters"** panel — three friendly,
fill-in-able sentence starters, so nobody ever stares at a blank card.

## How to print

1. Grab any PDF from `printables/` — they are ready to use right now.
2. Print on US Letter (8.5 x 11 in), landscape designs keep a 0.1 in safety
   margin for standard home printers.
3. Cut along the dashed borders (scissors icons mark them), fold gently where
   useful, and write freely.

## Local build (optional)

The PDFs are generated from hand-tuned HTML/CSS in `sheets/`. To rebuild them
yourself — no signups, no accounts, no network calls, no telemetry:

```bash
# 1. Install a local PDF engine (either one; WeasyPrint is the default):
pip install weasyprint pypdf          # preferred
#    or rely on an installed google-chrome / chromium

# 2. Run the single build script:
npm run build        # writes printables/*.pdf + BUILD-INFO.txt

# 3. Verify every sheet really renders a valid PDF:
npm test
```

The engine is auto-detected in this order: `weasyprint` (default), then any
installed `google-chrome`/`chromium`. Set `PDF_ENGINE=chrome` (or `weasy`) to
force one, or `CHROME=/path/to/chrome` to point at a specific browser.

Everything runs on your machine. The build script has no network access and
prints nothing but your own PDFs.

## Design notes

- **"Gratitude without guilt" philosophy**: the tracker deliberately has no
  date-due columns, no overdue shading, and no streak counters. The only rule
  baked into the wording panels is *one specific detail beats ten polite lines*.
- **Wording starters** on each sheet are meant to be read aloud, picked from,
  or ignored entirely — kids get their own deck, hosts get compliments-first.
- All sheets are print-color-adjust safe and legible on grayscale printers.

## Repository layout

```
sheets/          editable HTML/CSS sources (one file per sheet)
shared/          shared print stylesheet (letter-size @page rules, fill-in blanks, cut guides)
scripts/         build.mjs, test.mjs (node), validate_pdf.py (pypdf helper)
printables/      generated, unbranded, ready-to-print PDFs
```

## Privacy & secrets

No secrets, API keys, or personal data live in this repo — the tracker sheet is
a blank form; nothing in the build touches the filesystem beyond this folder
and `/tmp`. Tested, local-first, and stays that way.

## License

MIT — see [LICENSE](LICENSE). Free to use, print, and share.
© 2026 Asdale Dynamics, LLC.
