# Home Assistant Assist Desktop v2 - Current Status

**Last Updated:** January 15, 2026  
**Current Phase:** Phase 2 Complete ✅  
**Next Phase:** Phase 3 (Desktop Integration) or Phase 2.5 (Pipeline Selection)

---

## Current State

### ✅ Phase 1: Backend API (Complete)
- AES-256-GCM encryption for config storage
- Password-based authentication with bcrypt
- Session token management (UUID, 30-day timeout)
- Home Assistant settings CRUD with encryption
- Pipeline execution with text input
- Auto-generated passwords on first run
- Platform-specific config paths
- CLI commands: `backend`, `web`, `dev`
- Complete test suite (`test-phase2.sh`)

### ✅ Phase 2: Web UI (Complete)
- Auto-login with password detection (query param or window injection)
- Settings page with HA connection validation
- Text-based chat interface with message history
- Multi-turn conversation support (conversation ID tracking)
- localStorage persistence (survives page refresh)
- Reconnection logic with retry and exponential backoff
- First-run experience (auto-redirect to settings)
- Error handling and user feedback
- Production build working
- Vite proxy for development

### 🔜 Phase 3: Desktop Integration (Next)
See PLAN.md for details:
- Backend sidecar spawning in Rust
- Global keyboard shortcuts (Ctrl+Alt+A)
- System tray menu
- Window management
- Bundle backend as standalone binary

---

## Quick Start (3 Steps)

### 1. Start Backend + Get Password
```bash
cd v2
./test-phase2.sh
```
**Copy the password from output!**

### 2. Start Web UI
```bash
cd packages/web
bun run dev
```

### 3. Open Browser
```
http://localhost:5173/?password=PASTE_PASSWORD_HERE
```

---

## Production Deployment

### Build
```bash
cd v2
bun run build
```

### Serve
```bash
bun run web --port 3000
```
Opens browser at `http://localhost:3000/?password=<PASSWORD>`

---

## What's Working Right Now

### Backend API (Port 3000)
All endpoints tested and working:
- `GET /health` - Health check
- `POST /api/auth/login` - Password authentication
- `GET /api/auth/password` - Get auto-generated password
- `POST /api/auth/logout` - Session invalidation
- `GET /api/auth/status` - Token validation
- `GET /api/settings` - Get HA settings (encrypted at rest)
- `PUT /api/settings` - Update HA settings
- `POST /api/settings/test-connection` - Test HA connectivity
- `GET /api/pipelines` - List available pipelines
- `POST /api/pipelines/run-text` - Execute pipeline with text
- `POST /api/pipelines/run-audio` - Stub for Phase 4 (voice)

### Web UI (Port 5173 dev, or served from backend)
- Password-based auto-login
- First-run redirect to settings
- HA connection testing and validation
- Text chat with Home Assistant
- Conversation history with timestamps
- Multi-turn conversations with context
- Message persistence (localStorage)
- Clear history with confirmation
- Reconnection banner on backend disconnect
- Loading states and error handling
- Responsive layout

### Features Verified
- ✅ Auto-generated 64-char passwords on first run
- ✅ Encrypted config storage (~/.config/ha-assist/)
- ✅ Bearer token authentication
- ✅ Settings save/load with encryption
- ✅ Pipeline execution with HA WebSocket client
- ✅ Multi-turn conversation tracking
- ✅ localStorage with "ha-assist:" namespace
- ✅ Retry logic with exponential backoff (3 attempts)
- ✅ Auto-scroll to bottom in chat
- ✅ Relative timestamps ("just now", "5 minutes ago")

---

## Testing Guide

### Automated Backend Tests

```bash
cd v2
./test-phase2.sh
```

**Tests:**
- Config directory creation
- Password auto-generation
- Server startup
- Health check endpoint
- Login with password authentication
- Settings endpoint with Bearer token
- Server shutdown

**Expected:** All tests pass, backend remains running with password displayed.

---

### Manual Web UI Tests

#### Prerequisites
- Running Home Assistant instance
- URL (e.g., `http://homeassistant.local:8123`)
- Long-lived access token (Profile → Security)
- At least one Assist pipeline configured

#### Test Scenario 1: First Run & Auto-Login
1. Start backend: `./test-phase2.sh`
2. Start web UI: `cd packages/web && bun run dev`
3. Open: `http://localhost:5173/?password=<PASSWORD>`

**Expected:**
- Loading screen: "Connecting to backend..."
- Auto-login succeeds without prompt
- Redirects to Settings page (first run)
- No console errors

#### Test Scenario 2: Configure Home Assistant
1. On Settings page, enter:
   - URL: Your HA URL
   - Access Token: Your long-lived token
2. Click "Test Connection"

**Expected:**
- Button shows "Testing..." with spinner
- Success message: "Connected to Home Assistant X.X.X"
- Save button becomes enabled

3. Click "Save Settings"

**Expected:**
- Success message: "Settings saved successfully!"
- Auto-redirect to chat after 2 seconds

#### Test Scenario 3: Send Messages
1. In chat, type: `What time is it?`
2. Press Enter or click Send

**Expected:**
- User message appears (blue bubble, right-aligned)
- Loading indicator: "Assistant is thinking..."
- Response appears (gray bubble, left-aligned)
- Timestamp shows "Just now"
- Input field clears

#### Test Scenario 4: Conversation Persistence
1. Send 2-3 messages
2. Refresh page (F5)

**Expected:**
- Auto-login succeeds
- Chat page loads (not settings)
- All previous messages displayed
- Can continue conversation

#### Test Scenario 5: Multi-Turn Conversation
1. Send: `Turn on the living room lights`
2. Wait for response
3. Send: `Turn them off`

**Expected:**
- First command executes
- Second command uses context ("them" = living room lights)
- Both execute correctly
- Conversation ID maintained

#### Test Scenario 6: Clear History
1. Click "Clear History" button
2. Confirm in dialog

**Expected:**
- All messages disappear
- Empty state shows: "Welcome to Home Assistant Assist"
- localStorage cleared

#### Test Scenario 7: Backend Reconnection
1. Stop backend (Ctrl+C in Terminal 1)
2. Observe web UI

**Expected:**
- Red reconnection banner appears at top
- Error message in chat: "Error: Failed to fetch..."

3. Restart backend: `bun run backend --port 3000`
4. Click "Reconnect" in banner

**Expected:**
- Banner disappears
- Can send messages again

#### Test Scenario 8: Edit Settings
1. Navigate to Settings
2. Change HA URL or token
3. Test Connection
4. Save
5. Return to chat and send message

**Expected:**
- Settings updated
- Chat uses new configuration
- History preserved

---

## Known Limitations (By Design)

These are intentionally deferred to later phases:

### Phase 2.5 (Optional Enhancement)
- **No pipeline selection** - Uses first available or preferred pipeline
- User cannot choose specific pipeline per conversation

### Phase 3 (Desktop Integration)
- **No global shortcuts** - Must open browser manually
- **No system tray** - No background app
- **No desktop bundling** - Separate backend + web UI

### Phase 4 (Voice Support)
- **No voice input** - Text only
- **No audio recording** - Microphone button not implemented
- **No TTS playback** - Text responses only

### Phase 5 (Advanced Features)
- **No streaming responses** - Complete response appears at once
- **No markdown rendering** - Plain text only
- **No code blocks** - No syntax highlighting
- **No dark mode** - Light theme only

### Technical Debt
- **No unit tests** - All testing is manual
- **Mobile responsiveness** - Works but not optimized
- **Accessibility** - Basic keyboard nav only, no ARIA labels
- **Error recovery** - Some states require page refresh

---

## Troubleshooting

### Backend won't start
```bash
# Check if port is in use
lsof -i :3000

# Kill existing process
kill $(lsof -t -i:3000)

# View logs
cat /tmp/ha-assist-backend.log
```

### Web UI shows authentication errors
```bash
# Check backend is running
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}

# Reset config and get new password
rm -rf ~/.config/ha-assist
./test-phase2.sh
```

### HA connection test fails
```bash
# Test HA directly
curl http://your-ha-url:8123/api/
# Should return: {"message": "API running."}

# Verify access token is valid (create new in HA if needed)
```

### Messages not persisting
- Open DevTools → Application → Local Storage
- Verify `ha-assist:conversation` key exists
- Clear and retry: `localStorage.clear()`

### CORS errors in browser
- Check backend logs for CORS configuration
- Verify web UI is using correct proxy (dev mode)
- In production, web UI served from same origin (no CORS)

---

## Performance Metrics

### Build Times
- Full build: ~30 seconds
- Backend build: ~2 seconds
- Web build: ~200ms
- Desktop build: ~15 seconds (Rust compilation)

### Runtime Performance
- Backend startup: <1 second
- Auto-login: <100ms
- Settings save: <200ms
- Message send/receive: 1-3 seconds (depends on HA)

### Bundle Sizes
- Web UI: 47.80 kB JS + 1.65 kB CSS
- Gzipped: 13.25 kB JS + 0.75 kB CSS
- Backend: ~50 MB when compiled (includes Bun runtime)

---

## Configuration Details

### Password Format
- Auto-generated: 64-character hex string (SHA-256)
- Stored as bcrypt hash in config.enc
- Used as master password for AES-256-GCM encryption
- Can be reset with `--reset-password` flag

### Config File Location
- **Linux**: `~/.config/ha-assist/config.enc`
- **macOS**: `~/Library/Application Support/ha-assist/config.enc`
- **Windows**: `%APPDATA%/ha-assist/config.enc`

### Config File Structure (Encrypted)
```json
{
  "version": 1,
  "server": {
    "passwordHash": "$2b$10$..."
  },
  "homeAssistant": {
    "url": "salt:iv:tag:encrypted_data",
    "accessToken": "salt:iv:tag:encrypted_data",
    "selectedPipelineId": "salt:iv:tag:encrypted_data"
  }
}
```

### localStorage Schema
```json
{
  "ha-assist:token": "uuid-session-token",
  "ha-assist:conversation": {
    "conversationId": "uuid",
    "messages": [
      {
        "role": "user" | "assistant",
        "text": "message content",
        "timestamp": 1234567890
      }
    ]
  }
}
```

---

## Development Commands

```bash
cd v2

# Development
bun run backend          # Start backend only (port 3000)
bun run web             # Start web UI with Vite HMR (port 5173)
bun run desktop         # Desktop app (Phase 3 - not yet implemented)

# Building
bun run build           # Build all packages
bun run build:types     # Build shared types only
bun run build:backend   # Build backend only
bun run build:web       # Build web UI only
bun run build:desktop   # Build desktop app (Phase 3)

# Type Checking
bun run typecheck       # Type check all packages
cd packages/backend && bun run typecheck
cd packages/web && bun run typecheck

# Testing
./test-phase2.sh        # Automated backend API testing
# No unit test framework configured - see testing guide above
```

### Backend CLI
```bash
cd packages/backend

# Start server
bun run src/index.ts backend [--port 3000]

# Start server + serve web UI
bun run src/index.ts web [--port 3000]

# Dev mode with HMR
bun run src/index.ts dev [--port 3000]

# Reset password
bun run src/index.ts backend --reset-password
```

---

## Architecture Overview

### Monorepo Structure
```
v2/
├── packages/
│   ├── backend/         # Hono API server + HA WebSocket client
│   ├── web/            # Lit web components
│   ├── desktop/        # Tauri 2 Rust backend (Phase 3)
│   └── shared-types/   # Shared TypeScript types
```

### Data Flow
1. User opens web UI with password in URL query param
2. Web UI auto-logs in with backend API
3. User configures HA settings (URL + token)
4. Backend encrypts and stores settings
5. User sends message in chat
6. Web UI calls backend pipeline execution API
7. Backend connects to HA via WebSocket
8. Backend executes pipeline and returns response
9. Web UI displays response and saves to localStorage

### Security Model
- Password-based authentication (bcrypt)
- Session tokens (UUID, 30-day expiry)
- Config encryption at rest (AES-256-GCM)
- Bearer token for API auth
- Access tokens masked in UI
- No password in localStorage (only session token)

---

## Next Steps

### Option A: Phase 2.5 - Pipeline Selection (Quick Win)
- Add dropdown to settings page
- Fetch pipelines from backend
- Save preferred pipeline
- Use in chat interface
- **Estimated time:** 1-2 hours

### Option B: Phase 3 - Desktop Integration (Major Feature)
See PLAN.md for details. Key tasks:
- Backend sidecar spawning in Rust
- Bundle backend with `bun build --compile`
- Global keyboard shortcuts
- System tray menu
- Window management and state persistence
- **Estimated time:** 4-6 hours

### Option C: Phase 4 - Voice Support
See PLAN.md for details. Key tasks:
- Port audio recorder from v1
- Audio pipeline execution
- Microphone button in UI
- WAV encoding and transmission
- **Estimated time:** 3-4 hours

---

## Success Criteria (Current Phase)

Phase 2 is considered **complete and verified** when:

- ✅ All automated backend tests pass
- ✅ Web UI auto-login works
- ✅ Settings can connect to HA and save
- ✅ Chat can send/receive messages
- ✅ Messages persist after refresh
- ✅ Multi-turn conversations work
- ✅ No critical browser console errors
- ✅ Production build works
- ✅ Backend serves static web UI

**All criteria met!** Ready for Phase 3 or Phase 2.5.

---

## Additional Resources

- **Development Plan**: See PLAN.md for full roadmap
- **Completion History**: See HISTORY.md for Phase 1 & 2 details
- **API Documentation**: See packages/backend/API.md
- **Agent Instructions**: See AGENTS.md for coding guidelines
