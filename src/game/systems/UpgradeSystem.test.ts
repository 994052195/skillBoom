import { describe, expect, it } from 'vitest';
import { GAME_BALANCE } from '../config';
import { UpgradeSystem } from './UpgradeSystem';
import { UPGRADES, isEligibleUpgrade, previewUpgrade, statsFor } from './upgrades';

describe('UpgradeSystem', () => {
  it('keeps dedicated Steel Tempest upgrades locked until the skill is selected', () => {
    const steelTempest = UPGRADES.find((entry) => entry.id === 'steel-tempest')!;
    const tempestRange = UPGRADES.find((entry) => entry.id === 'tempest-range')!;

    expect(isEligibleUpgrade(steelTempest, {})).toBe(true);
    expect(isEligibleUpgrade(tempestRange, {})).toBe(false);
    expect(isEligibleUpgrade(tempestRange, { 'steel-tempest': 1 })).toBe(true);
    expect(statsFor({ 'steel-tempest': 1 }).primaryAttack).toBe('steel-tempest');
  });

  it('applies Steel Tempest stat upgrades and previews their real values', () => {
    expect(statsFor({ 'steel-tempest': 1, 'tempest-range': 4 }).slashLength).toBe(560);
    expect(statsFor({ 'steel-tempest': 1, 'tempest-force': 5 }).steelTempestBonusDamage).toBe(50);
    expect(statsFor({ 'steel-tempest': 1, 'tornado-pierce': 3 }).tornadoPierceCount).toBe(6);
    expect(statsFor({ 'steel-tempest': 1, 'gale-lift': 3 }).airborneDurationMs).toBe(1150);
    expect(statsFor({ 'steel-tempest': 1, 'piercing-shot': 2 }).tornadoPierceCount).toBe(5);
    expect(previewUpgrade('tempest-range', { 'steel-tempest': 1 })).toContain('320 → 380px');
  });

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
    const totalRanks = UPGRADES.reduce((sum, entry) => sum + entry.maxRank, 0);
    for (let step = 0; step < totalRanks && !upgrades.isMaxed; step += 1) {
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
    expect(upgrades.stats.primaryAttack).toBe('steel-tempest');
    expect(upgrades.stats.tornadoPierceCount).toBe(9);
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
    const upgrades = new UpgradeSystem(() => 0.83);
    upgrades.addExperience(30);
    const firstOrbit = upgrades.availableUpgrades.find((entry) => entry.id === 'orbit-blades')!;
    expect(firstOrbit.preview).toContain('0 → 1');
    upgrades.selectUpgrade(firstOrbit.id);
    expect(upgrades.isChoosing).toBe(true);
    const secondOrbit = upgrades.availableUpgrades.find((entry) => entry.id === 'orbit-blades')!;
    expect(secondOrbit.preview).toContain('1 → 2');
    upgrades.selectUpgrade('orbit-blades');
    upgrades.selectUpgrade('orbit-blades');
    expect(upgrades.stats.bladeCount).toBe(3);
    expect(upgrades.currentExperience).toBe(5);
    expect(upgrades.isChoosing).toBe(false);
  });
});
