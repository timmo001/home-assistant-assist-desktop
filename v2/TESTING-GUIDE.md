# Phase 2 Complete Testing Guide

## Prerequisites

Before testing, ensure you have:
- A working Home Assistant instance with URL and access token
- Terminal access to run commands
- Web browser (Chrome/Firefox recommended)

## Automated Backend Testing

We've created `test-phase2.sh` to automatically verify the backend works correctly.

### Run Backend Tests

```bash
cd /home/aidan/repos/home-assistant/home-assistant-assist-desktop/v2
./test-phase2.sh
```

**Expected Output:**
```
============================================
Phase 2 Manual Testing
============================================

1. Cleaning config directory...
   ✓ Config cleaned

2. Starting backend server on port 3000...
   ✓ Backend started (PID: XXXXX)
   ✓ Logs: /tmp/ha-assist-backend.log

3. Waiting for backend to be ready...
   ✓ Backend is ready!

4. Extracting auto-generated password...
   ✓ Password: [64-character hex string]

5. Testing backend endpoints...
   - Health check...
     ✓ Health check passed
   - Login with password...
     ✓ Login successful, token: [UUID]...
   - Get settings (should be empty)...
     ✓ Settings endpoint working

============================================
Backend Testing Complete!
============================================
```

**What This Tests:**
- ✅ Config directory creation
- ✅ Password auto-generation on first run
- ✅ Server startup on port 3000
- ✅ Health check endpoint
- ✅ Login endpoint with password authentication
- ✅ Settings endpoint with Bearer token auth

---

## Manual Web UI Testing

After running the backend test script, the backend will be running on port 3000. Now test the web UI.

### Step 1: Start Web UI Dev Server

**Terminal 2:**
```bash
cd /home/aidan/repos/home-assistant/home-assistant-assist-desktop/v2/packages/web
bun run dev
```

**Expected Output:**
```
VITE v5.4.21  ready in 131 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 2: Get Password from Backend

Copy the password from the `test-phase2.sh` output (look for "Open in browser" section).

### Step 3: Open Web UI in Browser

Navigate to:
```
http://localhost:5173/?password=YOUR_PASSWORD_HERE
```

---

## Test Scenarios

### ✅ Test 1: Auto-Login

**Steps:**
1. Open `http://localhost:5173/?password=YOUR_PASSWORD_HERE`
2. Observe loading screen

**Expected:**
- "Connecting to backend..." appears briefly
- Auto-login succeeds
- Redirects to settings page (first run, no HA configured)

**Verify:**
- No authentication errors
- Browser console shows no errors (F12)

---

### ✅ Test 2: First-Run Redirect

**Steps:**
1. After auto-login, observe the page

**Expected:**
- Settings page loads automatically
- Message: "No Home Assistant connection configured"
- Form shows URL and Access Token inputs

**Verify:**
- Settings page is displayed
- No chat interface visible yet

---

### ✅ Test 3: Settings - Invalid HA URL

**Steps:**
1. Enter invalid URL: `http://invalid-url-that-does-not-exist`
2. Enter any access token: `test-token`
3. Click "Test Connection"

**Expected:**
- Loading indicator appears
- Error message: "Failed to connect to Home Assistant"
- Settings are NOT saved

**Verify:**
- Error is displayed to user
- Console shows connection error

---

### ✅ Test 4: Settings - Valid HA Connection

**Steps:**
1. Enter your Home Assistant URL (e.g., `http://homeassistant.local:8123`)
2. Enter your long-lived access token
3. Click "Test Connection"

**Expected:**
- Loading indicator appears
- Success message: "Successfully connected to Home Assistant"
- "Save Settings" button becomes enabled

**Verify:**
- Green success message
- Save button is clickable

---

### ✅ Test 5: Settings - Save Configuration

**Steps:**
1. After successful test connection, click "Save Settings"

**Expected:**
- Loading indicator appears
- Success message: "Settings saved successfully"
- Auto-redirect to chat page after 1 second

**Verify:**
- Redirected to `/` (chat page)
- Chat interface loads

---

### ✅ Test 6: Chat - Send Text Message

**Steps:**
1. In chat interface, type: "What time is it?"
2. Press Enter or click Send

**Expected:**
- Message appears in chat with timestamp
- Loading indicator shows "Home Assistant is thinking..."
- Response from Home Assistant appears
- Response includes current time

**Verify:**
- User message displayed on right (blue bubble)
- Assistant response on left (gray bubble)
- Both messages have timestamps
- Input field clears after sending

---

### ✅ Test 7: Chat - localStorage Persistence

**Steps:**
1. Send a few messages in chat
2. Refresh the page (F5)
3. Observe chat history

**Expected:**
- Page reloads
- Auto-login succeeds
- Previous messages are displayed
- Can continue conversation

**Verify:**
- All previous messages visible
- Message order preserved
- Timestamps correct

---

### ✅ Test 8: Chat - Multi-Turn Conversation

**Steps:**
1. Send: "Turn on the living room lights"
2. Wait for response
3. Send: "Turn them off"
4. Wait for response

**Expected:**
- First message executes (lights turn on)
- Second message uses conversation context ("them" = living room lights)
- Both commands execute correctly

**Verify:**
- Conversation ID maintained between messages
- Context is preserved
- HA executes commands correctly

---

### ✅ Test 9: Settings - Edit Configuration

**Steps:**
1. Click "Settings" (or navigate to `/settings`)
2. Observe form

**Expected:**
- HA URL is displayed
- Access token is NOT displayed (security feature)
- "Test Connection" and "Save Settings" buttons available

**Verify:**
- URL is pre-filled
- Token field is empty (security)
- Can update URL and save

---

### ✅ Test 10: Reconnection - Backend Restart

**Steps:**
1. Stop backend (kill the PID from test script)
2. Observe web UI
3. Restart backend: `bun run backend --port 3000`
4. Wait for reconnection

**Expected:**
- Reconnection banner appears at top
- "Backend connection lost" message
- After backend restarts, banner shows "Reconnecting..."
- Successfully reconnects

**Verify:**
- Banner is visible
- Reconnection logic works
- Chat functions after reconnect

---

## Common Issues & Solutions

### Issue: "Failed to connect to backend"

**Solution:**
- Verify backend is running: `curl http://localhost:3000/health`
- Check backend logs: `cat /tmp/ha-assist-backend.log`
- Ensure port 3000 is not blocked by firewall

### Issue: "Authentication failed"

**Solution:**
- Verify password is correct (check test script output)
- Clear localStorage: Browser DevTools → Application → Local Storage → Clear All
- Restart with fresh config: `rm -rf ~/.config/ha-assist && ./test-phase2.sh`

### Issue: "Vite server won't start"

**Solution:**
- Kill existing processes: `pkill -f vite`
- Try a different port: Edit `vite.config.ts` and change port
- Check no other service is using port 5173

### Issue: Messages not persisting

**Solution:**
- Check localStorage: Browser DevTools → Application → Local Storage
- Verify `ha-assist:conversation` key exists
- Clear and retry: localStorage.clear()

### Issue: HA connection test fails

**Solution:**
- Verify HA URL is accessible: `curl http://your-ha-url/api/`
- Ensure access token is valid (create new one in HA if needed)
- Check network/firewall rules

---

## Clean Up After Testing

### Stop Backend

```bash
# Get PID from test script output or:
kill $(lsof -t -i:3000)
```

### Stop Web Dev Server

Press `Ctrl+C` in the terminal running `bun run dev`

### Clean Config (Optional)

```bash
rm -rf ~/.config/ha-assist
```

### Clean localStorage (Optional)

Browser DevTools → Application → Local Storage → Clear All

---

## Success Criteria

Phase 2 is considered **fully tested and working** if:

- ✅ All automated backend tests pass (`test-phase2.sh`)
- ✅ Web UI auto-login works
- ✅ Settings page can connect to HA
- ✅ Chat can send/receive messages
- ✅ localStorage persistence works
- ✅ Multi-turn conversations work
- ✅ Reconnection logic works
- ✅ No critical errors in browser console

---

## Next Steps After Testing

### If All Tests Pass

Proceed to **Phase 2.5** (optional) or **Phase 3**:

**Phase 2.5 - Pipeline Selection:**
- Add UI to select which assist pipeline to use
- Settings page: Dropdown with available pipelines
- Save selection and use in chat

**Phase 3 - Desktop Integration:**
- Backend sidecar spawning in Rust
- Bundle backend with `bun build --compile`
- Global keyboard shortcuts (Ctrl+Alt+A)
- System tray menu
- Window management

### If Tests Fail

Document the failure:
1. Which test scenario failed?
2. What was the expected behavior?
3. What actually happened?
4. Browser console errors?
5. Backend logs: `cat /tmp/ha-assist-backend.log`

---

## Logging and Debugging

### Backend Logs

```bash
# View backend logs
cat /tmp/ha-assist-backend.log

# Follow logs in real-time
tail -f /tmp/ha-assist-backend.log
```

### Browser Console

- Open DevTools: F12
- Check Console tab for errors
- Check Network tab for API requests

### Config File

```bash
# View encrypted config
cat ~/.config/ha-assist/config.enc

# Config location varies by platform:
# Linux:   ~/.config/ha-assist/config.enc
# macOS:   ~/Library/Application Support/ha-assist/config.enc
# Windows: %APPDATA%/ha-assist/config.enc
```

### localStorage

Browser DevTools → Application → Local Storage → `http://localhost:5173`

Keys to check:
- `ha-assist:token` - Auth token
- `ha-assist:conversation` - Chat history

---

## Technical Notes

### Password Authentication

- Password is 64-character hex string (SHA-256)
- Auto-generated on first run
- Stored in `config.enc` (AES-256-GCM encrypted)
- Can be reset with `--reset-password` flag

### API Proxy

- Web dev server (port 5173) proxies `/api` to backend (port 3000)
- Configured in `vite.config.ts`
- Production build serves from same origin (no proxy needed)

### localStorage Schema

```json
{
  "ha-assist:token": "uuid-token-here",
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

### Conversation Tracking

- Conversation ID generated on first message
- Sent with all subsequent pipeline runs
- Enables multi-turn conversation context
- Cleared when localStorage is cleared

---

## Questions?

If you encounter any issues during testing:

1. Check this guide's "Common Issues" section
2. Review backend logs
3. Check browser console
4. Verify HA instance is accessible
5. Try with fresh config (`rm -rf ~/.config/ha-assist`)

