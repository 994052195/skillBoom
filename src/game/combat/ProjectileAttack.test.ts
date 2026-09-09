import type Phaser from 'phaser';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { statsFor } from '../systems/upgrades';
import type { Targetable } from '../types';
import type { Enemy } from '../entities/Enemy';

const phaser = vi.hoisted(() => {
  class Graphics {
    public static destroyed = 0;
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
    public destroy(): void { Graphics.destroyed += 1; }
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
  it('creates a fan and destroys every projectile on teardown', () => {
    const attack = new ProjectileAttack(scene, player);

    attack.attack(target, { ...statsFor({}), projectileCount: 3, pierceCount: 2 });

    expect(attack.activeProjectileCount).toBe(3);
    const before = phaser.Graphics.destroyed;
    attack.destroy();
    expect(attack.activeProjectileCount).toBe(0);
    expect(phaser.Graphics.destroyed - before).toBe(3);
    attack.destroy();
    expect(phaser.Graphics.destroyed - before).toBe(3);
  });

  it('sweeps targets in path order and consumes the real pierce budget', () => {
    const attack = new ProjectileAttack(scene, player);
    const enemies = [140, 200, 260, 320].map((x) => ({
      x, y: 100, radius: 10, isAlive: () => true,
    } as Enemy));
    const damage = vi.fn();
    attack.attack(target, { ...statsFor({}), projectileSpeed: 1000, pierceCount: 2 });
    attack.update(300, [...enemies].reverse(), damage);
    expect(damage.mock.calls.map(([enemy]) => enemy)).toEqual(enemies.slice(0, 3));
    expect(damage.mock.calls.every(([, amount]) => amount === 20)).toBe(true);
    expect(attack.activeProjectileCount).toBe(0);
  });

  it('never hits a crossed target twice and destroys shots outside the world', () => {
    const attack = new ProjectileAttack(scene, player);
    const enemy = { x: 150, y: 100, radius: 10, isAlive: () => true } as Enemy;
    const damage = vi.fn();
    attack.attack(target, { ...statsFor({}), projectileSpeed: 1000, pierceCount: 2 });
    attack.update(50, [enemy, enemy], damage);
    attack.update(1, [enemy], damage);
    expect(damage).toHaveBeenCalledTimes(1);
    const before = phaser.Graphics.destroyed;
    attack.update(5000, [], damage);
    expect(attack.activeProjectileCount).toBe(0);
    expect(phaser.Graphics.destroyed - before).toBe(1);
  });
});
