import { StubAdapter } from "../stub-base";
import type { Platform } from "../types";

/**
 * Slack adapter (stub).
 *
 * Plan: use `@slack/web-api` + Socket Mode (`@slack/socket-mode`) so the
 * user can paste a bot or user token from https://api.slack.com/apps and
 * get channels/DMs without exposing a public webhook. The `connect`
 * implementation will open the socket and subscribe to `message.*`
 * events, mapping them onto our `Message` shape.
 *
 * Required config keys (planned): `botToken` (xoxb-…) or `userToken`
 * (xoxp-…) and `appToken` (xapp-…) for Socket Mode.
 */
export class SlackAdapter extends StubAdapter {
  readonly platform: Platform = "slack";
}

/** Factory used by `adapters/registry.ts`. */
export function createAdapter(): SlackAdapter {
  return new SlackAdapter();
}
