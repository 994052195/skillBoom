import Phaser from 'phaser';
import { circlesOverlap } from '../combat/collision';
import { GAME_BALANCE, NEON_COLORS, WORLD_BOUNDS } from '../config';
import { Enemy } from '../entities/Enemy';
import { ExperienceOrb } from '../entities/ExperienceOrb';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { EnemySpawner } from '../spawning/EnemySpawner';
import { SkillSystem } from '../systems/SkillSystem';
import { StatusSystem } from '../systems/StatusSystem';
import type { GameSystem } from '../systems/GameSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import type { PlayerInput, UpgradeId } from '../types';
import { BattleOverlay } from '../ui/BattleOverlay';
import { BattleHud } from '../ui/BattleHud';
import { TouchControls } from '../ui/TouchControls';

type MovementKeys = Record<keyof PlayerInput, Phaser.Input.Keyboard.Key>;
type ActionKeys = Record<'first' | 'second' | 'third' | 'restart', Phaser.Input.Keyboard.Key>;
type GameState = 'playing' | 'choosing-upgrade' | 'game-over';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private hud!: BattleHud;
  private overlay!: BattleOverlay;
  private touchControls!: TouchControls;
  private readonly enemies: Enemy[] = [];
  private readonly projectiles: Projectile[] = [];
  private readonly experienceOrbs: ExperienceOrb[] = [];
  private spawner = new EnemySpawner();
  private upgradeSystem = new UpgradeSystem();
  private systems: GameSystem[] = [];
  private keys!: MovementKeys;
  private actionKeys!: ActionKeys;
  private kills = 0;
  private elapsedMs = 0;
  private state: GameState = 'playing';

  public constructor() {
    super('game');
  }

  public create(): void {
    this.resetRun();
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
    this.actionKeys = keyboard.addKeys({
      first: Phaser.Input.Keyboard.KeyCodes.ONE,
      second: Phaser.Input.Keyboard.KeyCodes.TWO,
      third: Phaser.Input.Keyboard.KeyCodes.THREE,
      restart: Phaser.Input.Keyboard.KeyCodes.R,
    }) as ActionKeys;

    this.hud = new BattleHud(this);
    this.overlay = new BattleOverlay(this);
    this.touchControls = new TouchControls(this);
    this.refreshFixedUi();
    this.scale.on('resize', this.refreshFixedUi, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.refreshFixedUi, this);
      this.hud.destroy();
      this.overlay.destroy();
      this.touchControls.destroy();
    });
  }

  public update(_time: number, delta: number): void {
    this.touchControls.refresh();
    if (this.state === 'game-over') {
      if (Phaser.Input.Keyboard.JustDown(this.actionKeys.restart)) {
        this.scene.restart();
      }
      return;
    }

    if (this.state === 'choosing-upgrade') {
      this.selectUpgradeFromKeyboard();
      return;
    }

    this.elapsedMs += delta;
    for (const system of this.systems) {
      system.update(delta);
    }

    if (this.player.isAlive()) {
      const projectiles = this.player.update(delta, this.readInput(), this.enemies, this.elapsedMs);
      if (projectiles.length > 0) {
        this.projectiles.push(...projectiles);
      }

      const spawn = this.spawner.update(this.elapsedMs, this.player, WORLD_BOUNDS, this.enemies.length);
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

    this.resolveContactDamage(this.elapsedMs);
    this.resolveProjectileHits();
    if (!this.player.isAlive()) {
      this.hud.update(
        this.player.healthRatio,
        this.elapsedMs,
        this.kills,
        this.upgradeSystem.experienceRatio,
        this.upgradeSystem.currentLevel,
      );
      this.enterGameOver();
      return;
    }

    this.collectExperience(delta);
    this.removeInactiveEntities();
    this.hud.update(
      this.player.healthRatio,
      this.elapsedMs,
      this.kills,
      this.upgradeSystem.experienceRatio,
      this.upgradeSystem.currentLevel,
    );

    if (this.upgradeSystem.isChoosing) {
      this.enterUpgradeChoice();
    }
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
    const touchInput = this.touchControls.playerInput;
    return {
      up: this.keys.up.isDown || touchInput.up,
      down: this.keys.down.isDown || touchInput.down,
      left: this.keys.left.isDown || touchInput.left,
      right: this.keys.right.isDown || touchInput.right,
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

        const killed = enemy.takeDamage(projectile.damage);
        projectile.consume();
        if (killed) {
          this.kills += 1;
          this.experienceOrbs.push(new ExperienceOrb(this, enemy.x, enemy.y, enemy.experienceValue));
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

    for (let index = this.experienceOrbs.length - 1; index >= 0; index -= 1) {
      if (!this.experienceOrbs[index].isAlive()) {
        this.experienceOrbs[index].destroy();
        this.experienceOrbs.splice(index, 1);
      }
    }
  }

  private collectExperience(delta: number): void {
    for (let index = this.experienceOrbs.length - 1; index >= 0; index -= 1) {
      const orb = this.experienceOrbs[index];
      orb.update(delta, this.player);
      if (!orb.canCollectWith(this.player)) {
        continue;
      }

      orb.collect();
      this.upgradeSystem.addExperience(orb.value);
      if (this.upgradeSystem.isChoosing) {
        break;
      }
    }
  }

  private enterUpgradeChoice(): void {
    this.state = 'choosing-upgrade';
    this.touchControls.setEnabled(false);
    this.overlay.showUpgrade(this.upgradeSystem.availableUpgrades, (id) => this.selectUpgrade(id));
  }

  private selectUpgradeFromKeyboard(): void {
    const keys = [this.actionKeys.first, this.actionKeys.second, this.actionKeys.third];
    const index = keys.findIndex((key) => Phaser.Input.Keyboard.JustDown(key));
    if (index < 0) {
      return;
    }

    const choice = this.upgradeSystem.availableUpgrades[index];
    if (choice !== undefined) {
      this.selectUpgrade(choice.id);
    }
  }

  private selectUpgrade(id: UpgradeId): void {
    const selected = this.upgradeSystem.selectUpgrade(id);
    if (selected === null) {
      return;
    }

    this.player.applyUpgrade(selected.id);
    if (this.upgradeSystem.isChoosing) {
      this.overlay.showUpgrade(this.upgradeSystem.availableUpgrades, (choiceId) => this.selectUpgrade(choiceId));
      return;
    }

    this.state = 'playing';
    this.overlay.hide();
    this.touchControls.setEnabled(true);
  }

  private enterGameOver(): void {
    this.state = 'game-over';
    this.touchControls.setEnabled(false);
    this.overlay.showGameOver(this.elapsedMs, this.kills, () => this.scene.restart());
  }

  private refreshFixedUi(): void {
    if (this.player === undefined || this.hud === undefined || this.overlay === undefined) {
      return;
    }

    this.hud.update(
      this.player.healthRatio,
      this.elapsedMs,
      this.kills,
      this.upgradeSystem.experienceRatio,
      this.upgradeSystem.currentLevel,
    );

    if (this.state === 'choosing-upgrade') {
      this.overlay.showUpgrade(this.upgradeSystem.availableUpgrades, (id) => this.selectUpgrade(id));
    } else if (this.state === 'game-over') {
      this.overlay.showGameOver(this.elapsedMs, this.kills, () => this.scene.restart());
    }

    if (this.touchControls !== undefined) {
      this.touchControls.refresh();
    }
  }

  private resetRun(): void {
    this.enemies.length = 0;
    this.projectiles.length = 0;
    this.experienceOrbs.length = 0;
    this.spawner = new EnemySpawner();
    this.upgradeSystem = new UpgradeSystem();
    this.systems = [new SkillSystem(), this.upgradeSystem, new StatusSystem()];
    this.kills = 0;
    this.elapsedMs = 0;
    this.state = 'playing';
  }
}
