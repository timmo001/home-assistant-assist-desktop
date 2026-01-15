# @ha-assist/backend

Backend server for Home Assistant Assist Desktop v2.

## Overview

Hono-based backend server that provides:
- REST API for authentication and settings
- WebSocket proxy for Home Assistant connections
- Assist Pipeline integration
- Local configuration management

## Structure

```
src/
├── index.ts          # CLI entry point
├── server.ts         # Hono server setup
├── config.ts         # Config file management
├── routes/
│   ├── auth.ts       # Authentication endpoints
│   ├── settings.ts   # Settings endpoints
│   └── ha.ts         # Home Assistant proxy endpoints
└── ha/
    └── client.ts     # Home Assistant WebSocket client
```

## Usage

### Development

```bash
bun run dev
```

### Build

```bash
bun run build
```

### Commands

- `ha-assist backend` - Start backend server only
- `ha-assist web` - Start web frontend only (not yet implemented)
- `ha-assist desktop` - Start desktop app (not yet implemented)
- `ha-assist dev` - Start all services in dev mode

## Configuration

Configuration is stored in `~/.ha-assist/config.json`:

```json
{
  "homeAssistant": {
    "host": "homeassistant.local",
    "port": 8123,
    "ssl": true,
    "accessToken": "your-token"
  },
  "backend": {
    "port": 3000
  },
  "version": "2.0.0"
}
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/login` - Authenticate with Home Assistant
- `POST /api/auth/logout` - Clear credentials
- `GET /api/auth/status` - Check auth status

### Settings
- `GET /api/settings` - Get all settings
- `PATCH /api/settings` - Update settings

### Home Assistant (Stubs)
- `GET /api/ha/status` - Connection status
- `GET /api/ha/pipelines` - List assist pipelines
- `POST /api/ha/assist` - Run assist pipeline

## TODO

- [ ] Implement encryption for stored access tokens
- [ ] Complete Home Assistant WebSocket proxy
- [ ] Add WebSocket endpoint for real-time events
- [ ] Add error handling and validation middleware
- [ ] Add logging system
- [ ] Add tests
