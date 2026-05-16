import { StubAdapter } from "../stub-base";
import type { Platform } from "../types";

/**
 * Google Voice adapter (placeholder).
 *
 * **There is no public Google Voice API.** Google deprecated the XMPP
 * gateway in 2014 and never replaced it. Options going forward:
 *
 *  1. Scrape https://voice.google.com (fragile, violates ToS).
 *  2. Use a third-party SMS provider (Twilio, Bandwidth) and let the
 *     user forward their Voice number to it — a real product solution
 *     rather than a Voice integration.
 *  3. Wait for / lobby for a Google Voice API.
 *
 * We carry the placeholder so the UI can render "unsupported" instead
 * of pretending it works. No config keys.
 */
export class GoogleVoiceAdapter extends StubAdapter {
  readonly platform: Platform = "googlevoice";
}

/** Factory used by `adapters/registry.ts`. */
export function createAdapter(): GoogleVoiceAdapter {
  return new GoogleVoiceAdapter();
}
