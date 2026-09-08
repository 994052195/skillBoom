import { GAME_BALANCE } from '../config';
import type { GameSystem } from './GameSystem';
import type { UpgradeDefinition, UpgradeId } from '../types';

type RandomSource = () => number;

const UPGRADES: readonly UpgradeDefinition[] = [
  { id: 'rapid-fire', name: '连发核心', description: '攻击间隔缩短 12%' },
  { id: 'power-shot', name: '强击棱镜', description: '投射物伤害 +10' },
  { id: 'multishot', name: '分裂回路', description: '每次攻击额外发射 1 枚投射物' },
  { id: 'swift-projectiles', name: '超导弹道', description: '投射物速度 +16%' },
  { id: 'quickstep', name: '相位步伐', description: '移动速度 +12%' },
  { id: 'vital-core', name: '生命核心', description: '最大生命 +25，并恢复 25 生命' },
];

export class UpgradeSystem implements GameSystem {
  private experience = 0;
  private level = 1;
  private requiredExperience: number = GAME_BALANCE.firstLevelExperience;
  private choices: UpgradeDefinition[] = [];

  public constructor(private readonly random: RandomSource = Math.random) {}

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
    return Math.min(1, this.experience / this.requiredExperience);
  }

  public get isChoosing(): boolean {
    return this.choices.length > 0;
  }

  public get availableUpgrades(): readonly UpgradeDefinition[] {
    return this.choices;
  }

  public addExperience(amount: number): boolean {
    if (amount <= 0) {
      return false;
    }

    this.experience += amount;
    return this.openChoiceIfReady();
  }

  public selectUpgrade(id: UpgradeId): UpgradeDefinition | null {
    const selected = this.choices.find((choice) => choice.id === id) ?? null;
    if (selected === null) {
      return null;
    }

    this.experience -= this.requiredExperience;
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

    const pool = [...UPGRADES];
    while (this.choices.length < 3 && pool.length > 0) {
      const index = Math.floor(this.random() * pool.length);
      this.choices.push(pool.splice(index, 1)[0]);
    }
    return true;
  }
}
