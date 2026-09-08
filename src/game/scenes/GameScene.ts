import Phaser from 'phaser';
import { circlesOverlap } from '../combat/collision';
import { GAME_BALANCE, NEON_COLORS, WORLD_BOUNDS } from '../config';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { EnemySpawner } from '../spawning/EnemySpawner';
import { SkillSystem } from '../systems/SkillSystem';
import { StatusSystem } from '../systems/StatusSystem';
import type { GameSystem } from '../systems/GameSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import type { PlayerInput } from '../types';
import { BattleHud } from '../ui/BattleHud';

type MovementKeys = Record<keyof PlayerInput, Phaser.Input.Keyboard.Key>;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private hud!: BattleHud;
  private readonly enemies: Enemy[] = [];
  private readonly projectiles: Projectile[] = [];
  private readonly spawner = new EnemySpawner();
  private readonly systems: GameSystem[] = [new SkillSystem(), new UpgradeSystem(), new StatusSystem()];
  private keys!: MovementKeys;
  private kills = 0;

  public constructor() {
    super('game');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(NEON_COLORS.world);
    this.cameras.main.setBounds(WORLD_BOUNDS.x, WORLD_BOUNDS.y, WORLD_BOUNDS.width, WORLD_BOUNDS.height);
    this.createArena();

    this.player = new Player(this, WORLD_BOUNDS.width / 2, WORLD_BOUNDS.height / 2, WORLD_BOUNDS);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.setRoundPixels(true);

    const keyboard = this.input.keyboard;
    if (keyboard === null) {
      throw new Error('Keyboard input is required for the game scene.');
    }

    this.keys = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as MovementKeys;

    this.hud = new BattleHud(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.hud.destroy());
  }

  public update(time: number, delta: number): void {
    for (const system of this.systems) {
      system.update(delta);
    }

    if (this.player.isAlive()) {
      const projectile = this.player.update(delta, this.readInput(), this.enemies, time);
      if (projectile !== null) {
        this.projectiles.push(projectile);
      }

      const spawn = this.spawner.update(time, this.player, WORLD_BOUNDS, this.enemies.length);
      if (spawn !== null) {
        this.enemies.push(new Enemy(this, spawn.x, spawn.y, spawn.kind));
      }
    }

    for (const enemy of this.enemies) {
      enemy.update(delta, this.player);
    }

    for (const projectile of this.projectiles) {
      projectile.update(delta);
    }

    this.resolveContactDamage(time);
    this.resolveProjectileHits();
    this.removeInactiveEntities();
    this.hud.update(this.player.healthRatio, time, this.kills);
  }

  private createArena(): void {
    const arena = this.add.graphics().setDepth(-10);
    arena.fillStyle(NEON_COLORS.world, 1);
    arena.fillRect(WORLD_BOUNDS.x, WORLD_BOUNDS.y, WORLD_BOUNDS.width, WORLD_BOUNDS.height);
    arena.lineStyle(1, NEON_COLORS.grid, 0.3);

    for (let position = 0; position <= WORLD_BOUNDS.width; position += 200) {
      arena.lineBetween(position, 0, position, WORLD_BOUNDS.height);
      arena.lineBetween(0, position, WORLD_BOUNDS.width, position);
    }

    arena.lineStyle(2, NEON_COLORS.gridAccent, 0.58);
    for (let position = 0; position <= WORLD_BOUNDS.width; position += 1000) {
      arena.lineBetween(position, 0, position, WORLD_BOUNDS.height);
      arena.lineBetween(0, position, WORLD_BOUNDS.width, position);
    }
  }

  private readInput(): PlayerInput {
    return {
      up: this.keys.up.isDown,
      down: this.keys.down.isDown,
      left: this.keys.left.isDown,
      right: this.keys.right.isDown,
    };
  }

  private resolveContactDamage(time: number): void {
    if (!this.player.isAlive()) {
      return;
    }

    for (const enemy of this.enemies) {
      if (enemy.isAlive() && circlesOverlap(this.player, enemy)) {
        this.player.receiveContactDamage(GAME_BALANCE.enemyContactDamage, time);
      }
    }
  }

  private resolveProjectileHits(): void {
    for (const projectile of this.projectiles) {
      if (!projectile.isAlive()) {
        continue;
      }

      for (const enemy of this.enemies) {
        if (!projectile.collidesWith(enemy)) {
          continue;
        }

        const killed = enemy.takeDamage(GAME_BALANCE.projectileDamage);
        projectile.consume();
        if (killed) {
          this.kills += 1;
        }
        break;
      }
    }
  }

  private removeInactiveEntities(): void {
    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      if (!this.enemies[index].isAlive()) {
        this.enemies[index].destroy();
        this.enemies.splice(index, 1);
      }
    }

    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      if (this.projectiles[index].isExpired(WORLD_BOUNDS)) {
        this.projectiles[index].destroy();
        this.projectiles.splice(index, 1);
      }
    }
  }
}
