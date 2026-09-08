import Phaser from 'phaser';
import { NEON_COLORS, WORLD_BOUNDS } from '../config';

export class BattleHud {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly timeText: Phaser.GameObjects.Text;
  private readonly killText: Phaser.GameObjects.Text;
  private readonly levelText: Phaser.GameObjects.Text;

  public constructor(private readonly scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(1000);
    this.timeText = this.createText('00:00');
    this.killText = this.createText('KILLS 0');
    this.levelText = this.createText('LV. 1');
  }

  public update(healthRatio: number, elapsedMs: number, kills: number, experienceRatio: number, level: number): void {
    const camera = this.scene.cameras.main;
    const width = camera.width;
    const height = camera.height;
    const compact = width < 720;
    const left = compact ? 34 : 52;
    const barWidth = compact ? Math.max(150, Math.floor(width * 0.52)) : 256;
    const slotSize = compact ? Math.min(50, Math.max(42, Math.floor((width - 48) / 4))) : 58;
    const slotGap = compact ? 8 : 16;
    const skillWidth = slotSize * 4 + slotGap * 3;
    const skillLeft = compact ? Math.max(18, width - skillWidth - 18) : left;
    const bottom = height - (compact ? 18 : 28);
    const minimapSize = compact ? Math.min(108, Math.max(80, Math.floor(width * 0.27))) : 132;
    const minimapX = width - minimapSize - (compact ? 16 : 28);
    const minimapY = compact
      ? Math.max(88, height - minimapSize - slotSize - 38)
      : height - minimapSize - 28;

    this.graphics.clear();
    this.drawTopBars(left, barWidth, healthRatio, experienceRatio, compact);
    this.drawSkillSlots(skillLeft, bottom, slotSize, slotGap);
    this.drawMiniMap(minimapX, minimapY, minimapSize);

    if (compact) {
      this.timeText.setFontSize(15).setPosition(width - 100, 23).setText(formatTime(elapsedMs));
      this.killText.setFontSize(14).setPosition(width - 100, 48).setText(`KILLS ${kills}`);
      this.levelText.setFontSize(14).setPosition(8, 73).setText(`LV. ${level}`);
    } else {
      this.timeText.setFontSize(24).setPosition(width / 2 - 42, 22).setText(formatTime(elapsedMs));
      this.killText.setFontSize(24).setPosition(width / 2 + 53, 25).setText(`KILLS ${kills}`);
      this.levelText.setFontSize(24).setPosition(left - 48, 72).setText(`LV. ${level}`);
    }
  }

  public destroy(): void {
    this.graphics.destroy();
    this.timeText.destroy();
    this.killText.destroy();
    this.levelText.destroy();
  }

  private drawTopBars(
    left: number,
    barWidth: number,
    healthRatio: number,
    experienceRatio: number,
    compact: boolean,
  ): void {
    this.graphics.lineStyle(2, NEON_COLORS.hud, 0.8);
    this.graphics.strokeRoundedRect(left, 28, barWidth, 18, 2);
    this.graphics.fillStyle(NEON_COLORS.health, 0.9);
    this.graphics.fillRect(left + 3, 31, (barWidth - 6) * healthRatio, 12);
    this.graphics.lineStyle(2, NEON_COLORS.experience, 0.75);
    this.graphics.strokeRoundedRect(left, 55, barWidth, 10, 2);
    this.graphics.fillStyle(NEON_COLORS.experience, 0.8);
    this.graphics.fillRect(left + 3, 58, (barWidth - 6) * experienceRatio, 4);
    this.graphics.lineStyle(2, NEON_COLORS.hud, 0.85);
    this.graphics.strokeCircle(left - (compact ? 20 : 27), 46, compact ? 17 : 22);
    this.graphics.fillStyle(NEON_COLORS.player, 1);
    if (compact) {
      this.graphics.fillTriangle(left - 25, 52, left - 12, 46, left - 25, 40);
    } else {
      this.graphics.fillTriangle(left - 34, 53, left - 18, 46, left - 34, 39);
    }
  }

  private drawSkillSlots(left: number, bottom: number, size: number, gap: number): void {
    const colors = [NEON_COLORS.projectile, NEON_COLORS.player, NEON_COLORS.experience, NEON_COLORS.health];
    for (let index = 0; index < 4; index += 1) {
      const x = left + index * (size + gap);
      const y = bottom - size;
      const inset = Math.max(2, Math.round(size * 0.05));
      const center = size / 2;
      this.graphics.lineStyle(2, colors[index], 0.9);
      this.graphics.strokeRoundedRect(x, y, size, size, 3);
      this.graphics.fillStyle(colors[index], 0.14);
      this.graphics.fillRoundedRect(x + inset, y + inset, size - inset * 2, size - inset * 2, 2);
      this.graphics.fillStyle(colors[index], 0.92);
      if (index === 0) {
        this.graphics.fillTriangle(x + size * 0.28, y + size * 0.72, x + size * 0.74, y + center, x + size * 0.28, y + size * 0.28);
      } else if (index === 1) {
        this.graphics.fillCircle(x + center, y + center, size * 0.22);
        this.graphics.lineStyle(3, 0xffffff, 0.9);
        this.graphics.strokeCircle(x + center, y + center, size * 0.33);
      } else if (index === 2) {
        this.graphics.fillCircle(x + center, y + center, size * 0.24);
        this.graphics.fillStyle(0x07111f, 1);
        this.graphics.fillCircle(x + center, y + center, size * 0.1);
      } else {
        this.graphics.fillRect(x + size * 0.43, y + size * 0.24, size * 0.14, size * 0.52);
        this.graphics.fillRect(x + size * 0.24, y + size * 0.43, size * 0.52, size * 0.14);
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
