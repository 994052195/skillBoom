import type { Vector2Like } from '../types';

export class ProjectileHits {
  private readonly targets = new WeakSet<object>();
  private remaining: number;
  public constructor(pierceCount: number) { this.remaining = 1 + pierceCount; }
  public get exhausted(): boolean { return this.remaining <= 0; }
  public has(target: object): boolean { return this.targets.has(target); }
  public hit(target: object): boolean {
    if (this.exhausted || this.targets.has(target)) return false;
    this.targets.add(target);
    this.remaining -= 1;
    return true;
  }
}

// Earliest segment/circle intersection prevents fast shots skipping small enemies.
export function segmentCircleTime(start: Vector2Like, end: Vector2Like, center: Vector2Like, radius: number): number | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const ox = start.x - center.x;
  const oy = start.y - center.y;
  const c = ox * ox + oy * oy - radius * radius;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  if (a === 0) return null;
  const b = 2 * (ox * dx + oy * dy);
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const time = (-b - Math.sqrt(discriminant)) / (2 * a);
  return time >= 0 && time <= 1 ? time : null;
}

export function orbitPosition(owner: Vector2Like, angle: number, index: number, count: number, radius: number): Vector2Like {
  const phase = angle + index * Math.PI * 2 / count;
  return { x: owner.x + Math.cos(phase) * radius, y: owner.y + Math.sin(phase) * radius };
}

export class BladeHits {
  private readonly lastHit = new WeakMap<object, number>();
  public constructor(private readonly cooldownMs: number) {}
  public hit(target: object, nowMs: number): boolean {
    if (nowMs - (this.lastHit.get(target) ?? -Infinity) < this.cooldownMs) return false;
    this.lastHit.set(target, nowMs);
    return true;
  }
}
