import Phaser from 'phaser';
import { GameScene } from './game/scenes/GameScene';
import './styles.css';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#07111f',
  render: {
    antialias: true,
    pixelArt: false,
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
  },
  scene: [GameScene],
});
