# Home Assistant Assist Desktop v2 - Development Plan

**Last Updated:** January 15, 2026  
**Current Status:** Phase 2 Complete ✅ → See STATUS.md for details  
**Completion History:** See HISTORY.md for Phase 1 & 2 reports

---

## Project Overview

### Architecture Decisions
- **Encryption:** bcrypt for passwords + AES-256-GCM for config data
- **Auth:** UUID tokens in memory Map (single-user desktop app)
- **HA Connection:** Direct WebSocket via backend (no proxy needed for Phase 2)
- **Backend Bundling:** `bun build --compile` for standalone binary (~50MB)
- **Deployment:** Backend → Web UI → Desktop wrapper

### Completed Phases ✅
- **Phase 1:** Backend API with auth, encryption, settings, pipeline execution
- **Phase 2:** Web UI with chat interface, settings page, localStorage persistence

See HISTORY.md for detailed completion reports.

---

## Phase 2.5: Pipeline Selection (Optional Enhancement)

**Priority:** Low  
**Estimated Time:** 1-2 hours  
**Status:** Not started

### Features
- [ ] Add pipeline selection dropdown to settings page
- [ ] Fetch available pipelines from `GET /api/pipelines`
- [ ] Save preferred pipeline ID in settings
- [ ] Use selected pipeline in chat interface
- [ ] Show pipeline name in chat header
- [ ] Default to first available if none selected

**Files to Modify:**
- `packages/web/src/components/settings-page.ts` - Add pipeline dropdown
- `packages/web/src/components/assist-chat.ts` - Use selected pipeline
- `packages/backend/src/routes/settings.ts` - Store pipeline preference

**Benefits:**
- Users can choose specific pipelines (e.g., different languages, models)
- Better control over conversation behavior
- Preparation for advanced features

---

## Phase 3: Desktop Integration 🎯 **NEXT PHASE**

**Priority:** High  
**Estimated Time:** 4-6 hours  
**Status:** Not started

### 3.1 Backend Sidecar Spawning

**Implementation:**
- [ ] Build backend with `bun build --compile` (creates standalone ~50MB binary)
- [ ] Copy binary to `packages/desktop/src-tauri/sidecars/ha-assist-backend`
- [ ] Configure `tauri.conf.json` externalBin section
- [ ] Implement sidecar spawning in Rust (`lib.rs`):
  - Generate cryptographically secure random password
  - Spawn backend process with password in env var
  - Wait for health check at `http://127.0.0.1:<PORT>/health`
  - Retry with timeout (5 attempts, 500ms delay)
  - Store backend URL + password for frontend injection
  - Register cleanup handler (kill backend on app exit)
- [ ] Inject backend data into webview via `window.__HA_ASSIST__`
- [ ] Handle backend crashes (auto-restart with exponential backoff)

**Files:**
- `packages/desktop/src-tauri/src/lib.rs` - Implement `ensure_backend_ready` command
- `packages/desktop/src-tauri/tauri.conf.json` - Add externalBin configuration
- `packages/backend/package.json` - Add `build:compile` script
- `packages/desktop/src-tauri/Cargo.toml` - Add `rand` dependency for password gen

**Reference Implementations:**
- OpenCode's `spawn_sidecar` function in Tauri 2
- Review sidecar spawning patterns from v1 if applicable

### 3.2 Global Shortcuts

**Implementation:**
- [ ] Register global keyboard shortcuts:
  - **Primary:** `Ctrl+Alt+A` (Windows/Linux) / `Cmd+Option+A` (macOS)
  - **Alternative:** `Alt+Shift+A` (all platforms)
- [ ] Show/hide window on shortcut press
- [ ] Focus text input field when window appears
- [ ] Handle edge cases:
  - Window already visible → hide it
  - Window minimized → restore and focus
  - Multiple rapid presses → debounce
- [ ] Configurable shortcuts (settings page)

**Files:**
- `packages/desktop/src-tauri/src/shortcuts.rs` - Shortcut registration and handling
- `packages/desktop/src-tauri/src/lib.rs` - Integrate shortcuts on app startup
- `packages/desktop/src-tauri/Cargo.toml` - Add `tauri-plugin-global-shortcut`

**Platform Considerations:**
- macOS: Request accessibility permissions
- Windows: Admin rights not required
- Linux: X11 vs Wayland handling

### 3.3 System Tray

**Implementation:**
- [ ] Tray icon with app branding (already configured in v1 pattern)
- [ ] Context menu items:
  - **Show/Hide** - Toggle window visibility
  - **Settings** - Open settings page
  - **Separator**
  - **Quit** - Exit application
- [ ] Left-click tray icon to toggle window
- [ ] Update menu state based on window visibility
- [ ] Tray notification on first run (optional)

**Files:**
- `packages/desktop/src-tauri/src/tray.rs` - Tray setup and menu handlers
- `packages/desktop/src-tauri/src/lib.rs` - Initialize tray on startup
- `packages/desktop/src-tauri/icons/` - Tray icon assets

**Platform Considerations:**
- macOS: Use monochrome icon for tray (Template image)
- Windows: Use 16x16 and 32x32 icons
- Linux: Use SVG or PNG with transparency

### 3.4 Window Management

**Implementation:**
- [ ] Save/restore window position and size (use `tauri-plugin-window-state`)
- [ ] Hide to tray on close button (prevent app quit)
- [ ] Quit only from tray menu or Cmd+Q/Alt+F4
- [ ] Platform-specific behaviors:
  - **macOS:** Hide on close, quit from menu only
  - **Windows:** Minimize to tray on close
  - **Linux:** Similar to Windows, respect DE conventions
- [ ] Remember window state per monitor (multi-monitor support)
- [ ] Default window size: 800x600, centered on screen

**Files:**
- `packages/desktop/src-tauri/Cargo.toml` - Add `tauri-plugin-window-state`
- `packages/desktop/src-tauri/src/lib.rs` - Configure window behavior
- `packages/desktop/src-tauri/tauri.conf.json` - Window configuration

**State Storage:**
- Window state saved to OS-specific location
- Separate from app config (use Tauri's state plugin)

---

---

## Phase 4: Voice Support

**Priority:** Medium  
**Estimated Time:** 3-4 hours  
**Status:** Not started  
**Depends On:** Phase 3 (Desktop) recommended but not required

### 4.1 Audio Recorder (Web)

**Implementation:**
- [ ] Port AudioWorklet pattern from v1 (proven working implementation)
- [ ] Microphone button in chat interface
- [ ] Visual feedback during recording:
  - Pulsing red indicator
  - Waveform visualization (optional)
  - Recording duration timer
- [ ] Push-to-talk: Hold Space bar to record, release to send
- [ ] Click-to-toggle: Click mic button to start/stop
- [ ] WAV encoding (16-bit PCM, 16kHz sample rate for HA compatibility)
- [ ] Browser permission handling with clear UI prompts
- [ ] Audio level indicator (prevent silent recordings)

**Files to Port:**
- `v1/src/lib/audioRecorder.ts` → `packages/web/src/lib/audio-recorder.ts`
- `v1/src/lib/audioWorklet.ts` → `packages/web/src/lib/audio-worklet.ts`

**Files to Modify:**
- `packages/web/src/components/assist-chat.ts` - Add mic button and recording UI
- `packages/web/src/components/app-root.ts` - Handle keyboard shortcuts

**Browser Compatibility:**
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Requires user gesture for microphone access

### 4.2 Audio Pipeline (Backend)

**Implementation:**
- [ ] Complete `/api/pipelines/run-audio` endpoint (currently stubbed)
- [ ] Accept multipart/form-data with audio file
- [ ] Validate audio format (WAV, 16-bit PCM)
- [ ] Send to HA STT pipeline via WebSocket
- [ ] Handle STT events:
  - `stt-start` - STT processing started
  - `stt-end` - Transcription complete
  - `intent-start` - Intent processing started
  - `intent-end` - Response ready
- [ ] Return structured response:
  ```json
  {
    "transcription": "turn on the lights",
    "response": "I've turned on the lights",
    "conversationId": "uuid"
  }
  ```
- [ ] Error handling for unsupported formats, timeouts, STT failures

**Files:**
- `packages/backend/src/routes/pipelines.ts` - Implement audio endpoint
- `packages/backend/src/ha/client.ts` - Add audio pipeline support if needed

**HA Requirements:**
- Whisper or other STT integration in Home Assistant
- Pipeline configured with STT step

### 4.3 Voice UI

**Implementation:**
- [ ] Microphone button in chat header
- [ ] Recording states:
  - **Idle:** Gray mic icon
  - **Recording:** Red pulsing icon + "Recording..." text
  - **Processing:** Spinner + "Processing audio..."
  - **Transcribing:** "Transcribing..." with transcription preview
- [ ] Display transcription before sending (allow editing)
- [ ] Send transcribed text + original audio (future: audio-only mode)
- [ ] Keyboard shortcuts:
  - **Space (hold):** Push-to-talk
  - **Escape:** Cancel recording
- [ ] Settings page: Toggle auto-send (send immediately vs show transcription)

**Files:**
- `packages/web/src/components/assist-chat.ts` - Voice UI components
- `packages/web/src/components/settings-page.ts` - Voice settings

**UX Considerations:**
- Clear visual feedback for each stage
- Allow canceling mid-recording
- Handle microphone permission denial gracefully
- Show error if STT not configured in HA

---

## Phase 5: Advanced Features & Polish

**Priority:** Low  
**Estimated Time:** Variable (1-2 hours each)  
**Status:** Not started  
**When:** After Phases 3-4 complete and users request features

### 5.1 Streaming LLM Responses
- [ ] Handle `intent-progress` events from HA
- [ ] Stream response tokens to UI in real-time
- [ ] Typewriter effect for responses
- [ ] Cancel mid-stream with stop button

**Benefit:** Faster perceived response time, better UX for long responses

### 5.2 Markdown Rendering
- [ ] Install markdown parser (e.g., `marked` or `markdown-it`)
- [ ] Render formatted text, links, lists, code blocks
- [ ] Syntax highlighting for code (e.g., `highlight.js`)
- [ ] Sanitize HTML to prevent XSS

**Benefit:** Rich responses with formatting, better for complex queries

### 5.3 Continue Conversation
- [ ] "Continue" button on last assistant message
- [ ] Pre-fill input with context (e.g., "tell me more")
- [ ] Branch conversations (keep history, create new thread)

**Benefit:** Better multi-turn conversations, easier follow-ups

### 5.4 TTS Audio Playback
- [ ] Request audio from HA TTS pipeline
- [ ] Play audio in browser using Web Audio API
- [ ] Visual feedback during playback
- [ ] Stop/pause controls
- [ ] Settings toggle for auto-play

**Benefit:** Hands-free experience, accessibility

### 5.5 Conversation History Persistence
- [ ] Store conversations in SQLite (desktop) or IndexedDB (web)
- [ ] List previous conversations with timestamps
- [ ] Search conversation history
- [ ] Export conversations (JSON, markdown)

**Benefit:** Reference past conversations, long-term memory

### 5.6 Multiple Conversations
- [ ] Tab interface for multiple chat threads
- [ ] Create new conversation
- [ ] Switch between conversations
- [ ] Delete conversations

**Benefit:** Organize conversations by topic or context

### 5.7 Autostart on System Boot
- [ ] Register desktop app to start on login (Tauri built-in)
- [ ] Start minimized to tray
- [ ] Settings toggle for autostart

**Benefit:** Always available, no manual startup

### 5.8 Auto-Updater
- [ ] Integrate `tauri-plugin-updater`
- [ ] Check for updates on startup
- [ ] Download and install updates
- [ ] Notify user of new versions

**Benefit:** Keep users on latest version automatically

### 5.9 Dark Mode
- [ ] Add theme toggle to settings
- [ ] CSS variables for theming
- [ ] Persist preference in localStorage
- [ ] Respect OS theme preference

**Benefit:** Reduced eye strain, user preference

### 5.10 Accessibility Improvements
- [ ] ARIA labels for all interactive elements
- [ ] Screen reader support
- [ ] Keyboard navigation for all features
- [ ] High contrast mode
- [ ] Focus indicators

**Benefit:** Accessible to users with disabilities

### 5.11 Packaging & Distribution
- [ ] **Linux:**
  - [ ] AppImage (portable)
  - [ ] Flatpak (Flathub distribution)
  - [ ] Snap (Ubuntu Software)
  - [ ] .deb / .rpm packages
- [ ] **Windows:**
  - [ ] MSI installer
  - [ ] NSIS installer
  - [ ] Portable ZIP
- [ ] **macOS:**
  - [ ] DMG installer
  - [ ] Code signing (Apple Developer cert)
  - [ ] Notarization (Gatekeeper)

**Benefit:** Easy installation for end users

---

## Development Commands

```bash
cd v2

# Development
bun run backend          # Start backend API on port 3000
bun run web             # Start web UI with Vite HMR on port 5173
bun run desktop         # Desktop app (Phase 3 - not yet implemented)

# Building
bun run build           # Build all packages
bun run build:types     # Build shared types only
bun run build:backend   # Build backend only
bun run build:web       # Build web UI only
bun run build:desktop   # Build desktop app (Phase 3)

# Type Checking
bun run typecheck       # Type check all packages

# Testing
./test-phase2.sh        # Automated backend API testing
# See STATUS.md for manual web UI testing guide
```

### Backend CLI
```bash
cd packages/backend

# Start server
bun run src/index.ts backend [--port 3000]

# Start server + serve web UI  
bun run src/index.ts web [--port 3000]

# Dev mode with HMR support
bun run src/index.ts dev [--port 3000]

# Reset password and config
bun run src/index.ts backend --reset-password
```

---

## Implementation Notes

### Current Architecture
- **Backend:** Hono API server on Node/Bun
- **Web UI:** Lit web components with Vite
- **Desktop:** Tauri 2 (Phase 3)
- **Storage:** Platform-specific config directories
- **Auth:** Password + Bearer tokens
- **Encryption:** AES-256-GCM for config, bcrypt for passwords

### Key Technical Decisions
1. **No WebSocket Proxy (Yet)**
   - Backend connects directly to HA WebSocket
   - Web UI uses REST API for pipeline execution
   - Sufficient for current text-based chat
   - Could add WS proxy in future if needed for real-time features

2. **localStorage for Chat History**
   - Simple, works in both web and desktop
   - No backend persistence required
   - Easy to clear/export
   - Could migrate to IndexedDB or SQLite in Phase 5

3. **Single Pipeline (Phase 2)**
   - Uses first available or preferred pipeline
   - Phase 2.5 adds UI for selection
   - Sufficient for most users with one pipeline

4. **No Streaming (Phase 2)**
   - Complete responses only
   - Simpler implementation
   - Phase 5 adds streaming if users request it

5. **Text-Only (Phase 2)**
   - Voice deferred to Phase 4
   - Proven working code from v1 ready to port
   - Waiting for core features first

### Platform-Specific Considerations
- **Linux:** XDG directories, X11/Wayland support
- **macOS:** Application Support, code signing required
- **Windows:** AppData, MSI installer recommended

### Security Model
- Password never leaves config file (stored as bcrypt hash)
- Session tokens in memory only (not persisted)
- Config encrypted at rest with AES-256-GCM
- Access tokens never logged or exposed in UI
- CORS enabled for web dev, disabled in production

---

## Quick Reference

**Current Phase:** Phase 2 Complete ✅  
**Next Phase:** Phase 3 (Desktop) or Phase 2.5 (Pipeline Selection)  
**Status Details:** See STATUS.md  
**History:** See HISTORY.md  
**Testing:** See STATUS.md testing guide

**Quick Start:**
```bash
./test-phase2.sh                                    # Start backend
cd packages/web && bun run dev                      # Start web UI
open http://localhost:5173/?password=<PASSWORD>     # Use password from step 1
```

---

## Future Considerations

### Performance Optimization
- Bundle size reduction (tree shaking, code splitting)
- Backend response caching
- Lazy loading for advanced features
- Service worker for offline support (web)

### Advanced Features (Post Phase 5)
- Multi-user support (requires auth rework)
- Cloud sync for conversations
- Plugin system for extensions
- Custom pipeline creation UI
- Advanced voice commands (wake word detection)
- Integration with other smart home platforms

### Community Contributions
- Translation/i18n support
- Theme marketplace
- Plugin marketplace
- Documentation contributions

---

**Last Updated:** January 15, 2026
