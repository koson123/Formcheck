# Superhuman Atlas Architecture

## Product direction

Superhuman Atlas is a local-first progression system for real-world capability. The application should feel like a large role-playing skill tree, but its progress must represent useful human ability rather than artificial engagement.

The original Formcheck features remain a specialized Movement Lab. This lets future domains add their own labs—such as a focus timer, memory trainer, electronics bench, emergency drill runner, or project workspace—without forcing every skill into the same interaction.

## Current architecture

### Desktop shell

- Tauri 2 packages the application for Windows.
- React and TypeScript provide the interface.
- Existing MediaPipe processing remains local.
- Progress is stored in browser local storage for the foundation release.

### Atlas data

`src/data/atlas/` contains one module per domain and a shared index.

The compact blueprint format stores:

- domain
- path
- path goal
- ten ordered skill names

The shared index derives consistent application records containing:

- stable ID
- tier
- prerequisite
- proof standard
- estimated learning effort
- maintenance cost
- power rating
- synergy rating
- Golden Path membership

This keeps the 1,000-node backbone reviewable and prevents a single enormous hand-edited data file.

### Progress model

Each skill can be ranked from 0 through 5:

0. Locked or not started
1. Discovered
2. Capable
3. Reliable
4. Advanced
5. Mastered

Most users should target Reliable. Advanced and Mastered remain optional.

The local progress document currently stores:

- ranks by skill ID
- three active skill IDs
- notes and evidence by skill ID
- completed quest IDs
- bonus XP

### Quest model

Daily missions are generated from the current three-skill loadout. Weekly boss quests emphasize combination tests, projects, and maintenance. Quest completion currently uses an honor system because most real-world evidence cannot be verified automatically without intrusive tracking.

### Movement Lab

The existing calisthenics map and camera analyzer remain intact and are mounted inside the Atlas shell. Skills with supported movement names can open the correct analyzer directly.

## Expansion model

Every core skill should eventually open an expandable skill card with:

- a precise definition
- safety notes
- prerequisite checks
- beginner drills
- practical quests
- a proof test for each rank
- maintenance guidance
- recommended resources
- related skills
- combination unlocks
- optional achievements

Unique content should be added progressively rather than filling cards with generic text merely to claim completion.

## Planned milestones

### Milestone 1 — Foundation

- Complete 1,000-node backbone
- Command center
- Global atlas explorer
- Golden Path
- Rank and XP model
- Active loadouts
- Generated quests
- Local notes
- Preserved Movement Lab
- Windows CI and installers

### Milestone 2 — Durable progression

- Versioned persistence layer
- Export and import
- Automatic migrations
- Custom skills and quests
- Seasons and maintenance reminders
- Better achievement and title system

### Milestone 3 — Deep skill cards

- Unique drills and proof standards
- Resource library
- Project templates
- Safety and equipment guidance
- Combination abilities
- Personalized route recommendations

### Milestone 4 — Specialized labs

- Focus and learning lab
- Memory review system
- Builder project workspace
- Emergency drill mode
- Communication practice tools
- Expanded movement analyzers

### Milestone 5 — Optional ecosystem

- Optional encrypted sync
- Mobile companion
- Shared challenge packs
- Community-created expansions with moderation
- Plugin interface for new labs and data packs

## Non-goals

- Punishing streak systems
- Infinite low-value XP farming
- Requiring mastery of all 1,000 skills
- Uploading camera footage by default
- Turning private progress into a mandatory social network
- Claiming that software can automatically verify every real-world ability
