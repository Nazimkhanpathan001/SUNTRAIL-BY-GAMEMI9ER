// ─── Phaser Game Configuration ───────────────────────────────────────────────

import Phaser from 'phaser';
import { BootScene } from './BootScene';
import { GameScene } from './GameScene';

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#0A1628',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    render: {
      pixelArt: false,
      antialias: true,
      roundPixels: false,
    },
    scene: [BootScene, GameScene],
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
    input: {
      keyboard: true,
      mouse: true,
      touch: true,
    },
  };
}
