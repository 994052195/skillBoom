import type Phaser from 'phaser';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Enemy } from '../entities/Enemy';
import { StatusSystem } from '../systems/StatusSystem';
import { statsFor } from '../systems/upgrades';
import type { Targetable } from '../types';

const phaser = vi.hoisted(() => {
  class Graphics {
    public static readonly instances: Graphics[] = [];
    public x = 0;
    public y = 0;
    public destroyCalls = 0;

    public constructor(public readonly scene: Phaser.Scene) {
      Graphics.instances.push(this);
    }

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
    public destroy(): void { this.destroyCalls += 1; }
  }

  return { Graphics };
});

vi.mock('phaser', () => ({
  default: {
    GameObjects: { Graphics: phaser.Graphics },
    Math: {
      Angle: { Between: (x1: number, y1: number, x2: number, y2: number) => Math.atan2(y2 - y1, x2 - x1) },
      DegToRad: (degrees: number) => degrees * (Math.PI / 180),
    },
  },
}));

let SteelTempestAttack: typeof import('./SteelTempestAttack').SteelTempestAttack;
let Tornado: typeof import('../entities/Tornado').Tornado;

beforeAll(async () => {
  ({ SteelTempestAttack } = await import('./SteelTempestAttack'));
  ({ Tornado } = await import('../entities/Tornado'));
});

beforeEach(() => {
  phaser.Graphics.instances.length = 0;
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
  x: 500,
  y: 100,
  radius: 16,
  isAlive: () => true,
};

function fakeEnemy(x: number, y: number, radius = 10): Enemy {
  return {
    x,
    y,
    radius,
    isAlive: () => true,
    setAirborneVisual: vi.fn(),
  } as unknown as Enemy;
}

describe('SteelTempestAttack', () => {
  it('spawns one tornado on the third cast only', () => {
    const attack = new SteelTempestAttack(scene, player, new StatusSystem());
    const stats = statsFor({});

    attack.attack(target, stats);
    attack.attack(target, stats);
    expect(attack.activeTornadoCount).toBe(0);
    attack.attack(target, stats);

    expect(attack.activeTornadoCount).toBe(1);
    expect(attack.windStacks).toBe(0);
  });

  it('damages an overlapped enemy once per three-line volley', () => {
    const attack = new SteelTempestAttack(scene, player, new StatusSystem());
    const enemy = fakeEnemy(220, 100, 16);
    const damageEnemy = vi.fn();

    attack.attack(target, {
      ...statsFor({}),
      projectileCount: 3,
      steelTempestBonusDamage: 5,
    });
    attack.update(16, [enemy], damageEnemy);

    expect(damageEnemy).toHaveBeenCalledTimes(1);
    expect(damageEnemy).toHaveBeenCalledWith(enemy, 25);
  });

  it('keeps a slash alive for 100ms and then destroys its Graphics', () => {
    const attack = new SteelTempestAttack(scene, player, new StatusSystem());
    attack.attack(target, statsFor({}));
    const slash = phaser.Graphics.instances[0];

    attack.update(99, [], vi.fn());
    expect(slash.destroyCalls).toBe(0);

    attack.update(1, [], vi.fn());
    expect(slash.destroyCalls).toBe(1);
  });

  it('damages and lifts distinct tornado targets in swept path order until its configured limit', () => {
    const status = new StatusSystem();
    const tornado = new Tornado(scene, player, 0, {
      ...statsFor({}),
      tornadoPierceCount: 2,
      airborneDurationMs: 900,
    });
    const near = fakeEnemy(160, 100);
    const middle = fakeEnemy(240, 100);
    const far = fakeEnemy(320, 100);
    const events: string[] = [];
    const originalApplyAirborne = status.applyAirborne.bind(status);
    vi.spyOn(status, 'applyAirborne').mockImplementation((enemy, durationMs) => {
      events.push(`airborne:${enemy.x}:${durationMs}`);
      originalApplyAirborne(enemy, durationMs);
    });

    tornado.update(500);
    tornado.resolveHits([far, middle, near, near], (enemy) => {
      events.push(`damage:${enemy.x}`);
    }, status);

    expect(events).toEqual([
      'damage:160',
      'airborne:160:900',
      'damage:240',
      'airborne:240:900',
    ]);
    expect(status.isAirborne(near)).toBe(true);
    expect(status.isAirborne(middle)).toBe(true);
    expect(status.isAirborne(far)).toBe(false);
    expect(tornado.isAlive()).toBe(false);
    expect(phaser.Graphics.instances[0].destroyCalls).toBe(1);
  });

  it('destroys every active slash and tornado Graphics on teardown', () => {
    const attack = new SteelTempestAttack(scene, player, new StatusSystem());
    const stats = statsFor({});
    attack.attack(target, stats);
    attack.attack(target, stats);
    attack.attack(target, stats);

    attack.destroy();

    expect(phaser.Graphics.instances).toHaveLength(4);
    expect(phaser.Graphics.instances.every((graphics) => graphics.destroyCalls === 1)).toBe(true);
    expect(attack.activeTornadoCount).toBe(0);
  });
});
