import express, { type Request, type Response } from "express";
import cors from "cors";
import { createServer } from "node:http";
import { ConnectionManager } from "./connections/manager";
import { buildConnectionsRouter } from "./connections/routes";

/**
 * Pigeon Messenger sidecar entry point.
 *
 * Express server that owns the `ConnectionManager` and exposes every
 * messaging operation over `/api/*`. Listens on a dynamic port when
 * the Tauri shell passes `SIDECAR_PORT=0`, then prints
 * `__SIDECAR_PORT__=<n>` to stdout so Rust can parse the real port.
 * Reads stdin so it can detect when the parent (Tauri) exits and
 * shut itself down cleanly.
 */
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

const manager = new ConnectionManager();

/** Health check used by the frontend on startup to confirm the sidecar is alive. */
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, ts: Date.now() });
});

/**
 * Sample command kept for parity with the template — also doubles as a
 * smoke test for the dev/prod connection between the React UI and the
 * sidecar.
 */
app.get("/api/greet", (req: Request, res: Response) => {
  const name = String(req.query.name ?? "world");
  res.json({ message: `Hello, ${name}! (from Pigeon sidecar)` });
});

app.use("/api/connections", buildConnectionsRouter(manager));

const requestedPort = Number(process.env.SIDECAR_PORT ?? 3001);
const server = createServer(app);

manager
  .load()
  .catch((err) => {
    // Don't crash on a corrupt store — log and start with an empty list.
    // eslint-disable-next-line no-console
    console.error("sidecar: failed to load saved connections:", err);
  })
  .finally(() => {
    server.listen(requestedPort, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : requestedPort;
      // The Tauri shell parses this exact line to learn the port.
      console.log(`__SIDECAR_PORT__=${port}`);
    });
  });

/** Best-effort shutdown — close adapters then exit. */
async function shutdown(reason: string): Promise<never> {
  // eslint-disable-next-line no-console
  console.log(`sidecar: shutting down (${reason})`);
  await manager.shutdown().catch(() => {});
  process.exit(0);
}

// Parent-death detection: when Tauri exits, our stdin pipe closes -> EOF -> exit.
process.stdin.resume();
process.stdin.on("end", () => {
  shutdown("parent stdin closed");
});
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
