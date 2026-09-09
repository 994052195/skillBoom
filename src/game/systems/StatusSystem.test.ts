import { describe, expect, it, vi } from 'vitest';
import type { Enemy } from '../entities/Enemy';
import { StatusSystem } from './StatusSystem';

describe('StatusSystem airborne state', () => {
  function fakeEnemy(isAlive = () => true): Enemy {
    return {
      isAlive,
      setAirborneVisual: vi.fn(),
    } as unknown as Enemy;
  }

  it('refreshes airborne instead of stacking timers', () => {
    const status = new StatusSystem();
    const enemy = fakeEnemy();

    status.applyAirborne(enemy, 700);
    status.update(500);
    status.applyAirborne(enemy, 700);
    status.update(700);

    expect(status.isAirborne(enemy)).toBe(false);
    expect(enemy.setAirborneVisual).toHaveBeenLastCalledWith(false, 0);
  });

  it('clears airborne on one enemy or all enemies', () => {
    const status = new StatusSystem();
    const first = fakeEnemy();
    const second = fakeEnemy();

    status.applyAirborne(first, 700);
    status.applyAirborne(second, 700);
    status.clear(first);

    expect(status.isAirborne(first)).toBe(false);
    expect(status.isAirborne(second)).toBe(true);
    expect(first.setAirborneVisual).toHaveBeenLastCalledWith(false, 0);

    status.clearAll();

    expect(status.isAirborne(second)).toBe(false);
    expect(second.setAirborneVisual).toHaveBeenLastCalledWith(false, 0);
  });

  it('removes airborne from dead enemies during update', () => {
    let alive = true;
    const status = new StatusSystem();
    const enemy = fakeEnemy(() => alive);

    status.applyAirborne(enemy, 700);
    alive = false;
    status.update(100);

    expect(status.isAirborne(enemy)).toBe(false);
    expect(enemy.setAirborneVisual).toHaveBeenLastCalledWith(false, 0);
  });
});
