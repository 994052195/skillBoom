import { describe, expect, it } from 'vitest';
import { minimapMarkers } from './minimap';

describe('minimap world state', () => {
  it('maps live enemies and the player with radius-safe edges and elite colors', () => {
    const enemy = (x: number, kind: 'melee-minion' | 'ember-buff', alive = true) => ({ x, y: 2000, kind, isAlive: () => alive });
    const markers = minimapMarkers({ x: 4000, y: 0 }, [enemy(1000, 'melee-minion'), enemy(3000, 'ember-buff'), enemy(2000, 'melee-minion', false)], 100);
    expect(markers).toHaveLength(3);
    expect(markers[0].x).toBeCloseTo(25);
    expect(markers[1].x).toBeCloseTo(75);
    expect(markers[1].color).not.toBe(markers[0].color);
    expect(markers[2].x + markers[2].radius).toBeLessThanOrEqual(100);
    expect(markers[2].y - markers[2].radius).toBeGreaterThanOrEqual(0);
  });

  it('moves the player dot and removes killed enemies on the next update', () => {
    const enemy = { x: 2000, y: 2000, kind: 'melee-minion' as const, isAlive: () => false };
    const before = minimapMarkers({ x: 1000, y: 1000 }, [], 100);
    const after = minimapMarkers({ x: 3000, y: 3000 }, [enemy], 100);
    expect(after).toHaveLength(1);
    expect(after[0].x - before[0].x).toBe(50);
    expect(after[0].y - before[0].y).toBe(50);
  });
});
