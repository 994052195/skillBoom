import { describe, expect, it } from 'vitest';
import { EnemySpawner } from './EnemySpawner';
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
});
