import type { Targetable, Vector2Like } from '../types';

export function findClosestTarget<T extends Targetable>(origin: Vector2Like, targets: readonly T[]): T | null {
  let closest: T | null = null;
  let closestDistanceSquared = Number.POSITIVE_INFINITY;

  for (const target of targets) {
    if (!target.isAlive()) {
      continue;
    }

    const distanceX = target.x - origin.x;
    const distanceY = target.y - origin.y;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;

    if (distanceSquared < closestDistanceSquared) {
      closest = target;
      closestDistanceSquared = distanceSquared;
    }
  }

  return closest;
}
