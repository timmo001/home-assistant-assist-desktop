#!/bin/bash
# Phase 2 Manual Testing Script
# This script helps verify the backend and web UI work together

set -e

echo "============================================"
echo "Phase 2 Manual Testing"
echo "============================================"
echo ""

# Clean config for fresh start
echo "1. Cleaning config directory..."
rm -rf ~/.config/ha-assist
echo "   ✓ Config cleaned"
echo ""

# Start backend in background
echo "2. Starting backend server on port 3000..."
cd "$(dirname "$0")"
bun run backend --port 3000 > /tmp/ha-assist-backend.log 2>&1 &
BACKEND_PID=$!
echo "   ✓ Backend started (PID: $BACKEND_PID)"
echo "   ✓ Logs: /tmp/ha-assist-backend.log"
echo ""

# Wait for backend to start and password to appear in logs
echo "3. Waiting for backend to be ready and password to appear..."
PASSWORD=""
for i in {1..15}; do
  # Check if health endpoint is responding
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    # Give it a moment for the password to be written to logs
    sleep 0.5
    # Try to extract password from logs
    PASSWORD=$(grep "Password:" /tmp/ha-assist-backend.log | sed 's/^[[:space:]]*//' | awk '{print $2}')
    if [ -n "$PASSWORD" ]; then
      echo "   ✓ Backend is ready!"
      break
    fi
  fi
  if [ $i -eq 15 ]; then
    echo "   ✗ Backend failed to start or password not found"
    echo "   Log contents:"
    cat /tmp/ha-assist-backend.log
    kill $BACKEND_PID 2>/dev/null
    exit 1
  fi
  sleep 1
done
echo ""

# Verify password was extracted
echo "4. Verifying auto-generated password..."
if [ -z "$PASSWORD" ]; then
  echo "   ✗ Failed to extract password"
  echo "   Log contents:"
  cat /tmp/ha-assist-backend.log
  kill $BACKEND_PID 2>/dev/null
  exit 1
fi
echo "   ✓ Password: $PASSWORD"
echo ""

# Test backend endpoints
echo "5. Testing backend endpoints..."
echo "   - Health check..."
if curl -s http://localhost:3000/health | grep -q "ok"; then
  echo "     ✓ Health check passed"
else
  echo "     ✗ Health check failed"
fi

echo "   - Login with password..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$PASSWORD\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "     ✗ Login failed"
  kill $BACKEND_PID 2>/dev/null
  exit 1
fi
echo "     ✓ Login successful, token: ${TOKEN:0:20}..."

echo "   - Get settings (should be empty)..."
if curl -s http://localhost:3000/api/settings \
  -H "Authorization: Bearer $TOKEN" | grep -q "null"; then
  echo "     ✓ Settings endpoint working"
else
  echo "     ✗ Settings endpoint failed"
fi
echo ""

echo "============================================"
echo "Backend Testing Complete!"
echo "============================================"
echo ""
echo "Next Steps:"
echo ""
echo "1. Start the web UI dev server:"
echo "   cd packages/web && bun run dev"
echo ""
echo "2. Open in browser:"
echo "   http://localhost:5173/?password=$PASSWORD"
echo ""
echo "3. Follow the test scenarios in PHASE2-TESTING.md"
echo ""
echo "4. When done testing, stop the backend:"
echo "   kill $BACKEND_PID"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Backend logs: /tmp/ha-assist-backend.log"
echo ""
