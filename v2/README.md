# Home Assistant Assist Desktop v2

Modern, portable Home Assistant Assist application with web and desktop support.

## Architecture

- **Backend** (`packages/backend`) - Hono API server for storage, auth, and HA proxy
- **Web** (`packages/web`) - Lit-based web UI
- **Desktop** (`packages/desktop`) - Tauri wrapper with system integration
- **Shared Types** (`packages/shared-types`) - Common TypeScript types

## Development

```bash
# Install dependencies
bun install

# Run backend only
bun run backend

# Run web UI (dev mode)
bun run web

# Run desktop app
bun run desktop
```

## CLI Modes

Once built, the `ha-assist` CLI supports:

- `ha-assist backend` - Start backend server
- `ha-assist web` - Start backend + serve web UI
- `ha-assist desktop` - Start backend + launch desktop app
- `ha-assist dev` - Development mode

## Build

```bash
# Build all packages
bun run build

# Build specific package
bun run build:backend
bun run build:web
bun run build:desktop
```

## Features

- Voice input (STT) and output (TTS)
- Text input
- Streaming LLM responses
- Continue conversation
- Markdown rendering
- Pipeline selection
- Global keyboard shortcuts (desktop)
- System tray (desktop)
- Settings management
