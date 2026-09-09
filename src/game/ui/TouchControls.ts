import Phaser from 'phaser';
import type { PlayerInput } from '../types';
import { NEON_COLORS } from '../config';

const NO_INPUT: PlayerInput = { up: false, down: false, left: false, right: false };

export class TouchControls {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private activePointerId: number | null = null;
  private enabled = true;
  private input: PlayerInput = { ...NO_INPUT };
  private baseX = 0;
  private baseY = 0;
  private knobX = 0;
  private knobY = 0;
  private visible = false;

  public constructor(private readonly scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(1200);
    scene.input.on('pointerdown', this.onPointerDown, this);
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerup', this.onPointerUp, this);
    scene.input.on('pointerupoutside', this.onPointerUp, this);
    scene.game.events.on(Phaser.Core.Events.BLUR, this.releasePointer, this);
    scene.game.events.on(Phaser.Core.Events.HIDDEN, this.releasePointer, this);
    this.refresh();
  }

  public get playerInput(): PlayerInput {
    return this.input;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.releasePointer();
    }
    this.refresh();
    if (enabled) {
      this.draw();
    }
  }

  public refresh(): void {
    const { width, height } = this.scene.cameras.main;
    const nextVisible = this.shouldShow(width);
    const nextBaseX = Math.min(82, Math.max(60, width * 0.2));
    const nextBaseY = height - Math.min(84, Math.max(64, height * 0.14));

    if (this.baseX === nextBaseX && this.baseY === nextBaseY && this.visible === nextVisible) {
      return;
    }

    this.baseX = nextBaseX;
    this.baseY = nextBaseY;
    this.visible = nextVisible;
    if (this.activePointerId !== null) this.releasePointer();
    if (this.activePointerId === null) {
      this.knobX = this.baseX;
      this.knobY = this.baseY;
    }
    this.draw();
  }

  public destroy(): void {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.scene.input.off('pointerupoutside', this.onPointerUp, this);
    this.scene.game.events.off(Phaser.Core.Events.BLUR, this.releasePointer, this);
    this.scene.game.events.off(Phaser.Core.Events.HIDDEN, this.releasePointer, this);
    this.graphics.destroy();
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled || !this.visible || this.activePointerId !== null || !this.isInControlZone(pointer)) {
      return;
    }

    this.activePointerId = pointer.id;
    this.updateFromPointer(pointer);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.activePointerId) {
      this.updateFromPointer(pointer);
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.activePointerId) {
      this.releasePointer();
    }
  }

  private updateFromPointer(pointer: Phaser.Input.Pointer): void {
    const maxOffset = 36;
    const offsetX = pointer.x - this.baseX;
    const offsetY = pointer.y - this.baseY;
    const length = Math.hypot(offsetX, offsetY);
    const scale = length > maxOffset ? maxOffset / length : 1;
    const x = offsetX * scale;
    const y = offsetY * scale;

    this.knobX = this.baseX + x;
    this.knobY = this.baseY + y;
    this.input = {
      up: y < -8,
      down: y > 8,
      left: x < -8,
      right: x > 8,
    };
    this.draw();
  }

  private releasePointer(): void {
    this.activePointerId = null;
    this.input = { ...NO_INPUT };
    this.knobX = this.baseX;
    this.knobY = this.baseY;
    this.draw();
  }

  private isInControlZone(pointer: Phaser.Input.Pointer): boolean {
    const { width, height } = this.scene.cameras.main;
    return pointer.x <= width * 0.48 && pointer.y >= height * 0.48;
  }

  private shouldShow(width: number): boolean {
    return width <= 820 || window.matchMedia('(pointer: coarse)').matches;
  }

  private draw(): void {
    this.graphics.clear();
    if (!this.enabled || !this.visible) {
      return;
    }

    this.graphics.lineStyle(2, NEON_COLORS.hud, 0.38);
    this.graphics.strokeCircle(this.baseX, this.baseY, 46);
    this.graphics.fillStyle(NEON_COLORS.hud, 0.08);
    this.graphics.fillCircle(this.baseX, this.baseY, 44);
    this.graphics.lineStyle(1, NEON_COLORS.hud, 0.26);
    this.graphics.lineBetween(this.baseX - 31, this.baseY, this.baseX + 31, this.baseY);
    this.graphics.lineBetween(this.baseX, this.baseY - 31, this.baseX, this.baseY + 31);
    this.graphics.lineStyle(2, NEON_COLORS.player, 0.85);
    this.graphics.strokeCircle(this.knobX, this.knobY, 17);
    this.graphics.fillStyle(NEON_COLORS.player, 0.18);
    this.graphics.fillCircle(this.knobX, this.knobY, 15);
  }
}
