# 技能大爆炸 Design

## Purpose

Create a visual, playable foundation for a 2D top-down roguelike mowing game. This iteration proves movement, camera behavior, enemy pursuit, automatic attacks, projectile hits, entity cleanup, and a display-only battle HUD before adding progression systems.

## Runtime Model

`GameScene` owns entity collections and update ordering. `Player`, `Enemy`, and `Projectile` each own their Graphics rendering and immediate behavior. `EnemySpawner` owns timed, bounded spawn selection. Pure combat utilities provide stable unit-tested behavior for movement, collision, target selection, and health.

## Combat Defaults

| Setting | Value |
| --- | --- |
| World | 4000 x 4000 |
| Player speed / health | 260 / 100 |
| Enemy speed / health | 90 / 40 |
| Enemy contact damage | 10 |
| Spawn interval / cap | 1000ms / 150 |
| Attack interval | 500ms |
| Projectile damage / speed | 20 / 520 |
| Contact protection | 400ms |

## Units And HUD

Enemies use original geometric silhouettes: melee minions, caster minions, cannon minions, a crimson ember brute, and a cobalt crystal guardian. Buff monsters appear on the twelfth spawn and alternate by cycle. The HUD shows player health, a decorative experience bar, elapsed time, kill count, four display-only skill slots, and a schematic minimap. None of these slots grants gameplay effects in this prototype.

## Deferred Systems

`SkillSystem`, `UpgradeSystem`, and `StatusSystem` will conform to a shared `GameSystem` interface. They intentionally have no behavior in this prototype.
