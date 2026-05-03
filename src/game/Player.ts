// ─── Player Class ────────────────────────────────────────────────────────────

import Phaser from 'phaser';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from './constants';

const SPEED = 180;
const FRAME_INTERVAL = 220; // ms per walk frame

export class Player {
  private scene: Phaser.Scene;
  public sprite: Phaser.GameObjects.Image;
  private keys: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    wKey: Phaser.Input.Keyboard.Key;
    sKey: Phaser.Input.Keyboard.Key;
    aKey: Phaser.Input.Keyboard.Key;
    dKey: Phaser.Input.Keyboard.Key;
  };

  private walkFrame: number = 0;
  private frameTimer: number = 0;
  private isMoving: boolean = false;
  private shadowSprite: Phaser.GameObjects.Ellipse;

  // Collision objects (set from outside)
  public colliders: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Shadow
    this.shadowSprite = scene.add.ellipse(x, y + 14, 28, 10, 0x000000, 0.25);
    this.shadowSprite.setDepth(1);

    this.sprite = scene.add.image(x, y, 'player_idle');
    this.sprite.setDepth(5);
    this.sprite.setOrigin(0.5, 0.75);

    const kb = scene.input.keyboard!;
    this.keys = {
      up:    kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      wKey:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      sKey:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      aKey:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      dKey:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(delta: number, treeRects: Phaser.Geom.Rectangle[]): void {
    const dt = delta / 1000;

    let vx = 0, vy = 0;

    if (this.keys.left.isDown  || this.keys.aKey.isDown)  vx -= SPEED;
    if (this.keys.right.isDown || this.keys.dKey.isDown)  vx += SPEED;
    if (this.keys.up.isDown    || this.keys.wKey.isDown)  vy -= SPEED;
    if (this.keys.down.isDown  || this.keys.sKey.isDown)  vy += SPEED;

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.isMoving = vx !== 0 || vy !== 0;

    // Tentative new position
    let nx = this.sprite.x + vx * dt;
    let ny = this.sprite.y + vy * dt;

    // Map boundary
    nx = Phaser.Math.Clamp(nx, TILE_SIZE * 2.5, MAP_WIDTH - TILE_SIZE * 2.5);
    ny = Phaser.Math.Clamp(ny, TILE_SIZE * 2.5, MAP_HEIGHT - TILE_SIZE * 2.5);

    // Tree collision (simple AABB)
    const playerRect = new Phaser.Geom.Rectangle(nx - 10, ny - 10, 20, 20);
    let blocked = false;
    for (const rect of treeRects) {
      if (Phaser.Geom.Rectangle.Overlaps(playerRect, rect)) {
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      this.sprite.x = nx;
      this.sprite.y = ny;
    } else {
      // Try sliding on X only
      const playerRectX = new Phaser.Geom.Rectangle(nx - 10, this.sprite.y - 10, 20, 20);
      let blockedX = false;
      for (const rect of treeRects) {
        if (Phaser.Geom.Rectangle.Overlaps(playerRectX, rect)) { blockedX = true; break; }
      }
      if (!blockedX) {
        this.sprite.x = nx;
      }
      // Try sliding on Y only
      const playerRectY = new Phaser.Geom.Rectangle(this.sprite.x - 10, ny - 10, 20, 20);
      let blockedY = false;
      for (const rect of treeRects) {
        if (Phaser.Geom.Rectangle.Overlaps(playerRectY, rect)) { blockedY = true; break; }
      }
      if (!blockedY) {
        this.sprite.y = ny;
      }
    }

    // Update shadow
    this.shadowSprite.x = this.sprite.x;
    this.shadowSprite.y = this.sprite.y + 14;

    // Walk animation
    if (this.isMoving) {
      this.frameTimer += delta;
      if (this.frameTimer >= FRAME_INTERVAL) {
        this.frameTimer = 0;
        this.walkFrame = this.walkFrame === 0 ? 1 : 0;
      }
      this.sprite.setTexture(this.walkFrame === 0 ? 'player_walk1' : 'player_walk2');

      // Flip when moving left
      if (vx < 0) this.sprite.setFlipX(true);
      else if (vx > 0) this.sprite.setFlipX(false);

      // Bob effect
      this.sprite.setScale(1, 1 + Math.sin(this.frameTimer / FRAME_INTERVAL * Math.PI) * 0.03);
    } else {
      this.sprite.setTexture('player_idle');
      this.sprite.setScale(1, 1);
    }
  }

  getX(): number { return this.sprite.x; }
  getY(): number { return this.sprite.y; }

  getGridCol(): number { return Math.floor(this.sprite.x / TILE_SIZE); }
  getGridRow(): number { return Math.floor(this.sprite.y / TILE_SIZE); }

  setDepth(d: number): void {
    this.sprite.setDepth(d);
  }

  addGlowEffect(): void {
    // Pulsing glow
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 1, to: 0.88 },
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: 'Sine.InOut',
    });
  }
}
