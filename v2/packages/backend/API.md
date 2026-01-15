# HA Assist Desktop Backend API Documentation

## Base URL

- Development: `http://localhost:3000` (or auto-assigned port)
- Production: Varies by deployment

## Authentication

The API uses Bearer token authentication for protected endpoints.

### Login Flow

1. Get the server password (on first run or from desktop sidecar)
2. Call `POST /api/auth/login` with the password
3. Receive a session token
4. Include token in `Authorization: Bearer <token>` header for protected routes

## Endpoints

### Health Check

#### `GET /health`

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

### Authentication

#### `POST /api/auth/login`

Authenticate with the server password and receive a session token.

**Request:**
```json
{
  "password": "your_password_here"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "9ecc6cc4-f450-41a2-9b1f-8c7d5e4f3a2b",
  "message": "Authenticated successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid password"
}
```

#### `POST /api/auth/logout`

Invalidate the current session token.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### `GET /api/auth/status`

Check if a token is valid.

**Headers:**
- `Authorization: Bearer <token>` (optional)

**Response:**
```json
{
  "authenticated": true
}
```

#### `GET /api/auth/password`

Get the auto-generated server password (only available on first run or before authentication is set up).

**Response:**
```json
{
  "password": "54c906dc94863174c1208fe7e8e305cb7b56033d7223f5e8901f269192fcab5c"
}
```

**Response (Not Available):**
```json
{
  "error": "Password not available"
}
```

---

### Settings Management

All settings endpoints require authentication.

#### `GET /api/settings`

Get the current Home Assistant settings. Access token is masked for security.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "settings": {
    "url": "https://homeassistant.local:8123",
    "accessToken": "test...jkl",
    "selectedPipelineId": "01234567890abcdef"
  }
}
```

or when no settings are configured:

```json
{
  "settings": null
}
```

#### `PUT /api/settings`

Update Home Assistant settings. Data is encrypted before saving to disk.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request:**
```json
{
  "url": "https://homeassistant.local:8123",
  "accessToken": "your_long_lived_access_token",
  "selectedPipelineId": "pipeline_id_optional"
}
```

**Response:**
```json
{
  "success": true
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "URL and access token are required"
}
```

```json
{
  "success": false,
  "error": "Invalid URL format"
}
```

#### `POST /api/settings/test-connection`

Test connection to a Home Assistant instance without saving settings.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request:**
```json
{
  "url": "https://homeassistant.local:8123",
  "accessToken": "your_long_lived_access_token"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Connected to Home Assistant 2024.1.0"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "Connection failed: 401 Unauthorized"
}
```

---

## Not Yet Implemented

The following endpoints are planned but not yet implemented:

### Home Assistant Proxy

- `WS /api/ha/ws` - WebSocket proxy to Home Assistant
- `GET /api/ha/pipelines` - List available assist pipelines

### Pipeline Execution

- `POST /api/pipeline/run-text` - Execute pipeline with text input
- `POST /api/pipeline/run-audio` - Execute pipeline with audio input

---

## Error Responses

### 401 Unauthorized

Returned when authentication is required but not provided or invalid.

```json
{
  "error": "Unauthorized: No token provided"
}
```

```json
{
  "error": "Unauthorized: Invalid or expired token"
}
```

### 400 Bad Request

Returned when the request is malformed or missing required fields.

```json
{
  "success": false,
  "error": "URL and access token are required"
}
```

### 500 Internal Server Error

Returned when an unexpected error occurs on the server.

```json
{
  "success": false,
  "error": "Failed to save settings"
}
```

---

## Security

### Password Storage

Server passwords are hashed using bcrypt (10 rounds) before storage.

### Data Encryption

Sensitive data (Home Assistant URL, access token, pipeline ID) is encrypted using AES-256-GCM before being saved to disk. The encryption key is derived from the server password using PBKDF2 (100,000 iterations, SHA-256).

### Session Tokens

Session tokens are UUIDs stored in memory. They expire after 30 days of inactivity.

---

## Configuration File

Settings are stored in platform-specific locations:
- **Linux**: `~/.config/ha-assist/config.json`
- **macOS**: `~/Library/Application Support/ha-assist/config.json`
- **Windows**: `%APPDATA%/ha-assist/config.json`

Example config structure:

```json
{
  "version": 1,
  "server": {
    "passwordHash": "$2b$10$abc..."
  },
  "homeAssistant": {
    "url": "salt:iv:tag:encrypted_data",
    "accessToken": "salt:iv:tag:encrypted_data",
    "selectedPipelineId": "salt:iv:tag:encrypted_data"
  }
}
```

**Note:** Encrypted fields use the format `salt:iv:tag:encrypted` where all parts are hex-encoded.
