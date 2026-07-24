# Formcheck architecture

## Product boundary

Formcheck has two primary surfaces:

- A zoomable calisthenics progression map.
- A local exercise-specific form checker.

It deliberately excludes workout planning, workout logs, streaks, XP, social features, accounts, subscriptions, and nutrition tracking.

## Desktop packaging

The application uses Tauri 2 to package a React and TypeScript interface into Windows NSIS (`.exe`) and MSI installers. The frontend is built by Vite and displayed using the Windows WebView2 runtime.

## Offline pose analysis

The build script copies the MediaPipe Tasks Vision WebAssembly files into the packaged frontend and downloads the lightweight pose model during development or CI. The resulting installed application does not need the internet to run pose detection.

Video sources:

1. Laptop webcam through `getUserMedia`.
2. A local video file, including a video recorded with a phone and transferred to the laptop.

No Formcheck service receives or stores camera frames.

## Form-rule structure

Pose landmarks are converted into exercise-specific measurements rather than using one generic score. The initial templates measure:

- Push-up: elbow phase, lockout, depth, and shoulder–hip–ankle alignment.
- Squat: knee phase, depth, standing lockout, and torso lean.
- Plank: body line, hip offset, and clean hold time.
- Handstand: elbow lockout, shoulder opening, body line, vertical deviation, and clean hold time.
- Front lever: elbow lockout, body line, angle from horizontal, hip position, and clean hold time.

Each additional exercise should be implemented as a separate rule function with its own camera instructions and acceptable ranges.

## Skill data

Skills are stored as structured data containing:

- Position in the map
- Category and difficulty
- Prerequisites and following progressions
- Performance standard
- Technique cues
- Common mistakes
- Optional form-analyzer mapping

The interface derives all map edges from prerequisites, making it possible to extend the tree without rewriting the graph component.

## Planned extension

A later phone pairing feature can expose a temporary local-network capture page and transfer a recording directly to the desktop. It must remain optional and function without a cloud account.
