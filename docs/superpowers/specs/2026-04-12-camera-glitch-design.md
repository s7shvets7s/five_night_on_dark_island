# Camera Glitch Mechanic — Specification

## Overview

Random camera malfunction adds tension and punishes poor attention. When a camera breaks, a mini-game appears requiring the player to click numbers in order.

## Difficulty Scaling

| Night | Break Chance | Numbers Count | Direction |
|-------|--------------|----------------|-----------|
| 1-2   | 2%           | 3              | random    |
| 3-4   | 5%           | 4              | random    |
| 5-7   | 10-15%       | 5              | random    |

- **Break check interval**: random 8-15 seconds
- **Direction**: Green circles = ascending (1→2→3...), Red circles = descending (3→2→1...)
- **Numbers**: random arrangement on screen

## Gameplay Flow

1. Every 8-15 seconds, random break check occurs
2. If camera breaks → mini-game appears immediately
3. Player can:
   - **Solve immediately**: click numbers in correct order
   - **Leave and return later**: new numbers generate when returning
   - **Switch to other cameras**: can still monitor other rooms (broken camera shows static)
4. **On correct click**: camera restored, proceed normal
5. **On wrong click**: -4% power, new numbers appear
6. Process repeats until solved or power depleted

## Visual Design

- Numbers displayed as circles (44px minimum touch target)
- Green circles: ascending order
- Red circles: descending order
- Numbers randomly positioned within camera view area
- Static/noise overlay on broken camera when not in mini-game

## Technical Implementation

- `CameraSystem.js`: Add `_glitched` state, break check timer
- New `CameraGlitchMiniGame` system for rendering numbers and handling input
- Integration via `NightScene.js`: pass power system reference for penalty
- Config in `gameConfig.js`: per-night difficulty values

## Acceptance Criteria

- [ ] Camera randomly breaks during gameplay
- [ ] Mini-game shows numbers in circles (green=ascending, red=descending)
- [ ] Clicking correct order restores camera
- [ ] Wrong click = -4% power + new numbers
- [ ] Leaving without starting = no penalty
- [ ] Can return and solve later with new numbers
- [ ] Difficulty scales with night number
- [ ] Power penalty applies correctly
