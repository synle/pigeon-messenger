import { StubAdapter } from "../stub-base";
import type { Platform } from "../types";

/**
 * Facebook Messenger adapter (stub).
 *
 * Reality check: Meta only exposes the Send/Receive API for **Pages**
 * messaging users. There is no first-party API for reading or sending
 * personal Messenger DMs, and unofficial scrapers violate Meta's ToS
 * and break on every UI change. We'll surface that limitation in the
 * UI rather than ship a brittle scraper. Required config (page mode):
 * `pageAccessToken`.
 */
export class FacebookAdapter extends StubAdapter {
  readonly platform: Platform = "facebook";
}

/** Factory used by `adapters/registry.ts`. */
export function createAdapter(): FacebookAdapter {
  return new FacebookAdapter();
}
