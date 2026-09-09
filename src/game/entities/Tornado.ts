import Phaser from 'phaser';
import { segmentCircleTime } from '../combat/skills';
import { NEON_COLORS, STEEL_TEMPEST_BALANCE } from '../config';
import type { StatusSystem } from '../systems/StatusSystem';
import type { CombatStats, Targetable, WorldBounds } from '../types';
import type { Enemy } from './Enemy';

export class Tornado extends Phaser.GameObjects.Graphics implements Targetable {
  public readonly radius = STEEL_TEMPEST_BALANCE.slashWidth / 2;
  public readonly damage: number;
  private readonly velocityX: number;
  private readonly velocityY: number;
  private readonly airborneDurationMs: number;
  private readonly hits = new WeakSet<Enemy>();
  private previous: { x: number; y: number };
  private remainingTargets: number;
  private activeTornado = true;
  private graphicsDestroyed = false;
  private spin = 0;

  public constructor(scene: Phaser.Scene, owner: Targetable, angle: number, stats: CombatStats) {
    super(scene);
    this.previous = { x: owner.x, y: owner.y };
    this.damage = stats.projectileDamage + stats.steelTempestBonusDamage;
    this.velocityX = Math.cos(angle) * stats.projectileSpeed;
    this.velocityY = Math.sin(angle) * stats.projectileSpeed;
    this.remainingTargets = Math.max(0, Math.floor(stats.tornadoPierceCount));
    this.airborneDurationMs = stats.airborneDurationMs;
    this.setPosition(owner.x, owner.y);
    this.setDepth(15);
    scene.add.existing(this);
    this.redraw();

    if (this.remainingTargets === 0) {
      this.destroy();
    }
  }

  public isAlive(): boolean {
    return this.activeTornado;
  }

  public update(deltaMs: number): void {
    if (!this.activeTornado) {
      return;
    }

    this.previous = { x: this.x, y: this.y };
    this.x += this.velocityX * (deltaMs / 1000);
    this.y += this.velocityY * (deltaMs / 1000);
    this.spin += deltaMs * 0.014;
    this.redraw();
  }

  public resolveHits(
    enemies: readonly Enemy[],
    damageEnemy: (enemy: Enemy, damage: number) => void,
    statusSystem: StatusSystem,
  ): void {
    const contacts = enemies
      .map((enemy) => ({ enemy, time: this.hitTime(enemy) }))
      .filter((contact): contact is { enemy: Enemy; time: number } => contact.time !== null)
      .sort((first, second) => first.time - second.time);

    for (const { enemy } of contacts) {
      if (!this.activeTornado) {
        break;
      }
      if (!enemy.isAlive() || this.hits.has(enemy)) {
        continue;
      }

      this.hits.add(enemy);
      this.remainingTargets -= 1;
      damageEnemy(enemy, this.damage);
      statusSystem.applyAirborne(enemy, this.airborneDurationMs);
      if (this.remainingTargets === 0) {
        this.destroy();
      }
    }
  }

  public isExpired(bounds: WorldBounds): boolean {
    return !this.activeTornado
      || this.x < bounds.x - this.radius
      || this.y < bounds.y - this.radius
      || this.x > bounds.x + bounds.width + this.radius
      || this.y > bounds.y + bounds.height + this.radius;
  }

  public override destroy(fromScene?: boolean): void {
    this.activeTornado = false;
    if (this.graphicsDestroyed) {
      return;
    }

    this.graphicsDestroyed = true;
    super.destroy(fromScene);
  }

  private hitTime(enemy: Enemy): number | null {
    if (!this.activeTornado || !enemy.isAlive() || this.hits.has(enemy)) {
      return null;
    }

    return segmentCircleTime(this.previous, this, enemy, this.radius + enemy.radius);
  }

  private redraw(): void {
    this.clear();
    this.fillStyle(NEON_COLORS.player, 0.1);
    this.fillCircle(0, 0, this.radius);

    for (let arm = 0; arm < 3; arm += 1) {
      const startAngle = this.spin + arm * Math.PI * 2 / 3;
      this.lineStyle(4, arm === 1 ? NEON_COLORS.playerCore : NEON_COLORS.projectile, arm === 1 ? 0.82 : 0.92);
      let previousX = Math.cos(startAngle) * 3;
      let previousY = Math.sin(startAngle) * 3;
      for (let step = 1; step <= 9; step += 1) {
        const radius = 3 + step * (this.radius - 3) / 9;
        const angle = startAngle + step * 0.52;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.72;
        this.lineBetween(previousX, previousY, x, y);
        previousX = x;
        previousY = y;
      }
    }

    this.lineStyle(2, NEON_COLORS.playerCore, 0.72);
    this.strokeCircle(0, 0, this.radius - 4);
    this.lineStyle(1, 0xffffff, 0.42);
    this.lineBetween(-this.radius * 0.35, -this.radius * 0.68, this.radius * 0.5, -this.radius * 0.32);
    this.lineBetween(-this.radius * 0.55, this.radius * 0.32, this.radius * 0.42, this.radius * 0.62);
  }
}
