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
});
