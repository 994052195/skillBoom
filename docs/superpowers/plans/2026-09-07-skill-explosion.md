# 技能大爆炸 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Phaser 3, TypeScript, and Vite 2D top-down roguelike combat prototype with modular entities and no UI or asset pipeline.

**Architecture:** `GameScene` coordinates a player, enemies, projectiles, and an enemy spawner. Each visual entity is a Phaser `Graphics` object, while movement, collision, targeting, and health remain in small, testable TypeScript modules. Future game systems live behind a shared `GameSystem` interface without affecting the initial battle loop.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest.

## Global Constraints

- Display name: `技能大爆炸`; npm package name: `skill-explosion`.
- All actor visuals use Phaser Graphics; no image or audio assets.
- World bounds are exactly 4000 by 4000.
- No upgrade, active-skill, or status behavior in this iteration; a display-only combat HUD is included.
- GitHub destination is a new public repository owned by the account signed into the browser.

---

### Task 1: Scaffold the Vite and Phaser project

**Files:** package configuration, Vite configuration, TypeScript configuration, root HTML, startup module, global CSS, and `.gitignore`.

- [ ] Install Phaser, TypeScript, Vite, Vitest, and JSDOM.
- [ ] Configure `npm run dev`, `npm run build`, and `npm test`.
- [ ] Configure a full-window canvas host with no in-game HUD or menu.

### Task 2: Add pure combat primitives through tests

**Files:** `src/game/types.ts`, `src/game/config.ts`, and `src/game/combat/*`.

- [ ] Test and implement normalized WASD movement, world-bound clamping, circular collision, closest-target selection, and health state.
- [ ] Keep tunable combat values in one config module.

### Task 3: Build modular Graphics entities

**Files:** `src/game/entities/Player.ts`, `Enemy.ts`, and `Projectile.ts`.

- [ ] Use cyan player, original MOBA-inspired melee/caster/cannon minions, red/blue buff monsters, and yellow projectiles over a dark neon world.
- [ ] Player moves, takes protected contact damage, and fires at the closest enemy every 500ms.
- [ ] Enemy tracks player and dies at zero health.
- [ ] Projectile flies to a frozen direction, damages one enemy, and expires outside the world.

### Task 4: Add spawning and scene orchestration

**Files:** `src/game/spawning/EnemySpawner.ts` and `src/game/scenes/GameScene.ts`.

- [ ] Spawn up to 150 enemies every second in a bounded annulus around the player.
- [ ] Follow the player with a bounded Phaser camera.
- [ ] Update entities, apply collision rules, and destroy inactive Graphics each frame.

### Task 5: Reserve future system seams and verify

**Files:** `src/game/systems/*`, README, and test files.

- [ ] Add empty `SkillSystem`, `UpgradeSystem`, and `StatusSystem` implementations behind `GameSystem`.
- [ ] Run the full test suite and production build.
- [ ] Start the dev server and visually verify movement, follow camera, spawn, pursuit, damage, automatic projectiles, and the HUD.

### Task 6: Initialize Git and publish

- [ ] Initialize a `main` branch and commit the complete project.
- [ ] Create public GitHub repository `技能大爆炸` from the browser account, set the remote, and push `main`.
