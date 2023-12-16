# Home Assistant Assist - Desktop

This is a desktop app for [Home Assistant](https://www.home-assistant.io) Assist. It is built using [Tauri](https://tauri.app) and [Svelte](https://svelte.dev).

Compatible with Windows, MacOS, and Linux.

You can find out more about Home Assistant Assist [here](https://www.home-assistant.io/voice_control/).

[Community forum post](https://community.home-assistant.io/t/home-assistant-assist-desktop/656737?u=timmo001)

[Discuss project](https://github.com/timmo001/home-assistant-assist-desktop/discussions)

[Report issues](https://github.com/timmo001/home-assistant-assist-desktop/issues)

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

![Screenshot 01](https://community-assets.home-assistant.io/original/4X/b/f/f/bff536dbd616670babbf52ae25940a3d8cb1e2c6.png)

![Screenshot 02](https://community-assets.home-assistant.io/original/4X/b/2/8/b2811c098b857ebc63292b8cd52a5240ea17ae37.png)

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
