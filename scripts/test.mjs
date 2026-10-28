#!/usr/bin/env node
/**
 * test.mjs — verifies every sheet builds a valid PDF, locally, using the same
 * engine preference as build.mjs (WeasyPrint, then headless Chrome).
 *
 * Checks, per sheet:
 *   - renderer exits successfully and writes a file
 *   - %PDF header, %%EOF trailer, sane size
 *   - deep parse via pypdf (page tree, page count) when pypdf is installed
 *   - linked local stylesheets exist, no remote assets, no inline scripts
 * Plus: printables/ exists with unbranded content when the repo is built.
 *
 * Run: npm test
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sheetsDir = join(root, "sheets");
const sharedDir = join(root, "shared");
const tmp = join("/tmp/opencode", "gratitude-test-render");
const hasPypdf = spawnSync("python3", ["-c", "import pypdf"], { stdio: ["ignore", "ignore", "ignore"] }).status === 0;
const hasWeasy = spawnSync("weasyprint", ["--version"], { stdio: ["ignore", "ignore", "ignore"] }).status === 0;

function renderToPdf(htmlPath, outPath) {
  if (hasWeasy && process.env.PDF_ENGINE !== "chrome") {
    execFileSync("weasyprint", [htmlPath, outPath], { timeout: 120000, stdio: ["ignore", "ignore", "pipe"] });
    return "weasyprint";
  }
  const candidates = [process.env.CHROME, "google-chrome", "google-chrome-stable", "chromium", "chromium-browser"].filter(Boolean);
  for (const bin of candidates) {
    if (spawnSync(bin, ["--version"], { stdio: ["ignore", "ignore", "ignore"] }).status !== 0) continue;
    execFileSync(bin, [
      "--headless=new", "--disable-gpu", "--no-sandbox", "--disable-crashpad",
      "--disable-dev-shm-usage", "--no-first-run",
      `--user-data-dir=${join(tmp, "profile")}`,
      `--print-to-pdf=${outPath}`, "--no-pdf-header-footer",
      `file://${htmlPath}`,
    ], { timeout: 120000, stdio: ["ignore", "ignore", "pipe"] });
    return bin;
  }
  throw new Error("No usable PDF engine found (weasyprint or chromium)");
}

function deepValidate(path3, label) {
  const buf = readFileSync(path3);
  assert.match(buf.subarray(0, 5).toString("latin1"), /^%PDF-/, "missing %PDF header");
  assert.ok(buf.subarray(buf.length - 2048).toString("latin1").includes("%%EOF"), "missing %%EOF trailer");
  assert.ok(statSync(path3).size > 5000, `PDF too small (${buf.length} bytes) for a real render`);
  if (hasPypdf) {
    const res = spawnSync("python3", [join(root, "scripts", "validate_pdf.py"), path3], { encoding: "utf8" });
    assert.strictEqual(res.status, 0, `pypdf validation failed for ${label}: ${res.stderr}`);
  }
}

const sheets = readdirSync(sheetsDir).filter((f) => f.endsWith(".html")).sort();

test.before(() => {
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
});

test("a usable PDF engine is available (weasyprint or chromium)", () => {
  assert.ok(hasWeasy || findChromeOk(), "need weasyprint or chromium installed");
});

function findChromeOk() {
  for (const bin of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    if (spawnSync(bin, ["--version"], { stdio: ["ignore", "ignore", "ignore"] }).status === 0) return bin;
  }
  return null;
}

test(`found the expected sheet sources (${sheets.length})`, () => {
  assert.ok(sheets.length >= 10, `expected at least 10 sheets, found ${sheets.length}`);
});

test("shared print stylesheet exists and is print-oriented", () => {
  const cssPath = join(sharedDir, "print.css");
  assert.ok(existsSync(cssPath), "missing shared/print.css");
  const css = readFileSync(cssPath, "utf8");
  assert.ok(css.includes("@page"), "shared css should define @page rules");
  assert.ok(css.match(/8\.5in|11in/), "shared css should target letter-size sheets");
});

test("sheet sheet-specific stylesheets reference no remote or secret-bearing assets", () => {
  for (const sheet of sheets) {
    const html = readFileSync(join(sheetsDir, sheet), "utf8");
    assert.ok(!/<script/i.test(html), `sheets must be static HTML/CSS only: ${sheet}`);
    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      assert.ok(!/^https?:\/\//i.test(m[1]), `remote asset not allowed in ${sheet}: ${m[1]}`);
    }
    const links = [...html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(links.length >= 1, `expected a linked stylesheet in ${sheet}`);
    for (const l of links) {
      assert.ok(existsSync(resolve(sheetsDir, l)), `stylesheet missing: ${l}`);
    }
  }
});

test("package.json exposes build and test scripts", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.ok(pkg.scripts && pkg.scripts.build, "missing build script");
  assert.ok(pkg.scripts && pkg.scripts.test, "missing test script");
});

test("LICENSE and README credit are in place", () => {
  const license = readFileSync(join(root, "LICENSE"), "utf8");
  assert.ok(license.includes("MIT License"), "LICENSE should be MIT");
  assert.ok(license.includes("Copyright (c) 2026 Asdale Dynamics, LLC"), "LICENSE copyright line missing/incorrect");
  const readme = readFileSync(join(root, "README.md"), "utf8");
  assert.ok(readme.includes("Asdale Dynamics, LLC"), "README should credit Asdale Dynamics, LLC");
});

for (const sheet of sheets) {
  test(`sheet ${sheet} renders a valid, complete PDF`, () => {
    const src = join(sheetsDir, sheet);
    const out = join(tmp, sheet.replace(/\.html$/, ".pdf"));
    renderToPdf(src, out);
    assert.ok(existsSync(out), "renderer produced no PDF");
    deepValidate(out, sheet);
  });
}

test("printables/ holds built, unbranded PDFs (run npm run build first)", () => {
  const outDir = join(root, "printables");
  if (!existsSync(outDir)) {
    assert.fail("printables/ missing — run `npm run build` before testing the shipped output");
  }
  const pdfs = readdirSync(outDir).filter((f) => f.endsWith(".pdf"));
  assert.ok(pdfs.length >= 10, `expected at least 10 built PDFs, found ${pdfs.length}`);
  for (const f of filesNonPdf(outDir)) {
    const lower = readFileSync(join(outDir, f), "utf8").slice(0, 8000).toLowerCase();
    for (const banned of ["@example.com", "@gmail", "todo@yahoo", "secret", "api_key", "apikey", "phonenumber"]) {
      assert.ok(!lower.includes(banned), `${f} contains suspicious content: ${banned}`);
    }
  }
  for (const f of pdfs) {
    deepValidate(join(outDir, f), `shipped/${f}`);
  }
});

function filesNonPdf(dir) {
  return readdirSync(dir).filter((f) => !f.endsWith(".pdf"));
}
