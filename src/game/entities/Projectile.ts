import Phaser from 'phaser';
import { GAME_BALANCE, NEON_COLORS } from '../config';
import { ProjectileHits, segmentCircleTime } from '../combat/skills';
import type { Targetable, WorldBounds } from '../types';

interface ProjectileOptions {
  damage?: number;
  speed?: number;
  angleOffset?: number;
  pierceCount?: number;
}

export class Projectile extends Phaser.GameObjects.Graphics implements Targetable {
  public readonly radius = GAME_BALANCE.projectileRadius;
  public readonly damage: number;
  private readonly velocityX: number;
  private readonly velocityY: number;
  private activeProjectile = true;
  private previous: { x: number; y: number };
  private readonly hits: ProjectileHits;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    { damage = GAME_BALANCE.projectileDamage, speed = GAME_BALANCE.projectileSpeed, angleOffset = 0, pierceCount = 0 }: ProjectileOptions = {},
  ) {
    super(scene);
    this.previous = { x, y };
    this.hits = new ProjectileHits(pierceCount);
    const distanceX = targetX - x;
    const distanceY = targetY - y;
    const angle = Math.atan2(distanceY, distanceX) + angleOffset;
    this.damage = damage;
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;
    this.setPosition(x, y);
    this.setRotation(angle);
    this.setDepth(15);
    scene.add.existing(this);
    this.redraw();
    if (pierceCount > 0) {
      this.lineStyle(2, NEON_COLORS.player, 0.95);
      this.strokeCircle(0, 0, this.radius + 2);
    }
  }

  public isAlive(): boolean {
    return this.activeProjectile;
  }

  public update(deltaMs: number): void {
    if (!this.activeProjectile) {
      return;
    }

    this.previous = { x: this.x, y: this.y };
    this.x += this.velocityX * (deltaMs / 1000);
    this.y += this.velocityY * (deltaMs / 1000);
  }

  public hitTime(target: Targetable): number | null {
    if (!this.activeProjectile || !target.isAlive() || this.hits.has(target)) return null;
    return segmentCircleTime(this.previous, this, target, this.radius + target.radius);
  }

  public registerHit(target: Targetable): boolean {
    if (!this.activeProjectile || !this.hits.hit(target)) return false;
    if (this.hits.exhausted) this.consume();
    return true;
  }

  public consume(): void {
    this.activeProjectile = false;
    this.setVisible(false);
  }

  public isExpired(bounds: WorldBounds): boolean {
    return !this.activeProjectile
      || this.x < bounds.x - this.radius
      || this.y < bounds.y - this.radius
      || this.x > bounds.x + bounds.width + this.radius
      || this.y > bounds.y + bounds.height + this.radius;
  }

  private redraw(): void {
    this.clear();
    this.lineStyle(2, NEON_COLORS.projectile, 0.32);
    this.lineBetween(-12, 0, 0, 0);
    this.fillStyle(NEON_COLORS.projectile, 1);
    this.fillCircle(0, 0, this.radius);
    this.fillStyle(0xffffff, 0.95);
    this.fillCircle(0, 0, 2);
  }
}
