import { StubAdapter } from "../stub-base";
import type { Platform } from "../types";

/**
 * Matrix adapter (stub).
 *
 * Plan: `matrix-js-sdk` with the Client-Server API against any
 * homeserver (`matrix.org` by default). Matrix is the spiritual heir to
 * Pidgin's federated approach — fully open, decentralized, and works
 * great as a target for a "one client, many protocols" app. Required
 * config: `homeserver` (e.g. `https://matrix.org`), `accessToken`,
 * `userId`.
 */
export class MatrixAdapter extends StubAdapter {
  readonly platform: Platform = "matrix";
}

/** Factory used by `adapters/registry.ts`. */
export function createAdapter(): MatrixAdapter {
  return new MatrixAdapter();
}
