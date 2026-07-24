# Windows build validation

GitHub Actions validates the desktop application on `windows-latest` and uploads both installer formats:

- NSIS `.exe`
- Windows Installer `.msi`

The build installs Node.js and Rust, prepares the bundled MediaPipe WebAssembly runtime and pose model, compiles the TypeScript/Vite frontend, compiles the Tauri Rust shell, and uploads the finished installers as the `Formcheck-Windows` artifact.

Every run also uploads `Formcheck-Build-Log`, including failed runs, so compiler and packaging errors remain available for diagnosis.
