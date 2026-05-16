import { Router, type Request, type Response } from "express";
import { NotImplementedError } from "../adapters/not-implemented";
import { PLATFORM_CATALOG } from "../adapters/registry";
import type { Platform } from "../adapters/types";
import { ConnectionManager } from "./manager";

/**
 * Build the `/api/connections` Express router on top of a shared
 * `ConnectionManager`. Routes are deliberately thin — all business
 * logic lives in the manager / adapters.
 */
export function buildConnectionsRouter(manager: ConnectionManager): Router {
  const router = Router();

  /** GET /api/connections — list every persisted connection. */
  router.get("/", (_req: Request, res: Response) => {
    res.json(manager.list());
  });

  /** GET /api/connections/platforms — catalog of supported platforms (for the Add form). */
  router.get("/platforms", (_req: Request, res: Response) => {
    res.json(PLATFORM_CATALOG);
  });

  /**
   * POST /api/connections — create a connection.
   * Body: { platform: Platform, displayName: string, config: Record<string,string> }
   */
  router.post("/", async (req: Request, res: Response) => {
    const body = req.body as {
      platform?: Platform;
      displayName?: string;
      config?: Record<string, string>;
    };
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "Body must be a JSON object" });
      return;
    }
    if (!body.platform || !PLATFORM_CATALOG.some((p) => p.platform === body.platform)) {
      res.status(400).json({ error: `Unknown platform: ${body.platform}` });
      return;
    }
    if (!body.displayName || typeof body.displayName !== "string") {
      res.status(400).json({ error: "displayName is required" });
      return;
    }
    const conn = await manager.create(
      body.platform,
      body.displayName,
      body.config ?? {},
    );
    res.status(201).json(conn);
  });

  /** DELETE /api/connections/:id — remove a connection. */
  router.delete("/:id", async (req: Request, res: Response) => {
    const ok = await manager.remove(req.params.id);
    if (!ok) {
      res.status(404).json({ error: "Connection not found" });
      return;
    }
    res.status(204).end();
  });

  /** POST /api/connections/:id/start — open the adapter (idempotent). */
  router.post("/:id/start", async (req: Request, res: Response) => {
    try {
      const adapter = await manager.start(req.params.id);
      res.json({ id: req.params.id, status: adapter.status() });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  /** POST /api/connections/:id/stop — close the adapter. */
  router.post("/:id/stop", async (req: Request, res: Response) => {
    await manager.stop(req.params.id);
    res.json({ id: req.params.id, status: "disconnected" });
  });

  /** GET /api/connections/:id/chats — list chats from the live adapter. */
  router.get("/:id/chats", async (req: Request, res: Response) => {
    try {
      const adapter = await manager.require(req.params.id);
      res.json(await adapter.listChats());
    } catch (err) {
      respondAdapterError(res, err);
    }
  });

  /** GET /api/connections/:id/chats/:chatId/messages — list messages in a chat. */
  router.get("/:id/chats/:chatId/messages", async (req: Request, res: Response) => {
    try {
      const adapter = await manager.require(req.params.id);
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const before = typeof req.query.before === "string" ? req.query.before : undefined;
      res.json(await adapter.listMessages(req.params.chatId, { limit, before }));
    } catch (err) {
      respondAdapterError(res, err);
    }
  });

  /**
   * POST /api/connections/:id/chats/:chatId/messages — send a message.
   * Body: { text: string }
   */
  router.post("/:id/chats/:chatId/messages", async (req: Request, res: Response) => {
    const text = req.body?.text;
    if (typeof text !== "string" || text.length === 0) {
      res.status(400).json({ error: "text is required" });
      return;
    }
    try {
      const adapter = await manager.require(req.params.id);
      res.status(201).json(await adapter.sendMessage(req.params.chatId, text));
    } catch (err) {
      respondAdapterError(res, err);
    }
  });

  return router;
}

/**
 * Translate adapter errors into HTTP responses. Stubs throw
 * `NotImplementedError` → 501, missing connections → 404, everything
 * else → 500 with the original message.
 */
function respondAdapterError(res: Response, err: unknown): void {
  if (err instanceof NotImplementedError) {
    res.status(501).json({ error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : String(err);
  if (message.startsWith("Unknown connection")) {
    res.status(404).json({ error: message });
    return;
  }
  res.status(500).json({ error: message });
}
