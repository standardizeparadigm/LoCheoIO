/**
 * The audit, as Markdown — the copy a reviewer reads without running anything.
 *
 * WHY A CHECKED-IN REPORT INSTEAD OF ONLY A SCRIPT
 * -----------------------------------------------
 * `npm run audit:adaptive` answers "what does the layout do *now*". A report in
 * the repository answers the question that survives a release: "what did it do
 * when we shipped 1.1.8, and what changed since". It is also the only artifact
 * where the *shape* of the window space is visible at a glance — 578 windows,
 * 101 of them wordmark-only, 25 cropped, and not one broken.
 *
 * It is generated, so it is not a second source of truth: `--check` re-renders it
 * and fails the build if the file on disk differs by a byte. That is the same
 * contract `assets/test-matrix.svg` and the two corpora already live under.
 *
 * WHY BARS
 * --------
 * A list of counts sorted descending tells you which trade-off fires most. A bar
 * tells you *how much* of the space it is, without arithmetic — and the bars in
 * this file are drawn at a fixed 40 columns so two reports from two releases line
 * up when diffed.
 */

import { constraintIds } from "../constraints";
import { PRESETS } from "../presets";
import { boxOf, describeBox } from "../viewport";
import { resolveAdaptive } from "../resolve";
import type { AuditReport, AuditTally } from "./audit";

/** Width of the bar column, in characters. Bars are scaled to the largest count. */
const BAR = 40;

/** A bar that scales to the biggest count in the group, so the group fills 40 cols. */
function bar(count: number, max: number): string {
  if (max <= 0) return "";
  const filled = Math.max(1, Math.round((count / max) * BAR));
  return "█".repeat(filled).padEnd(BAR, "·");
}

/** A count as a share of the sweep, e.g. `31%`. */
function share(count: number, total: number): string {
  if (total <= 0) return "—";
  return `${Math.round((count / total) * 100)}%`;
}

/** One histogram, as a table. Empty input renders an explicit "none" row. */
function histogram(title: string, rows: AuditTally[], total: number): string {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
  const body = rows.length
    ? rows.map((r) => `| \`${r.key}\` | ${r.count} | ${share(r.count, total)} | ${bar(r.count, max)} |`).join("\n")
    : "| — | 0 | 0% | (không có) |";
  return `### ${title}\n\n| Khoá | Cửa sổ | Tỉ lệ | |\n| --- | --- | --- | --- |\n${body}\n`;
}

/**
 * The whole report.
 *
 * Deterministic: no dates, no timings, no ordering that depends on object keys.
 * The only variable is the sweep, and the sweep is a constant table.
 */
export function renderAuditMarkdown(report: AuditReport): string {
  const total = report.windows;
  /*
   * Round 15: this sentence hardcoded "14 bất biến" — the count of the contract at
   * the time it was typed. Adding `prefs-respected` made the generated report claim
   * a number the code no longer had, which is the one thing a *generated* document
   * must never do. The count is read from the list now.
   */
  const invariants = constraintIds().length;
  const lines: string[] = [];

  lines.push("# Kiểm toán adaptive — không gian cửa sổ");
  lines.push("");
  lines.push(
    "> Tệp này **được sinh tự động** từ `resolveAdaptive()` — hàm mà ứng dụng thật dùng để vẽ. Đừng sửa tay:",
  );
  lines.push("> `npm run audit:adaptive -- --write` ghi lại, `npm run audit:adaptive -- --check` báo lỗi nếu tệp lệch.");
  lines.push("");
  lines.push("| | |");
  lines.push("| --- | --- |");
  lines.push(`| **Cửa sổ đã kiểm** | **${total}** (21 preset + lưới theo breakpoint) |`);
  lines.push(`| **Vi phạm hợp đồng** | **${report.violations.reduce((n, v) => n + v.count, 0)}** |`);
  lines.push(`| **Chỉ còn chữ LỌ CHÉO** | ${report.minimal} (${share(report.minimal, total)}) |`);
  lines.push(`| **Hero hàng / cột** | ${report.hero.row} / ${report.hero.stack} |`);
  lines.push(`| **Kết luận** | ${report.ok ? "✅ không cửa sổ nào phá hợp đồng" : "❌ có vi phạm — xem bảng dưới"} |`);
  lines.push("");

  lines.push("## 1. Hợp đồng");
  lines.push("");
  if (report.violations.length === 0) {
    lines.push(
      `Không có vi phạm nào trên ${total} cửa sổ. Con số này là **0**, không phải "chưa kiểm": mỗi cửa sổ ở trên đều đã chạy hết ${invariants} bất biến của \`constraints.ts\`.`,
    );
  } else {
    lines.push("| Bất biến | Số cửa sổ | Ví dụ |");
    lines.push("| --- | --- | --- |");
    for (const v of report.violations) lines.push(`| \`${v.key}\` | ${v.count} | ${v.examples.join(", ")} |`);
  }
  lines.push("");

  lines.push("## 2. Những gì bố cục đã nhường");
  lines.push("");
  lines.push("Đây là **thương lượng, không phải lỗi**: cửa sổ nhỏ thì phải bỏ thứ gì đó.");
  lines.push("");
  lines.push(...histogram("2.1 Thương lượng theo mã", report.warnings, total).split("\n"));
  lines.push(...histogram("2.2 Kiểu khít", report.fits, total).split("\n"));
  lines.push(...histogram("2.3 Mật độ chrome", report.densities, total).split("\n"));
  lines.push(...histogram("2.4 Bậc kích thước", report.tiers, total).split("\n"));
  lines.push(...histogram("2.5 Nấc của chip chế độ", report.chip, total).split("\n"));

  lines.push("## 3. Hai đầu của không gian");
  lines.push("");
  lines.push("| | Giá trị | Cửa sổ |");
  lines.push("| --- | --- | --- |");
  lines.push(`| Scene nhỏ nhất | ${report.extrema.smallestScene.value}px | ${report.extrema.smallestScene.window} |`);
  lines.push(`| Scene lớn nhất | ${report.extrema.largestScene.value}px | ${report.extrema.largestScene.window} |`);
  lines.push(`| Reserve nhỏ nhất | ${report.extrema.smallestReserve.value}px | ${report.extrema.smallestReserve.window} |`);
  lines.push(`| Room chật nhất | ${report.extrema.tightestRoom.value} | ${report.extrema.tightestRoom.window} |`);
  lines.push("");

  lines.push("## 4. 21 preset, đọc từ profile thật");
  lines.push("");
  lines.push("| Preset | Cửa sổ | Box | Tầng | Mật độ | Scene | Reserve | Khít | Hero | Chip |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const preset of PRESETS) {
    const p = resolveAdaptive({ box: boxOf(preset.width, preset.height) });
    const sample = report.samples.find((s) => s.width === preset.width && s.height === preset.height && s.origin === `preset:${preset.id}`);
    lines.push(
      `| \`${preset.id}\` | ${preset.width}×${preset.height} | ${describeBox(p.box)} | ${p.tier} | ${p.density} | ${p.plan.scene} | ${p.plan.reserve} | ${p.plan.fit} | ${p.hero.sideBySide ? "hàng" : "cột"} | ${sample?.chip ?? "—"} |`,
    );
  }
  lines.push("");

  lines.push("## 5. Chạy lại");
  lines.push("");
  lines.push("```bash");
  lines.push("npm run audit:adaptive            # in bảng tóm tắt");
  lines.push("npm run audit:adaptive -- --json  # toàn bộ report, cho máy đọc");
  lines.push("npm run audit:adaptive -- --check # lỗi nếu tệp này lệch");
  lines.push("npm run audit:adaptive -- --write # ghi lại tệp này");
  lines.push("```");
  lines.push("");
  return lines.join("\n");
}
