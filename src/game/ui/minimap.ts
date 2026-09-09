import { NEON_COLORS, WORLD_BOUNDS } from '../config';
import type { EnemyKind, Targetable, Vector2Like } from '../types';

export interface MinimapEnemy extends Targetable { kind: EnemyKind; }
export interface MapMarker extends Vector2Like { color: number; radius: number; }

export function worldToMiniMap(position: Vector2Like, size: number, radius = 0): Vector2Like {
  return {
    x: Math.min(size - radius, Math.max(radius, (position.x - WORLD_BOUNDS.x) / WORLD_BOUNDS.width * size)),
    y: Math.min(size - radius, Math.max(radius, (position.y - WORLD_BOUNDS.y) / WORLD_BOUNDS.height * size)),
  };
}

export function minimapMarkers(player: Vector2Like, enemies: readonly Pick<MinimapEnemy, 'x' | 'y' | 'kind' | 'isAlive'>[], size: number): MapMarker[] {
  const markers: MapMarker[] = [];
  for (const enemy of enemies) {
    if (!enemy.isAlive()) continue;
    const elite = enemy.kind === 'ember-buff' || enemy.kind === 'crystal-buff';
    const radius = elite ? 3 : 2;
    const color = enemy.kind === 'ember-buff' ? NEON_COLORS.ember
      : enemy.kind === 'crystal-buff' ? NEON_COLORS.crystal : NEON_COLORS.enemy;
    markers.push({ ...worldToMiniMap(enemy, size, radius), radius, color });
  }
  markers.push({ ...worldToMiniMap(player, size, 4), radius: 4, color: NEON_COLORS.player });
  return markers;
}
