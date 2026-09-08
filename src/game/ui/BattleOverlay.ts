import Phaser from 'phaser';
import { NEON_COLORS } from '../config';
import type { UpgradeDefinition, UpgradeId } from '../types';

export class BattleOverlay {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  public constructor(private readonly scene: Phaser.Scene) {}

  public showUpgrade(choices: readonly UpgradeDefinition[], onSelect: (id: UpgradeId) => void): void {
    this.clear();
    const { width, height } = this.scene.cameras.main;
    this.addScrim(width, height);
    this.addText(width / 2, 118, '等级提升', 38, NEON_COLORS.experience);
    this.addText(width / 2, 164, '选择一项强化', 18, 0xd9faff);

    const cardWidth = 280;
    const cardHeight = 236;
    const gap = 20;
    const startX = width / 2 - ((cardWidth * choices.length + gap * (choices.length - 1)) / 2);

    choices.forEach((choice, index) => {
      const x = startX + index * (cardWidth + gap);
      const y = height / 2 - cardHeight / 2 + 32;
      const card = this.scene.add.rectangle(x, y, cardWidth, cardHeight, 0x0b1d31, 0.98)
        .setOrigin(0, 0)
        .setStrokeStyle(2, NEON_COLORS.experience, 0.9)
        .setScrollFactor(0)
        .setDepth(2001)
        .setInteractive({ useHandCursor: true });
      this.objects.push(card);

      const key = this.addText(x + 26, y + 26, `${index + 1}`, 18, NEON_COLORS.projectile, 0);
      key.setOrigin(0, 0.5);
      const name = this.addText(x + cardWidth / 2, y + 87, choice.name, 25, NEON_COLORS.hud);
      const description = this.scene.add.text(x + cardWidth / 2, y + 132, choice.description, {
        align: 'center',
        color: '#d9faff',
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '18px',
        wordWrap: { width: cardWidth - 60 },
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(2001);
      this.objects.push(name, description);

      card.on('pointerover', () => card.setFillStyle(0x123c56, 1));
      card.on('pointerout', () => card.setFillStyle(0x0b1d31, 0.98));
      card.on('pointerup', () => onSelect(choice.id));
    });
  }

  public showGameOver(survivalMs: number, kills: number, onRestart: () => void): void {
    this.clear();
    const { width, height } = this.scene.cameras.main;
    this.addScrim(width, height);
    this.addText(width / 2, height / 2 - 124, '战斗结束', 42, NEON_COLORS.health);
    this.addText(width / 2, height / 2 - 62, `存活时间  ${formatTime(survivalMs)}`, 22, 0xd9faff);
    this.addText(width / 2, height / 2 - 24, `击败敌人  ${kills}`, 22, 0xd9faff);

    const button = this.scene.add.rectangle(width / 2, height / 2 + 62, 232, 58, NEON_COLORS.hud, 0.2)
      .setStrokeStyle(2, NEON_COLORS.hud, 1)
      .setScrollFactor(0)
      .setDepth(2001)
      .setInteractive({ useHandCursor: true });
    const label = this.addText(width / 2, height / 2 + 62, '重新开始  [R]', 20, NEON_COLORS.hud);
    this.objects.push(button, label);
    button.on('pointerover', () => button.setFillStyle(NEON_COLORS.hud, 0.38));
    button.on('pointerout', () => button.setFillStyle(NEON_COLORS.hud, 0.2));
    button.on('pointerup', onRestart);
  }

  public hide(): void {
    this.clear();
  }

  public destroy(): void {
    this.clear();
  }

  private addScrim(width: number, height: number): void {
    const scrim = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x02060b, 0.8)
      .setScrollFactor(0)
      .setDepth(2000);
    this.objects.push(scrim);
  }

  private addText(
    x: number,
    y: number,
    value: string,
    fontSize: number,
    color: number,
    origin = 0.5,
  ): Phaser.GameObjects.Text {
    const text = this.scene.add.text(x, y, value, {
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
    }).setOrigin(origin, 0.5).setScrollFactor(0).setDepth(2001);
    this.objects.push(text);
    return text;
  }

  private clear(): void {
    for (const object of this.objects) {
      object.destroy();
    }
    this.objects.length = 0;
  }
}

function formatTime(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}
