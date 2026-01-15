# Phase 2 Testing Guide

## Prerequisites

1. Running Home Assistant instance with:
   - Accessible URL (e.g., `http://homeassistant.local:8123`)
   - Long-lived access token created in Profile → Security
   - At least one Assist pipeline configured

---

## Quick Start Testing

### Terminal 1: Start Backend
```bash
cd v2
rm -rf ~/.config/ha-assist  # Clean start
bun run backend --port 3000
```

**Expected Output:**
```
============================================================
  FIRST RUN - AUTO-GENERATED PASSWORD
============================================================
  Password: <64-character-hex-string>
============================================================

Server started on port 3000
API available at http://localhost:3000
```

**Important:** Copy the password shown above!

### Terminal 2: Start Web UI (Dev Mode)
```bash
cd v2/packages/web
bun run dev
```

**Expected Output:**
```
VITE v5.4.21  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Open Browser
```
http://localhost:5173/?password=<PASTE_PASSWORD_HERE>
```

Replace `<PASTE_PASSWORD_HERE>` with the password from Terminal 1.

---

## Test Sequence

### Test 1: First Run - Loading & Auth ✓

**Expected Behavior:**
1. Page loads and shows "Connecting to backend..."
2. Auto-login with password from query param
3. Detects no settings configured
4. Automatically redirects to Settings page

**What to Check:**
- [ ] Loading screen appears briefly
- [ ] No authentication errors
- [ ] Redirects to Settings page (URL becomes `#settings`)

---

### Test 2: Settings Configuration ✓

**On the Settings page:**

1. **Enter your Home Assistant details:**
   - URL: `http://homeassistant.local:8123` (or your HA URL)
   - Access Token: Paste your long-lived access token

2. **Click "Test Connection"**
   
   **Expected:**
   - Button shows "Testing..." with spinner
   - After 1-2 seconds: Green success message
   - Message shows: "Connected to Home Assistant X.X.X"

3. **Click "Save Settings"**
   
   **Expected:**
   - Button shows "Saving..." with spinner
   - Green success message: "Settings saved successfully!"
   - After 2 seconds: Auto-redirect to Chat page

**What to Check:**
- [ ] URL validation works (try invalid URL first)
- [ ] Test Connection validates before showing success
- [ ] Settings are saved
- [ ] Auto-redirect to chat after save

---

### Test 3: Chat Interface - First Message ✓

**On the Chat page:**

1. **Send a simple query:**
   - Type: `What time is it?`
   - Press Enter (or click Send)

   **Expected:**
   - Message appears in chat as blue bubble (user)
   - "Assistant is thinking..." appears with spinner
   - After 1-3 seconds: Assistant response appears
   - Response shows current time

2. **Check message display:**
   - User messages: Blue bubble, right-aligned
   - Assistant messages: Gray bubble, left-aligned, "Assistant" label
   - Timestamps: "Just now" or "X minutes ago"

**What to Check:**
- [ ] User message appears immediately
- [ ] Loading indicator shows during execution
- [ ] Assistant response appears correctly
- [ ] Timestamps are displayed
- [ ] Messages aligned correctly

---

### Test 4: Chat Persistence ✓

1. **Refresh the page** (F5 or Ctrl+R)
   
   **Expected:**
   - Loading screen appears
   - Auto-login works (password still in URL)
   - Chat page loads (not settings - already configured)
   - **Previous conversation is still there!**

2. **Check localStorage:**
   - Open DevTools → Application → Local Storage
   - Should see keys starting with `ha-assist:`
   - Check `ha-assist:conversation` contains your messages

**What to Check:**
- [ ] Conversation persists across refresh
- [ ] Conversation ID maintained
- [ ] localStorage keys use correct prefix

---

### Test 5: Multi-Turn Conversation ✓

1. **Send a follow-up question:**
   - First: `Turn on the office lights`
   - Wait for response
   - Then: `Turn them off`

   **Expected:**
   - First command executes successfully
   - Second command uses conversation context (knows "them" = office lights)
   - Conversation ID maintained across both messages

**What to Check:**
- [ ] Both commands execute
- [ ] Context is maintained
- [ ] Conversation ID stays the same

---

### Test 6: Clear History ✓

1. **Click "Clear History" button** (top left of chat)
   
   **Expected:**
   - Confirmation dialog appears: "Are you sure..."
   - Click OK
   - All messages disappear
   - Empty state shows: "Welcome to Home Assistant Assist"
   - localStorage cleared

**What to Check:**
- [ ] Confirmation required
- [ ] Messages cleared
- [ ] Empty state shown
- [ ] localStorage updated

---

### Test 7: Error Handling ✓

1. **Test invalid command:**
   - Type: `asdfghjkl random nonsense 12345`
   - Send

   **Expected:**
   - Assistant responds with error or confusion message
   - Error displayed as red bubble in center

2. **Test with backend stopped:**
   - Stop the backend (Ctrl+C in Terminal 1)
   - Try to send a message

   **Expected:**
   - Red reconnection banner appears at top
   - Error message in chat: "Error: Failed to fetch..."
   - Retry button in banner

3. **Test backend reconnection:**
   - Restart backend in Terminal 1
   - Click "Reconnect" in banner
   
   **Expected:**
   - Banner disappears
   - Can send messages again

**What to Check:**
- [ ] Invalid commands handled gracefully
- [ ] Backend disconnection detected
- [ ] Reconnect banner works
- [ ] Messages queued/handled properly

---

### Test 8: Settings Update ✓

1. **Navigate to Settings** (click Settings in header)
2. **Change HA URL** to different instance (if you have one)
3. **Test Connection** with new URL
4. **Save**
5. **Return to Chat**
6. **Send message**

   **Expected:**
   - New HA instance used for messages
   - Chat history preserved
   - Conversation ID reset (different instance)

**What to Check:**
- [ ] Settings can be updated
- [ ] Chat works with new settings
- [ ] History maintained

---

## Production Build Testing

### Build & Serve
```bash
cd v2
bun run build
bun run web --port 3000
```

### Access
```
http://localhost:3000/?password=<PASSWORD>
```

**What to Check:**
- [ ] Production build works identically to dev
- [ ] Static files served correctly
- [ ] No console errors
- [ ] Performance is good

---

## Edge Cases to Test

### 1. Long Messages
- Send a message with 500+ characters
- Expected: Message wraps correctly, doesn't break layout

### 2. Fast Consecutive Messages
- Type message, send
- Immediately type another, send
- Expected: Both messages queue and execute

### 3. Special Characters
- Send: `Test "quotes" and 'apostrophes'`
- Send: `Test <html> tags & symbols`
- Expected: Characters displayed correctly, no XSS

### 4. Empty Input
- Try to send empty message
- Expected: Button disabled, cannot send

### 5. Page Refresh During Send
- Send message
- Immediately refresh page
- Expected: Message might be lost but app doesn't crash

---

## Browser Console

Monitor for errors in browser DevTools (F12):

**Expected:**
- No console errors during normal operation
- Warnings for network errors (expected when backend stops)
- API calls visible in Network tab

**Network Tab Should Show:**
- `POST /api/auth/login` → 200
- `GET /api/settings` → 200
- `PUT /api/settings` → 200
- `POST /api/settings/test-connection` → 200
- `GET /api/pipelines` → 200 (if pipeline selection added)
- `POST /api/pipelines/run-text` → 200

---

## Known Issues / Expected Behavior

1. **Access Token Display**: Settings page won't show saved token (security), user must re-enter to change

2. **Pipeline Selection**: Not implemented yet - uses first available pipeline

3. **Streaming**: Responses appear all at once (not streaming)

4. **Markdown**: Plain text only (no formatting)

5. **Voice**: Not implemented (Phase 4)

---

## Success Criteria

Phase 2 is complete when ALL of these work:

✅ **Authentication**
- [ ] Password query param works
- [ ] Auto-login successful
- [ ] Backend API calls authenticated

✅ **First Run**
- [ ] Redirects to settings
- [ ] Shows helpful instructions

✅ **Settings**
- [ ] Load empty settings initially
- [ ] Test Connection validates HA
- [ ] Save settings and redirect to chat
- [ ] Settings persist across refresh

✅ **Chat**
- [ ] Send messages to HA
- [ ] Display responses correctly
- [ ] Conversation context maintained
- [ ] History persists across refresh
- [ ] Clear history works

✅ **Error Handling**
- [ ] Backend disconnection detected
- [ ] Reconnect banner works
- [ ] Invalid HA credentials show error
- [ ] Network errors handled gracefully

✅ **Production**
- [ ] Build succeeds
- [ ] Static serving works
- [ ] Performance acceptable

---

## Troubleshooting

### "No password provided" Error
- Check URL has `?password=XXX`
- Check password matches backend output

### "Authentication failed" Error
- Restart backend to get new password
- Ensure password copied correctly (all 64 characters)

### "Home Assistant not configured" Error
- Go to Settings
- Enter HA URL and token
- Save settings

### Connection Test Fails
- Verify HA URL is accessible from your computer
- Try opening HA URL in browser
- Check access token is valid
- Check HA instance is running

### Messages Don't Send
- Check backend is running (Terminal 1)
- Check Network tab for errors
- Check HA settings are saved
- Try refreshing page

---

## Next Steps After Testing

If all tests pass:
- ✅ Phase 2 is COMPLETE!
- Ready for Phase 3: Desktop Integration
- Or continue with Phase 2.5: Pipeline selection UI

If tests fail:
- Note which tests fail
- Check browser console for errors
- Check backend terminal for errors
- Report issues for fixes
