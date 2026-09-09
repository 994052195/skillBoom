import type Phaser from 'phaser';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { statsFor } from '../systems/upgrades';
import type { Targetable } from '../types';

const phaser = vi.hoisted(() => {
  class Graphics {
    public x = 0;
    public y = 0;

    public constructor(public readonly scene: Phaser.Scene) {}

    public setPosition(x: number, y: number): this {
      this.x = x;
      this.y = y;
      return this;
    }

    public setRotation(): this { return this; }
    public setDepth(): this { return this; }
    public clear(): this { return this; }
    public lineStyle(): this { return this; }
    public lineBetween(): this { return this; }
    public strokeCircle(): this { return this; }
    public fillStyle(): this { return this; }
    public fillCircle(): this { return this; }
    public setVisible(): this { return this; }
    public destroy(): void {}
  }

  return { Graphics };
});

vi.mock('phaser', () => ({
  default: {
    GameObjects: { Graphics: phaser.Graphics },
    Math: { DegToRad: (degrees: number) => degrees * (Math.PI / 180) },
  },
}));

let ProjectileAttack: typeof import('./ProjectileAttack').ProjectileAttack;

beforeAll(async () => {
  ({ ProjectileAttack } = await import('./ProjectileAttack'));
});

const scene = {
  add: {
    existing: () => undefined,
  },
} as unknown as Phaser.Scene;

const player: Targetable = {
  x: 100,
  y: 100,
  radius: 18,
  isAlive: () => true,
};

const target: Targetable = {
  x: 200,
  y: 100,
  radius: 16,
  isAlive: () => true,
};

describe('ProjectileAttack', () => {
  it('creates one projectile per projectileCount with the requested pierce count', () => {
    const attack = new ProjectileAttack(scene, player);

    attack.attack(target, { ...statsFor({}), projectileCount: 3, pierceCount: 2 });

    expect(attack.activeProjectileCount).toBe(3);
    expect(attack.projectilePierceCounts()).toEqual([2, 2, 2]);
  });
});
