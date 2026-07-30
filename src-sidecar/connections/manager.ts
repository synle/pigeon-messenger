import { randomBytes } from "node:crypto";
import { createAdapterFor } from "../adapters/registry";
import type { Connection, ConnectionConfig, Platform, ProtocolAdapter } from "../adapters/types";
import { readConnections, writeConnections } from "./store";

/**
 * Owns the live `Map<connectionId, ProtocolAdapter>` plus the persisted
 * `Connection[]` metadata. Responsible for:
 *
 *  - loading saved connections from disk at startup
 *  - creating/deleting connections (persists on every mutation)
 *  - flipping a connection on/off (opens the adapter, updates status)
 *
 * The REST layer in `routes.ts` is a thin shell around these methods.
 */
export class ConnectionManager {
  private connections: Connection[] = [];
  private liveAdapters = new Map<string, ProtocolAdapter>();

  /** Read all persisted connections from disk into memory. */
  async load(): Promise<void> {
    this.connections = await readConnections();
  }

  /** Return a defensive copy with fresh `status` from any live adapters. */
  list(): Connection[] {
    return this.connections.map((c) => ({
      ...c,
      status: this.liveAdapters.get(c.id)?.status() ?? c.status,
    }));
  }

  /** Look up a single connection by id, or `undefined` if missing. */
  get(id: string): Connection | undefined {
    return this.list().find((c) => c.id === id);
  }

  /**
   * Create a new connection record (does NOT auto-connect — the caller
   * decides when to call `start`). Persists the new list to disk.
   */
  async create(
    platform: Platform,
    displayName: string,
    config: ConnectionConfig,
  ): Promise<Connection> {
    const conn: Connection = {
      id: `${platform}-${randomBytes(5).toString("hex")}`,
      platform,
      displayName,
      config,
      status: "disconnected",
      createdAt: new Date().toISOString(),
    };
    this.connections.push(conn);
    await writeConnections(this.connections);
    return conn;
  }

  /**
   * Remove a connection. Tears down the live adapter first so we don't
   * leak sockets, then drops the persisted record.
   */
  async remove(id: string): Promise<boolean> {
    const live = this.liveAdapters.get(id);
    if (live) {
      await live.disconnect().catch(() => {});
      this.liveAdapters.delete(id);
    }
    const before = this.connections.length;
    this.connections = this.connections.filter((c) => c.id !== id);
    if (this.connections.length === before) return false;
    await writeConnections(this.connections);
    return true;
  }

  /**
   * Open the adapter for a connection. Idempotent — calling twice
   * returns the same live adapter. Surfaces underlying connect errors
   * to the caller.
   */
  async start(id: string): Promise<ProtocolAdapter> {
    const existing = this.liveAdapters.get(id);
    if (existing) return existing;
    const record = this.connections.find((c) => c.id === id);
    if (!record) throw new Error(`Unknown connection: ${id}`);
    const adapter = createAdapterFor(record.platform);
    await adapter.connect(record.config);
    this.liveAdapters.set(id, adapter);
    return adapter;
  }

  /** Close the live adapter for a connection (no-op if not running). */
  async stop(id: string): Promise<void> {
    const live = this.liveAdapters.get(id);
    if (!live) return;
    await live.disconnect();
    this.liveAdapters.delete(id);
  }

  /**
   * Return the live adapter for `id`, starting it first if it isn't
   * running. Used by routes that need to talk to the adapter on demand.
   */
  async require(id: string): Promise<ProtocolAdapter> {
    return this.liveAdapters.get(id) ?? this.start(id);
  }

  /**
   * Tear down every live adapter — called on sidecar shutdown so we
   * don't leak open sockets if Tauri SIGTERMs us.
   */
  async shutdown(): Promise<void> {
    const all = Array.from(this.liveAdapters.values());
    this.liveAdapters.clear();
    await Promise.all(all.map((a) => a.disconnect().catch(() => {})));
  }
}
