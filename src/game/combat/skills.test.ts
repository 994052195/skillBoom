import { describe, expect, it } from 'vitest';
import { ProjectileHits, segmentCircleTime, orbitPosition, BladeHits } from './skills';

describe('piercing shots', () => {
  it('hits each target once and stops after the allowed distinct targets', () => {
    const hits = new ProjectileHits(1);
    const first = {};
    expect(hits.hit(first)).toBe(true);
    expect(hits.hit(first)).toBe(false);
    expect(hits.exhausted).toBe(false);
    expect(hits.hit({})).toBe(true);
    expect(hits.exhausted).toBe(true);
    expect(hits.hit({})).toBe(false);
  });

  it('detects targets crossed between frames and orders entry points', () => {
    const start = { x: 0, y: 0 };
    const end = { x: 200, y: 0 };
    const near = segmentCircleTime(start, end, { x: 50, y: 0 }, 10)!;
    const far = segmentCircleTime(start, end, { x: 150, y: 0 }, 10)!;
    expect(near).toBeCloseTo(0.2);
    expect(near).toBeLessThan(far);
    expect(segmentCircleTime(start, end, { x: 50, y: 30 }, 10)).toBeNull();
    expect(segmentCircleTime(start, start, start, 10)).toBe(0);
  });
});

describe('orbit blades', () => {
  it('evenly spaces blades around a moving owner', () => {
    const first = orbitPosition({ x: 100, y: 100 }, 0, 0, 2, 80);
    const second = orbitPosition({ x: 100, y: 100 }, 0, 1, 2, 80);
    expect(first).toEqual({ x: 180, y: 100 });
    expect(second.x).toBeCloseTo(20);
    expect(second.y).toBeCloseTo(100);
  });

  it('limits contact damage per enemy using battle time', () => {
    const hits = new BladeHits(500);
    const enemy = {};
    expect(hits.hit(enemy, 0)).toBe(true);
    expect(hits.hit(enemy, 0)).toBe(false);
    expect(hits.hit(enemy, 499)).toBe(false);
    expect(hits.hit({}, 499)).toBe(true);
    expect(hits.hit(enemy, 500)).toBe(true);
  });
});
