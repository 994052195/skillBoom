import type { PlayerInput, Vector2Like, WorldBounds } from '../types';

export function getMovementVector(input: PlayerInput, speed: number): Vector2Like {
  const horizontal = Number(input.right) - Number(input.left);
  const vertical = Number(input.down) - Number(input.up);
  const length = Math.hypot(horizontal, vertical);

  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: (horizontal / length) * speed,
    y: (vertical / length) * speed,
  };
}

export function clampPosition(position: Vector2Like, bounds: WorldBounds, radius: number): Vector2Like {
  return {
    x: Math.min(Math.max(position.x, bounds.x + radius), bounds.x + bounds.width - radius),
    y: Math.min(Math.max(position.y, bounds.y + radius), bounds.y + bounds.height - radius),
  };
}
