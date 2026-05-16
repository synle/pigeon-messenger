import { invoke } from "@tauri-apps/api/core";
import type { Connection, Platform, PlatformInfo } from "../types/messaging";

/**
 * Resolve the base URL of the sidecar.
 *
 * In a Tauri prod build the Rust shell knows the real port and exposes
 * it via the `get_sidecar_port` command. In dev mode (or the browser /
 * vitest), `invoke` either fails or returns `0` — fall through to an
 * empty string so the Vite proxy forwards `/api/*` to port 3001.
 */
async function getApiBase(): Promise<string> {
  try {
    const port = await invoke<number>("get_sidecar_port");
    if (port && port > 0) return `http://127.0.0.1:${port}`;
  } catch {
    // Not running under Tauri — fall through to relative URLs.
  }
  return "";
}

/**
 * Thin `fetch` wrapper that resolves the sidecar base URL and throws
 * on non-2xx responses with the server-supplied error message when
 * available.
 */
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const base = await getApiBase();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // ignore — keep the status-line message
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** GET /api/connections */
export function listConnections(): Promise<Connection[]> {
  return api<Connection[]>("/api/connections");
}

/** GET /api/connections/platforms */
export function listPlatforms(): Promise<PlatformInfo[]> {
  return api<PlatformInfo[]>("/api/connections/platforms");
}

/** POST /api/connections */
export function createConnection(args: {
  platform: Platform;
  displayName: string;
  config: Record<string, string>;
}): Promise<Connection> {
  return api<Connection>("/api/connections", {
    method: "POST",
    body: JSON.stringify(args),
  });
}

/** DELETE /api/connections/:id */
export function deleteConnection(id: string): Promise<void> {
  return api<void>(`/api/connections/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/** POST /api/connections/:id/start */
export function startConnection(id: string): Promise<{ id: string; status: string }> {
  return api(`/api/connections/${encodeURIComponent(id)}/start`, { method: "POST" });
}

/** POST /api/connections/:id/stop */
export function stopConnection(id: string): Promise<{ id: string; status: string }> {
  return api(`/api/connections/${encodeURIComponent(id)}/stop`, { method: "POST" });
}
