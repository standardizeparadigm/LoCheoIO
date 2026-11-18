/**
 * Offline self-containment gate (v1.1.8 vòng 20) — pin cho hợp đồng «một file,
 * chơi từ đĩa» (ADR 0001 + ADR 0009).
 *
 * Bối cảnh lỗi thật: người chơi tải `index.html` từ release về rồi mở bằng
 * file:// là cách chơi phổ biến nhất, và đã có báo cáo «mở offline mất sạch
 * animation». Điều tra cho thấy bản build tự chứa 100% (JS/CSS/font inline,
 * không một tham chiếu ngoài) — trang chết đến từ việc mở nhầm file nguồn
 * `index.html` ở gốc repo (dev entry cần dev server) hoặc trình duyệt quá cũ.
 * Ba lớp chống tái phát được pin ở đây:
 *
 *   1. `scripts/check-offline.mjs` — máy quét tham chiếu ngoài thuần (pure),
 *      chạy sau `vite build` trong `npm run check`: bất kỳ `src=/href=/url()/
 *      @import/modulepreload` tuyệt đối nào trong dist đều là lỗi CI.
 *   2. Boot watchdog trong `index.html` — template gốc phải còn nguyên,
 *      vì Vite mang nó sang dist: nếu bundle không gắn vào #root sau 4 giây,
 *      người chơi thấy lời giải thích song ngữ thay vì trang trắng.
 *   3. dist (khi tồn tại sau build) — quét thật: 0 tham chiếu ngoài.
 *
 * Scan là pure nên không cần build để test logic; phần dist chỉ chạy khi
 * file có sẵn (CI chạy gate thật ngay sau build, ở đây là lưới rà bổ sung).
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isExternalRef, REF_KINDS, scanExternalRefs } from "../scripts/check-offline.mjs";

const root = resolve(__dirname, "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

describe("check-offline — máy quét tham chiếu ngoài (pure)", () => {
  it("ref kind vocabulary matches REF_KINDS export (test ↔ script đồng bộ)", () => {
    expect(REF_KINDS).toEqual([
      "src", "href", "srcset", "poster", "css-url", "css-import", "preload-link",
    ]);
  });

  it("isExternalRef: tuyệt đối / protocol-relative / http(s) là ngoài, data · # · tương đối là trong", () => {
    expect(isExternalRef("/assets/index-abc.js")).toBe(true);
    expect(isExternalRef("//cdn.example.com/x.css")).toBe(true);
    expect(isExternalRef("https://cdn.example.com/x.css")).toBe(true);
    expect(isExternalRef("http://localhost:5173/main.tsx")).toBe(true);
    expect(isExternalRef("data:image/svg+xml,%3Csvg/%3E")).toBe(false);
    expect(isExternalRef("#hash")).toBe(false);
    expect(isExternalRef("favicon.svg")).toBe(false);
    expect(isExternalRef("./favicon.png")).toBe(false);
    expect(isExternalRef("")).toBe(false);
    expect(isExternalRef(undefined as unknown as string)).toBe(false);
  });

  it("bắt đủ 4 nhóm phạm vi: attr src/href, css url(), css @import, link preload", () => {
    const html = [
      '<script src="/assets/x.js"></script>',
      '<link rel="stylesheet" href="https://cdn.example.com/a.css">',
      '<div style="background:url(/img.png)">',
      "<style>@import 'theme.css';</style>", // tương đối → không phạm
      '<style>@import "https://fonts.example.com/f.css";</style>',
      '<img srcset="/hero@2x.png 2x">',
      '<video poster="/poster.jpg">',
      '<link rel="modulepreload" href="/m.js">',
      '<link rel="icon" href="data:image/x-icon;base64,AAAA">',
    ].join("\n");
    const refs = scanExternalRefs(html);
    const kinds = refs.map((r) => r.kind);
    expect(kinds).toContain("src");
    expect(kinds).toContain("href");
    expect(kinds).toContain("css-url");
    expect(kinds).toContain("css-import");
    expect(kinds).toContain("srcset");
    expect(kinds).toContain("poster");
    expect(kinds).toContain("preload-link");
    // @import 'theme.css' tương đối và favicon data: không được bịflag
    expect(refs.map((r) => r.value)).not.toContain("theme.css");
    // modulepreload phạm 2 lần (attr href + preload-link) — cố ý, báo đúp cho rõ
    expect(refs).toHaveLength(8);
  });

  it("data URI chứa chuỗi 'http' bên trong payload không bị báo nhầm", () => {
    // base64 của một font/ảnh thật có thể chứa nguyên cụm "http://" — phải được strip trước khi quét
    const html = '<style>body{background:url("data:image/svg+xml;base64,aHR0cDovL3g=")}</style>';
    expect(scanExternalRefs(html)).toHaveLength(0);
  });

  it("file tự chứa chuẩn (JS/CSS inline, font data:, favicon tương đối) → 0 phạm", () => {
    const html = [
      '<link rel="icon" href="data:image/x-icon;base64,AAAA">',
      '<link rel="icon" href="favicon.svg">',
      '<link rel="apple-touch-icon" href="favicon.png">',
      '<script type="module">/* bundle inline */</script>',
      '<style>@font-face{src:url(data:font/woff2;base64,AAAA)}p{color:#b6e07a}</style>',
      '<div id="root"></div>',
    ].join("\n");
    expect(scanExternalRefs(html)).toHaveLength(0);
  });
});

describe("boot watchdog trong index.html (template gốc — Vite mang sang dist)", () => {
  it("template còn nguyên watchdog: marker, id panel, hẹn giờ 4s, tự gỡ khi mount", () => {
    const html = read("index.html");
    expect(html).toContain("data-locheo-boot");
    expect(html).toContain('NOTICE_ID = "locheo-boot-notice"');
    expect(html).toContain("4000");
    expect(html).toContain("MutationObserver");
    // giải thích đúng 3 lý do, song ngữ
    expect(html).toContain("file://");
    expect(html).toContain("npm run dev");
    expect(html).toContain("could not start");
    // thuần ES5, không accidential ngoài
    expect(html).not.toMatch(/<script[^>]*src="http/);
  });

  it("dev entry vẫn là module /src/main.tsx (watchdog bổ sung, không thay thế)", () => {
    const html = read("index.html");
    expect(html).toContain('<script type="module" src="/src/main.tsx"></script>');
    expect(html).toContain('<meta name="version" content="1.1.8" />');
  });
});

describe("dist thật (khi tồn tại sau build) — quét lưới rà bổ sung", () => {
  const distPath = resolve(root, "dist/index.html");

  it("dist/index.html tự chứa 100% + mang watchdog theo template", () => {
    if (!existsSync(distPath)) return; // gate thật nằm ở `npm run check` (sau vite build)
    const html = readFileSync(distPath, "utf8");
    expect(scanExternalRefs(html)).toHaveLength(0);
    expect(html).toContain("locheo-boot-notice");
    expect(html).toContain('name="version" content="1.1.8"');
  });
});
