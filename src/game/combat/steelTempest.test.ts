import { describe, expect, it } from 'vitest';
import { STEEL_TEMPEST_BALANCE } from '../config';
import { advanceWindStacks } from './steelTempest';

describe('steel tempest combat data', () => {
  it('exposes the Steel Tempest balance values', () => {
    expect(STEEL_TEMPEST_BALANCE).toEqual({
      slashLength: 320,
      slashWidth: 36,
      slashLifetimeMs: 100,
      tornadoPierceCount: 3,
      airborneDurationMs: 700,
    });
  });

  it('fires on every third cast', () => {
    expect(advanceWindStacks(0)).toEqual({ next: 1, firesTornado: false });
    expect(advanceWindStacks(1)).toEqual({ next: 2, firesTornado: false });
    expect(advanceWindStacks(2)).toEqual({ next: 0, firesTornado: true });
  });
});
