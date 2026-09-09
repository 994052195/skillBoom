export interface Vector2Like {
  x: number;
  y: number;
}

export interface WorldBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Targetable extends Vector2Like {
  readonly radius: number;
  isAlive(): boolean;
}

export interface Damageable {
  readonly health: number;
  isAlive(): boolean;
  takeDamage(amount: number): boolean;
}

export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export type EnemyKind = 'melee-minion' | 'caster-minion' | 'cannon-minion' | 'ember-buff' | 'crystal-buff';

export interface EnemySpawn {
  x: number;
  y: number;
  kind: EnemyKind;
}

export type UpgradeId =
  | 'rapid-fire'
  | 'power-shot'
  | 'multishot'
  | 'swift-projectiles'
  | 'quickstep'
  | 'vital-core'
  | 'piercing-shot'
  | 'orbit-blades'
  | 'steel-tempest'
  | 'tempest-range'
  | 'tempest-force'
  | 'tornado-pierce'
  | 'gale-lift';

export type PrimaryAttackId = 'projectile' | 'steel-tempest';

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
  maxRank: number;
  requires?: UpgradeId;
}

export interface UpgradeChoice extends UpgradeDefinition {
  currentRank: number;
  preview: string;
}

export interface CombatStats {
  primaryAttack: PrimaryAttackId;
  moveSpeed: number;
  attackIntervalMs: number;
  projectileDamage: number;
  projectileSpeed: number;
  projectileCount: number;
  maxHealth: number;
  pierceCount: number;
  bladeCount: number;
  slashLength: number;
  steelTempestBonusDamage: number;
  tornadoPierceCount: number;
  airborneDurationMs: number;
}
