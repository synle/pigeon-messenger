/**
 * Frontend-facing copies of the sidecar's domain types. Kept hand-in-sync
 * with `src-sidecar/adapters/types.ts` — the frontend never imports
 * sidecar code directly because that code only runs in Node.
 *
 * If you change either copy, change the other in the same commit.
 */

export type Platform =
  | "slack"
  | "discord"
  | "telegram"
  | "teams"
  | "googlechat"
  | "facebook"
  | "whatsapp"
  | "googlevoice"
  | "matrix";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

/** Persistable description of a connection. */
export interface Connection {
  id: string;
  platform: Platform;
  displayName: string;
  config: Record<string, string>;
  status: ConnectionStatus;
  createdAt: string;
}

/** Metadata about a platform — used by the Add Connection form. */
export interface PlatformInfo {
  platform: Platform;
  displayName: string;
  description: string;
  requiredConfig: { key: string; label: string; secret?: boolean }[];
  status: "stub" | "placeholder" | "ready";
}
