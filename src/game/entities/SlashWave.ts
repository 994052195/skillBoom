import Phaser from 'phaser';
import { segmentCircleTime } from '../combat/skills';
import { NEON_COLORS, STEEL_TEMPEST_BALANCE } from '../config';
import type { CombatStats, Targetable, Vector2Like } from '../types';
import type { Enemy } from './Enemy';

export class SlashWave extends Phaser.GameObjects.Graphics {
  public readonly damage: number;
  private readonly start: Vector2Like;
  private readonly end: Vector2Like;
  private elapsedMs = 0;
  private activeSlash = true;
  private graphicsDestroyed = false;

  public constructor(
    scene: Phaser.Scene,
    owner: Targetable,
    angle: number,
    stats: CombatStats,
    private readonly volleyHits: WeakSet<Enemy>,
  ) {
    super(scene);
    this.start = { x: owner.x, y: owner.y };
    this.end = {
      x: owner.x + Math.cos(angle) * stats.slashLength,
      y: owner.y + Math.sin(angle) * stats.slashLength,
    };
    this.damage = stats.projectileDamage + stats.steelTempestBonusDamage;
    this.setPosition(owner.x, owner.y);
    this.setRotation(angle);
    this.setDepth(16);
    scene.add.existing(this);
    this.redraw(stats.slashLength);
  }

  public isAlive(): boolean {
    return this.activeSlash;
  }

  public update(deltaMs: number): void {
    if (!this.activeSlash) {
      return;
    }

    this.elapsedMs += Math.max(0, deltaMs);
    if (this.elapsedMs >= STEEL_TEMPEST_BALANCE.slashLifetimeMs) {
      this.destroy();
    }
  }

  public resolveHits(enemies: readonly Enemy[], damageEnemy: (enemy: Enemy, damage: number) => void): void {
    if (!this.activeSlash) {
      return;
    }

    for (const enemy of enemies) {
      if (!enemy.isAlive() || this.volleyHits.has(enemy)) {
        continue;
      }

      const hit = segmentCircleTime(
        this.start,
        this.end,
        enemy,
        STEEL_TEMPEST_BALANCE.slashWidth / 2 + enemy.radius,
      );
      if (hit === null) {
        continue;
      }

      this.volleyHits.add(enemy);
      damageEnemy(enemy, this.damage);
    }
  }

  public override destroy(fromScene?: boolean): void {
    this.activeSlash = false;
    if (this.graphicsDestroyed) {
      return;
    }

    this.graphicsDestroyed = true;
    super.destroy(fromScene);
  }

  private redraw(length: number): void {
    this.clear();
    this.lineStyle(STEEL_TEMPEST_BALANCE.slashWidth, NEON_COLORS.player, 0.18);
    this.lineBetween(0, 0, length, 0);
    this.lineStyle(5, NEON_COLORS.projectile, 0.96);
    this.lineBetween(0, 0, length, 0);
    this.fillStyle(NEON_COLORS.playerCore, 0.9);
    this.fillCircle(length, 0, 5);
  }
}
