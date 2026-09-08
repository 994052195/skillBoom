import Phaser from 'phaser';
import { NEON_COLORS, WORLD_BOUNDS } from '../config';

export class BattleHud {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly timeText: Phaser.GameObjects.Text;
  private readonly killText: Phaser.GameObjects.Text;

  public constructor(private readonly scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(1000);
    this.timeText = this.createText('00:00');
    this.killText = this.createText('KILLS 0');
  }

  public update(healthRatio: number, elapsedMs: number, kills: number): void {
    const camera = this.scene.cameras.main;
    const width = camera.width;
    const height = camera.height;
    const left = 52;
    const bottom = height - 28;
    const minimapSize = 132;
    const minimapX = width - minimapSize - 28;
    const minimapY = height - minimapSize - 28;

    this.graphics.clear();
    this.drawTopBars(left, healthRatio);
    this.drawSkillSlots(left, bottom);
    this.drawMiniMap(minimapX, minimapY, minimapSize);

    this.timeText.setPosition(width / 2 - 42, 22).setText(formatTime(elapsedMs));
    this.killText.setPosition(width / 2 + 53, 25).setText(`KILLS ${kills}`);
  }

  public destroy(): void {
    this.graphics.destroy();
    this.timeText.destroy();
    this.killText.destroy();
  }

  private drawTopBars(left: number, healthRatio: number): void {
    const barWidth = 256;
    this.graphics.lineStyle(2, NEON_COLORS.hud, 0.8);
    this.graphics.strokeRoundedRect(left, 28, barWidth, 18, 2);
    this.graphics.fillStyle(NEON_COLORS.health, 0.9);
    this.graphics.fillRect(left + 3, 31, (barWidth - 6) * healthRatio, 12);
    this.graphics.lineStyle(2, NEON_COLORS.experience, 0.75);
    this.graphics.strokeRoundedRect(left, 55, barWidth, 10, 2);
    this.graphics.fillStyle(NEON_COLORS.experience, 0.8);
    this.graphics.fillRect(left + 3, 58, (barWidth - 6) * 0.44, 4);
    this.graphics.lineStyle(2, NEON_COLORS.hud, 0.85);
    this.graphics.strokeCircle(left - 27, 46, 22);
    this.graphics.fillStyle(NEON_COLORS.player, 1);
    this.graphics.fillTriangle(left - 34, 53, left - 18, 46, left - 34, 39);
  }

  private drawSkillSlots(left: number, bottom: number): void {
    const colors = [NEON_COLORS.projectile, NEON_COLORS.player, NEON_COLORS.experience, NEON_COLORS.health];
    for (let index = 0; index < 4; index += 1) {
      const x = left + index * 74;
      const y = bottom - 60;
      this.graphics.lineStyle(2, colors[index], 0.9);
      this.graphics.strokeRoundedRect(x, y, 58, 58, 3);
      this.graphics.fillStyle(colors[index], 0.14);
      this.graphics.fillRoundedRect(x + 3, y + 3, 52, 52, 2);
      this.graphics.fillStyle(colors[index], 0.92);
      if (index === 0) {
        this.graphics.fillTriangle(x + 16, y + 42, x + 43, y + 29, x + 16, y + 17);
      } else if (index === 1) {
        this.graphics.fillCircle(x + 29, y + 29, 13);
        this.graphics.lineStyle(3, 0xffffff, 0.9);
        this.graphics.strokeCircle(x + 29, y + 29, 19);
      } else if (index === 2) {
        this.graphics.fillCircle(x + 29, y + 29, 14);
        this.graphics.fillStyle(0x07111f, 1);
        this.graphics.fillCircle(x + 29, y + 29, 6);
      } else {
        this.graphics.fillRect(x + 25, y + 14, 8, 30);
        this.graphics.fillRect(x + 14, y + 25, 30, 8);
      }
    }
  }

  private drawMiniMap(x: number, y: number, size: number): void {
    this.graphics.lineStyle(2, NEON_COLORS.hud, 0.9);
    this.graphics.strokeRect(x, y, size, size);
    this.graphics.lineStyle(1, NEON_COLORS.grid, 0.7);
    for (let step = 1; step < 4; step += 1) {
      const offset = (size / 4) * step;
      this.graphics.lineBetween(x + offset, y, x + offset, y + size);
      this.graphics.lineBetween(x, y + offset, x + size, y + offset);
    }
    this.graphics.fillStyle(NEON_COLORS.player, 1);
    this.graphics.fillCircle(x + size / 2, y + size / 2, 5);
    this.graphics.fillStyle(NEON_COLORS.enemy, 0.85);
    this.graphics.fillCircle(x + 20, y + 34, 3);
    this.graphics.fillCircle(x + 96, y + 27, 3);
    this.graphics.fillCircle(x + 78, y + 102, 3);
  }

  private createText(value: string): Phaser.GameObjects.Text {
    return this.scene.add.text(0, 0, value, {
      color: '#37ecff',
      fontFamily: 'monospace',
      fontSize: '24px',
      fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(1001);
  }
}

function formatTime(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function worldToMiniMap(position: { x: number; y: number }, size: number): { x: number; y: number } {
  return {
    x: (position.x / WORLD_BOUNDS.width) * size,
    y: (position.y / WORLD_BOUNDS.height) * size,
  };
}
