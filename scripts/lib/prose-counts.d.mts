/**
 * Types for `prose-counts.mjs`.
 *
 * The module is plain ESM because two consumers are plain Node scripts; the
 * test that runs the same rules inside `vitest` is TypeScript, so it needs the
 * shape stated. Kept beside the module so `tsc` resolves it automatically.
 */
export interface ProseCounts {
  tests: number;
  files: number;
  svgs: number;
  keys: number;
}
export interface ProseRule {
  re: RegExp;
  to: (match: string, ...groups: string[]) => string;
  current?: boolean;
}
export declare function makeRules(counts: ProseCounts): ProseRule[];
export declare function applyRules(body: string, counts: ProseCounts): string;
export declare function rewrite(body: string, counts: ProseCounts): { body: string; changed: boolean };
export declare function staleCounts(body: string, counts: ProseCounts): string[];
export declare const EXTRA_TARGETS: string[];
export declare const HISTORICAL: RegExp;
export declare const PAST: RegExp;
export declare const TREE: RegExp;
export declare const QUOTED: RegExp;
