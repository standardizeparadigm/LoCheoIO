/**
 * Ba SVG mới của vòng hai.
 *
 * Mỗi file được kiểm trên ba mặt, và cả ba đều từng hỏng thật khi viết:
 *
 *   1. XML hợp lệ                       — `resvg` từ chối file méo, và một
 *                                         SVG hỏng làm cả README hỏng theo
 *   2. mọi `<animate>` có `dur`         — thiếu `dur` thì trình duyệt lấy mặc
 *                                         định 0s và "hoạt họa" đứng im; mắt
 *                                         thường không phân biệt được với
 *                                         hoạt họa chạy chậm
 *   3. không chú thích HTML/emoji trong text  — `<text>` chỉ nhận ký tự, một
 *                                         `<!--` lọt vào sẽ hiện nguyên văn
 *
 * Bài học đắt nhất không nằm trong test: lưới chéo dài trong
 * `diagonal-motion.svg` thoát khỏi thẻ kể cả khi đã có `clip-path`, vì nhóm
 * chứa nó nằm trong một `<g transform>` nên hệ toạ độ của clip lệch đi. Đã
 * thay bằng các vạch ngắn nằm gọn trong thẻ — thứ không cần clip thì không
 * thể clip sai.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const FILES = [
  "assets/menu-anatomy.svg",
  "assets/diagonal-motion.svg",
] as const;

describe.each(FILES)("%s", (file) => {
  const raw = readFileSync(file, "utf8");

  it("is well-formed XML with a viewBox", () => {
    // Không dùng DOMParser (không có DOM thật trong vitest node env): kiểm
    // cấu trúc thô nhưng đủ để bắt thẻ chưa đóng và thuộc tính không quote.
    expect(raw.startsWith("<svg")).toBe(true);
    expect(raw.trimEnd().endsWith("</svg>")).toBe(true);
    expect(raw).toMatch(/viewBox="0 0 \d+ \d+"/);
    const open = (raw.match(/<[a-zA-Z]/g) ?? []).length;
    const close = (raw.match(/\/>|<\//g) ?? []).length;
    expect(close).toBeGreaterThanOrEqual(open - 1); // -1: thẻ <svg> gốc
  });

  it("has accessibility metadata", () => {
    expect(raw).toContain('role="img"');
    expect(raw).toMatch(/aria-label="[^"]{20,}"/);
  });

  it("marks itself as SMIL-animated in the alt text", () => {
    // README nào nhúng file này cũng phải nói cho người đọc screen reader biết
    // ảnh có chuyển động — nếu không, một ảnh động im lặng là một bất ngờ.
    expect(raw).toMatch(/aria-label="[^"]*SMIL/);
  });

  it("gives every animated element a duration", () => {
    const anims = raw.match(/<animate[A-Za-z]*\b[^>]*>/g) ?? [];
    expect(anims.length).toBeGreaterThan(0);
    const noDur = anims.filter((a) => !/\bdur="/.test(a));
    expect(noDur).toEqual([]);
  });

  it("uses indefinite repetition instead of a finite loop that silently stops", () => {
    const anims = raw.match(/<animate[A-Za-z]*\b[^>]*>/g) ?? [];
    const finite = anims.filter(
      (a) => /repeatCount="(?:[0-9]+|freeze)"/.test(a),
    );
    expect(finite).toEqual([]);
  });

  it("does not leak HTML comments or emoji into <text>", () => {
    const texts = raw.match(/<text\b[\s\S]*?<\/text>/g) ?? [];
    for (const t of texts) {
      expect(t).not.toContain("<!--");
      // Emoji trong <text> render thành ô vuông ở phần lớn font hệ thống.
      expect(t).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    }
  });

  it("quotes every attribute", () => {
    // Một thuộc tính không quote làm resvg bỏ qua cả thẻ, im lặng.
    const bad = raw.match(/<[a-zA-Z][^>]*\s[a-zA-Z-]+=[^"'\s>]/g) ?? [];
    expect(bad).toEqual([]);
  });
});

describe("the two round-two SVGs together", () => {
  it("do not claim a version other than 1.1.8", () => {
    for (const f of FILES) {
      const raw = readFileSync(f, "utf8");
      const versions = [...raw.matchAll(/v?(\d+\.\d+\.\d+)/g)].map((m) => m[1]);
      for (const v of versions) expect(v).toBe("1.1.8");
    }
  });

  it("are both referenced from the Vietnamese README", () => {
    const md = readFileSync("README.md", "utf8");
    for (const f of FILES) {
      const name = f.replace(/^assets\//, "");
      expect(md).toContain(`<img src="assets/${name}"`);
      // ...và mỗi ảnh có alt text thật, không phải alt=""
      const tag = md.slice(md.indexOf(`<img src="assets/${name}"`));
      const alt = tag.slice(0, tag.indexOf(">")).match(/alt="([^"]*)"/)?.[1] ?? "";
      expect(alt.length).toBeGreaterThan(20);
    }
  });
});
