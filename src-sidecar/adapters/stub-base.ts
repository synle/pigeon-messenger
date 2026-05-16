import { NotImplementedError } from "./not-implemented";
import type {
  Chat,
  ConnectionConfig,
  ConnectionStatus,
  Message,
  Platform,
  ProtocolAdapter,
} from "./types";

/**
 * Base class for placeholder adapters. Real adapters extend it and
 * override the methods they support. Every override should update
 * `this._status` so the manager can report accurate state.
 *
 * Today every adapter inherits the stub behavior — `connect` flips
 * status to "connected" without doing real work and the message
 * methods throw `NotImplementedError`. Replace per platform as we
 * wire them up.
 */
export abstract class StubAdapter implements ProtocolAdapter {
  /** Platform identifier — subclasses set this in their constructor. */
  public abstract readonly platform: Platform;

  /** Current lifecycle state; updated by `connect`/`disconnect`/errors. */
  protected _status: ConnectionStatus = "disconnected";

  /**
   * Stub: pretends to connect by flipping the status flag.
   * Override to perform a real handshake (Slack RTM, Discord gateway, …).
   */
  async connect(_config: ConnectionConfig): Promise<void> {
    this._status = "connected";
  }

  /** Stub: flips status to disconnected. Override to close sockets. */
  async disconnect(): Promise<void> {
    this._status = "disconnected";
  }

  /** Return the cached status — adapters mutate `_status` themselves. */
  status(): ConnectionStatus {
    return this._status;
  }

  /** Stub: not implemented. */
  async listChats(): Promise<Chat[]> {
    throw new NotImplementedError(this.platform, "listChats");
  }

  /** Stub: not implemented. */
  async listMessages(
    _chatId: string,
    _opts?: { limit?: number; before?: string },
  ): Promise<Message[]> {
    throw new NotImplementedError(this.platform, "listMessages");
  }

  /** Stub: not implemented. */
  async sendMessage(_chatId: string, _text: string): Promise<Message> {
    throw new NotImplementedError(this.platform, "sendMessage");
  }
}
