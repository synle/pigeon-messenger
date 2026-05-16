import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { ConnectionManager } from "./manager";

/**
 * Tests for `ConnectionManager`. Each case uses a throwaway `PIGEON_CONFIG_DIR`
 * so we never touch the user's real `~/.pigeon-messenger/connections.json`.
 *
 * Coverage focus: create + persist + read-back, idempotent `start`, and
 * `remove` actually unhooks the live adapter. Adapter behavior itself is
 * tested in the per-platform suites (when we add them).
 */
describe("ConnectionManager", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "pigeon-test-"));
    process.env.PIGEON_CONFIG_DIR = dir;
  });

  afterEach(() => {
    delete process.env.PIGEON_CONFIG_DIR;
    rmSync(dir, { recursive: true, force: true });
  });

  it("starts empty when no connections.json exists", async () => {
    const mgr = new ConnectionManager();
    await mgr.load();
    expect(mgr.list()).toEqual([]);
  });

  it("creates, persists, and reloads connections", async () => {
    const mgr = new ConnectionManager();
    await mgr.load();
    const created = await mgr.create("slack", "Work Slack", { botToken: "xoxb-test" });
    expect(created.platform).toBe("slack");
    expect(created.displayName).toBe("Work Slack");
    expect(created.id.startsWith("slack-")).toBe(true);

    // Fresh manager reads the same file back.
    const reloaded = new ConnectionManager();
    await reloaded.load();
    const all = reloaded.list();
    expect(all.length).toBe(1);
    expect(all[0].displayName).toBe("Work Slack");
  });

  it("start() flips status to connected and is idempotent", async () => {
    const mgr = new ConnectionManager();
    await mgr.load();
    const conn = await mgr.create("slack", "Slack", {});
    const a1 = await mgr.start(conn.id);
    const a2 = await mgr.start(conn.id);
    expect(a1).toBe(a2); // same live adapter both times
    expect(mgr.get(conn.id)?.status).toBe("connected");
  });

  it("remove() tears down the live adapter and drops the record", async () => {
    const mgr = new ConnectionManager();
    await mgr.load();
    const conn = await mgr.create("slack", "Slack", {});
    await mgr.start(conn.id);
    const removed = await mgr.remove(conn.id);
    expect(removed).toBe(true);
    expect(mgr.get(conn.id)).toBeUndefined();
  });

  it("remove() returns false for an unknown id", async () => {
    const mgr = new ConnectionManager();
    await mgr.load();
    expect(await mgr.remove("does-not-exist")).toBe(false);
  });
});
