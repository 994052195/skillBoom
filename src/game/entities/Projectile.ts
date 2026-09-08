import Phaser from 'phaser';
import { GAME_BALANCE, NEON_COLORS } from '../config';
import { circlesOverlap } from '../combat/collision';
import type { Targetable, WorldBounds } from '../types';

interface ProjectileOptions {
  damage?: number;
  speed?: number;
  angleOffset?: number;
}

export class Projectile extends Phaser.GameObjects.Graphics implements Targetable {
  public readonly radius = GAME_BALANCE.projectileRadius;
  public readonly damage: number;
  private readonly velocityX: number;
  private readonly velocityY: number;
  private activeProjectile = true;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    { damage = GAME_BALANCE.projectileDamage, speed = GAME_BALANCE.projectileSpeed, angleOffset = 0 }: ProjectileOptions = {},
  ) {
    super(scene);
    const distanceX = targetX - x;
    const distanceY = targetY - y;
    const angle = Math.atan2(distanceY, distanceX) + angleOffset;
    this.damage = damage;
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;
    this.setPosition(x, y);
    this.setDepth(15);
    scene.add.existing(this);
    this.redraw();
  }

  public isAlive(): boolean {
    return this.activeProjectile;
  }

  public update(deltaMs: number): void {
    if (!this.activeProjectile) {
      return;
    }

    this.x += this.velocityX * (deltaMs / 1000);
    this.y += this.velocityY * (deltaMs / 1000);
  }

  public collidesWith(target: Targetable): boolean {
    return this.activeProjectile && target.isAlive() && circlesOverlap(this, target);
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
