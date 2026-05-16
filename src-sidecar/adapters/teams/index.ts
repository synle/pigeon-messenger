import { StubAdapter } from "../stub-base";
import type { Platform } from "../types";

/**
 * Microsoft Teams adapter (stub).
 *
 * Plan: use Microsoft Graph (`@microsoft/microsoft-graph-client`) with
 * OAuth 2.0 (delegated permissions). We'll need to register an Azure AD
 * app and use the `Chat.ReadWrite` + `ChatMessage.Read` scopes. The
 * change-notifications API (webhooks) is required for near-real-time
 * delivery — long-poll the `/me/chats/{id}/messages` endpoint as a
 * fallback. Required config: `tenantId`, `clientId`, `accessToken`,
 * `refreshToken`.
 */
export class TeamsAdapter extends StubAdapter {
  readonly platform: Platform = "teams";
}

/** Factory used by `adapters/registry.ts`. */
export function createAdapter(): TeamsAdapter {
  return new TeamsAdapter();
}
