# Formcheck

Formcheck is an offline Windows calisthenics reference with two focused tools:

1. A large, zoomable skill progression map inspired by roadmap-style calisthenics sites.
2. An exercise-specific form checker using the laptop webcam or a locally imported video recorded on a phone.

It is intentionally **not** a workout planner, workout log, social network, streak app, XP system, or subscription service.

## Current features

- Interactive skill tree with push, pull, balance, core, legs, mobility, planche, lever, handstand, muscle-up, and compression branches.
- Prerequisites, standards, cues, common mistakes, and next progressions for each node.
- Fully local MediaPipe pose detection.
- Initial form templates for:
  - Push-up
  - Bodyweight squat
  - Plank
  - Handstand
  - Front lever
- Laptop webcam mode.
- Recorded-video mode for clips made with a phone camera.
- Automatic GitHub Actions build that produces Windows `.exe` and `.msi` installers.

## Privacy and offline behavior

The packaged app includes the MediaPipe WebAssembly runtime and pose model. Camera frames and selected videos are processed on the device and are not uploaded by Formcheck.

The first development install downloads the official pose model once so it can be bundled into the final app. The installed Windows app then works offline.

## Local development on Windows

Install:

- Node.js 22 or newer
- Rust stable using rustup
- Microsoft C++ Build Tools with the Desktop development with C++ workload
- WebView2, which is included with modern Windows 10 and Windows 11

Then run:

```powershell
npm install
npm run tauri dev
```

Build installers:

```powershell
npm run build
```

The installers will be created under:

```text
src-tauri\target\release\bundle\nsis\
src-tauri\target\release\bundle\msi\
```

## Getting the GitHub-built `.exe`

Open the repository's **Actions** tab, select **Build Windows app**, open the newest successful run, and download the `Formcheck-Windows` artifact.

## Scope of the first release

Laptop-camera analysis is the primary mode. Phone footage can be recorded on the phone and imported locally. Direct phone-to-laptop pairing over the local network is planned as a later offline feature.
