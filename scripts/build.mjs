#!/usr/bin/env node
/**
 * build.mjs — one-script local build for the gratitude pack.
 * Renders every HTML sheet in sheets/ to an unbranded PDF in printables/.
 *
 * Engines (no network, no signups, no secrets):
 *   1. WeasyPrint (preferred: pip install weasyprint)
 *   2. headless Chrome/Chromium (--print-to-pdf)   # override with $CHROME
 *
 * Every produced PDF is validated (%PDF header, %%EOF trailer, sane size).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sheetsDir = join(root, "sheets");
const outDir = join(root, "printables");

function hasPypdf() {
  return spawnSync("python3", ["-c", "import pypdf"], { stdio: ["ignore", "ignore", "ignore"] }).status === 0;
}

const PDFENGINE_OK = hasPypdf();

function validatePdf(buf, path2, label) {
  if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") throw new Error(`${label}: bad PDF header`);
  if (!buf.subarray(buf.length - 1024).toString("latin1").includes("%%EOF")) {
    throw new Error(`${label}: missing %%EOF trailer`);
  }
  if (buf.length < 2000) throw new Error(`${label}: PDF suspiciously small (${buf.length} bytes)`);
  if (PDFENGINE_OK) {
    // Deep validation via pypdf: full parse, page tree, per-page count.
    execFileSync("python3", [join(root, "scripts", "validate_pdf.py"), path2], {
      cwd: root,
      stdio: ["ignore", "inherit", "inherit"],
    });
  } else {
    console.warn(`(note) pypdf not found; ${label} validated by header/trailer checks only. pip install pypdf for full validation.`);
  }
}

function runWeasy(src, out) {
  execFileSync("weasyprint", [src, out], { timeout: 120000, stdio: ["ignore", "ignore", "inherit"] });
}

function runChrome(src, out) {
  const candidates = [process.env.CHROME, "google-chrome", "google-chrome-stable", "chromium", "chromium-browser"].filter(Boolean);
  for (const bin of candidates) {
    const probe = spawnSync(bin, ["--version"], { stdio: ["ignore", "pipe", "ignore"] });
    if (probe.status !== 0) continue;
    execFileSync(bin, [
      "--headless=new", "--disable-gpu", "--no-sandbox", "--disable-crashpad",
      "--disable-dev-shm-usage", "--no-first-run",
      "--user-data-dir=/tmp/opencode/gratitude-chrome-profile",
      `--print-to-pdf=${out}`, "--no-pdf-header-footer",
      `file://${src}`,
    ], { timeout: 120000, stdio: ["ignore", "ignore", "inherit"] });
    if (existsSync(out)) return;
  }
  throw new Error("No usable Chromium-based browser found");
}

function pickEngine() {
  if (process.env.PDF_ENGINE === "chrome") return runChrome;
  if (process.env.PDF_ENGINE === "weasy") return runWeasy;
  if (spawnSync("weasyprint", ["--version"], { stdio: ["ignore", "ignore", "ignore"] }).status === 0) return runWeasy;
  return runChrome;
}

const render = pickEngine();
const files = readdirSync(sheetsDir).filter((f) => f.endsWith(".html")).sort();
if (files.length === 0) {
  console.error(`No .html sheets found in ${sheetsDir}`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

let ok = 0;
const lines = [];
for (const f of files) {
  const src = join(sheetsDir, f);
  const out = join(outDir, f.replace(/\.html$/, ".pdf"));
  if (existsSync(out)) unlinkSync(out);

  render(src, out);

  if (!existsSync(out)) throw new Error(`${f}: renderer produced no PDF`);
  const stat = statSync(out);
  validatePdf(readFileSync(out), out, f);
  ok += 1;
  const name = f.replace(/\.html$/, ".pdf");
  lines.push(`  ${name}  (${stat.size} bytes)`);
  console.log(`\u2713 ${name.padEnd(30)} ${stat.size} bytes`);
}

writeFileSync(
  join(root, "printables", "BUILD-INFO.txt"),
  [
    "# Gratitude Without Guilt printables",
    "# MIT License | Copyright (c) 2026 Asdale Dynamics, LLC",
    `# Built locally on ${new Date().toISOString()}`,
    `# Sheets rendered: ${ok}/${files.length}`,
    "",
    ...lines,
    "",
  ].join("\n")
);

console.log(`\nDone: ${ok}/${files.length} sheets built to printables/ (PDFs stay local, unbranded).`);
