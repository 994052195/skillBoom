import Phaser from 'phaser';
import { GAME_BALANCE, NEON_COLORS } from '../config';
import { Health } from '../combat/health';
import type { Damageable, EnemyKind, Targetable } from '../types';

interface EnemyStats {
  health: number;
  speed: number;
  radius: number;
}

export class Enemy extends Phaser.GameObjects.Graphics implements Damageable, Targetable {
  public readonly radius: number;
  private readonly healthState: Health;
  private readonly speed: number;

  public constructor(scene: Phaser.Scene, x: number, y: number, public readonly kind: EnemyKind) {
    super(scene);
    const stats = getEnemyStats(kind);
    this.radius = stats.radius;
    this.speed = stats.speed;
    this.healthState = new Health(stats.health);
    this.setPosition(x, y);
    this.setDepth(10);
    scene.add.existing(this);
    this.redraw();
  }

  public get health(): number {
    return this.healthState.current;
  }

  public get experienceValue(): number {
    return this.kind === 'ember-buff' || this.kind === 'crystal-buff'
      ? GAME_BALANCE.buffExperience
      : GAME_BALANCE.minionExperience;
  }

  public isAlive(): boolean {
    return this.healthState.isAlive();
  }

  public update(deltaMs: number, target: Targetable): void {
    if (!this.isAlive() || !target.isAlive()) {
      return;
    }

    const distanceX = target.x - this.x;
    const distanceY = target.y - this.y;
    const distance = Math.hypot(distanceX, distanceY);

    if (distance <= 0.001) {
      return;
    }

    const step = (this.speed * deltaMs) / 1000;
    this.x += (distanceX / distance) * step;
    this.y += (distanceY / distance) * step;
  }

  public takeDamage(amount: number): boolean {
    const died = this.healthState.takeDamage(amount);
    if (!died) {
      this.redraw();
    }
    return died;
  }

  private redraw(): void {
    this.clear();

    if (this.kind === 'ember-buff' || this.kind === 'crystal-buff') {
      this.drawBuffMonster();
      return;
    }

    this.drawMinion();
  }

  private drawMinion(): void {
    const color = this.kind === 'caster-minion'
      ? NEON_COLORS.enemyCaster
      : this.kind === 'cannon-minion'
        ? NEON_COLORS.enemyCannon
        : NEON_COLORS.enemy;

    this.fillStyle(NEON_COLORS.enemyDark, 0.95);
    this.fillCircle(0, 0, this.radius);
    this.lineStyle(2, color, 1);
    this.strokeCircle(0, 0, this.radius);

    if (this.kind === 'melee-minion') {
      this.fillStyle(color, 1);
      this.fillRoundedRect(-7, -7, 14, 16, 2);
      this.fillTriangle(-14, 12, -4, 8, -13, 1);
      this.fillTriangle(14, -12, 4, -8, 13, -1);
    } else if (this.kind === 'caster-minion') {
      this.fillStyle(color, 1);
      this.fillTriangle(0, -14, 9, 9, -9, 9);
      this.lineStyle(2, color, 1);
      this.lineBetween(10, -12, 16, 10);
      this.fillCircle(16, 11, 3);
    } else {
      this.fillStyle(color, 1);
      this.fillRoundedRect(-14, -8, 23, 16, 3);
      this.fillRect(8, -4, 13, 8);
      this.fillCircle(-9, 11, 4);
      this.fillCircle(7, 11, 4);
    }

    this.drawHealthBar(color);
  }

  private drawBuffMonster(): void {
    const color = this.kind === 'ember-buff' ? NEON_COLORS.ember : NEON_COLORS.crystal;
    this.lineStyle(3, color, 0.55);
    this.strokeCircle(0, 0, this.radius + 7);
    this.fillStyle(color, 0.14);
    this.fillCircle(0, 0, this.radius + 5);
    this.fillStyle(NEON_COLORS.enemyDark, 1);
    this.fillCircle(0, 0, this.radius - 5);
    this.lineStyle(4, color, 1);
    this.strokeCircle(0, 0, this.radius - 5);

    this.fillStyle(color, 0.94);
    this.fillTriangle(0, -this.radius + 5, this.radius - 8, 4, 0, this.radius - 5);
    this.fillTriangle(0, -this.radius + 5, -this.radius + 8, 4, 0, this.radius - 5);
    this.fillStyle(0xffffff, 0.9);
    this.fillCircle(-12, -4, 4);
    this.fillCircle(12, -4, 4);
    this.drawHealthBar(color);
  }

  private drawHealthBar(color: number): void {
    const width = this.radius * 1.8;
    const y = -this.radius - 13;
    this.fillStyle(0x07111f, 0.85);
    this.fillRect(-width / 2, y, width, 4);
    this.fillStyle(color, 1);
    this.fillRect(-width / 2, y, width * this.healthState.ratio, 4);
  }
}

function getEnemyStats(kind: EnemyKind): EnemyStats {
  if (kind === 'ember-buff' || kind === 'crystal-buff') {
    return {
      health: GAME_BALANCE.enemyHealth * GAME_BALANCE.buffHealthMultiplier,
      speed: GAME_BALANCE.enemySpeed * GAME_BALANCE.buffSpeedMultiplier,
      radius: GAME_BALANCE.buffRadius,
    };
  }

  if (kind === 'cannon-minion') {
    return { health: 62, speed: 68, radius: 20 };
  }

  if (kind === 'caster-minion') {
    return { health: 30, speed: 108, radius: 14 };
  }

  return { health: GAME_BALANCE.enemyHealth, speed: GAME_BALANCE.enemySpeed, radius: GAME_BALANCE.enemyRadius };
}
