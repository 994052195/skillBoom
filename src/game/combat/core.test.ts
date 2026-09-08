import { describe, expect, it } from 'vitest';
import { circlesOverlap } from './collision';
import { clampPosition, getMovementVector } from './movement';
import { findClosestTarget } from './targeting';
import type { Targetable, WorldBounds } from '../types';

const bounds: WorldBounds = { x: 0, y: 0, width: 100, height: 100 };

const target = (x: number, y: number, alive = true): Targetable => ({
  x,
  y,
  radius: 5,
  isAlive: () => alive,
});

describe('movement', () => {
  it('normalizes diagonal movement to the requested speed', () => {
    const vector = getMovementVector({ up: false, down: true, left: false, right: true }, 260);

    expect(Math.hypot(vector.x, vector.y)).toBeCloseTo(260);
  });

  it('clamps a position inside world bounds using the entity radius', () => {
    expect(clampPosition({ x: -10, y: 130 }, bounds, 12)).toEqual({ x: 12, y: 88 });
  });
});

describe('collision', () => {
  it('detects overlapping circular entities', () => {
    expect(circlesOverlap(target(0, 0), target(8, 0))).toBe(true);
    expect(circlesOverlap(target(0, 0), target(11, 0))).toBe(false);
  });
});

describe('targeting', () => {
  it('selects the closest living target', () => {
    const closest = findClosestTarget({ x: 0, y: 0 }, [target(30, 0), target(8, 0), target(4, 0, false)]);

    expect(closest).toMatchObject({ x: 8, y: 0 });
  });

  it('returns null when every target is dead', () => {
    expect(findClosestTarget({ x: 0, y: 0 }, [target(3, 0, false)])).toBeNull();
  });
});
