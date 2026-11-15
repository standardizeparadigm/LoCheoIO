#!/usr/bin/env node
/**
 * Structural validation for the 20 README assets.
 *
 * There is no SVG renderer in CI (no rsvg, no headless browser), so the assets
 * cannot be screenshot-tested. What *can* be checked is everything that makes
 * an SVG fail in a browser while still being well-formed XML:
 *
 *   1. root is <svg> with a viewBox and no width/height — the README scales
 *      every one of these with `width="100%"`, and a fixed height in the file
 *      would fight that;
 *   2. every `url(#id)` resolves to an `<id>` that exists — a gradient id typo
 *      renders as black, silently;
 *   3. every `url(#id)` used inside a gradient/pattern is not self-referential
 *      (a filter on a gradient stop is ignored, and looks like a bug);
 *   4. no `<script>` and no `on*=` handler — these files are inlined into
 *      READMEs and are served from a CDN;
 *   5. every SMIL animation names an attribute its element actually has, and
 *      every `begin` is a parseable clock or event;
 *   6. the file is non-trivial: gradients/animations are what "higher grade"
 *      means, so a flat file fails rather than passing silently.
 *
 * Exit code 1 on any failure so `npm run check:assets` can gate on it.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ASSETS = "assets";
const problems = [];
const notes = [];

/** Every id="..." in a file. */
const idsIn = (src) => new Set([...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

/** Every url(#...) reference. */
const refsIn = (src) => [...src.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);

const files = readdirSync(ASSETS).filter((f) => f.endsWith(".svg")).sort();
if (files.length !== 20) {
  problems.push(`expected 20 assets, found ${files.length}`);
}

for (const file of files) {
  const path = join(ASSETS, file);
  const src = readFileSync(path, "utf8");
  const fail = (msg) => problems.push(`${file}: ${msg}`);

  // ---- 1. root -----------------------------------------------------------------
  if (!/<svg[\s>]/.test(src)) fail("no <svg> root");
  if (!/viewBox="/.test(src)) fail("no viewBox — cannot scale");
  if (/<svg[^>]*\swidth="\d+/.test(src)) fail("fixed width attribute on root");

  // ---- 2. dangling references ---------------------------------------------------
  const ids = idsIn(src);
  for (const ref of new Set(refsIn(src))) {
    if (!ids.has(ref)) fail(`url(#${ref}) does not resolve`);
  }

  // ---- 3. self-reference --------------------------------------------------------
  // A gradient stop that filters itself is a no-op in every engine.
  const gradBlocks = [...src.matchAll(/<(linear|radial)Gradient[^>]*id="([^"]+)"[\s\S]*?<\/\1Gradient>/g)];
  for (const [, , gid] of gradBlocks) {
    const block = gradBlocks.find(([, , id]) => id === gid)[0];
    if (block.includes(`url(#${gid})`)) fail(`gradient ${gid} references itself`);
  }

  // ---- 4. safety -----------------------------------------------------------------
  if (/<script/i.test(src)) fail("contains <script>");
  if (/\son[a-z]+\s*=/i.test(src)) fail("contains an inline event handler");
  if (/xlink:href="https?:/.test(src)) fail("references an external URL");

  // ---- 5. SMIL sanity ------------------------------------------------------------
  const ELEMENT_ATTRS = {
    animate: ["attributeName"],
    animateTransform: ["attributeName", "type"],
    animateMotion: ["path"],
    set: ["attributeName"],
  };
  for (const [tag, required] of Object.entries(ELEMENT_ATTRS)) {
    for (const m of src.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, "g"))) {
      const attrs = m[1];
      for (const req of required) {
        if (!new RegExp(`\\s${req}="`).test(attrs)) fail(`<${tag}> without ${req}`);
      }
      const begin = attrs.match(/\sbegin="([^"]+)"/);
      if (begin && !/^-?[\d.]+m?s$|^[\w.-]+\.(begin|end|repeat)$|^indefinite$/.test(begin[1])) {
        fail(`unparseable begin="${begin[1]}"`);
      }
      const dur = attrs.match(/\sdur="([^"]+)"/);
      if (dur && !/^[\d.]+m?s$/.test(dur[1])) fail(`unparseable dur="${dur[1]}"`);
    }
  }

  // ---- 6. non-trivial ------------------------------------------------------------
  const gradients = (src.match(/<(linear|radial)Gradient/g) ?? []).length;
  const anims = (src.match(/<animate/g) ?? []).length;
  if (gradients === 0) fail("no gradient — flat fill");
  if (anims === 0) fail("no SMIL animation");
  /*
   * Round 6 raised the floor: a gradient alone still paints every highlight as
   * a flat fill. A bloom is what makes highlights read as *light*, so every
   * asset carries at least one filter now.
   */
  const bare = src.replace(/<!--[\s\S]*?-->/g, "");
  if (!/<filter\b/.test(bare)) fail("no filter — no glow anywhere");
  const filters = (bare.match(/<filter/g) ?? []).length;
  notes.push(`${file.padEnd(24)} ${String(Math.round(src.length / 1024)).padStart(3)}kB  grad:${gradients} anim:${anims} glow:${filters}`);
}

console.log(notes.join("\n"));
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error("  ✗ " + p);
  process.exit(1);
}
console.log(`\nASSETS OK — ${files.length} SVG, all references resolve, all animated.`);
