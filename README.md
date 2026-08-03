# Superhuman Atlas

Superhuman Atlas is an offline-first Windows progression app for building broad real-world capability without turning life into endless grinding.

It grows the original Formcheck project into a complete skill-development system while preserving Formcheck as the built-in **Movement Lab**.

## Current foundation

- **1,000 named skills** across 10 domains and 100 paths
- Ten-tier progression ladders with explicit prerequisites
- Six proof-based states: Locked, Discovered, Capable, Reliable, Advanced, and Mastered
- A 60-node **Golden Path** focused on maximum capability per hour
- Three-skill active loadouts to prevent overwhelm
- Local XP, levels, evidence notes, proof tests, and progress tracking
- Daily missions and weekly boss quests generated from the active loadout
- Global search across the complete atlas
- Domain readiness and path-level progress summaries
- Existing calisthenics progression map
- Existing local MediaPipe camera analyzer for push-up, squat, plank, handstand, and front lever
- Windows `.exe` and `.msi` builds through GitHub Actions

## The ten domains

1. Physical Engine
2. Movement and Defense
3. Supermind
4. Awareness
5. Communication
6. Technology
7. Builder
8. Survival and Rescue
9. Life Mastery
10. Expression and Influence

Each domain contains 10 paths. Each path contains 10 deliberately ordered skills, creating a 1,000-node backbone that can expand into drills, resources, projects, achievements, and combination abilities.

## Design rules

- **Reliable beats perfect.** Rank 3 is the main target for most abilities.
- **Only three active lines.** The rest of the atlas remains optional.
- **Proof over tapping.** Progress should represent demonstrated ability.
- **Maintenance stays small.** Learned abilities should not consume the future.
- **Offline first.** Progress and camera processing stay on the computer.

## Local development on Windows

Install:

- Node.js 22 or newer
- Rust stable using rustup
- Microsoft C++ Build Tools with the Desktop development with C++ workload
- WebView2, included with modern Windows 10 and Windows 11

Run the development app:

```powershell
npm install
npm run tauri dev
```

Run tests:

```powershell
npm test
```

Build Windows installers:

```powershell
npm run build
```

Installers are created under:

```text
src-tauri\target\release\bundle\nsis\
src-tauri\target\release\bundle\msi\
```

## Privacy

The app uses browser local storage for atlas progress. The packaged MediaPipe runtime processes supported movement footage locally. Camera frames and imported videos are not intentionally uploaded by the application.

## Project status

This branch establishes the complete Atlas backbone and the first usable desktop experience. The architecture is intentionally data-driven so later releases can add unique drills, learning resources, custom quests, achievements, combination unlocks, seasons, export/import, and optional device sync without replacing the core map.
