# @ha-assist/desktop

Desktop wrapper for Home Assistant Assist using Tauri 2.x.

## Structure

- `src/` - TypeScript frontend code
  - `main.ts` - Desktop entry point that connects to backend
- `src-tauri/` - Rust backend code
  - `src/lib.rs` - Main Tauri application logic
  - `src/main.rs` - Entry point
  - `tauri.conf.json` - Tauri configuration
  - `Cargo.toml` - Rust dependencies

## Development

```bash
# Install dependencies
bun install

# Run in dev mode
bun run tauri dev
```

## Build

```bash
# Build for production
bun run tauri build
```

## TODO

- [ ] Implement backend sidecar spawning
- [ ] Add backend health checking
- [ ] Integrate with @ha-assist/web package
- [ ] Add system tray functionality
- [ ] Add keyboard shortcuts
- [ ] Create proper app icons
- [ ] Add auto-updater
