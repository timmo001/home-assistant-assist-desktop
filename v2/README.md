# Home Assistant Assist Desktop v2

Modern, portable Home Assistant Assist application with web and desktop support.

## 🚀 Quick Start

### Test Phase 2 (Backend + Web UI)

**Ready to test!** Follow the [Quick Test Guide](QUICK-TEST.md) or run:

```bash
# 1. Start backend and run automated tests
./test-phase2.sh

# 2. Start web UI (in new terminal)
cd packages/web && bun run dev

# 3. Open browser with password from step 1
http://localhost:5173/?password=YOUR_PASSWORD_HERE
```

See [TESTING-GUIDE.md](TESTING-GUIDE.md) for complete test scenarios.

---

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
bun run backend --port 3000

# Run web UI (dev mode with HMR)
cd packages/web && bun run dev

# Run desktop app (Phase 3 - not functional yet)
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

## Current Status (Phase 2)

### ✅ Implemented
- ✅ Backend API with auth and encryption
- ✅ Settings management (HA URL + access token)
- ✅ Text-based chat interface
- ✅ Multi-turn conversations
- ✅ localStorage persistence
- ✅ Auto-login with password
- ✅ Connection validation

### 🚧 Coming Soon
- ⏳ Pipeline selection UI (Phase 2.5)
- ⏳ Desktop integration (Phase 3)
- ⏳ Global keyboard shortcuts (Phase 3)
- ⏳ System tray (Phase 3)
- ⏳ Voice input (STT) (Phase 4)
- ⏳ Voice output (TTS) (Phase 4)
- ⏳ Streaming LLM responses (Phase 5)
- ⏳ Markdown rendering (Phase 5)

## Documentation

- **[Quick Test Guide](QUICK-TEST.md)** - 3-step quick start
- **[Testing Guide](TESTING-GUIDE.md)** - Complete test scenarios
- **[API Documentation](packages/backend/API.md)** - Backend API reference
- **[Development Plan](PLAN.md)** - Roadmap and architecture
- **[Phase 2 Complete](PHASE2-COMPLETE.md)** - Phase 2 completion report
