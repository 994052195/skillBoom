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
