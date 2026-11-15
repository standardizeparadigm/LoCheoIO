import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "../src/utils/clipboard";

const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");

function setClipboard(value: unknown) {
  Object.defineProperty(globalThis, "navigator", {
    value,
    configurable: true,
    writable: true,
  });
}

/*
 * The legacy path needs a `document`. There is no jsdom in this project, so a
 * minimal fake is built here: two methods (`createElement`, `execCommand`) and
 * `body.appendChild`. That is a lot less than a DOM, and it is enough to prove
 * the three things the fallback can get wrong — the node is attached before it
 * is selected, the selection is restored, and the return value is the
 * command's, not `true`.
 */
function fakeDocument(options: { execResult?: boolean; execThrows?: boolean } = {}) {
  const calls: string[] = [];
  const active = { focus: vi.fn(), tag: "ACTIVE" };
  const area = {
    value: "",
    style: {} as Record<string, string>,
    setAttribute: vi.fn(),
    focus: vi.fn(() => calls.push("focus")),
    select: vi.fn(() => calls.push("select")),
    setSelectionRange: vi.fn(() => calls.push("range")),
    remove: vi.fn(() => calls.push("remove")),
  };
  const body = {
    appendChild: vi.fn(() => {
      calls.push("append");
      return area;
    }),
  };
  const doc = {
    activeElement: active as unknown as HTMLElement,
    body: body as unknown as HTMLElement,
    createElement: vi.fn(() => area),
    execCommand: vi.fn(() => {
      if (options.execThrows) throw new Error("not supported");
      calls.push("exec");
      return options.execResult ?? true;
    }),
  };
  return { doc, calls, area, body, active };
}

function setDocument(value: unknown) {
  Object.defineProperty(globalThis, "document", { value, configurable: true, writable: true });
}

afterEach(() => {
  if (original) Object.defineProperty(globalThis, "navigator", original);
  setDocument(undefined);
  vi.restoreAllMocks();
});

describe("copyText", () => {
  it("resolves true when the clipboard API accepts the write", async () => {
    const writeText = vi.fn(async () => {});
    setClipboard({ clipboard: { writeText } });
    await expect(copyText("hello")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("resolves false when the API is missing (insecure origin / old Safari)", async () => {
    setClipboard({});
    await expect(copyText("hello")).resolves.toBe(false);
  });

  it("resolves false when writeText rejects instead of throwing to the caller", async () => {
    setClipboard({
      clipboard: {
        writeText: vi.fn(async () => {
          throw new Error("NotAllowedError");
        }),
      },
    });
    await expect(copyText("hello")).resolves.toBe(false);
  });
});

describe("copyText falls back to execCommand", () => {
  it("uses the fallback when the clipboard API is absent", async () => {
    // The bug: this returned `false` and the button did nothing on `file://`.
    setClipboard({});
    const { doc } = fakeDocument();
    setDocument(doc);
    await expect(copyText("backup-string")).resolves.toBe(true);
    expect(doc.execCommand).toHaveBeenCalledWith("copy");
  });

  it("uses the fallback when the clipboard API rejects", async () => {
    setClipboard({
      clipboard: {
        writeText: vi.fn(async () => {
          throw new Error("NotAllowedError");
        }),
      },
    });
    const { doc } = fakeDocument();
    setDocument(doc);
    await expect(copyText("x")).resolves.toBe(true);
    expect(doc.execCommand).toHaveBeenCalled();
  });

  it("attaches the textarea before selecting it", async () => {
    /*
     * Order is the whole fallback. A detached node cannot be selected, and
     * `select()` on one is a silent no-op — so `execCommand` would return
     * `true` on some browsers and copy the *previous* selection.
     */
    setClipboard({});
    const { doc, calls } = fakeDocument();
    setDocument(doc);
    await copyText("payload");
    expect(calls.indexOf("append")).toBeLessThan(calls.indexOf("select"));
    expect(calls.indexOf("focus")).toBeLessThan(calls.indexOf("select"));
  });

  it("puts the text into the textarea", async () => {
    setClipboard({});
    const { doc, area } = fakeDocument();
    setDocument(doc);
    await copyText("backup-string");
    expect(area.value).toBe("backup-string");
  });

  it("removes the textarea and restores focus afterwards", async () => {
    setClipboard({});
    const { doc, area, active, calls } = fakeDocument();
    setDocument(doc);
    await copyText("x");
    expect(calls).toContain("remove");
    expect(active.focus).toHaveBeenCalled();
    expect(area.remove).toHaveBeenCalled();
  });

  it("reports the command's own result, not blanket success", async () => {
    // `execCommand` returns false when the browser refuses. Claiming true here
    // would be the original bug in a new place.
    setClipboard({});
    const { doc } = fakeDocument({ execResult: false });
    setDocument(doc);
    await expect(copyText("x")).resolves.toBe(false);
  });

  it("survives execCommand throwing", async () => {
    setClipboard({});
    const { doc } = fakeDocument({ execThrows: true });
    setDocument(doc);
    await expect(copyText("x")).resolves.toBe(false);
  });

  it("returns false when there is no document at all (SSR)", async () => {
    // `smoke-ssr.tsx` renders the whole tree in Node; a component that copies
    // on mount would reach this.
    setClipboard({});
    const { doc } = fakeDocument();
    setDocument(undefined);
    await expect(copyText("x")).resolves.toBe(false);
    void doc;
  });

  it("still cleans up when execCommand throws", async () => {
    // The `finally` block, which is what keeps a thrown command from leaving a
    // textarea in the document and focus on it.
    setClipboard({});
    const { doc, area } = fakeDocument({ execThrows: true });
    setDocument(doc);
    await copyText("x");
    expect(area.remove).toHaveBeenCalled();
  });
});
