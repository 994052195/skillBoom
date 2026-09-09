import Phaser from 'phaser';
import { GameScene } from '../../src/game/scenes/GameScene.ts';
import { Enemy } from '../../src/game/entities/Enemy.ts';
import { Projectile } from '../../src/game/entities/Projectile.ts';
import { UpgradeSystem } from '../../src/game/systems/UpgradeSystem.ts';
import { statsFor } from '../../src/game/systems/upgrades.ts';

const scene = new GameScene();
const params = new URLSearchParams(location.search);
const game = new Phaser.Game({type:Phaser.CANVAS,parent:'app',width:Number(params.get('w'))||667,height:Number(params.get('h'))||375,scene:[scene],audio:{noAudio:true}});
const report = document.querySelector('#report');
const results = [];
function test(name, run) {
  try { if (!run()) throw Error('assertion failed'); results.push('PASS '+name); }
  catch (error) { results.push('FAIL '+name+': '+error.message); }
  report.textContent = results.join('\n');
}
async function restartFixture() {
  const previous = scene.player;
  scene.scene.restart();
  for (let i = 0; i < 100 && scene.player === previous; i++) await new Promise((resolve) => setTimeout(resolve, 20));
  if (scene.player === previous) throw Error('Scene restart timed out');
  scene.scene.pause();
  scene.spawner.lastSpawnAt = 1e9;
  scene.player.lastAttackAt = 1e9;
}
function showPreview() {
    const p=scene.player, stats=statsFor({'steel-tempest':1,multishot:2});
    scene.cameras.main.stopFollow();scene.cameras.main.centerOn(p.x,p.y);
    scene.setAttackPattern(stats);
    for(const [dx,dy,kind] of [[140,0,'ember-buff'],[260,-55,'caster-minion'],[295,65,'melee-minion'],[-120,60,'crystal-buff']]) {
      scene.enemies.push(new Enemy(scene,p.x+dx,p.y+dy,kind));
    }
    const target={x:p.x+500,y:p.y,radius:16,isAlive:()=>true};
    for(let i=0;i<3;i++)scene.primaryAttack.attack(target,stats);
    scene.primaryAttack.update(40,scene.enemies,(e,d)=>scene.damageEnemy(e,d));
    const wind=scene.primaryAttack.tornadoes[0];
    wind.update(140);wind.resolveHits(scene.enemies,(e,d)=>scene.damageEnemy(e,d),scene.statusSystem);
    scene.statusSystem.update(300);
    scene.hud.setBuild(stats,false);scene.hud.update(1,45000,38,0.5,8);
    scene.hud.updateWorld(p,scene.enemies,45000,true);
    report.hidden=true;
}
const ready = setInterval(async () => {
  if (!scene.touchControls) return;
  clearInterval(ready);
  scene.scene.pause();
  if (params.has('preview')) { showPreview(); return; }
  test('prepressed key does not auto-select upgrade', () => {
    scene.upgradeSystem = new UpgradeSystem(() => 0);
    scene.actionKeys.first._justDown = true;
    scene.upgradeSystem.addExperience(6);
    scene.enterUpgradeChoice();
    scene.update(0,16);
    return scene.state === 'choosing-upgrade' && scene.upgradeSystem.currentLevel === 1;
  });
  test('fresh key selects once and clears queued keys for next level', () => {
    scene.upgradeSystem = new UpgradeSystem(() => 0);
    scene.upgradeSystem.addExperience(30);
    scene.enterUpgradeChoice();
    scene.actionKeys.first._justDown = true;
    scene.actionKeys.second._justDown = true;
    scene.update(0,16);
    scene.update(0,16);
    return scene.upgradeSystem.currentLevel === 2 && scene.state === 'choosing-upgrade';
  });
  test('blur releases held touch input', () => {
    scene.touchControls.setEnabled(true);
    scene.touchControls.onPointerDown({id:1,x:110,y:300});
    const moved = scene.touchControls.playerInput.right;
    game.events.emit(Phaser.Core.Events.BLUR);
    return moved && Object.values(scene.touchControls.playerInput).every(value=>!value);
  });
  test('hiding joystick on resize releases input', () => {
    scene.touchControls.onPointerDown({id:2,x:110,y:300});
    scene.cameras.main.setSize(1280,720);
    scene.touchControls.refresh();
    return scene.touchControls.activePointerId === null && Object.values(scene.touchControls.playerInput).every(value=>!value);
  });
  test('unchanged HUD skips Graphics command rebuild', () => {
    scene.hud.update(1,1000,0,0,1);
    let count=0; const original=scene.hud.graphics.clear;
    scene.hud.graphics.clear=function(){count++; return original.call(this);};
    scene.hud.update(1,1016,0,0,1);
    scene.hud.update(1,1032,0,0,1);
    scene.hud.graphics.clear=original;
    return count===0;
  });
  test('minimap uses actual positions, removes deaths and throttles redraws', () => {
    scene.hud.update(1,1000,0,0,1);
    const graphics = scene.hud.mapGraphics;
    const originalClear = graphics.clear;
    const originalCircle = graphics.fillCircle;
    const points = [];
    let clears = 0;
    graphics.clear = function() { clears++; points.length = 0; return originalClear.call(this); };
    graphics.fillCircle = function(x,y,r) { points.push({x,y,r}); return originalCircle.call(this,x,y,r); };
    const p = {x:1000,y:3000};
    const enemy = {x:3000,y:1000,radius:16,kind:'melee-minion',isAlive:()=>true};
    scene.hud.updateWorld(p,[enemy],1000,true);
    const {x,y,size} = scene.hud.mapBounds;
    const actual = points.length === 2 && points[0].x === x + size * 0.75 && points[1].y === y + size * 0.75;
    scene.hud.updateWorld(p,[enemy],1016);
    const throttled = clears === 1;
    enemy.isAlive = () => false;
    scene.hud.updateWorld(p,[enemy],1100);
    const removed = clears === 2 && points.length === 1;
    graphics.clear = originalClear;
    graphics.fillCircle = originalCircle;
    return actual && throttled && removed;
  });
  test('death frame stops projectile kills and cleans dead entities', () => {
    scene.state='playing'; scene.overlay.hide();
    const p=scene.player;
    p.healthState.takeDamage(90);
    p.lastAttackAt=1e9;
    const contact=new Enemy(scene,p.x,p.y,'melee-minion');
    const target=new Enemy(scene,p.x+120,p.y,'melee-minion'); target.takeDamage(20);
    const dead=new Enemy(scene,p.x-100,p.y,'melee-minion'); dead.takeDamage(40);
    scene.enemies.push(contact,target,dead);
    scene.primaryAttack.projectiles.push(new Projectile(scene,p.x+120,p.y,p.x+130,p.y));
    const initialKills=scene.kills;
    scene.update(0,16);
    return scene.state==='game-over' && target.isAlive() && scene.kills===initialKills && !dead.scene;
  });
  await restartFixture();
  test('steel tempest unlock switches primary attack and preserves stacks on stat upgrade', () => {
    const previous=scene.primaryAttack;
    scene.upgradeSystem = new UpgradeSystem(() => 0.99999);
    scene.upgradeSystem.addExperience(6);
    scene.enterUpgradeChoice();
    scene.selectUpgrade('steel-tempest');
    const switched=scene.primaryAttack.id==='steel-tempest' && previous!==scene.primaryAttack;
    const attack=scene.primaryAttack;
    const p=scene.player;
    const target={x:p.x+200,y:p.y,radius:16,isAlive:()=>true};
    attack.attack(target, statsFor({'steel-tempest':1}));
    attack.attack(target, statsFor({'steel-tempest':1}));
    scene.setAttackPattern(statsFor({'steel-tempest':1,'tempest-force':1}));
    return switched && scene.primaryAttack===attack && scene.primaryAttack.windStacks===2;
  });
  await restartFixture();
  test('steel tempest third cast creates tornado and airborne suppresses contact until recovery', () => {
    scene.setAttackPattern(statsFor({'steel-tempest':1}));
    const p=scene.player;
    const enemy=new Enemy(scene,p.x+120,p.y,'ember-buff');
    scene.enemies.push(enemy);
    const stats=statsFor({'steel-tempest':1});
    scene.primaryAttack.attack(enemy, stats);
    scene.primaryAttack.attack(enemy, stats);
    const before=scene.primaryAttack.activeTornadoCount;
    scene.primaryAttack.attack(enemy, stats);
    for(let i=0;i<4;i++)scene.primaryAttack.update(50, scene.enemies, (target, damage)=>scene.damageEnemy(target, damage));
    const lifted=scene.statusSystem.isAirborne(enemy);
    enemy.setPosition(p.x, p.y);
    const health=p.health;
    scene.update(0,16);
    const stationary=enemy.x===p.x && enemy.y===p.y;
    scene.resolveContactDamage(1000);
    const suppressed=p.health===health;
    scene.statusSystem.update(stats.airborneDurationMs);
    const recovered=!scene.statusSystem.isAirborne(enemy);
    scene.resolveContactDamage(1500);
    return before===0 && lifted && stationary && suppressed && recovered && p.health<health;
  });
  const oldEnemy=scene.enemies[0];
  scene.statusSystem.applyAirborne(oldEnemy,700);
  await restartFixture();
  test('steel tempest cleanup clears active airborne before shutdown restart', () => {
    return scene.state==='playing' && scene.primaryAttack.id==='projectile'
      && !scene.statusSystem.isAirborne(oldEnemy) && !oldEnemy.scene;
  });
  report.textContent = (results.every(line=>line.startsWith('PASS')) ? 'ALL LOGIC CHECKS PASS\n' : 'REGRESSION FAILURES\n')+results.join('\n');
},100);
