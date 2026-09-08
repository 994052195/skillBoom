import type { WorldBounds } from './types';

export const WORLD_BOUNDS: WorldBounds = {
  x: 0,
  y: 0,
  width: 4000,
  height: 4000,
};

export const GAME_BALANCE = {
  playerSpeed: 260,
  playerHealth: 100,
  playerRadius: 18,
  playerAttackIntervalMs: 500,
  contactInvulnerabilityMs: 400,
  enemyHealth: 40,
  enemySpeed: 90,
  enemyRadius: 16,
  enemyContactDamage: 10,
  enemySpawnIntervalMs: 1000,
  maxEnemies: 150,
  spawnMinDistance: 400,
  spawnMaxDistance: 850,
  projectileDamage: 20,
  projectileSpeed: 520,
  projectileRadius: 6,
  buffHealthMultiplier: 6,
  buffSpeedMultiplier: 0.64,
  buffRadius: 46,
  buffSpawnEvery: 12,
} as const;

export const NEON_COLORS = {
  world: 0x07111f,
  grid: 0x113c58,
  gridAccent: 0x0c2c44,
  player: 0x36f2ff,
  playerCore: 0xd4fcff,
  enemy: 0xff2c9b,
  enemyDark: 0x651546,
  enemyCaster: 0xc95cff,
  enemyCannon: 0xff5e45,
  projectile: 0xffe54c,
  ember: 0xff3d36,
  crystal: 0x2b8dff,
  hud: 0x37ecff,
  health: 0x33f4b1,
  experience: 0xb476ff,
} as const;
