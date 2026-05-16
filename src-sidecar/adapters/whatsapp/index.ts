import { StubAdapter } from "../stub-base";
import type { Platform } from "../types";

/**
 * WhatsApp adapter (stub).
 *
 * Plan: the official WhatsApp Business Cloud API (Meta). Like Facebook
 * Messenger, this targets businesses, not personal accounts — personal
 * WhatsApp is locked behind the official mobile/desktop clients and
 * Meta actively bans third-party clients. The community library
 * `whatsapp-web.js` exists but is unofficial and risks an account ban.
 * Required config (Business Cloud): `phoneNumberId`, `accessToken`,
 * `verifyToken`.
 */
export class WhatsAppAdapter extends StubAdapter {
  readonly platform: Platform = "whatsapp";
}

/** Factory used by `adapters/registry.ts`. */
export function createAdapter(): WhatsAppAdapter {
  return new WhatsAppAdapter();
}
