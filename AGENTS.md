# AGENTS

Guidance for Claude Code when working in this repository.

## Project Overview

**Pigeon Messenger** is a unified desktop chat client in the spirit of Pidgin/Adium — one window connected to many messaging platforms (Slack, Discord, Telegram, Microsoft Teams, Google Chat, Facebook Messenger, WhatsApp, Google Voice, Matrix, …). Built with **Tauri v2** + **Node.js/Express sidecar** + **React 19** (TypeScript) + **MUI v9** + **Vite 6**.

## Build commands

```bash
npm install                # JS dependencies
npx tauri dev              # Full app + sidecar in dev mode
npm run dev:web            # Vite frontend only (browser mode)
npm run dev:sidecar        # Express sidecar only (port 3001), with hot rebuild
npm run build              # Production frontend build
npm run build:sidecar      # Bundle src-sidecar/server.ts -> src-tauri/resources/server.cjs
npm run build:tauri        # build + build:sidecar (Tauri's beforeBuildCommand)
npx tauri build            # Production desktop build
npm test                   # Vitest (run once)
cd src-tauri && cargo test # Rust tests
```

## Architecture

Three layers:

- **`src/` (React + TS)** — UI built with MUI v9. Routes via React Router (`HashRouter`). Talks to the sidecar over `fetch()`. The frontend resolves the sidecar URL by calling `invoke('get_sidecar_port')`. In dev mode the call returns `0` and the frontend uses relative URLs so the Vite proxy forwards `/api/*` to port `3001`.
- **`src-sidecar/server.ts` (Node + Express)** — listens on a dynamic port (`SIDECAR_PORT=0`). Prints `__SIDECAR_PORT__=<n>` on stdout for the Rust shell to parse. Reads stdin so it can detect parent (Tauri) death and exit cleanly.
- **`src-tauri/` (Rust)** — Tauri v2 shell. In production builds, `lib.rs::spawn_sidecar()` runs `node resources/server.cjs`, parses the port from stdout, and exposes it to the frontend via the `get_sidecar_port` Tauri command. On exit, drops the sidecar's stdin and `child.kill()`s as a backup.

### Messenger domain layout

- `src-sidecar/adapters/types.ts` — `ProtocolAdapter` interface every platform implements.
- `src-sidecar/adapters/registry.ts` — maps `Platform` → factory.
- `src-sidecar/adapters/<platform>/` — one subdirectory per platform (slack, discord, telegram, teams, googlechat, facebook, whatsapp, googlevoice, matrix). Stubs today; fill in `connect/listChats/listMessages/sendMessage` per platform.
- `src-sidecar/connections/manager.ts` — owns the live in-memory `Map<id, ProtocolAdapter>`.
- `src-sidecar/connections/store.ts` — JSON-on-disk persistence (path comes from `app.getPath('appData')` once Tauri wires that to the sidecar; until then, `<cwd>/pigeon-connections.json`).
- `src-sidecar/connections/routes.ts` — REST endpoints under `/api/connections`.

The frontend NEVER imports anything from `src-sidecar/`. It talks to the sidecar over HTTP only.

### Production sidecar lifecycle

1. **Build**: `vite.sidecar.config.ts` runs in SSR mode with `noExternal: true` and produces a single `src-tauri/resources/server.cjs` (all npm deps inlined; only Node built-ins external).
2. **Spawn**: `find_system_node()` probes fnm/nvm/volta/mise/n/asdf/nodenv/Homebrew paths since GUI apps don't inherit shell PATH on macOS/Linux. Falls back to plain `node`.
3. **Port handshake**: Sidecar reports `__SIDECAR_PORT__=<n>` on stdout; Rust parses with a 15 s timeout.
4. **Shutdown**: stdin EOF triggers `process.exit(0)` in the sidecar; Rust force-kills after 3 s if the child hasn't exited.

### Dev mode

`tauri dev` runs `npm run dev` (Vite + sidecar via `concurrently`) and the Rust shell skips spawning the sidecar (`#[cfg(debug_assertions)]`). The sidecar listens on `3001`; Vite proxies `/api/*` to it. `get_sidecar_port` returns `0` to signal "use relative URLs".

## Versioning

The single source of truth is **`src-tauri/tauri.conf.json` → `version`**. `build.rs` exposes it as `APP_VERSION`. Dev builds append `[DEV]`; CI release builds set `TAURI_RELEASE=true` for clean version strings.

## Conventions

- All API responses use `camelCase` JSON.
- Tauri commands are `snake_case` in Rust; the frontend calls them with `snake_case` strings.
- Frontend never imports anything from `src-sidecar/` — that code only runs in Node.
- Always add tests for new code: components get `*.test.tsx` (Vitest + Testing Library), sidecar modules get `*.test.ts`, Rust modules get `#[cfg(test)] mod tests`.
- New platform = new folder under `src-sidecar/adapters/<name>/` exporting `createAdapter()`, registered in `adapters/registry.ts`. The UI should never grow a platform `switch` — keep platform logic on the sidecar side of the wire.

## CI / Release Workflows

- **`build.yml`** — runs on every push/PR to `master`, runs `npm test` and `cargo test` then builds the Tauri bundle on macOS (ARM + Intel), Windows, Linux.
- **`release-official.yml`** — `v*` tag pushes or manual `workflow_dispatch`. Uses `synle/workflows/actions/release/{begin,end}-release` for the unified flow.
- **`release-beta.yml`** — manual `workflow_dispatch` only. Builds a draft prerelease.

## Git / PR Merge Policy

- **For now, push directly to `master`.** No feature branches, no PRs. This is a deliberate temporary override while the project bootstraps.
- When the merge policy flips back to PRs, switch to **squash and merge** and re-enable the babysit loop.

## GitHub Raw File URLs

Always use the `?raw=1` blob URL format: `https://github.com/{owner}/{repo}/blob/head/{path}?raw=1`.

Do NOT use `api.github.com/repos/.../contents/` or `raw.githubusercontent.com`.
