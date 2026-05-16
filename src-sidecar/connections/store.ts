import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Connection } from "../adapters/types";

/**
 * Resolve the on-disk path for the connections JSON.
 *
 * Honors `PIGEON_CONFIG_DIR` (set by the Tauri shell once it learns the
 * OS app-data path). Falls back to `~/.pigeon-messenger/` so dev runs
 * also persist between restarts.
 */
function resolveConfigDir(): string {
  const fromEnv = process.env.PIGEON_CONFIG_DIR;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return path.join(os.homedir(), ".pigeon-messenger");
}

/** Full path to the connections JSON file on disk. */
export function connectionsFilePath(): string {
  return path.join(resolveConfigDir(), "connections.json");
}

/**
 * Read all persisted connections.
 *
 * Returns `[]` if the file doesn't exist yet — first-run is not an error.
 * Throws on JSON parse failures so the caller can surface a clear message
 * rather than silently dropping all the user's saved connections.
 */
export async function readConnections(): Promise<Connection[]> {
  const file = connectionsFilePath();
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Corrupt connections store at ${file}: expected array`);
  }
  return parsed as Connection[];
}

/**
 * Persist the full connections list. We always write the whole array
 * (small, infrequent) so partial updates can't corrupt the file.
 *
 * Creates the parent directory on first write.
 */
export async function writeConnections(connections: Connection[]): Promise<void> {
  const file = connectionsFilePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(connections, null, 2), "utf-8");
  await fs.rename(tmp, file);
}
