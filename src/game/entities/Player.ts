import Phaser from 'phaser';
import { GAME_BALANCE, NEON_COLORS } from '../config';
import { Health } from '../combat/health';
import { clampPosition, getMovementVector } from '../combat/movement';
import { findClosestTarget } from '../combat/targeting';
import type { Damageable, PlayerInput, Targetable, UpgradeId, WorldBounds } from '../types';
import { Projectile } from './Projectile';

export class Player extends Phaser.GameObjects.Graphics implements Damageable, Targetable {
  public readonly radius = GAME_BALANCE.playerRadius;
  private readonly healthState = new Health(GAME_BALANCE.playerHealth);
  private lastAttackAt = Number.NEGATIVE_INFINITY;
  private lastDamageAt = Number.NEGATIVE_INFINITY;
  private moveSpeed: number = GAME_BALANCE.playerSpeed;
  private attackIntervalMs: number = GAME_BALANCE.playerAttackIntervalMs;
  private projectileDamage: number = GAME_BALANCE.projectileDamage;
  private projectileSpeed: number = GAME_BALANCE.projectileSpeed;
  private projectileCount: number = 1;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly bounds: WorldBounds,
  ) {
    super(scene);
    this.setPosition(x, y);
    this.setDepth(20);
    scene.add.existing(this);
    this.redraw();
  }

  public get health(): number {
    return this.healthState.current;
  }

  public get maxHealth(): number {
    return this.healthState.max;
  }

  public get healthRatio(): number {
    return this.healthState.ratio;
  }

  public isAlive(): boolean {
    return this.healthState.isAlive();
  }

  public update(deltaMs: number, input: PlayerInput, enemies: readonly Targetable[], nowMs: number): Projectile[] {
    if (!this.isAlive()) {
      return [];
    }

    const movement = getMovementVector(input, this.moveSpeed);
    const nextPosition = clampPosition(
      { x: this.x + movement.x * (deltaMs / 1000), y: this.y + movement.y * (deltaMs / 1000) },
      this.bounds,
      this.radius,
    );

    this.setPosition(nextPosition.x, nextPosition.y);
    this.setAlpha(nowMs - this.lastDamageAt < 90 ? 0.45 : 1);

    if (nowMs - this.lastAttackAt < this.attackIntervalMs) {
      return [];
    }

    const target = findClosestTarget(this, enemies);
    if (target === null) {
      return [];
    }

    this.lastAttackAt = nowMs;
    return this.fireAt(target);
  }

  public receiveContactDamage(amount: number, nowMs: number): boolean {
    if (!this.isAlive() || nowMs - this.lastDamageAt < GAME_BALANCE.contactInvulnerabilityMs) {
      return false;
    }

    this.lastDamageAt = nowMs;
    this.healthState.takeDamage(amount);
    this.redraw();
    return true;
  }

  public takeDamage(amount: number): boolean {
    const died = this.healthState.takeDamage(amount);
    this.redraw();
    return died;
  }

  public applyUpgrade(upgrade: UpgradeId): void {
    switch (upgrade) {
      case 'rapid-fire':
        this.attackIntervalMs = Math.max(120, Math.round(this.attackIntervalMs * 0.88));
        break;
      case 'power-shot':
        this.projectileDamage += 10;
        break;
      case 'multishot':
        this.projectileCount += 1;
        break;
      case 'swift-projectiles':
        this.projectileSpeed = Math.round(this.projectileSpeed * 1.16);
        break;
      case 'quickstep':
        this.moveSpeed = Math.round(this.moveSpeed * 1.12);
        break;
      case 'vital-core':
        this.healthState.increaseMaximum(25);
        this.redraw();
        break;
    }
  }

  private fireAt(target: Targetable): Projectile[] {
    const spread = Phaser.Math.DegToRad(12);
    const midpoint = (this.projectileCount - 1) / 2;
    const projectiles: Projectile[] = [];

    for (let index = 0; index < this.projectileCount; index += 1) {
      projectiles.push(new Projectile(this.scene, this.x, this.y, target.x, target.y, {
        damage: this.projectileDamage,
        speed: this.projectileSpeed,
        angleOffset: (index - midpoint) * spread,
      }));
    }

    return projectiles;
  }

  private redraw(): void {
    this.clear();
    this.lineStyle(3, NEON_COLORS.player, 0.95);
    this.strokeCircle(0, 0, this.radius);
    this.fillStyle(NEON_COLORS.player, 0.22);
    this.fillCircle(0, 0, this.radius - 3);
    this.fillStyle(NEON_COLORS.playerCore, 1);
    this.fillTriangle(-8, 10, 13, 0, -8, -10);

    if (!this.isAlive()) {
      this.lineStyle(4, 0xffffff, 0.9);
      this.lineBetween(-11, -11, 11, 11);
      this.lineBetween(11, -11, -11, 11);
    }
  }
}
