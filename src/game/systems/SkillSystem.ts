import Phaser from 'phaser';
import { BladeHits, orbitPosition, segmentCircleTime } from '../combat/skills';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';

export const BLADE_STATS = { radius: 80, hitRadius: 14, damage: 15, cooldownMs: 500, angularSpeed: 2.5 } as const;

export class SkillSystem {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly hits = new BladeHits(BLADE_STATS.cooldownMs);
  private angle = 0;
  private previousOwner: { x: number; y: number };
  private count = 0;

  public constructor(scene: Phaser.Scene, private readonly player: Player) {
    this.graphics = scene.add.graphics().setDepth(19);
    this.previousOwner = { x: player.x, y: player.y };
  }

  public setBladeCount(count: number): void {
    this.count = count;
    this.previousOwner = { x: this.player.x, y: this.player.y };
    this.draw();
  }

  public update(deltaMs: number, nowMs: number, enemies: readonly Enemy[], damageEnemy: (enemy: Enemy, damage: number) => void): void {
    if (!this.player.isAlive()) return;
    const previousAngle = this.angle;
    this.angle += BLADE_STATS.angularSpeed * deltaMs / 1000;
    for (let index = 0; index < this.count; index += 1) {
      const before = orbitPosition(this.previousOwner, previousAngle, index, this.count, BLADE_STATS.radius);
      const after = orbitPosition(this.player, this.angle, index, this.count, BLADE_STATS.radius);
      for (const enemy of enemies) {
        if (enemy.isAlive()
          && segmentCircleTime(before, after, enemy, BLADE_STATS.hitRadius + enemy.radius) !== null
          && this.hits.hit(enemy, nowMs)) {
          damageEnemy(enemy, BLADE_STATS.damage);
        }
      }
    }
    this.previousOwner = { x: this.player.x, y: this.player.y };
    this.angle %= Math.PI * 2;
    this.draw();
  }

  public destroy(): void { this.graphics.destroy(); }

  private draw(): void {
    this.graphics.clear();
    if (this.count === 0) return;
    this.graphics.lineStyle(1, 0x62ffce, 0.16);
    this.graphics.strokeCircle(this.player.x, this.player.y, BLADE_STATS.radius);
    for (let index = 0; index < this.count; index += 1) {
      const position = orbitPosition(this.player, this.angle, index, this.count, BLADE_STATS.radius);
      this.graphics.save();
      this.graphics.translateCanvas(position.x, position.y);
      this.graphics.rotateCanvas(this.angle + index * Math.PI * 2 / this.count);
      this.graphics.fillStyle(0x62ffce, 0.16);
      this.graphics.fillCircle(0, 0, 19);
      this.graphics.fillStyle(0x62ffce, 1);
      this.graphics.fillTriangle(-7, -15, 10, 0, -7, 15);
      this.graphics.lineStyle(2, 0xe8fff6, 1);
      this.graphics.lineBetween(-7, -15, 10, 0);
      this.graphics.restore();
    }
  }
}
