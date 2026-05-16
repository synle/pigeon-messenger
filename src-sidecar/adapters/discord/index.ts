import { StubAdapter } from "../stub-base";
import type { Platform } from "../types";

/**
 * Discord adapter (stub).
 *
 * Plan: use `discord.js` against a bot token (user-token / "selfbot" use
 * is against Discord ToS and we won't support it). The gateway delivers
 * messages over a WebSocket; we'll map `MESSAGE_CREATE` events onto
 * `Message`. Required config: `botToken`.
 */
export class DiscordAdapter extends StubAdapter {
  readonly platform: Platform = "discord";
}

/** Factory used by `adapters/registry.ts`. */
export function createAdapter(): DiscordAdapter {
  return new DiscordAdapter();
}
