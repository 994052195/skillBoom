import type { Targetable } from '../types';

export function circlesOverlap(first: Targetable, second: Targetable): boolean {
  const distanceX = first.x - second.x;
  const distanceY = first.y - second.y;
  const combinedRadius = first.radius + second.radius;

  return distanceX * distanceX + distanceY * distanceY <= combinedRadius * combinedRadius;
}
