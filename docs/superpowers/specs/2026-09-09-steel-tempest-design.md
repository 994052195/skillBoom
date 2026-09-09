# Steel Tempest Attack Design

## Goal

Add Steel Tempest as a random-reward primary attack pattern. Selecting it replaces the default round projectile attack with linear slashes and a tornado on every third attack.

The scope is limited to the slash, tornado, and airborne status. Upgrade-card weights, new enemy families, and other hero skills are excluded.

## Player Experience

- Auto attacks still target the nearest living enemy.
- Each attack releases a short-lived linear slash toward that target.
- Multishot adds more slash lines in a narrow fan.
- Each completed attack adds one wind stack. The third attack resets the stack and also fires a tornado in the center direction.
- A tornado hit lifts an enemy briefly, preventing pursuit and contact damage until it recovers.

## Initial Rules

| Item | Initial rule |
| --- | --- |
| Slash length | 320px |
| Slash width | 36px |
| Slash lifetime | About 100ms |
| Slash damage | Current player damage |
| Multishot | One additional slash per rank in a narrow fan |
| Per-attack hits | An enemy takes damage at most once from one slash volley |
| Wind stacks | Count attacks, not slash lines |
| Tornado trigger | Every third attack |
| Tornado damage | Current player damage |
| Tornado pierce | Three distinct enemies |
| Airborne duration | 700ms |

Attack speed reduces the attack interval. Damage improves both slash and tornado damage. Multishot widens coverage without changing wind-stack frequency. Projectile speed increases tornado travel speed.

## Module Boundaries

```text
combat/
  AttackPattern.ts          Primary attack interface
  ProjectileAttack.ts       Adapter for the existing projectile attack
  SteelTempestAttack.ts     Slashes, wind stacks, and tornado trigger
entities/
  SlashWave.ts              One linear slash hit area and rendering
  Tornado.ts                Moving, piercing tornado entity
systems/
  StatusSystem.ts           Apply, update, and query enemy statuses
```

`GameScene` only invokes the active `AttackPattern` and supplies player position, enemies, and the common damage callback. It does not own slash, stack, tornado, pierce, or airborne decisions.

`SteelTempestAttack` creates slashes in the resolved attack direction, records `windStacks`, and creates the tornado on the third cast. `SlashWave` uses swept segment or capsule-vs-circle tests. All lines in one volley share a hit ledger so a fanned attack cannot hurt the same enemy twice.

`Tornado` reuses the existing projectile movement and swept-collision model. It tracks hit targets and remaining pierce count. A hit goes through the common damage callback and `StatusSystem.applyAirborne`.

## Airborne Status

`StatusSystem` stores temporary status per enemy. Its first status is `airborne`.

- Airborne enemies do not run pursuit movement.
- Airborne enemies cannot inflict contact damage.
- Rendering shows lift, rotation, and a highlight.
- A later tornado hit refreshes the remaining airborne time instead of creating competing timers.

Status records clear when an enemy dies or when the game restarts. Future slow, burn, and root statuses reuse this system instead of adding enemy-specific booleans.

## Rewards And Upgrades

Steel Tempest is a skill reward. Selecting it replaces the primary attack pattern. Dedicated upgrades become eligible only after the player owns it:

- Increase slash length.
- Increase Steel Tempest damage.
- Increase tornado pierce targets.
- Increase airborne duration.

Existing upgrade weights are unchanged in this scope.

## Acceptance Checks

- The first two casts create slashes only; the third also creates one tornado and resets wind stacks.
- A fanned volley cannot damage the same enemy more than once.
- The tornado hits distinct enemies in path order and destroys itself at its pierce limit.
- Airborne enemies neither pursue nor cause contact damage, then recover normally.
- Death, restart, and changing the attack pattern leave no slash, tornado, or status records behind.
- Existing projectile, piercing, orbit-blade, and upgrade-selection tests remain green.

## Non-Goals

- Do not use League of Legends art, audio, character models, or other assets.
- Do not add a full hero roster, manual casting, aiming UI, or cooldown UI.
- Do not change enemy spawn pacing or experience-drop behavior.
