import { GAME_BALANCE } from '../config';
import type { GameSystem } from './GameSystem';
import type { CombatStats, UpgradeChoice, UpgradeId } from '../types';
import { UPGRADES, isEligibleUpgrade, statsFor, previewUpgrade, type UpgradeRanks } from './upgrades';

type RandomSource = () => number;

export class UpgradeSystem implements GameSystem {
  private experience = 0;
  private level = 1;
  private requiredExperience: number = GAME_BALANCE.firstLevelExperience;
  private choices: UpgradeChoice[] = [];
  private readonly ranks: UpgradeRanks = {};

  public constructor(private readonly random: RandomSource = Math.random) {}

  public get stats(): CombatStats { return statsFor(this.ranks); }

  public get isMaxed(): boolean {
    return UPGRADES.every((entry) => !isEligibleUpgrade(entry, this.ranks) || (this.ranks[entry.id] ?? 0) >= entry.maxRank);
  }

  public get currentExperience(): number {
    return this.experience;
  }

  public get experienceToNextLevel(): number {
    return this.requiredExperience;
  }

  public get currentLevel(): number {
    return this.level;
  }

  public get experienceRatio(): number {
    return this.isMaxed ? 1 : Math.min(1, this.experience / this.requiredExperience);
  }

  public get isChoosing(): boolean {
    return this.choices.length > 0;
  }

  public get availableUpgrades(): readonly UpgradeChoice[] {
    return this.choices;
  }

  public addExperience(amount: number): boolean {
    if (!Number.isFinite(amount) || amount <= 0 || this.isMaxed) {
      return false;
    }

    this.experience += amount;
    return this.openChoiceIfReady();
  }

  public selectUpgrade(id: UpgradeId): UpgradeChoice | null {
    const selected = this.choices.find((choice) => choice.id === id) ?? null;
    if (selected === null) {
      return null;
    }

    this.experience -= this.requiredExperience;
    this.ranks[id] = (this.ranks[id] ?? 0) + 1;
    this.level += 1;
    this.requiredExperience = Math.ceil(
      GAME_BALANCE.firstLevelExperience * GAME_BALANCE.experienceLevelGrowth ** (this.level - 1),
    );
    this.choices = [];
    this.openChoiceIfReady();
    return selected;
  }

  public update(_deltaMs: number): void {}

  private openChoiceIfReady(): boolean {
    if (this.choices.length > 0 || this.experience < this.requiredExperience) {
      return false;
    }

    const pool = UPGRADES.filter((entry) => isEligibleUpgrade(entry, this.ranks) && (this.ranks[entry.id] ?? 0) < entry.maxRank);
    if (pool.length === 0) return false;
    while (this.choices.length < 3 && pool.length > 0) {
      const index = Math.floor(this.random() * pool.length);
      const definition = pool.splice(index, 1)[0];
      this.choices.push({ ...definition, currentRank: this.ranks[definition.id] ?? 0,
        preview: previewUpgrade(definition.id, this.ranks) });
    }
    return true;
  }
}
