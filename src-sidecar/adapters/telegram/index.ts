import { StubAdapter } from "../stub-base";
import type { Platform } from "../types";

/**
 * Telegram adapter (stub).
 *
 * Plan: use the Bot API via `node-telegram-bot-api` (long-poll) or
 * `telegraf`. For *personal* Telegram accounts we'd need MTProto
 * (`gramjs`) — that's a Tier-2 follow-up because it needs phone-number
 * auth and is much more involved. Required config (bot mode): `botToken`.
 */
export class TelegramAdapter extends StubAdapter {
  readonly platform: Platform = "telegram";
}

/** Factory used by `adapters/registry.ts`. */
export function createAdapter(): TelegramAdapter {
  return new TelegramAdapter();
}
