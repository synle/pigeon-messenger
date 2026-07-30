# Pigeon Messenger

A **unified desktop chat client** — one window for every messaging platform you live in. Spiritual successor to [Pidgin](https://pidgin.im/) / Adium, rebuilt with a modern stack: **Tauri v2** + **Node.js/Express sidecar** + **React 19** (TypeScript) + **MUI v9** + **Vite 6** + **Vitest 4**.

> **Status:** very early scaffolding (0.1.0). The shell, the sidecar handshake, the connection registry, and stubbed protocol adapters are in place. Actual messaging is not wired up yet — see the [Roadmap](#roadmap).

## Goals

Connect to all the places conversations happen, behind one consistent UI:

| Tier | Platform           | Approach                                                                                                       | Status      |
| ---- | ------------------ | -------------------------------------------------------------------------------------------------------------- | ----------- |
| 1    | Slack              | Web API + Socket Mode (bot/user tokens)                                                                        | stub        |
| 1    | Discord            | Bot API (gateway WebSocket)                                                                                    | stub        |
| 1    | Telegram           | Bot API (long-poll or webhook)                                                                                 | stub        |
| 1    | Microsoft Teams    | Microsoft Graph API (OAuth)                                                                                    | stub        |
| 1    | Google Chat        | Chat API (service account or OAuth)                                                                            | stub        |
| 1    | Facebook Messenger | Send/Receive API — Page tokens only; personal DMs are unsupported by Meta                                      | stub        |
| 1    | WhatsApp           | WhatsApp Business Cloud API (Meta)                                                                             | stub        |
| 2    | Google Voice       | No public API — best-effort placeholder (Voice has no first-party API; would need scraping or carrier handoff) | placeholder |
| 2    | Matrix             | Client-Server API (homeserver-agnostic) — the spiritual heir to Pidgin's federated approach                    | stub        |

Other strong candidates worth adding next: **IRC** (the original Pidgin protocol — easy, well-defined), **Signal** (via `signal-cli`), **Mattermost / Zulip / Rocket.Chat** (open-source Slack-alikes with clean APIs), **iMessage** (macOS-only, AppleScript bridge), **SMS via Twilio**.

> **Reality check:** several of the above forbid third-party clients in their ToS for personal accounts (Facebook DMs, WhatsApp personal, Google Voice). Where no public API exists for personal use, the adapter starts as a placeholder and we'll surface that limitation in the UI rather than ship a TOS-violating scraper.

## Quick start

```bash
git clone git@github.com:synle/pigeon-messenger.git
cd pigeon-messenger
npm install
npx tauri dev          # full desktop app + sidecar in dev mode
```

The Rust shell spawns the Node sidecar in production builds; in `tauri dev` the sidecar runs as a separate `concurrently` process on port `3001` and Vite proxies `/api/*` to it.

### Useful scripts

```bash
npm run dev:web        # Vite frontend only (browser at http://localhost:1420)
npm run dev:sidecar    # Express sidecar only (port 3001), with hot rebuild
npm run build          # Production frontend build
npm run build:sidecar  # Bundle src-sidecar/server.ts -> src-tauri/resources/server.cjs
npm run build:tauri    # build + build:sidecar (used as Tauri beforeBuildCommand)
npm test               # Vitest run
npm run typecheck      # tsc --noEmit
npm run tauri:build    # Production desktop build (.dmg/.exe/.deb/.AppImage)
cd src-tauri && cargo test  # Rust tests
```

### Requirements

| Tool          | Version | Notes                                                                 |
| ------------- | ------- | --------------------------------------------------------------------- |
| Node.js       | 20+     | Use `fnm` / `nvm` to pin                                              |
| npm           | 10+     | Ships with Node                                                       |
| Rust          | stable  | `rustup default stable`                                               |
| Tauri prereqs | —       | See [tauri.app prerequisites](https://tauri.app/start/prerequisites/) |

Platform-specific extras:

- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Windows**: Microsoft C++ Build Tools, WebView2 (preinstalled on Win11)
- **Linux**: `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libxdo-dev libssl-dev`

> The packaged `.app` / `.exe` requires **Node.js to be installed system-wide** at runtime — GUI apps can't see version managers (fnm/nvm/volta), so install Node via `brew install node`, the official `.pkg`, or place a `node` binary in `/usr/local/bin`. The Rust shell probes common locations (see `find_system_node()` in `src-tauri/src/lib.rs`).

## Architecture

```
.
├── src/                          # React frontend
│   ├── components/
│   │   ├── NavBar.tsx
│   │   └── ConnectionsSidebar.tsx
│   ├── pages/
│   │   ├── HomePage.tsx          # Unified inbox (placeholder)
│   │   ├── ConnectionsPage.tsx   # Manage / add platform connections
│   │   └── SettingsPage.tsx
│   ├── lib/api.ts                # Sidecar HTTP client
│   └── types/                    # Shared types (Connection, Message, ...)
├── src-sidecar/
│   ├── server.ts                 # Express entry point
│   ├── connections/
│   │   ├── manager.ts            # In-memory ConnectionManager
│   │   ├── store.ts              # JSON-on-disk persistence
│   │   └── routes.ts             # REST routes /api/connections/*
│   └── adapters/                 # One subdir per platform
│       ├── types.ts              # ProtocolAdapter interface
│       ├── registry.ts           # Maps platform -> adapter factory
│       ├── slack/
│       ├── discord/
│       ├── telegram/
│       ├── teams/
│       ├── googlechat/
│       ├── facebook/
│       ├── whatsapp/
│       ├── googlevoice/
│       └── matrix/
├── src-tauri/                    # Tauri Rust shell
│   ├── src/lib.rs                # Spawns sidecar, exposes get_sidecar_port()
│   ├── resources/                # Bundled .cjs lives here in prod
│   └── tauri.conf.json
└── .github/workflows/            # build, release-official, release-beta
```

### How the sidecar wires up

1. **Build**: `vite.sidecar.config.ts` bundles `src-sidecar/server.ts` and all its npm deps into a single `src-tauri/resources/server.cjs`. `tauri.conf.json` ships everything in `resources/` with the app.
2. **Start**: In production builds, `lib.rs::spawn_sidecar()` calls `node resources/server.cjs` with `SIDECAR_PORT=0` and `stdin` piped. The sidecar binds a random port and prints `__SIDECAR_PORT__=<n>` to stdout; the Rust side parses it.
3. **Discover**: The frontend calls `invoke('get_sidecar_port')` to learn the port, then `fetch(\`http://127.0.0.1:${port}/api/...\`)`.
4. **Shutdown**: When Tauri exits, the stdin pipe closes; the sidecar sees EOF on `process.stdin` and calls `process.exit(0)`. Tauri also `child.kill()`s as a backup on `RunEvent::Exit`.

### Protocol adapter contract

Every platform implements the same interface in `src-sidecar/adapters/types.ts`:

```ts
interface ProtocolAdapter {
  readonly platform: Platform;
  connect(config: ConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  listChats(): Promise<Chat[]>;
  listMessages(chatId: string, opts?: { limit?: number; before?: string }): Promise<Message[]>;
  sendMessage(chatId: string, text: string): Promise<Message>;
  status(): ConnectionStatus;
}
```

A new platform → new folder under `src-sidecar/adapters/<name>/` exporting a `createAdapter()` factory, registered in `adapters/registry.ts`. The UI never imports adapter code directly; it always goes through `GET /api/connections` and friends.

## Roadmap

- [x] Scaffold Tauri shell + Node sidecar + React UI
- [x] Connection model, persistence (JSON-on-disk), REST API
- [x] Stub adapters for all Tier-1 platforms
- [ ] Wire Slack first end-to-end (list channels, list messages, send)
- [ ] Generic chat view + message composer
- [ ] Real-time updates (Server-Sent Events from sidecar → UI)
- [ ] Local message search (SQLite via better-sqlite3 in the sidecar)
- [ ] Per-platform OAuth flows (use Tauri's deep-link plugin)
- [ ] Notifications (Tauri notification plugin)
- [ ] Encrypted credential storage (Tauri stronghold / OS keychain)

## Versioning & release

The version lives in **`src-tauri/tauri.conf.json` → `version`**. `build.rs` exposes it as `APP_VERSION`. Dev builds append `[DEV]`; CI release builds set `TAURI_RELEASE=true`.

- **Build CI** (`.github/workflows/build.yml`) — runs on every push/PR to `master`. Tests + builds on macOS (ARM + Intel), Windows, Linux.
- **Official release** (`.github/workflows/release-official.yml`) — `v*` tag or `workflow_dispatch`.
- **Beta release** (`.github/workflows/release-beta.yml`) — manual `workflow_dispatch` only.

## License

MIT — add a `LICENSE` file when publishing publicly.
