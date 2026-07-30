import { createAdapter as createSlack } from "./slack";
import { createAdapter as createDiscord } from "./discord";
import { createAdapter as createTelegram } from "./telegram";
import { createAdapter as createTeams } from "./teams";
import { createAdapter as createGoogleChat } from "./googlechat";
import { createAdapter as createFacebook } from "./facebook";
import { createAdapter as createWhatsApp } from "./whatsapp";
import { createAdapter as createGoogleVoice } from "./googlevoice";
import { createAdapter as createMatrix } from "./matrix";
import type { AdapterFactory, Platform } from "./types";

/**
 * Static map from `Platform` -> adapter factory. To add a new platform:
 *  1. Create `src-sidecar/adapters/<name>/index.ts` exporting
 *     `createAdapter(): ProtocolAdapter`.
 *  2. Add `<name>` to the `Platform` union in `types.ts`.
 *  3. Add an entry here.
 *  4. Add a row to `PLATFORM_CATALOG` so the UI can show it.
 */
const FACTORIES: Record<Platform, AdapterFactory> = {
  slack: createSlack,
  discord: createDiscord,
  telegram: createTelegram,
  teams: createTeams,
  googlechat: createGoogleChat,
  facebook: createFacebook,
  whatsapp: createWhatsApp,
  googlevoice: createGoogleVoice,
  matrix: createMatrix,
};

/**
 * Build a fresh adapter for the given platform. Throws if `platform`
 * is not a known key — the route layer maps that to HTTP 400.
 */
export function createAdapterFor(platform: Platform) {
  const factory = FACTORIES[platform];
  if (!factory) throw new Error(`Unknown platform: ${platform}`);
  return factory();
}

/** Display metadata for each platform — surfaced in the UI's Add Connection page. */
export interface PlatformInfo {
  platform: Platform;
  /** Human-readable name shown to the user. */
  displayName: string;
  /** One-line summary of how the integration works. */
  description: string;
  /** Config keys the user needs to provide. */
  requiredConfig: { key: string; label: string; secret?: boolean }[];
  /** Tier-2 / unsupported / fragile flag — UI can dim or warn. */
  status: "stub" | "placeholder" | "ready";
}

export const PLATFORM_CATALOG: PlatformInfo[] = [
  {
    platform: "slack",
    displayName: "Slack",
    description: "Slack Web API + Socket Mode. Paste a bot token and app token.",
    requiredConfig: [
      { key: "botToken", label: "Bot token (xoxb-…)", secret: true },
      { key: "appToken", label: "App token (xapp-…)", secret: true },
    ],
    status: "stub",
  },
  {
    platform: "discord",
    displayName: "Discord",
    description: "Discord bot token only (self-bots violate Discord ToS).",
    requiredConfig: [{ key: "botToken", label: "Bot token", secret: true }],
    status: "stub",
  },
  {
    platform: "telegram",
    displayName: "Telegram",
    description: "Telegram Bot API. Create a bot via @BotFather and paste the token.",
    requiredConfig: [{ key: "botToken", label: "Bot token", secret: true }],
    status: "stub",
  },
  {
    platform: "teams",
    displayName: "Microsoft Teams",
    description: "Microsoft Graph API (delegated OAuth). Requires an Azure AD app registration.",
    requiredConfig: [
      { key: "tenantId", label: "Tenant ID" },
      { key: "clientId", label: "Client ID" },
      { key: "accessToken", label: "Access token", secret: true },
      { key: "refreshToken", label: "Refresh token", secret: true },
    ],
    status: "stub",
  },
  {
    platform: "googlechat",
    displayName: "Google Chat",
    description: "Google Workspace only. Service account or OAuth client.",
    requiredConfig: [{ key: "serviceAccountJson", label: "Service account JSON", secret: true }],
    status: "stub",
  },
  {
    platform: "facebook",
    displayName: "Facebook Messenger",
    description: "Pages messaging only — Meta does not expose personal DMs.",
    requiredConfig: [{ key: "pageAccessToken", label: "Page access token", secret: true }],
    status: "stub",
  },
  {
    platform: "whatsapp",
    displayName: "WhatsApp Business",
    description: "WhatsApp Business Cloud API (Meta). Personal accounts are not supported.",
    requiredConfig: [
      { key: "phoneNumberId", label: "Phone number ID" },
      { key: "accessToken", label: "Access token", secret: true },
    ],
    status: "stub",
  },
  {
    platform: "googlevoice",
    displayName: "Google Voice",
    description: "No public API. Placeholder — likely needs a Twilio bridge to ever ship.",
    requiredConfig: [],
    status: "placeholder",
  },
  {
    platform: "matrix",
    displayName: "Matrix",
    description: "Open, federated chat (matrix.org and any homeserver).",
    requiredConfig: [
      { key: "homeserver", label: "Homeserver (e.g. https://matrix.org)" },
      { key: "userId", label: "User ID (e.g. @you:matrix.org)" },
      { key: "accessToken", label: "Access token", secret: true },
    ],
    status: "stub",
  },
];
