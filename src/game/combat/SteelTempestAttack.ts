import Phaser from 'phaser';
import { WORLD_BOUNDS } from '../config';
import type { Enemy } from '../entities/Enemy';
import { SlashWave } from '../entities/SlashWave';
import { Tornado } from '../entities/Tornado';
import type { StatusSystem } from '../systems/StatusSystem';
import type { CombatStats, Targetable } from '../types';
import type { AttackPattern } from './AttackPattern';
import { advanceWindStacks } from './steelTempest';

export class SteelTempestAttack implements AttackPattern {
  public readonly id = 'steel-tempest' as const;
  private readonly slashes: SlashWave[] = [];
  private readonly tornadoes: Tornado[] = [];
  private currentWindStacks = 0;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Targetable,
    private readonly statusSystem: StatusSystem,
  ) {}

  public get windStacks(): number {
    return this.currentWindStacks;
  }

  public get activeTornadoCount(): number {
    return this.tornadoes.filter((tornado) => tornado.isAlive()).length;
  }

  public attack(target: Targetable, stats: CombatStats): void {
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
    const volleyHits = new WeakSet<Enemy>();
    for (const offset of fanOffsets(stats.projectileCount, Phaser.Math.DegToRad(12))) {
      this.slashes.push(new SlashWave(this.scene, this.player, angle + offset, stats, volleyHits));
    }

    const wind = advanceWindStacks(this.currentWindStacks);
    this.currentWindStacks = wind.next;
    if (wind.firesTornado) {
      this.tornadoes.push(new Tornado(this.scene, this.player, angle, stats));
    }
  }

  public update(deltaMs: number, enemies: readonly Enemy[], damageEnemy: (enemy: Enemy, damage: number) => void): void {
    for (const slash of this.slashes) {
      slash.update(deltaMs);
      slash.resolveHits(enemies, damageEnemy);
    }

    for (const tornado of this.tornadoes) {
      tornado.update(deltaMs);
      tornado.resolveHits(enemies, damageEnemy, this.statusSystem);
    }

    this.removeInactiveAttacks();
  }

  public destroy(): void {
    for (const slash of this.slashes) {
      slash.destroy();
    }
    for (const tornado of this.tornadoes) {
      tornado.destroy();
    }

    this.slashes.length = 0;
    this.tornadoes.length = 0;
  }

  private removeInactiveAttacks(): void {
    for (let index = this.slashes.length - 1; index >= 0; index -= 1) {
      if (!this.slashes[index].isAlive()) {
        this.slashes.splice(index, 1);
      }
    }

    for (let index = this.tornadoes.length - 1; index >= 0; index -= 1) {
      if (this.tornadoes[index].isExpired(WORLD_BOUNDS)) {
        this.tornadoes[index].destroy();
        this.tornadoes.splice(index, 1);
      }
    }
  }
}

function fanOffsets(count: number, spread: number): number[] {
  const midpoint = (count - 1) / 2;
  return Array.from({ length: count }, (_, index) => (index - midpoint) * spread);
}
