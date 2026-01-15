# Home Assistant Assist Desktop v2 - Development Plan

## Technical Decisions

### Infrastructure
- **Encryption:** bcrypt for passwords + Node crypto (AES-256-GCM) for config data
- **Auth:** UUID tokens in memory Map (single-user desktop app)
- **HA Connection:** WebSocket proxy (Web → Backend WS → HA WS)
- **Testing:** Phase 1 includes curl/Postman testing before UI
- **Backend Bundling:** `bun build --compile` for standalone binary (~90MB)

### Feature Priority (from user input)
1. Settings UI
2. Global shortcuts
3. HA connection
4. Text chat
5. Pipeline running
6. Voice recording (deferred to Phase 4)

### Deployment Strategy
- Start with backend API foundation
- Web UI uses backend for all HA communication
- Desktop spawns backend as sidecar binary

---

## Phase 1: Backend API Foundation 🎯 **CURRENT**

### 1.1 Crypto & Config Management
- [x] Basic config file management exists
- [ ] Add AES-256-GCM encryption for sensitive fields
- [ ] Use bcrypt for password hashing
- [ ] Create `~/.ha-assist/config.json` structure:
  ```json
  {
    "version": 1,
    "server": {
      "passwordHash": "bcrypt_hash_here"
    },
    "homeAssistant": {
      "url": "encrypted_data",
      "accessToken": "encrypted_data",
      "selectedPipelineId": "encrypted_data"
    }
  }
  ```
- [ ] Config migration system
- [ ] Validation helpers

**Files:**
- `packages/backend/src/crypto.ts` (new)
- `packages/backend/src/config.ts` (expand)

### 1.2 Authentication System
- [ ] Generate random password on first run (if none exists)
- [ ] Store bcrypt hash in config
- [ ] UUID-based session tokens in memory Map
- [ ] Auth middleware for protected routes
- [ ] Endpoints:
  - `POST /auth/login` - Accept password, return token
  - `POST /auth/logout` - Clear token
  - `GET /auth/status` - Check if authenticated
  - `GET /auth/password` - Get current password (for desktop sidecar)

**Files:**
- `packages/backend/src/middleware/auth.ts` (new)
- `packages/backend/src/routes/auth.ts` (complete stubs)

### 1.3 Settings Management
- [ ] CRUD operations for HA settings
- [ ] Encrypt/decrypt on save/load
- [ ] Test HA connection endpoint
- [ ] Endpoints:
  - `GET /api/settings` - Get current settings (decrypted)
  - `PUT /api/settings` - Save settings (encrypts before storing)
  - `POST /api/settings/test-connection` - Test HA URL + token

**Files:**
- `packages/backend/src/routes/settings.ts` (expand)

### 1.4 Home Assistant WebSocket Proxy
- [ ] WebSocket endpoint at `/api/ha/ws`
- [ ] Authenticate client connection (check session token)
- [ ] Connect to HA WebSocket using stored credentials
- [ ] Proxy messages bidirectionally:
  - Client → Backend → HA
  - HA → Backend → Client
- [ ] Handle HA disconnection/reconnection
- [ ] Error handling and client notifications

**Files:**
- `packages/backend/src/routes/ha.ts` (implement WebSocket proxy)
- Uses existing `packages/backend/src/ha/client.ts`

### 1.5 Pipeline Execution API
- [ ] Endpoints for pipeline operations:
  - `GET /api/pipelines` - List available pipelines
  - `POST /api/pipeline/run-text` - Execute pipeline with text input
  - `POST /api/pipeline/run-audio` - Upload audio (stub for Phase 4)
- [ ] Use HA client to execute pipelines
- [ ] Return results and events

**Files:**
- `packages/backend/src/routes/pipelines.ts` (new)

### 1.6 CLI Commands
- [x] `ha-assist backend` - Works!
- [ ] `ha-assist web` - Serve static web UI + API on same port
- [ ] `ha-assist dev` - Backend + web with HMR (vite proxy)
- [ ] Add `--port` flag support
- [ ] Add `--reset-password` flag

**Files:**
- `packages/backend/src/index.ts` (expand)
- `packages/backend/src/server.ts` (add static file serving)

### 1.7 Testing Phase 1
- [ ] Create `test-backend.sh` script with curl commands
- [ ] Test auth flow (login, use token, logout)
- [ ] Test settings CRUD with encryption
- [ ] Test HA connection (if HA instance available)
- [ ] Test WebSocket proxy
- [ ] Document API endpoints in `API.md`

**Files:**
- `packages/backend/test-backend.sh` (new)
- `packages/backend/API.md` (new)

---

## Phase 2: Web UI Core

### 2.1 Backend Client Library
- [ ] Complete `BackendClient` class
- [ ] Auth methods (login, logout, checkStatus)
- [ ] Settings methods (get, save, testConnection)
- [ ] WebSocket connection for HA proxy
- [ ] Pipeline execution methods
- [ ] Error handling and retry logic

**Files:**
- `packages/web/src/lib/backend-client.ts` (expand)

### 2.2 Settings Page (Priority #1)
- [ ] Form fields:
  - HA URL input with validation
  - Access token input (password field)
  - Pipeline selection dropdown
  - Test connection button
- [ ] Show connection status (success/error)
- [ ] Save/load from backend
- [ ] Loading states
- [ ] Error display

**Files:**
- `packages/web/src/components/settings-page.ts` (complete)

### 2.3 Chat Interface (Text-Only, No Streaming)
- [ ] Text input field with send button
- [ ] Message history display (user + assistant)
- [ ] Pipeline execution:
  - Show "thinking..." while processing
  - Display complete response when done
  - Plain text only (no markdown)
- [ ] Error handling (show errors in chat)
- [ ] Clear conversation button
- [ ] Settings link

**Files:**
- `packages/web/src/components/assist-chat.ts` (implement)
- `packages/web/src/components/message-bubble.ts` (text rendering)

### 2.4 App Structure
- [ ] First-run detection (redirect to settings if no HA config)
- [ ] Navigation between chat and settings
- [ ] Loading screen during backend connection
- [ ] Responsive layout

**Files:**
- `packages/web/src/components/app-root.ts` (expand)
- `packages/web/src/styles/global.css` (styling)

### 2.5 Build & Deploy
- [ ] Production build works
- [ ] Backend can serve web UI via `ha-assist web`
- [ ] Dev mode with HMR via `ha-assist dev`

---

## Phase 3: Desktop Integration

### 3.1 Backend Sidecar Spawning
- [ ] Build backend with `bun build --compile`
- [ ] Copy binary to `packages/desktop/src-tauri/sidecars/`
- [ ] Configure `tauri.conf.json` externalBin
- [ ] Implement sidecar spawning in Rust:
  - Generate random password
  - Spawn backend with password env var
  - Wait for health check (retry with timeout)
  - Store backend URL + password
  - Kill on app exit
- [ ] Return backend data to frontend

**Files:**
- `packages/desktop/src-tauri/src/lib.rs` (implement `ensure_backend_ready`)
- `packages/desktop/src-tauri/tauri.conf.json` (add externalBin)
- `packages/backend/package.json` (add compile script)

**Reference:** OpenCode's `lib.rs` spawn_sidecar function

### 3.2 Global Shortcuts (Priority #2)
- [ ] Register shortcuts:
  - `Ctrl+Alt+A` (all platforms)
  - `Alt+Shift+A` (alternative)
- [ ] Show/hide window on shortcut
- [ ] Focus text input when showing
- [ ] Handle already-visible case

**Files:**
- `packages/desktop/src-tauri/src/shortcuts.rs` (new)
- `packages/desktop/src-tauri/src/lib.rs` (integrate)

### 3.3 System Tray
- [ ] Tray icon (already configured)
- [ ] Menu items:
  - Show/Hide
  - Settings
  - Quit
- [ ] Click tray to toggle window
- [ ] Update menu based on window state

**Files:**
- `packages/desktop/src-tauri/src/tray.rs` (new)

### 3.4 Window Management
- [ ] Save/restore window position and size
- [ ] Hide to tray on close (don't quit)
- [ ] Quit only from tray menu
- [ ] Platform-specific behaviors

**Files:**
- Use `tauri-plugin-window-state` (already installed in OpenCode pattern)

---

## Phase 4: Voice Support

### 4.1 Audio Recorder (Web)
- [ ] Port AudioWorklet pattern from v1
- [ ] Record button in chat UI
- [ ] Visual feedback (recording animation)
- [ ] Stop recording on button release
- [ ] Send WAV to backend

**Files to port:**
- `v1/src/lib/audioRecorder.ts` → `packages/web/src/lib/audio-recorder.ts`
- `v1/src/lib/audioWorklet.ts` → `packages/web/src/lib/audio-worklet.ts`

### 4.2 Audio Pipeline (Backend)
- [ ] Implement `/api/pipeline/run-audio` endpoint
- [ ] Accept WAV/PCM audio
- [ ] Send to HA STT pipeline
- [ ] Return transcription + intent results

### 4.3 Voice UI
- [ ] Microphone button in chat
- [ ] Show recording state
- [ ] Display transcription
- [ ] Keyboard shortcut to start recording (Space to talk)

---

## Phase 5: Future Enhancements

Deferred until core features are complete:

- [ ] Streaming LLM responses (handle `intent-progress` events)
- [ ] Markdown rendering for responses
- [ ] Continue conversation feature
- [ ] TTS audio playback
- [ ] Conversation history persistence
- [ ] Multiple conversations
- [ ] Autostart on system boot
- [ ] Auto-updater (tauri-plugin-updater)
- [ ] Packaging:
  - [ ] AppImage
  - [ ] Windows MSI/NSIS
  - [ ] macOS DMG
  - [ ] Flatpak
  - [ ] Snap

---

## Current Status

**Completed:**
- ✅ Monorepo structure
- ✅ All packages build successfully
- ✅ Desktop app runs without Wayland errors
- ✅ Icons added
- ✅ Basic HA WebSocket client ported
- ✅ Type definitions complete

**Next Step:**
Start Phase 1.1 - Implement crypto utilities and config encryption

---

## Development Commands

```bash
cd v2

# Development
bun run backend          # Start backend only
bun run web              # Start web UI with Vite HMR
bun run desktop          # Start desktop app (Tauri dev)

# Building
bun run build            # Build all packages
bun run build:types      # Build shared-types
bun run build:backend    # Build backend
bun run build:web        # Build web UI
bun run build:desktop    # Build desktop (+ create installers)

# Testing (Phase 1)
cd packages/backend && ./test-backend.sh
```

---

## Notes

- Backend uses port auto-assignment (finds available port)
- Config stored in `~/.ha-assist/config.json`
- Desktop sidecar passes password via environment variable
- Web UI connects to backend, backend proxies to HA
- No streaming responses in initial release (Phase 5)
- Voice support deferred to Phase 4
