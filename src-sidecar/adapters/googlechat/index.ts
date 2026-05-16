import { StubAdapter } from "../stub-base";
import type { Platform } from "../types";

/**
 * Google Chat adapter (stub).
 *
 * Plan: use the Google Chat REST API (`googleapis` npm package) with a
 * service account or OAuth 2.0. Personal Google Chat (consumer) is
 * limited — the API is designed for Workspace. We'll prioritize the
 * Workspace flow first. Required config: `clientId`, `clientSecret`,
 * `refreshToken` (OAuth) or `serviceAccountJson` (server-to-server).
 */
export class GoogleChatAdapter extends StubAdapter {
  readonly platform: Platform = "googlechat";
}

/** Factory used by `adapters/registry.ts`. */
export function createAdapter(): GoogleChatAdapter {
  return new GoogleChatAdapter();
}
