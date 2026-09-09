import Phaser from 'phaser';
import { GameScene } from '../../src/game/scenes/GameScene.ts';
import { Enemy } from '../../src/game/entities/Enemy.ts';
import { Projectile } from '../../src/game/entities/Projectile.ts';
import { UpgradeSystem } from '../../src/game/systems/UpgradeSystem.ts';

const scene = new GameScene();
const game = new Phaser.Game({type:Phaser.CANVAS,parent:'app',width:667,height:375,scene:[scene],audio:{noAudio:true}});
const report = document.querySelector('#report');
const results = [];
function test(name, run) {
  try { if (!run()) throw Error('assertion failed'); results.push('PASS '+name); }
  catch (error) { results.push('FAIL '+name+': '+error.message); }
  report.textContent = results.join('\n');
}
const ready = setInterval(() => {
  if (!scene.touchControls) return;
  clearInterval(ready);
  scene.scene.pause();
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
    scene.projectiles.push(new Projectile(scene,p.x+120,p.y,p.x+130,p.y));
    const initialKills=scene.kills;
    scene.update(0,16);
    return scene.state==='game-over' && target.isAlive() && scene.kills===initialKills && !dead.scene;
  });
  report.textContent = (results.every(line=>line.startsWith('PASS')) ? 'ALL LOGIC CHECKS PASS\n' : 'REGRESSION FAILURES\n')+results.join('\n');
},100);
