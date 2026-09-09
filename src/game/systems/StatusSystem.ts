import type { GameSystem } from './GameSystem';
import type { Enemy } from '../entities/Enemy';

interface AirborneState {
  remainingMs: number;
  durationMs: number;
}

export class StatusSystem implements GameSystem {
  private readonly airborne = new Map<Enemy, AirborneState>();

  public applyAirborne(enemy: Enemy, durationMs: number): void {
    if (!enemy.isAlive() || durationMs <= 0) {
      this.clear(enemy);
      return;
    }

    this.airborne.set(enemy, { remainingMs: durationMs, durationMs });
    enemy.setAirborneVisual(true, 1);
  }

  public isAirborne(enemy: Enemy): boolean {
    return this.airborne.has(enemy);
  }

  public clear(enemy: Enemy): void {
    if (!this.airborne.delete(enemy)) {
      return;
    }

    enemy.setAirborneVisual(false, 0);
  }

  public clearAll(): void {
    for (const enemy of this.airborne.keys()) {
      enemy.setAirborneVisual(false, 0);
    }

    this.airborne.clear();
  }

  public update(deltaMs: number): void {
    for (const [enemy, state] of this.airborne) {
      if (!enemy.isAlive()) {
        this.clear(enemy);
        continue;
      }

      state.remainingMs -= deltaMs;
      if (state.remainingMs <= 0) {
        this.clear(enemy);
        continue;
      }

      enemy.setAirborneVisual(true, state.remainingMs / state.durationMs);
    }
  }
}
