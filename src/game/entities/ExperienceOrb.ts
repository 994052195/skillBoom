import Phaser from 'phaser';
import { GAME_BALANCE, NEON_COLORS } from '../config';
import type { Targetable } from '../types';

export class ExperienceOrb extends Phaser.GameObjects.Graphics implements Targetable {
  public readonly radius = GAME_BALANCE.experienceOrbRadius;
  private activeOrb = true;

  public constructor(scene: Phaser.Scene, x: number, y: number, public readonly value: number) {
    super(scene);
    this.setPosition(x, y);
    this.setDepth(8);
    scene.add.existing(this);
    this.redraw();
  }

  public isAlive(): boolean {
    return this.activeOrb;
  }

  public update(deltaMs: number, collector: Targetable): void {
    if (!this.activeOrb || !collector.isAlive()) {
      return;
    }

    const distanceX = collector.x - this.x;
    const distanceY = collector.y - this.y;
    const distance = Math.hypot(distanceX, distanceY);
    if (distance === 0 || distance > GAME_BALANCE.experienceMagnetRadius) {
      return;
    }

    const step = Math.min(distance, GAME_BALANCE.experienceMagnetSpeed * (deltaMs / 1000));
    this.x += (distanceX / distance) * step;
    this.y += (distanceY / distance) * step;
  }

  public canCollectWith(collector: Targetable): boolean {
    const distance = Math.hypot(collector.x - this.x, collector.y - this.y);
    return this.activeOrb
      && collector.isAlive()
      && distance <= this.radius + GAME_BALANCE.experienceCollectRadius;
  }

  public collect(): void {
    this.activeOrb = false;
    this.setVisible(false);
  }

  private redraw(): void {
    this.clear();
    this.lineStyle(2, NEON_COLORS.experience, 0.8);
    this.strokeCircle(0, 0, this.radius);
    this.fillStyle(NEON_COLORS.experience, 0.3);
    this.fillCircle(0, 0, this.radius - 2);
    this.fillStyle(0xffffff, 0.9);
    this.fillCircle(-2, -2, 2);
  }
}
