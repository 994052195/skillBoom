import { describe, expect, it } from 'vitest';
import { GAME_BALANCE } from '../config';
import { UpgradeSystem } from './UpgradeSystem';

describe('UpgradeSystem', () => {
  it('opens three distinct choices after reaching the experience threshold', () => {
    const upgrades = new UpgradeSystem(() => 0);

    expect(upgrades.addExperience(GAME_BALANCE.firstLevelExperience - 1)).toBe(false);
    expect(upgrades.isChoosing).toBe(false);

    expect(upgrades.addExperience(1)).toBe(true);
    expect(upgrades.availableUpgrades).toHaveLength(3);
    expect(new Set(upgrades.availableUpgrades.map((choice) => choice.id)).size).toBe(3);
  });

  it('applies one level at a time and preserves excess experience', () => {
    const upgrades = new UpgradeSystem(() => 0);
    upgrades.addExperience(GAME_BALANCE.firstLevelExperience + 2);
    const selected = upgrades.availableUpgrades[0];

    expect(upgrades.selectUpgrade(selected.id)).toEqual(selected);
    expect(upgrades.currentLevel).toBe(2);
    expect(upgrades.currentExperience).toBe(2);
    expect(upgrades.isChoosing).toBe(false);
  });

  it('shows actual before/after values and removes capped upgrades', () => {
    const upgrades = new UpgradeSystem(() => 0);
    for (let rank = 0; rank < 5; rank += 1) {
      upgrades.addExperience(upgrades.experienceToNextLevel);
      const choice = upgrades.availableUpgrades.find((entry) => entry.id === 'rapid-fire')!;
      expect(choice.currentRank).toBe(rank);
      expect(choice.maxRank).toBe(5);
      expect(choice.preview).toContain('→');
      upgrades.selectUpgrade(choice.id);
    }
    upgrades.addExperience(upgrades.experienceToNextLevel);
    expect(upgrades.availableUpgrades.some((entry) => entry.id === 'rapid-fire')).toBe(false);
    expect(upgrades.stats.attackIntervalMs).toBe(264);
  });

  it('offers fewer choices near completion, exhausts the pool without a modal, and resets per run', () => {
    const upgrades = new UpgradeSystem(() => 0);
    const counts = new Map<string, number>();
    let sawShortPool = false;
    for (let step = 0; step < 40 && !upgrades.isMaxed; step += 1) {
      upgrades.addExperience(upgrades.experienceToNextLevel);
      const choices = upgrades.availableUpgrades;
      expect(choices.length).toBeGreaterThan(0);
      if (choices.length < 3) sawShortPool = true;
      const selected = choices[0];
      counts.set(selected.id, (counts.get(selected.id) ?? 0) + 1);
      upgrades.selectUpgrade(selected.id);
    }
    expect(upgrades.isMaxed).toBe(true);
    expect(sawShortPool).toBe(true);
    expect(counts.get('piercing-shot')).toBe(3);
    expect(counts.get('orbit-blades')).toBe(3);
    expect(upgrades.stats.projectileCount).toBe(5);
    expect(upgrades.stats.pierceCount).toBe(3);
    expect(upgrades.stats.bladeCount).toBe(3);
    upgrades.addExperience(100000);
    expect(upgrades.isChoosing).toBe(false);
    expect(upgrades.availableUpgrades).toEqual([]);
    const fresh = new UpgradeSystem();
    expect(fresh.stats.bladeCount).toBe(0);
    expect(fresh.stats.pierceCount).toBe(0);
  });

  it('rejects stale selections and invalid experience without changing stats', () => {
    const upgrades = new UpgradeSystem(() => 0);
    upgrades.addExperience(Number.NaN);
    upgrades.addExperience(Infinity);
    expect(upgrades.currentExperience).toBe(0);
    expect(upgrades.selectUpgrade('orbit-blades')).toBeNull();
    upgrades.addExperience(6);
    upgrades.selectUpgrade('rapid-fire');
    expect(upgrades.selectUpgrade('rapid-fire')).toBeNull();
    expect(upgrades.stats.attackIntervalMs).toBe(440);
  });

  it('chains excess experience choices with updated previews', () => {
    const upgrades = new UpgradeSystem(() => 0.99999);
    upgrades.addExperience(30);
    expect(upgrades.availableUpgrades[0].preview).toContain('0 → 1');
    upgrades.selectUpgrade('orbit-blades');
    expect(upgrades.isChoosing).toBe(true);
    expect(upgrades.availableUpgrades[0].preview).toContain('1 → 2');
    upgrades.selectUpgrade('orbit-blades');
    upgrades.selectUpgrade('orbit-blades');
    expect(upgrades.stats.bladeCount).toBe(3);
    expect(upgrades.currentExperience).toBe(5);
    expect(upgrades.isChoosing).toBe(false);
  });
});
