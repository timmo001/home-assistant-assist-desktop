# Quick Test Reference

## 🚀 Quick Start (3 Steps)

### 1. Start Backend + Get Password
```bash
cd /home/aidan/repos/home-assistant/home-assistant-assist-desktop/v2
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

## ✅ Quick Test Checklist

- [ ] Auto-login works (no password prompt)
- [ ] Settings page loads first
- [ ] Enter HA URL and token
- [ ] "Test Connection" succeeds
- [ ] "Save Settings" redirects to chat
- [ ] Send message: "What time is it?"
- [ ] Response received from HA
- [ ] Refresh page (F5) - history persists
- [ ] Send follow-up message - context works

**All checked?** Phase 2 is complete! 🎉

---

## 🧹 Clean Up

```bash
# Stop backend
kill $(lsof -t -i:3000)

# Stop web dev server
# Press Ctrl+C in terminal

# Reset config (optional)
rm -rf ~/.config/ha-assist
```

---

## 🐛 Quick Debug

### Backend not starting?
```bash
cat /tmp/ha-assist-backend.log
lsof -i :3000  # Check what's using port 3000
```

### Web UI shows errors?
- F12 → Console tab
- Check for red errors
- Verify backend is running: `curl http://localhost:3000/health`

### HA connection fails?
```bash
# Test HA directly
curl http://your-ha-url:8123/api/
```

---

## 📚 Full Documentation

- **Complete Testing Guide:** `TESTING-GUIDE.md`
- **API Documentation:** `packages/backend/API.md`
- **Phase 2 Completion Report:** `PHASE2-COMPLETE.md`
- **Original Test Scenarios:** `PHASE2-TESTING.md`

