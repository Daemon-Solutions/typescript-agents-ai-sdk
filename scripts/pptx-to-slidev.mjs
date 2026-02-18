#!/usr/bin/env node

/**
 * pptx-to-slidev.mjs
 *
 * Thin extraction layer: pulls text and images out of a .pptx file.
 * Claude handles the creative transformation (layout selection, branding)
 * via the /new-deck skill instructions.
 *
 * Usage:
 *   node scripts/pptx-to-slidev.mjs <input.pptx> <deck-dir>
 *
 * Outputs:
 *   <deck-dir>/slides-raw.md   — one markdown section per slide with raw text
 *   shared/public/<deckname>-img-<N>.<ext> — extracted images
 */

import { parseOffice } from "officeparser";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
  rmSync,
} from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { execSync } from "node:child_process";

const [pptxPath, deckDir] = process.argv.slice(2);

if (!pptxPath || !deckDir) {
  console.error(
    "Usage: node scripts/pptx-to-slidev.mjs <input.pptx> <deck-dir>"
  );
  process.exit(1);
}

const resolvedPptx = resolve(pptxPath);
if (!existsSync(resolvedPptx)) {
  console.error(`File not found: ${resolvedPptx}`);
  process.exit(1);
}

const resolvedDeckDir = resolve(deckDir);
const deckName = basename(resolvedDeckDir);
const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..");
const publicDir = join(repoRoot, "shared", "public");

mkdirSync(resolvedDeckDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });

// --- Extract text content ---
console.log(`Extracting text from ${basename(resolvedPptx)}...`);

const text = await parseOffice(resolvedPptx);

// Split on double newlines to approximate slide boundaries
const chunks = text
  .split(/\n{3,}/)
  .map((c) => c.trim())
  .filter(Boolean);

// --- Extract images from the PPTX zip ---
// PPTX files are ZIP archives; use the system `unzip` command to avoid extra deps
console.log("Extracting images...");

let imageCount = 0;
const imageMap = new Map(); // original filename -> new filename
const tmpDir = join(resolvedDeckDir, ".pptx-tmp");

try {
  mkdirSync(tmpDir, { recursive: true });
  execSync(`unzip -o -q "${resolvedPptx}" "ppt/media/*" -d "${tmpDir}"`, {
    stdio: "pipe",
  });

  const mediaDir = join(tmpDir, "ppt", "media");
  if (existsSync(mediaDir)) {
    const files = readdirSync(mediaDir).sort();
    for (const file of files) {
      imageCount++;
      const ext = extname(file).slice(1);
      const newName = `${deckName}-img-${imageCount}.${ext}`;
      copyFileSync(join(mediaDir, file), join(publicDir, newName));
      imageMap.set(file, newName);
      console.log(`  -> ${newName}`);
    }
  }
} catch (err) {
  // unzip may fail if there are no media files — that's fine
  if (err.message && !err.message.includes("caution")) {
    console.warn("Warning: Could not extract images:", err.message);
  }
} finally {
  // Clean up temp directory
  rmSync(tmpDir, { recursive: true, force: true });
}

// --- Build raw markdown ---
let md = `# Raw PPTX Extraction: ${basename(resolvedPptx)}\n\n`;
md += `> Deck: ${deckName} | Slides: ~${chunks.length} | Images: ${imageCount}\n\n`;

chunks.forEach((chunk, i) => {
  md += `---\n\n`;
  md += `## Slide ${i + 1}\n\n`;
  md += chunk + "\n\n";

  // List all extracted images on the first slide for reference
  // (officeparser doesn't provide per-slide image mapping)
  if (i === 0 && imageMap.size > 0) {
    md += `### Extracted Images\n\n`;
    for (const [orig, newName] of imageMap) {
      md += `- \`${orig}\` -> \`/${newName}\`\n`;
    }
    md += "\n";
  }
});

const rawPath = join(resolvedDeckDir, "slides-raw.md");
writeFileSync(rawPath, md);
console.log(`\nWrote raw extraction to ${rawPath}`);
console.log(`Extracted ${imageCount} images to shared/public/`);
console.log("\nClaude will now transform this into branded Slidev slides.");
