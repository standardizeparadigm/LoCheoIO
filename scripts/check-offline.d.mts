/**
 * Types for `check-offline.mjs`.
 *
 * The module is plain ESM because its CLI consumer is `npm run check` (plain
 * Node); the test that runs the same scan inside `vitest` is TypeScript, so it
 * needs the shape stated. Kept beside the module so `tsc` resolves it
 * automatically — same convention as `scripts/lib/prose-counts.d.mts`.
 */

/** Reference kinds the scanner understands, in report order vocabulary. */
export const REF_KINDS: readonly string[];

/**
 * True for values that only make sense when a server resolves them:
 * origin-absolute (`/…`), protocol-relative (`//…`), and `http(s)://`.
 * `data:`, fragments, `about:`, `mailto:`, `javascript:` and relative names
 * are self-contained — always false.
 */
export declare function isExternalRef(value: string | undefined): boolean;

/** One offending reference, as the CLI reports it. */
export interface ExternalRef {
  kind: string;
  value: string;
}

/**
 * Pure scanner: data: URIs are stripped first (their payload may contain any
 * byte pattern), then every fetching construct — src/href/poster/srcset
 * attributes, CSS url() and @import, and modulepreload/preload/prefetch
 * links — is checked with {@link isExternalRef}.
 */
export declare function scanExternalRefs(html: string): ExternalRef[];
