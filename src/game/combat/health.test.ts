import { describe, expect, it } from 'vitest';
import { Health } from './health';

describe('Health', () => {
  it('marks the owner dead when damage exhausts health', () => {
    const health = new Health(40);

    expect(health.takeDamage(40)).toBe(true);
    expect(health.current).toBe(0);
    expect(health.isAlive()).toBe(false);
  });

  it('ignores non-positive damage', () => {
    const health = new Health(40);

    expect(health.takeDamage(-10)).toBe(false);
    expect(health.current).toBe(40);
  });
});
