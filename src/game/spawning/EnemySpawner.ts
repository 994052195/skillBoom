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
    const position = this.findPosition(playerPosition, bounds);
    if (position === null) return null;
    this.spawnCount += 1;
    return { ...position, kind: this.pickKind() };
  }

  private findPosition(playerPosition: Vector2Like, bounds: WorldBounds): Vector2Like | null {
    const angle = this.random() * Math.PI * 2;
    const distance = GAME_BALANCE.spawnMinDistance + this.random() * (GAME_BALANCE.spawnMaxDistance - GAME_BALANCE.spawnMinDistance);
    // Rotate invalid candidates around the same ring; clamping would shorten the safe distance.
    for (let attempt = 0; attempt < 32; attempt += 1) {
      const candidateAngle = angle + attempt * Math.PI * (3 - Math.sqrt(5));
      const x = playerPosition.x + Math.cos(candidateAngle) * distance;
      const y = playerPosition.y + Math.sin(candidateAngle) * distance;
      if (x >= bounds.x + 64 && x <= bounds.x + bounds.width - 64
        && y >= bounds.y + 64 && y <= bounds.y + bounds.height - 64) return { x, y };
    }
    return null;
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
