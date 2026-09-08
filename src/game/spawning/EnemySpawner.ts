import { GAME_BALANCE } from '../config';
import type { EnemyKind, EnemySpawn, Vector2Like, WorldBounds } from '../types';

type RandomSource = () => number;

export class EnemySpawner {
  private lastSpawnAt = 0;
  private spawnCount = 0;

  public constructor(private readonly random: RandomSource = Math.random) {}

  public update(nowMs: number, playerPosition: Vector2Like, bounds: WorldBounds, currentEnemyCount: number): EnemySpawn | null {
    if (currentEnemyCount >= GAME_BALANCE.maxEnemies || nowMs - this.lastSpawnAt < GAME_BALANCE.enemySpawnIntervalMs) {
      return null;
    }

    this.lastSpawnAt = nowMs;
    this.spawnCount += 1;

    const angle = this.random() * Math.PI * 2;
    const distance = GAME_BALANCE.spawnMinDistance + this.random() * (GAME_BALANCE.spawnMaxDistance - GAME_BALANCE.spawnMinDistance);
    const x = Math.min(Math.max(playerPosition.x + Math.cos(angle) * distance, bounds.x + 64), bounds.x + bounds.width - 64);
    const y = Math.min(Math.max(playerPosition.y + Math.sin(angle) * distance, bounds.y + 64), bounds.y + bounds.height - 64);

    return { x, y, kind: this.pickKind() };
  }

  private pickKind(): EnemyKind {
    if (this.spawnCount % GAME_BALANCE.buffSpawnEvery === 0) {
      return this.spawnCount % (GAME_BALANCE.buffSpawnEvery * 2) === 0 ? 'crystal-buff' : 'ember-buff';
    }

    const roll = this.random();
    if (roll < 0.5) {
      return 'melee-minion';
    }
    if (roll < 0.82) {
      return 'caster-minion';
    }
    return 'cannon-minion';
  }
}
