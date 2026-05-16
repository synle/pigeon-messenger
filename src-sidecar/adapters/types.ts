/**
 * Shared protocol-adapter contract.
 *
 * Every supported messaging platform implements `ProtocolAdapter`. The
 * sidecar's `ConnectionManager` owns a Map<connectionId, ProtocolAdapter>
 * and routes REST calls from the frontend to the right adapter. The UI
 * never imports adapter modules directly — it always goes through the
 * `/api/connections/*` HTTP API.
 */

/** Identifiers of every platform the app knows about. */
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

/** Lifecycle state of a connection from the UI's perspective. */
export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

/**
 * Free-form credential bag the user supplied when creating the connection.
 * Each adapter validates the shape it needs (e.g. Slack expects `botToken`,
 * Matrix expects `homeserver` + `accessToken`).
 */
export type ConnectionConfig = Record<string, string>;

/** Persistable description of a connection (no live socket state). */
export interface Connection {
  /** Stable identifier — `<platform>-<base36 rand>`. */
  id: string;
  /** Which platform this connection talks to. */
  platform: Platform;
  /** Human-friendly label the user picked (e.g. "Work Slack"). */
  displayName: string;
  /** Credentials/config — adapter-specific. */
  config: ConnectionConfig;
  /** Latest known status (refreshed in-memory by the adapter). */
  status: ConnectionStatus;
  /** ISO timestamp the connection was created. */
  createdAt: string;
}

/** A chat / room / channel / DM thread, normalized across platforms. */
export interface Chat {
  /** Adapter-local chat id (channel id, room id, DM id, …). */
  id: string;
  /** Display name (channel name, group name, contact name, …). */
  name: string;
  /** True for direct/private one-on-one threads. */
  isDirect: boolean;
  /** Count of unread messages, if known. */
  unread?: number;
  /** ISO timestamp of the last activity, if known. */
  lastActivityAt?: string;
}

/** A single message in a chat, normalized across platforms. */
export interface Message {
  /** Adapter-local message id. */
  id: string;
  /** Chat this message belongs to. */
  chatId: string;
  /** Sender's display name. */
  author: string;
  /** Plain-text message body. Rich content goes in `html` later. */
  text: string;
  /** ISO timestamp the message was sent. */
  sentAt: string;
  /** True if the current user sent this. */
  fromMe: boolean;
}

/**
 * The interface every platform adapter implements.
 *
 * Stubs throw `NotImplementedError` from `not-implemented.ts` so the REST
 * routes can surface a friendly 501 instead of crashing the sidecar.
 */
export interface ProtocolAdapter {
  /** Which platform this adapter speaks. */
  readonly platform: Platform;

  /**
   * Open a live session using the given credentials.
   * Implementations should set internal status to "connecting" then
   * "connected" or "error" so `status()` reflects reality.
   */
  connect(config: ConnectionConfig): Promise<void>;

  /** Tear down sockets, stop polling, release resources. */
  disconnect(): Promise<void>;

  /** Return the current live status. */
  status(): ConnectionStatus;

  /** List the chats/channels/DMs visible to the connected account. */
  listChats(): Promise<Chat[]>;

  /**
   * Fetch messages for a single chat. `before` is an adapter-defined
   * cursor (often an id or timestamp) used for pagination.
   */
  listMessages(
    chatId: string,
    opts?: { limit?: number; before?: string },
  ): Promise<Message[]>;

  /** Send `text` to `chatId` and return the persisted message. */
  sendMessage(chatId: string, text: string): Promise<Message>;
}

/** Factory signature exported by every adapter folder. */
export type AdapterFactory = () => ProtocolAdapter;
