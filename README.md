# Home Assistant Assist - Desktop

This is a desktop app for [Home Assistant](https://www.home-assistant.io) Assist. It is built using [Tauri](https://tauri.app) and [Svelte](https://svelte.dev).

Compatible with Windows, MacOS, and Linux.

You can find out more about Home Assistant Assist [here](https://www.home-assistant.io/voice_control/).

## Features

- Speech to text
- Text to speech
- Assist pipeline picker
- Toggle with keyboard shortcuts
  - `Alt + A` to toggle window
  - `Alt + Shift + A` to trigger voice pipelines.
- System tray icon
  - `Left click` to toggle window
  - `Right click` to open context menu

## Installation

You can download the latest release from the [releases](https://github.com/timmo001/home-assistant-assist-desktop/releases) page.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/)
- [Rust](https://www.rust-lang.org/)

### Setup

```bash
yarn install
```

### Running

```bash
yarn tauri dev
```

### Building

```bash
yarn tauri build
```

## Attributions

A lot of the assist code is based on the Home Assistant frontend code. Here are some of the files which were used:

https://github.com/home-assistant/frontend/blob/dev/src/dialogs/voice-command-dialog/ha-voice-command-dialog.ts

https://github.com/home-assistant/frontend/blob/dev/src/util/audio-recorder.ts

https://github.com/home-assistant/frontend/blob/dev/src/data/conversation.ts
