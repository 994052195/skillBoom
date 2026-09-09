# Steel Tempest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Steel Tempest as a random reward that replaces default projectile attacks with slash volleys and a tornado on every third cast.

**Architecture:** `GameScene` owns an `AttackPattern`; `ProjectileAttack` retains the existing behavior and `SteelTempestAttack` owns slash and tornado Graphics. `StatusSystem` owns airborne state so enemy movement, contact damage, rendering, and future status effects remain separate from the scene.

**Tech Stack:** TypeScript 5, Phaser 3, Vite, Vitest.

## Global Constraints

- Keep the 4000 by 4000 Phaser Graphics world and add no image or audio assets.
- Attack stacks count casts, never multishot lines. Cast three fires one tornado and resets to zero.
- A slash volley hits an enemy once; a tornado hits three distinct enemies by default.
- Airborne lasts 700ms, disables pursuit and contact damage, and refreshes on a later tornado hit.
- Preserve current projectile, piercing, orbit blade, touch-control, minimap, experience, death, and restart behavior.
- Do not use League of Legends art, audio, character models, or other protected assets.

---

### Task 1: Add combat data and reusable airborne state

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/config.ts`
- Create: `src/game/combat/steelTempest.ts`
- Create: `src/game/combat/steelTempest.test.ts`
- Modify: `src/game/entities/Enemy.ts`
- Modify: `src/game/systems/StatusSystem.ts`
- Create: `src/game/systems/StatusSystem.test.ts`

**Interfaces:**
- Produces `PrimaryAttackId = 'projectile' | 'steel-tempest'`.
- Adds `primaryAttack`, `slashLength`, `steelTempestBonusDamage`, `tornadoPierceCount`, and `airborneDurationMs` to `CombatStats`.
- Produces `advanceWindStacks(current)` and `StatusSystem.applyAirborne(enemy, durationMs)`, `isAirborne(enemy)`, `clear(enemy)`, and `clearAll()`.

- [ ] **Step 1: Write failing pure and status tests**

```ts
it('fires on every third cast', () => {
  expect(advanceWindStacks(0)).toEqual({ next: 1, firesTornado: false });
  expect(advanceWindStacks(1)).toEqual({ next: 2, firesTornado: false });
  expect(advanceWindStacks(2)).toEqual({ next: 0, firesTornado: true });
});

it('refreshes airborne instead of stacking timers', () => {
  const status = new StatusSystem();
  const enemy = {} as Enemy;
  status.applyAirborne(enemy, 700);
  status.update(500);
  status.applyAirborne(enemy, 700);
  status.update(700);
  expect(status.isAirborne(enemy)).toBe(false);
});
```

- [ ] **Step 2: Verify tests fail**

Run: `npm test -- src/game/combat/steelTempest.test.ts src/game/systems/StatusSystem.test.ts`

Expected: FAIL because the helpers and status methods do not exist.

- [ ] **Step 3: Implement configuration, helper, state map, and visual hook**

```ts
export const STEEL_TEMPEST_BALANCE = {
  slashLength: 320, slashWidth: 36, slashLifetimeMs: 100,
  tornadoPierceCount: 3, airborneDurationMs: 700,
} as const;

export function advanceWindStacks(current: number): { next: number; firesTornado: boolean } {
  return current + 1 === 3 ? { next: 0, firesTornado: true } : { next: current + 1, firesTornado: false };
}
```

`StatusSystem` uses `Map<Enemy, { remainingMs: number; durationMs: number }>` and calls `enemy.setAirborneVisual(active, remainingRatio)`. The hook changes only display offset, rotation, alpha, and highlight; it never changes an enemy's world position, health, speed, or kind.

- [ ] **Step 4: Verify tests pass**

Run: `npm test -- src/game/combat/steelTempest.test.ts src/game/systems/StatusSystem.test.ts src/game/combat/health.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/types.ts src/game/config.ts src/game/combat/steelTempest.ts src/game/combat/steelTempest.test.ts src/game/entities/Enemy.ts src/game/systems/StatusSystem.ts src/game/systems/StatusSystem.test.ts
git commit -m "feat: add steel tempest combat state"
```

### Task 2: Extract the existing projectile behavior behind AttackPattern

**Files:**
- Create: `src/game/combat/AttackPattern.ts`
- Create: `src/game/combat/ProjectileAttack.ts`
- Create: `src/game/combat/ProjectileAttack.test.ts`
- Modify: `src/game/entities/Player.ts`
- Modify: `src/game/scenes/GameScene.ts`

**Interfaces:**
- Produces `AttackPattern` with `id`, `attack(target, stats)`, `update(deltaMs, enemies, damageEnemy)`, and `destroy()`.
- `Player` produces `canAttack(nowMs)` and `markAttack(nowMs)`; it no longer directly creates projectiles.

- [ ] **Step 1: Write the failing adapter test**

```ts
it('creates one projectile per projectileCount with the requested pierce count', () => {
  const attack = new ProjectileAttack(scene, player);
  attack.attack(target, { ...statsFor({}), projectileCount: 3, pierceCount: 2 });
  expect(attack.activeProjectileCount).toBe(3);
  expect(attack.projectilePierceCounts()).toEqual([2, 2, 2]);
});
```

- [ ] **Step 2: Verify test fails**

Run: `npm test -- src/game/combat/ProjectileAttack.test.ts`

Expected: FAIL because `ProjectileAttack` is absent.

- [ ] **Step 3: Implement the interface and migrate current behavior**

```ts
export interface AttackPattern {
  readonly id: PrimaryAttackId;
  attack(target: Targetable, stats: CombatStats): void;
  update(deltaMs: number, enemies: readonly Enemy[], damageEnemy: (enemy: Enemy, damage: number) => void): void;
  destroy(): void;
}

public canAttack(nowMs: number): boolean {
  return this.isAlive() && nowMs - this.lastAttackAt >= this.stats.attackIntervalMs;
}
```

Move projectile creation, movement, swept contact ordering, pierce accounting, expiry, and Graphics destruction from `GameScene` into `ProjectileAttack`. `GameScene` finds nearest target, marks the cast, and delegates to the active pattern through its existing `damageEnemy` callback.

- [ ] **Step 4: Verify projectile regression tests**

Run: `npm test -- src/game/combat/ProjectileAttack.test.ts src/game/combat/skills.test.ts src/game/combat/core.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/combat/AttackPattern.ts src/game/combat/ProjectileAttack.ts src/game/combat/ProjectileAttack.test.ts src/game/entities/Player.ts src/game/scenes/GameScene.ts
git commit -m "refactor: route attacks through patterns"
```

### Task 3: Build SlashWave, Tornado, and Steel Tempest pattern

**Files:**
- Create: `src/game/entities/SlashWave.ts`
- Create: `src/game/entities/Tornado.ts`
- Create: `src/game/combat/SteelTempestAttack.ts`
- Create: `src/game/combat/SteelTempestAttack.test.ts`

**Interfaces:**
- `SteelTempestAttack` implements `AttackPattern` and exposes read-only `windStacks` and `activeTornadoCount` for tests.
- `SlashWave` uses a shared `WeakSet<Enemy>` for a full multishot volley.
- `Tornado` uses path-ordered swept collisions and calls `StatusSystem.applyAirborne` after common damage.

- [ ] **Step 1: Write failing behavior tests**

```ts
it('spawns one tornado on the third cast only', () => {
  attack.attack(target, stats);
  attack.attack(target, stats);
  expect(attack.activeTornadoCount).toBe(0);
  attack.attack(target, stats);
  expect(attack.activeTornadoCount).toBe(1);
  expect(attack.windStacks).toBe(0);
});

it('damages an overlapped enemy once per three-line volley', () => {
  attack.attack(target, { ...stats, projectileCount: 3 });
  attack.update(16, [enemy], damageEnemy);
  expect(damageEnemy).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Verify tests fail**

Run: `npm test -- src/game/combat/SteelTempestAttack.test.ts`

Expected: FAIL because the pattern and entities are absent.

- [ ] **Step 3: Implement entity lifetime, collisions, and damage**

```ts
public attack(target: Targetable, stats: CombatStats): void {
  const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
  const hits = new WeakSet<Enemy>();
  for (const offset of fanOffsets(stats.projectileCount, Phaser.Math.DegToRad(12))) {
    this.slashes.push(new SlashWave(this.scene, this.player, angle + offset, stats, hits));
  }
  const wind = advanceWindStacks(this.windStacks);
  this.windStacks = wind.next;
  if (wind.firesTornado) this.tornadoes.push(new Tornado(this.scene, this.player, angle, stats));
}
```

`SlashWave` draws a 100ms cyan/gold forward line and tests a finite 320px by 36px capsule. `Tornado` moves at `stats.projectileSpeed`, records distinct hit targets, destroys itself at `stats.tornadoPierceCount`, and applies `stats.airborneDurationMs`. Both destroy Graphics when inactive or when `SteelTempestAttack.destroy()` is called.

- [ ] **Step 4: Verify focused combat tests**

Run: `npm test -- src/game/combat/SteelTempestAttack.test.ts src/game/combat/steelTempest.test.ts src/game/systems/StatusSystem.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/entities/SlashWave.ts src/game/entities/Tornado.ts src/game/combat/SteelTempestAttack.ts src/game/combat/SteelTempestAttack.test.ts
git commit -m "feat: add steel tempest attacks"
```

### Task 4: Add random reward eligibility, scene switching, HUD, and end-to-end checks

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/systems/upgrades.ts`
- Modify: `src/game/systems/UpgradeSystem.ts`
- Modify: `src/game/systems/UpgradeSystem.test.ts`
- Modify: `src/game/scenes/GameScene.ts`
- Modify: `src/game/ui/BattleHud.ts`
- Modify: `tests/browser/logic.js`
- Modify: `README.md`

**Interfaces:**
- Adds upgrade ids `steel-tempest`, `tempest-range`, `tempest-force`, `tornado-pierce`, and `gale-lift`.
- Adds optional `requires: UpgradeId` to `UpgradeDefinition` and `isEligibleUpgrade(definition, ranks)`.
- `GameScene.setAttackPattern(stats)` replaces and destroys the old pattern when `stats.primaryAttack` changes.

- [ ] **Step 1: Write failing reward and browser-regression checks**

```ts
it('keeps dedicated Steel Tempest upgrades locked until the skill is selected', () => {
  const steelTempest = UPGRADES.find((entry) => entry.id === 'steel-tempest')!;
  const tempestRange = UPGRADES.find((entry) => entry.id === 'tempest-range')!;
  expect(isEligibleUpgrade(steelTempest, {})).toBe(true);
  expect(isEligibleUpgrade(tempestRange, {})).toBe(false);
  expect(isEligibleUpgrade(tempestRange, { 'steel-tempest': 1 })).toBe(true);
  expect(statsFor({ 'steel-tempest': 1 }).primaryAttack).toBe('steel-tempest');
});
```

```js
test('airborne target cannot cause contact damage', async () => {
  await hitEnemyWithTornado(scene, enemy);
  const health = scene.player.health;
  advanceScene(scene, 350);
  assert.equal(scene.player.health, health);
});
```

- [ ] **Step 2: Verify checks fail**

Run: `npm test -- src/game/systems/UpgradeSystem.test.ts`

Expected: FAIL because conditional rewards are absent.

Open: `http://127.0.0.1:5173/tests/browser/logic.html`

Expected: the new browser assertion fails before scene integration.

- [ ] **Step 3: Implement reward pool, switching, and cleanup**

```ts
private setAttackPattern(stats: CombatStats): void {
  if (this.attackPattern.id === stats.primaryAttack) return;
  this.attackPattern.destroy();
  this.attackPattern = stats.primaryAttack === 'steel-tempest'
    ? new SteelTempestAttack(this, this.player, this.statusSystem)
    : new ProjectileAttack(this, this.player);
}
```

Before random selection, filter upgrades by `requires` and max rank. `statsFor` and `previewUpgrade` must support all five Steel Tempest upgrades. After selecting an upgrade, apply stats and call `setAttackPattern`. Skip `statusSystem.isAirborne(enemy)` in enemy movement and contact-damage loops. Clear statuses and destroy the pattern on scene shutdown, death, restart, and attack replacement. Update the first HUD slot label/icon for `primaryAttack === 'steel-tempest'` and document the new reward and controls in README.

- [ ] **Step 4: Run complete verification**

Run: `npm test`

Expected: all Vitest suites PASS.

Run: `npm run build`

Expected: TypeScript and Vite build PASS; the existing Phaser bundle-size warning is non-blocking.

Run: `git diff --check`

Expected: no whitespace errors.

Open `http://127.0.0.1:5173/` and verify slash volleys, one tornado per third cast, lifted enemies pausing and recovering, and restart without orphan Graphics.

- [ ] **Step 5: Commit integration**

```bash
git add src/game/types.ts src/game/systems/upgrades.ts src/game/systems/UpgradeSystem.ts src/game/systems/UpgradeSystem.test.ts src/game/scenes/GameScene.ts src/game/ui/BattleHud.ts tests/browser/logic.js README.md
git commit -m "feat: integrate steel tempest reward loop"
```

## Plan Self-Review

- Spec coverage: Tasks 1 and 3 cover cast counting, slash collision, multishot de-duplication, tornado pierce, and airborne. Task 4 covers random reward gating, upgrades, UI, lifecycle cleanup, and browser verification.
- Placeholder scan: every task includes exact files, concrete interfaces, a failing test, commands, expected output, implementation details, and commit scope.
- Type consistency: `PrimaryAttackId`, `CombatStats.primaryAttack`, `AttackPattern`, `StatusSystem.applyAirborne`, `SlashWave`, and `Tornado` use the same names throughout.
