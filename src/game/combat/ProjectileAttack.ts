import Phaser from 'phaser';
import { WORLD_BOUNDS } from '../config';
import type { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import type { CombatStats, Targetable } from '../types';
import type { AttackPattern } from './AttackPattern';

export class ProjectileAttack implements AttackPattern {
  public readonly id = 'projectile' as const;
  private readonly projectiles: Projectile[] = [];

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly owner: Targetable,
  ) {}

  public get activeProjectileCount(): number {
    return this.projectiles.filter((projectile) => projectile.isAlive()).length;
  }

  public attack(target: Targetable, stats: CombatStats): void {
    const spread = Phaser.Math.DegToRad(12);
    const midpoint = (stats.projectileCount - 1) / 2;

    for (let index = 0; index < stats.projectileCount; index += 1) {
      const projectile = new Projectile(this.scene, this.owner.x, this.owner.y, target.x, target.y, {
        damage: stats.projectileDamage,
        speed: stats.projectileSpeed,
        pierceCount: stats.pierceCount,
        angleOffset: (index - midpoint) * spread,
      });

      this.projectiles.push(projectile);
    }
  }

  public update(deltaMs: number, enemies: readonly Enemy[], damageEnemy: (enemy: Enemy, damage: number) => void): void {
    for (const projectile of this.projectiles) {
      projectile.update(deltaMs);
    }

    this.resolveHits(enemies, damageEnemy);
    this.removeExpiredProjectiles();
  }

  public destroy(): void {
    for (const projectile of this.projectiles) {
      projectile.destroy();
    }

    this.projectiles.length = 0;
  }

  private resolveHits(enemies: readonly Enemy[], damageEnemy: (enemy: Enemy, damage: number) => void): void {
    for (const projectile of this.projectiles) {
      if (!projectile.isAlive()) {
        continue;
      }

      const contacts: { enemy: Enemy; time: number }[] = [];
      for (const enemy of enemies) {
        const time = projectile.hitTime(enemy);
        if (time !== null) contacts.push({ enemy, time });
      }
      contacts.sort((a, b) => a.time - b.time);
      for (const { enemy } of contacts) {
        if (!projectile.isAlive()) break;
        if (enemy.isAlive() && projectile.registerHit(enemy)) damageEnemy(enemy, projectile.damage);
      }
    }
  }

  private removeExpiredProjectiles(): void {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      if (this.projectiles[index].isExpired(WORLD_BOUNDS)) {
        this.projectiles[index].destroy();
        this.projectiles.splice(index, 1);
      }
    }
  }
}
