/**
 * The rule set that decides whether a prose count is current.
 *
 * WHY THIS IS A MODULE AND NOT PART OF THE SCRIPT
 * ----------------------------------------------
 * It used to live inside `scripts/sync-prose-counts.mjs`, which is only ever run
 * by CI (`node scripts/sync-prose-counts.mjs --verify`) and by hand. So the
 * repository had a gate for prose counts that `npm run check` did not run, and
 * the failure mode was exactly the one CI caught on the last release: four files
 * still said "26 SVGs" after the twenty-seventh figure landed, the ten READMEs
 * had been rewritten by hand, and nobody typed the command locally.
 *
 * A gate that only CI runs is a gate nobody runs. Splitting the rules out means
 * `tests/prose-counts-gate.test.ts` can run the *same* rules — not a copy of
 * them, not a re-implementation — against the same files, inside `vitest run`,
 * with the counts measured from the repo instead of from a subprocess. The
 * script keeps measuring (it runs the suite to learn the test count); this module
 * only decides.
 *
 * WHAT THE RULES SEE
 * ------------------
 * Eight languages state the same fact eight ways, and they do not all use the
 * same words, the same separators or even the same script:
 *
 *     520 tests / 51 files       520 tests across 51 files
 *     520 tests en 51 archivos   520 Tests in 51 Dateien
 *     520 test trên 48 file      520 testes em 51 ficheiros
 *     51 파일 495 테스트          SVG ทั้งหมด 26 ภาพ
 *
 * Every rule below is a *sentence shape*, and every `to` is a function of the
 * match groups — no `$1`, no `$&`, nothing to escape. That is not style: the
 * first version of this sweep used a template with a backreference and wrote
 * `82 Dateien · 882 51 Dateien · 520 Tests` into six files.
 */

export function makeRules(counts) {
  /* Every number the rules write comes from this one object. */
  const T = String(counts.tests);
  const F = String(counts.files);
  const SVGS = String(counts.svgs);
  const KEYS = String(counts.keys);
  return [
    // 520 tests / 51 files  ·  520 test / 48 file  ·  520 Tests / 51 Dateien
    {
      re: /\b\d{3,4} ([Tt]ests?|[Tt]est|[Tt]estes|[Tt]este) \/ \d{1,3} ([A-Za-z][\w]*)\b/g,
      to: (m, noun, unit) => `${T} ${noun} / ${F} ${unit}`,
    },
    /*
     * The parenthesised form: "\`menu-layout.test.ts\` khoá toàn bộ phép cộng chiều
     * cao (976 test)". Survived the other rules for several rounds because a
     * number in brackets, next to a filename, reads as a note about *that file*
     * rather than as a claim about the suite.
     */
    {
      re: /\(\d{3,4} ([Tt]ests?|[Tt]est|[Tt]estes?)\)/g,
      to: (m, noun) => `(${T} ${noun})`,
    },
    // 520 tests across 51 files
    {
      re: /\b\d{3,4} tests? across \d{1,3} files\b/g,
      to: () => `${T} tests across ${F} files`,
    },
    // 520 tests en 51 archivos · 520 Tests in 51 Dateien · 520 testes em 51 ficheiros
    {
      re: /\b\d{3,4} ([Tt]ests?|[Tt]estes?) (en|sur|auf|em|in|di|trên|の) \d{1,3} ([A-Za-z][\w]*)\b/g,
      to: (m, noun, prep, unit) => `${T} ${noun} ${prep} ${F} ${unit}`,
    },
    // 520 Unit-Tests · 520 tests unitaires · 520 testes unitários · 520 unit tests
    {
      re: /\b\d{3,4} ((?:[Uu]nit[- ][Tt]ests?)|(?:[Uu]nit[- ][Tt]est)|(?:tests? unit\w*)|(?:testes? unit\w*))\b/g,
      to: (m, phrase) => `${T} ${phrase}`,
    },
    // typecheck + 520 tests + build
    {
      re: /\btypecheck \+ \d{3,4} [Tt]ests? \+ build\b/g,
      to: (m) => m.replace(/\d{3,4}/, T),
    },
    /*
     * Thai writes the pair with no separator words: "501 เทสต์ใน 48 ไฟล์" —
     * count, noun, "ใน" (in), count, unit. Non-Latin script, so `\b` does not
     * apply and the pattern is anchored on the digits and the Thai word instead.
     */
    {
      re: /\d{3,4} เทสต์ใน \d{1,3} ไฟล์/g,
      to: () => `${T} เทสต์ใน ${F} ไฟล์`,
    },
    /*
     * "20 SVG — no orphans" · "20 SVGs, references checked both ways".
     * This rule is marked `current: true`, which means the whole *line* is
     * skipped when it looks like a record of the past: an arrow into 1.1.8, a
     * version-range row, or a changelog table. The sweep row in every README
     * says "10 READMEs + docs + 19 SVGs → 1.1.8", and 19 really was the count
     * when that sweep happened — rewriting it would falsify the record. The
     * growth table (`| SVG | 18 | 19 |`) has the same problem.
     */
    {
      re: /\b\d{1,2} (SVGs?|file SVG)\b/g,
      current: true,
      to: (m, unit) => `${SVGS} ${unit}`,
    },
    /*
     * "7 locales × 327 keys" · "327 khoá × 7 locale". Current-facing, and it
     * appears both in a shell comment and in a quality-gate table cell.
     */
    {
      re: /\b\d{3} (keys?|khoá|key|clés|claves|Schlüssel|teclas|键|키|キー)\b/g,
      current: true,
      to: (m, unit) => `${KEYS} ${unit}`,
    },
    /*
     * CJK `alt` text puts the file count first and drops every separator word:
     *
     *     40ファイル344テスト            (ja)
     *     51개 파일 495 테스트           (ko)
     *     51 个文件 501 项测试、九个质量门  (zh)
     *
     * Eight READMEs describe the same test-matrix.svg image; five said the
     * current numbers and three said numbers from three different releases
     * (344/40, 495/51, 501/51). A sighted reader sees the SVG and never reads
     * this line — it exists for screen readers, which is exactly why nobody
     * noticed it drift. Matched as one unit so the pair cannot be half-updated
     * into "986 ファイル 344 テスト".
     */
    {
      /*
       * Separators are captured and re-emitted verbatim. Japanese sets the pair
       * closed up (`40ファイル344テスト`), Korean and Chinese space it out
       * (`51개 파일 495 테스트`) — a rule that normalises whitespace would
       * "fix" the counts and leave a subtly un-Japanese line behind.
       */
      re: /(\d{1,3})(\s*)(ファイル|개\s*파일|个文件)(\s*)(\d{3,4})(\s*)(テスト|테스트|项测试)/g,
      to: (m, fc, g1, fu, g2, tc, g3, tu) => `${F}${g1}${fu}${g2}${T}${g3}${tu}`,
    },
    // 51 files · 520 tests  (reversed order, some languages prefer it)
    {
      re: /\b\d{1,3} ([A-Za-z][\w]*) · \d{3,4} ([Tt]ests?|[Tt]estes?)\b/g,
      to: (m, unit, noun) => `${F} ${unit} · ${T} ${noun}`,
    },
  ];
}

  /** Sentences that look like a count but must NOT be rewritten (released rows). */
export const HISTORICAL = /v1\.1\.[0-7]|2026-1[01]-\d\d/;

  /**
   * Sentences that describe the past rather than today, so their numbers must be
   * left exactly as written. Widened after the SVG rule rewrote two sweep rows
   * that said "19 SVGs → 1.1.8": an arrow into the release, a "sweep"/"quét" verb
   * plus a version, or an explicit old-value marker all mean "this was true
   * then".
   */
export const PAST =
    /→ *1\.1\.8|→ *v1\.1\.8|quét toàn bộ|sweep of 10|barrido de 10|balayage des 10|kompletter Durchlauf|varredura de 10|ตรวจ 10|全量扫描|\| *\d{1,2} *\| *\*?\d{1,2}\*? *\|/;

  /**
   * Lines that are part of the project-tree diagram, not prose.
   *
   * THE BUG THIS FIXES
   * ------------------
   * The test/file rule `\d{1,3} files` matched inside the ASCII tree in the
   * README:
   *
   *     │  └─ ui/          # 8 primitive, 1 file mỗi cái
   *     ├─ changelog/      # in-game changelog (tách từ 1 file)
   *     │  ├─ entries/     #   1 file / 1 bản
   *
   * and rewrote all three `1`s to `48`, the number of test files. The tree then
   * claimed eight primitives live in "48 file mỗi cái" and that `changelog/` was
   * split from 48 files. It survived six rounds of review because a tree is the
   * one part of a README nobody re-reads once it looks right.
   *
   * A line is a tree line when it contains a box-drawing glyph. Blocking the
   * whole line is the only safe rule: a tree node describes a file that exists,
   * not a count of files that exist.
   */
export const TREE = /[│├└─]/;

  /**
   * Text inside «guillemets» is a quotation, and a quotation of a number is
   * usually a quotation of an *old* number.
   *
   * THE BUG THIS FIXES
   * ------------------
   * `scripts/README.md` explains why prose counts drift by exhibiting them:
   *
   *     — «520 tests / 51 files», «520 Tests in 51 Dateien», «520 test trên 48 file»,
   *     «520 testes em 51 ficheiros», «520 Unit-Tests», «typecheck + 520 tests + build»
   *     (Đặt trong «» vì đây là trích dẫn những con số cũ, không phải số hôm nay.)
   *
   * The rule rewrote every one of them to 981 and left the sentence beneath it
   * saying "these are the old numbers". A file can discuss a stale count without
   * holding a stale count — so the count only moves outside the quotation marks,
   * not by skipping the line: a line may quote an old figure *and* state today's.
   */
export const QUOTED = /(«[^»]*»)/;

/**
 * Apply every rule to one document, line by line.
 *
 * A LINE IS THE UNIT because "is this sentence about today?" is a property of the
 * line, not of the file: a README legitimately holds a current claim in one
 * paragraph and a record of the past in the next. Three guards decide, and they
 * apply to *every* rule — the first version applied them only to rules flagged
 * `current`, which silently exempted the test/file/key rules, the ones that had
 * actually corrupted a tree:
 *
 *   `TREE`   — a box-drawing glyph means the line is the project tree, not prose;
 *   `PAST`   — an arrow into the release, a sweep verb, an old-value row;
 *   `QUOTED` — «…» is a quotation, and a quotation of a number is usually an old
 *              one. Only the unquoted spans are rewritten, not the whole line:
 *              a line may quote an old figure *and* state today's.
 */
export function applyRules(body, counts) {
  let next = body;
  for (const { re, to } of makeRules(counts)) {
    next = next
      .split("\n")
      .map((line) => {
        if (TREE.test(line)) return line;
        if (PAST.test(line)) return line;
        /* Odd indices are the «…» spans; only even ones are prose to update. */
        return line
          .split(QUOTED)
          .map((part, i) => (i % 2 === 1 ? part : part.replace(re, to)))
          .join("");
      })
      .join("\n");
  }
  return next;
}

/** Rewrite a document, and say whether anything moved. */
export function rewrite(body, counts) {
  const next = applyRules(body, counts);
  return { body: next, changed: next !== body };
}

/**
 * Lines that still look like a stale count after rewriting.
 *
 * This verifies the *output*, not the input: a line that pairs a three-digit
 * number with a file count, mentions tests, and does not contain today's total is
 * almost always a rewrite this sweep failed to make. Judging it is better than
 * leaving a wrong number in eight languages.
 */
export function staleCounts(body, counts) {
  const out = [];
  for (const line of body.split("\n")) {
    if (!/\b\d{3,4}\b/.test(line)) continue;
    if (HISTORICAL.test(line)) continue;
    const bare = line.split(QUOTED).filter((_, i) => i % 2 === 0).join("");
    if (!/\b\d{3,4}\b/.test(bare)) continue;
    const stalePair = /\b(?:5[0-9]{2}|6[0-9]{2}|7[0-9]{2})\b[^\n]*\b(?:4[0-9]|5[0-9]|6[0-9])\b/.test(bare)
      && /\b(?:tests?|Tests?|testes?|Unit)\b/.test(bare)
      && !bare.includes(String(counts.tests));
    if (stalePair) out.push(line.trim().slice(0, 90));
  }
  return out;
}

/**
 * The files that state a count but are not READMEs at the repo root.
 *
 * Each was added because it had already drifted: `tests/README.md` opens with a
 * claim about the suite in the directory the suite lives in, `docs/README.md`
 * indexes the asset store, `scripts/README.md` prints the validator's sample
 * output, and `CONTRIBUTING.md` tells a contributor what `npm run test` looks
 * like. The last release's CI failure was the SVG count in exactly these four.
 */
export const EXTRA_TARGETS = [
  "scripts/README.md",
  "tests/README.md",
  "docs/README.md",
  "CONTRIBUTING.md",
];
