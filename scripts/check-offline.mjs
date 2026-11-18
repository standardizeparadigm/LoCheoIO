#!/usr/bin/env node
/**
 * Offline self-containment gate (v1.1.8, vòng 20) — `node scripts/check-offline.mjs [file]`
 *
 * WHY THIS EXISTS
 * ---------------
 * The most common way to play Lọ Chéo is the single-file build opened straight
 * from disk (`file://dist/index.html`, attached to every release, launched by the
 * play-*.bat/.command/.sh scripts). On `file://` there is no server to catch a
 * stray absolute path: a single `src="/assets/…"` or `url(/fonts/…)` that a web
 * host would silently resolve becomes `file:///assets/…` — a dead reference, and
 * the page loads half-broken with no error the player can see. The single-file
 * contract (ADR 0001) promises that can never happen; nothing checked it, so
 * nothing prevented a future build from quietly regressing.
 *
 * WHAT IT SCANS
 * -------------
 * Every attribute/construct that fetches a subresource, and flags any value that
 * is NOT self-contained (data: URI, fragment, or a same-file relative name):
 *   • src / href / poster / srcset attributes pointing at `/…`, `//…`, `http://`, `https://`
 *   • CSS url(...) and @import with the same absolute/protocol prefixes
 *   • <link rel=modulepreload|preload|prefetch> — the lazy-fetch escape hatch
 * data: URIs are stripped first (a 700 KB base64 font may legitimately contain
 * the substring "http"), so the scan sees only real references.
 *
 * EXIT BEHAVIOUR
 * --------------
 * Offenders found → non-zero exit with a per-reference report (this is the CI
 * gate, wired after `vite build` in `npm run check`). Target file missing →
 * exit 0 with a hint, so `vitest` and ad-hoc runs on a clean tree still pass;
 * the real gate always runs right after the build that produces the file.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_TARGET = "dist/index.html";

/** Reference kinds the scan understands — exported so tests can pin the vocabulary. */
export const REF_KINDS = ["src", "href", "srcset", "poster", "css-url", "css-import", "preload-link"];

/**
 * Strip data: URIs (base64 and percent-encoded) so their payload — which can
 * contain any byte pattern, including `http://` inside a font or an inlined
 * script — is never mistaken for a live network reference.
 */
function stripDataUris(html) {
  return html
    .replace(/data:[\w.+-]+\/[\w.+-]+;base64,[A-Za-z0-9+/=]+/g, '""')
    .replace(/data:[\w.+-]+\/[\w.+-]+,[^"'`)\s>]*/g, '""');
}

/** True for values that only make sense when a server resolves them. */
export function isExternalRef(value) {
  const v = (value || "").trim();
  if (v.length === 0) return false;
  if (/^(data:|#|about:|mailto:|javascript:)/i.test(v)) return false;
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith("//")) return true; // protocol-relative
  if (v.startsWith("/")) return true; // origin-absolute — dies on file://
  return false;
}

/**
 * Pure scanner: returns one {kind, value} per offending reference.
 * Exported for tests/offline-gate.test.ts; the CLI below is a thin wrapper.
 */
export function scanExternalRefs(html) {
  const out = [];
  const src = stripDataUris(html);

  // attribute form: src/href/poster/srcset = "…" (double or single quotes)
  const attrRe = /(?:\s(src|href|poster|srcset))\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  for (const m of src.matchAll(attrRe)) {
    const value = m[2] !== undefined ? m[2] : m[3];
    if (isExternalRef(value)) out.push({ kind: m[1].toLowerCase(), value });
  }

  // CSS url(…)
  const urlRe = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]+))\s*\)/gi;
  for (const m of src.matchAll(urlRe)) {
    const value = m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3];
    if (isExternalRef(value)) out.push({ kind: "css-url", value });
  }

  // CSS @import "…";
  const importRe = /@import\s+(?:"([^"]*)"|'([^']*)')/gi;
  for (const m of src.matchAll(importRe)) {
    const value = m[1] !== undefined ? m[1] : m[2];
    if (isExternalRef(value)) out.push({ kind: "css-import", value });
  }

  // modulepreload / preload / prefetch — the lazy-fetch escape hatch
  const linkRe = /<link\b[^>]*>/gi;
  for (const tag of src.matchAll(linkRe)) {
    const t = tag[0];
    if (!/\brel\s*=\s*["']?(?:modulepreload|preload|prefetch)["']?/i.test(t)) continue;
    const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(t);
    const value = href ? (href[1] !== undefined ? href[1] : href[2]) : "";
    if (isExternalRef(value)) out.push({ kind: "preload-link", value });
  }

  return out;
}

function main() {
  const target = process.argv[2] || DEFAULT_TARGET;
  const path = resolve(target);
  if (!existsSync(path)) {
    console.log(`• ${target} chưa tồn tại — chạy \`npm run build\` trước để gate có file để quét (skip, exit 0).`);
    return;
  }
  const html = readFileSync(path, "utf8");
  const refs = scanExternalRefs(html);
  if (refs.length > 0) {
    console.error(`✗ ${target} KHÔNG tự chứa — ${refs.length} tham chiếu ngoài sẽ chết trên file://:`);
    for (const r of refs) console.error(`   [${r.kind}] ${r.value.slice(0, 120)}`);
    process.exit(1);
  }
  const kb = (statSync(path).size / 1024).toFixed(1);
  console.log(`✓ offline self-contained: ${target} (${kb} KB) — 0 tham chiếu ngoài, an toàn khi mở từ đĩa (file://)`);
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) main();
