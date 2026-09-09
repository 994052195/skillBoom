import type { Enemy } from '../entities/Enemy';
import type { CombatStats, PrimaryAttackId, Targetable } from '../types';

export interface AttackPattern {
  readonly id: PrimaryAttackId;
  attack(target: Targetable, stats: CombatStats): void;
  update(deltaMs: number, enemies: readonly Enemy[], damageEnemy: (enemy: Enemy, damage: number) => void): void;
  destroy(): void;
}
