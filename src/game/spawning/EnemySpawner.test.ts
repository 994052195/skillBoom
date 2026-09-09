import { describe, expect, it } from 'vitest';
import { EnemySpawner } from './EnemySpawner';
import { GAME_BALANCE } from '../config';
import type { WorldBounds } from '../types';

const bounds: WorldBounds = { x: 0, y: 0, width: 4000, height: 4000 };

describe('EnemySpawner', () => {
  it('waits for its configured interval before producing a spawn', () => {
    const spawner = new EnemySpawner(() => 0.5);

    expect(spawner.update(999, { x: 2000, y: 2000 }, bounds, 0)).toBeNull();
    expect(spawner.update(1000, { x: 2000, y: 2000 }, bounds, 0)).not.toBeNull();
  });

  it('does not exceed the enemy cap', () => {
    const spawner = new EnemySpawner(() => 0.5);

    expect(spawner.update(1000, { x: 2000, y: 2000 }, bounds, 150)).toBeNull();
  });

  it('keeps generated positions inside world bounds', () => {
    const spawner = new EnemySpawner(() => 0);
    const spawn = spawner.update(1000, { x: 5, y: 5 }, bounds, 0);

    expect(spawn).not.toBeNull();
    expect(spawn?.x).toBeGreaterThanOrEqual(0);
    expect(spawn?.y).toBeGreaterThanOrEqual(0);
    expect(spawn?.x).toBeLessThanOrEqual(4000);
    expect(spawn?.y).toBeLessThanOrEqual(4000);
  });

  it('preserves the safe spawn ring at every edge and corner', () => {
    for (const x of [18, 2000, 3982]) for (const y of [18, 2000, 3982]) {
      for (const roll of [0, 0.125, 0.25, 0.5, 0.625, 0.75, 0.999]) {
        const spawn = new EnemySpawner(() => roll).update(1000, { x, y }, bounds, 0)!;
        expect(spawn).not.toBeNull();
        expect(Math.hypot(spawn.x - x, spawn.y - y)).toBeGreaterThanOrEqual(GAME_BALANCE.spawnMinDistance - 0.001);
        expect(Math.hypot(spawn.x - x, spawn.y - y)).toBeLessThanOrEqual(GAME_BALANCE.spawnMaxDistance + 0.001);
        expect(spawn.x).toBeGreaterThanOrEqual(64);
        expect(spawn.y).toBeGreaterThanOrEqual(64);
        expect(spawn.x).toBeLessThanOrEqual(3936);
        expect(spawn.y).toBeLessThanOrEqual(3936);
      }
    }
  });

  it('skips impossible spawns without spending the elite cadence', () => {
    const spawner = new EnemySpawner(() => 0.5);
    const tiny = { x: 0, y: 0, width: 150, height: 150 };
    expect(spawner.update(1000, { x: 75, y: 75 }, tiny, 0)).toBeNull();
    for (let count = 1; count <= 12; count++) {
      const spawn = spawner.update(1000 + count * 1000, { x: 2000, y: 2000 }, bounds, 0)!;
      expect(spawn.kind).toBe(count === 12 ? 'ember-buff' : 'caster-minion');
    }
  });
});
