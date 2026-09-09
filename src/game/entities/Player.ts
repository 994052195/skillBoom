import Phaser from 'phaser';
import { GAME_BALANCE, NEON_COLORS } from '../config';
import { Health } from '../combat/health';
import { clampPosition, getMovementVector } from '../combat/movement';
import type { CombatStats, Damageable, PlayerInput, Targetable, WorldBounds } from '../types';
import { statsFor } from '../systems/upgrades';

export class Player extends Phaser.GameObjects.Graphics implements Damageable, Targetable {
  public readonly radius = GAME_BALANCE.playerRadius;
  private readonly healthState = new Health(GAME_BALANCE.playerHealth);
  private lastAttackAt = Number.NEGATIVE_INFINITY;
  private lastDamageAt = Number.NEGATIVE_INFINITY;
  private stats = statsFor({});

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

  public update(deltaMs: number, input: PlayerInput, nowMs: number): void {
    if (!this.isAlive()) {
      return;
    }

    const movement = getMovementVector(input, this.stats.moveSpeed);
    const nextPosition = clampPosition(
      { x: this.x + movement.x * (deltaMs / 1000), y: this.y + movement.y * (deltaMs / 1000) },
      this.bounds,
      this.radius,
    );

    this.setPosition(nextPosition.x, nextPosition.y);
    this.setAlpha(nowMs - this.lastDamageAt < 90 ? 0.45 : 1);
  }

  public canAttack(nowMs: number): boolean {
    return this.isAlive() && nowMs - this.lastAttackAt >= this.stats.attackIntervalMs;
  }

  public markAttack(nowMs: number): void {
    this.lastAttackAt = nowMs;
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

  public applyStats(stats: CombatStats): void {
    this.healthState.increaseMaximum(stats.maxHealth - this.stats.maxHealth);
    this.stats = stats;
    this.redraw();
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
