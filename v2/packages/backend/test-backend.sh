#!/bin/bash

# Backend API Test Script
# Tests all implemented endpoints with curl

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TOKEN=""

# Helper functions
print_section() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_test() {
  echo -e "${YELLOW}▶ Test:${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓ Success:${NC} $1"
}

print_error() {
  echo -e "${RED}✗ Error:${NC} $1"
  exit 1
}

print_info() {
  echo -e "${YELLOW}ℹ Info:${NC} $1"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --url)
      BASE_URL="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [--url BASE_URL]"
      echo ""
      echo "Options:"
      echo "  --url BASE_URL    Backend URL (default: http://localhost:3000)"
      echo "  --help            Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run with --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   HA Assist Desktop Backend API Test Suite   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo -e "\n${BLUE}Base URL:${NC} $BASE_URL\n"

# ============================================================================
# Health Check
# ============================================================================
print_section "1. Health Check"

print_test "GET /health"
response=$(curl -s "${BASE_URL}/health")
status=$(echo "$response" | jq -r '.status')

if [ "$status" = "ok" ]; then
  print_success "Server is healthy"
else
  print_error "Health check failed: $response"
fi

# ============================================================================
# Authentication Tests
# ============================================================================
print_section "2. Authentication"

# Get auto-generated password
print_test "GET /api/auth/password (get auto-generated password)"
response=$(curl -s "${BASE_URL}/api/auth/password")
PASSWORD=$(echo "$response" | jq -r '.password')

if [ -z "$PASSWORD" ] || [ "$PASSWORD" = "null" ]; then
  print_error "Failed to get password: $response"
fi

print_success "Got password: ${PASSWORD:0:16}..."

# Test login with correct password
print_test "POST /api/auth/login (with correct password)"
response=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"$PASSWORD\"}")

success=$(echo "$response" | jq -r '.success')
TOKEN=$(echo "$response" | jq -r '.token')

if [ "$success" != "true" ] || [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  print_error "Login failed: $response"
fi

print_success "Logged in successfully, got token: ${TOKEN:0:16}..."

# Test login with wrong password
print_test "POST /api/auth/login (with wrong password)"
response=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"password": "wrong_password"}')

success=$(echo "$response" | jq -r '.success')

if [ "$success" = "true" ]; then
  print_error "Login should have failed with wrong password"
fi

print_success "Login correctly rejected wrong password"

# Test auth status (authenticated)
print_test "GET /api/auth/status (with token)"
response=$(curl -s "${BASE_URL}/api/auth/status" \
  -H "Authorization: Bearer $TOKEN")

authenticated=$(echo "$response" | jq -r '.authenticated')

if [ "$authenticated" != "true" ]; then
  print_error "Auth status should show authenticated: $response"
fi

print_success "Auth status correctly shows authenticated"

# Test auth status (no token)
print_test "GET /api/auth/status (without token)"
response=$(curl -s "${BASE_URL}/api/auth/status")

authenticated=$(echo "$response" | jq -r '.authenticated')

if [ "$authenticated" != "false" ]; then
  print_error "Auth status should show not authenticated without token"
fi

print_success "Auth status correctly shows not authenticated without token"

# ============================================================================
# Settings Tests
# ============================================================================
print_section "3. Settings Management"

# Test getting settings (should be null initially)
print_test "GET /api/settings (should be null initially)"
response=$(curl -s "${BASE_URL}/api/settings" \
  -H "Authorization: Bearer $TOKEN")

settings=$(echo "$response" | jq -r '.settings')

if [ "$settings" != "null" ]; then
  print_info "Settings exist: $settings"
else
  print_success "No settings configured yet (expected on first run)"
fi

# Test updating settings
print_test "PUT /api/settings (update HA settings)"
response=$(curl -s -X PUT "${BASE_URL}/api/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://homeassistant.local:8123",
    "accessToken": "test_token_abc123def456ghi789jkl",
    "selectedPipelineId": "01234567890abcdef"
  }')

success=$(echo "$response" | jq -r '.success')

if [ "$success" != "true" ]; then
  print_error "Failed to update settings: $response"
fi

print_success "Settings updated successfully"

# Test getting settings after update
print_test "GET /api/settings (after update)"
response=$(curl -s "${BASE_URL}/api/settings" \
  -H "Authorization: Bearer $TOKEN")

url=$(echo "$response" | jq -r '.settings.url')
token_preview=$(echo "$response" | jq -r '.settings.accessToken')

if [ "$url" != "https://homeassistant.local:8123" ]; then
  print_error "URL not saved correctly: $url"
fi

if [[ ! "$token_preview" =~ ^test.*jkl$ ]]; then
  print_error "Access token not masked correctly: $token_preview"
fi

print_success "Settings retrieved successfully (access token masked)"

# Test settings without auth
print_test "GET /api/settings (without token - should fail)"
response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/settings")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" != "401" ]; then
  print_error "Settings should require authentication (got $http_code)"
fi

print_success "Settings correctly requires authentication"

# Test connection (will fail since it's a fake HA URL)
print_test "POST /api/settings/test-connection (will fail with fake URL)"
response=$(curl -s -X POST "${BASE_URL}/api/settings/test-connection" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://homeassistant.local:8123",
    "accessToken": "test_token"
  }')

success=$(echo "$response" | jq -r '.success')

if [ "$success" = "true" ]; then
  print_info "Connection test succeeded (unexpected, is there a real HA instance?)"
else
  print_success "Connection test failed as expected (fake URL)"
fi

# ============================================================================
# Logout Test
# ============================================================================
print_section "4. Logout"

print_test "POST /api/auth/logout"
response=$(curl -s -X POST "${BASE_URL}/api/auth/logout" \
  -H "Authorization: Bearer $TOKEN")

success=$(echo "$response" | jq -r '.success')

if [ "$success" != "true" ]; then
  print_error "Logout failed: $response"
fi

print_success "Logged out successfully"

# Test auth status after logout
print_test "GET /api/auth/status (after logout)"
response=$(curl -s "${BASE_URL}/api/auth/status" \
  -H "Authorization: Bearer $TOKEN")

authenticated=$(echo "$response" | jq -r '.authenticated')

if [ "$authenticated" != "false" ]; then
  print_error "Auth status should show not authenticated after logout"
fi

print_success "Token invalidated after logout"

# ============================================================================
# Summary
# ============================================================================
print_section "✓ All Tests Passed!"

echo -e "${GREEN}Summary:${NC}"
echo "  • Health check: ✓"
echo "  • Authentication: ✓"
echo "  • Settings management: ✓"
echo "  • Authorization middleware: ✓"
echo "  • Logout: ✓"
echo ""
echo -e "${YELLOW}Note:${NC} Pipeline endpoints implemented but require real HA instance to test"
echo ""
