import Phaser from 'phaser';
import { NEON_COLORS } from '../config';
import type { UpgradeDefinition, UpgradeId } from '../types';

export class BattleOverlay {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  public constructor(private readonly scene: Phaser.Scene) {}

  public showUpgrade(choices: readonly UpgradeDefinition[], onSelect: (id: UpgradeId) => void): void {
    this.clear();
    const { width, height } = this.scene.cameras.main;
    const stacked = width < 480 || height > width;
    const compact = height < 620 || stacked;
    const titleY = compact ? 42 : 118;
    const subtitleY = compact ? 76 : 164;
    this.addScrim(width, height);
    this.addText(width / 2, titleY, '等级提升', compact ? 28 : 38, NEON_COLORS.experience);
    this.addText(width / 2, subtitleY, '选择一项强化', compact ? 16 : 18, 0xd9faff);

    const gap = stacked ? 10 : 20;
    const cardWidth = stacked
      ? Math.min(420, width - 32)
      : Math.min(280, (width - 96) / choices.length);
    const cardHeight = stacked
      ? Math.max(98, Math.min(132, Math.floor((height - subtitleY - 32 - gap * (choices.length - 1)) / choices.length)))
      : Math.min(236, Math.max(158, height - 232));
    const totalHeight = cardHeight * choices.length + gap * (choices.length - 1);
    const startX = stacked
      ? width / 2 - cardWidth / 2
      : width / 2 - ((cardWidth * choices.length + gap * (choices.length - 1)) / 2);
    const startY = stacked
      ? Math.max(subtitleY + 24, Math.min(height - totalHeight - 16, subtitleY + 30))
      : Math.max(subtitleY + 30, height / 2 - cardHeight / 2 + 32);

    choices.forEach((choice, index) => {
      const x = stacked ? startX : startX + index * (cardWidth + gap);
      const y = stacked ? startY + index * (cardHeight + gap) : startY;
      const card = this.scene.add.rectangle(x, y, cardWidth, cardHeight, 0x0b1d31, 0.98)
        .setOrigin(0, 0)
        .setStrokeStyle(2, NEON_COLORS.experience, 0.9)
        .setScrollFactor(0)
        .setDepth(2001)
        .setInteractive({ useHandCursor: true });
      this.objects.push(card);

      const key = this.addText(x + 22, y + 24, `${index + 1}`, compact ? 16 : 18, NEON_COLORS.projectile, 0);
      key.setOrigin(0, 0.5);
      const name = this.addText(
        stacked ? x + 52 : x + cardWidth / 2,
        stacked ? y + 24 : y + cardHeight * 0.37,
        choice.name,
        compact ? 20 : 25,
        NEON_COLORS.hud,
        stacked ? 0 : 0.5,
      );
      const description = this.scene.add.text(stacked ? x + 22 : x + cardWidth / 2, stacked ? y + 52 : y + cardHeight * 0.57, choice.description, {
        align: 'center',
        color: '#d9faff',
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: compact ? '16px' : '18px',
        wordWrap: { width: cardWidth - (stacked ? 44 : 60) },
      }).setOrigin(stacked ? 0 : 0.5, 0).setScrollFactor(0).setDepth(2001);
      this.objects.push(name, description);

      card.on('pointerover', () => card.setFillStyle(0x123c56, 1));
      card.on('pointerout', () => card.setFillStyle(0x0b1d31, 0.98));
      card.on('pointerup', () => onSelect(choice.id));
    });
  }

  public showGameOver(survivalMs: number, kills: number, onRestart: () => void): void {
    this.clear();
    const { width, height } = this.scene.cameras.main;
    const compact = width < 720 || height < 520;
    const titleY = height / 2 - (compact ? 92 : 124);
    this.addScrim(width, height);
    this.addText(width / 2, titleY, '战斗结束', compact ? 32 : 42, NEON_COLORS.health);
    this.addText(width / 2, titleY + 50, `存活时间  ${formatTime(survivalMs)}`, compact ? 18 : 22, 0xd9faff);
    this.addText(width / 2, titleY + 84, `击败敌人  ${kills}`, compact ? 18 : 22, 0xd9faff);

    const buttonY = titleY + (compact ? 142 : 186);
    const button = this.scene.add.rectangle(width / 2, buttonY, compact ? Math.min(260, width - 48) : 232, 58, NEON_COLORS.hud, 0.2)
      .setStrokeStyle(2, NEON_COLORS.hud, 1)
      .setScrollFactor(0)
      .setDepth(2001)
      .setInteractive({ useHandCursor: true });
    const label = this.addText(width / 2, buttonY, compact ? '重新开始' : '重新开始  [R]', 20, NEON_COLORS.hud);
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
