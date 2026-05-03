import Phaser from 'phaser';
import Sound from '../utils/SoundManager';

import { TextureFactory } from './TextureFactory';
import { TileMap } from './TileMap';
import { EnergySystem } from './EnergySystem';
import { Player } from './Player';
import { BuildingSystem } from './BuildingSystem';
import { UISystem } from './UISystem';
import {
  TILE_SIZE, MAP_COLS, MAP_ROWS, MAP_WIDTH, MAP_HEIGHT,
  TILE, ENERGY,
} from './constants';
import type { BuildingType } from './constants';

interface TreeObject {
  sprite: Phaser.GameObjects.Image;
  rect: Phaser.Geom.Rectangle;
}

export class GameScene extends Phaser.Scene {
  private textureFactory!: TextureFactory;
  private tileMap!: TileMap;
  private energySystem!: EnergySystem;
  private player!: Player;
  private buildingSystem!: BuildingSystem;
  private uiSystem!: UISystem;

  private trees: TreeObject[] = [];
  private treeRects: Phaser.Geom.Rectangle[] = [];

  private selectedBuilding: BuildingType | null = null;
  private hoverHighlight: Phaser.GameObjects.Rectangle | null = null;

  private isGameWon: boolean = false;
  private winScreen: Phaser.GameObjects.Container | null = null;

  private ambientParticles: {
    sprite: Phaser.GameObjects.Image;
    vx: number;
    vy: number;
    life: number;
  }[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // All textures are procedural — nothing to load from files
  }

  create(): void {
    this.input.once('pointerdown', () => {
      console.log('CLICK DETECTED');
      Sound.playStart();
    });

    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    this.textureFactory = new TextureFactory(this);
    this.textureFactory.createAll();

    this.createBackground();

    this.tileMap = new TileMap(this);
    this.tileMap.generate();

    this.energySystem = new EnergySystem();

    this.spawnTrees();

    const startX = 5 * TILE_SIZE + TILE_SIZE / 2;
    const startY = 5 * TILE_SIZE + TILE_SIZE / 2;
    this.player = new Player(this, startX, startY);

    this.buildingSystem = new BuildingSystem(this, this.energySystem, this.tileMap);

    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.0);

    this.uiSystem = new UISystem(this, this.energySystem, this.tileMap, this.buildingSystem);
    this.uiSystem.setOnBuildingSelect((type) => {
      this.selectedBuilding = type;
      if (type === null) {
        this.buildingSystem.removeGhost();
      }
    });

    this.energySystem.setCallbacks(
      () => this.uiSystem.showBlackout(),
      () => this.uiSystem.hideBlackout(),
    );

    this.hoverHighlight = this.add.rectangle(0, 0, TILE_SIZE, TILE_SIZE, 0xFFFFFF, 0.18);
    this.hoverHighlight.setOrigin(0, 0);
    this.hoverHighlight.setDepth(8);
    this.hoverHighlight.setVisible(false);
    this.hoverHighlight.setStrokeStyle(2, 0xFFFFFF, 0.6);

    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.mouse?.disableContextMenu();

    this.setupDepthSorting();

    this.time.delayedCall(200, () => {
      this.buildingSystem.place(6, 5, 'solar_panel');
    });

    this.startAmbientParticles();

    this.cameras.main.zoomTo(1.0, 800, 'Linear', true);
    this.cameras.main.fadeIn(600);
  }

  private createBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0D1B2A, 0x0D1B2A, 0x1A3A1A, 0x1A3A1A, 1);
    bg.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    bg.setDepth(-1);
  }

  private spawnTrees(): void {
    const seed = (x: number, y: number, salt: number) => {
      const n = Math.sin(x * 73.1 + y * 157.3 + salt * 43.7) * 31415.926;
      return n - Math.floor(n);
    };

    for (let row = 2; row < MAP_ROWS - 2; row++) {
      for (let col = 2; col < MAP_COLS - 2; col++) {
        const s = seed(col, row, 42);
        if (s < 0.08) {
          const tile = this.tileMap.getTileAtGrid(col, row);
          if (!tile || tile.type === TILE.WATER || tile.type === TILE.STONE) continue;

          if (col <= 7 && row <= 7) continue;

          const tx = col * TILE_SIZE + TILE_SIZE / 2;
          const ty = row * TILE_SIZE + TILE_SIZE / 2;
          const isDead = tile.type === TILE.POLLUTED;

          const treeSprite = this.add.image(tx, ty, isDead ? 'dead_tree' : 'tree');
          treeSprite.setOrigin(0.5, 0.9);
          treeSprite.setDepth(3);

          const sc = 0.85 + seed(col, row, 99) * 0.35;
          treeSprite.setScale(sc);

          const trunkW = 16 * sc;
          const trunkH = 16 * sc;
          const rect = new Phaser.Geom.Rectangle(
            tx - trunkW / 2,
            ty - trunkH / 2,
            trunkW,
            trunkH,
          );

          this.trees.push({ sprite: treeSprite, rect });
          this.treeRects.push(rect);
        }
      }
    }
  }

  private setupDepthSorting(): void {
    // We'll update depth every frame based on Y position
  }

  private startAmbientParticles(): void {
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        if (this.ambientParticles.length < 30) {
          this.spawnAmbientParticle();
        }
      },
    });
  }

  private spawnAmbientParticle(): void {
    const cam = this.cameras.main;
    const x = cam.scrollX + Phaser.Math.Between(0, cam.width);
    const y = cam.scrollY + Phaser.Math.Between(0, cam.height);
    const p = this.add.image(x, y, 'particle_leaf');
    p.setDepth(2);
    p.setAlpha(0);
    p.setScale(0.3 + Math.random() * 0.4);
    p.setTint(Phaser.Math.Between(0, 1) === 0 ? 0x88FF88 : 0xFFEE88);

    this.tweens.add({
      targets: p,
      alpha: { from: 0, to: 0.5 },
      duration: 1000,
      yoyo: true,
      hold: 2000,
      onComplete: () => {
        p.destroy();
        this.ambientParticles = this.ambientParticles.filter((ap) => ap.sprite !== p);
      },
    });

    this.ambientParticles.push({
      sprite: p,
      vx: (Math.random() - 0.5) * 20,
      vy: -10 - Math.random() * 20,
      life: 4000,
    });
  }

  update(_time: number, delta: number): void {
    if (this.isGameWon) return;

    this.energySystem.update(delta);

    this.player.update(delta, this.treeRects);

    const body = (this.player.sprite as Phaser.GameObjects.GameObject & {
      body?: Phaser.Physics.Arcade.Body;
    }).body;

    if (body && (Math.abs(body.velocity.x) > 5 || Math.abs(body.velocity.y) > 5)) {
      Sound.playStep();
    }

    this.player.sprite.setDepth(5 + this.player.getY() * 0.001);

    this.buildingSystem.update(delta);

    this.uiSystem.update(this.player.getX(), this.player.getY());

    if (this.energySystem.isBlackout()) {
      this.cameras.main.setBackgroundColor(0x330000);
    } else {
      this.cameras.main.setBackgroundColor(0x0D1B2A);
    }

    if (this.tileMap.isWinCondition() && !this.isGameWon) {
      this.triggerWin();
    }

    this.updateAmbientParticles(delta);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.isGameWon) return;

    const worldX = pointer.worldX;
    const worldY = pointer.worldY;
    const col = Math.floor(worldX / TILE_SIZE);
    const row = Math.floor(worldY / TILE_SIZE);

    void col;
    void row;

    const tile = this.tileMap.getTileAtGrid(col, row);

    if (this.selectedBuilding && this.hoverHighlight) {
      this.hoverHighlight.setVisible(true);
      this.hoverHighlight.setPosition(col * TILE_SIZE, row * TILE_SIZE);

      const canPlace = tile !== null
        && this.tileMap.isBuildable(col, row)
        && !this.buildingSystem.hasBuilding(col, row)
        && this.buildingSystem.canAfford(this.selectedBuilding);

      this.hoverHighlight.setFillStyle(canPlace ? 0x00FF88 : 0xFF4444, 0.2);
      this.hoverHighlight.setStrokeStyle(2, canPlace ? 0x00FF88 : 0xFF4444, 0.8);

      this.buildingSystem.showGhost(col, row, this.selectedBuilding);
    } else if (!this.selectedBuilding && this.hoverHighlight) {
      if (tile && tile.type === TILE.POLLUTED) {
        this.hoverHighlight.setVisible(true);
        this.hoverHighlight.setPosition(col * TILE_SIZE, row * TILE_SIZE);
        const canClean = this.energySystem.getCurrent() >= ENERGY.CLEAN_TILE_COST;
        this.hoverHighlight.setFillStyle(canClean ? 0xFFDD00 : 0xFF4444, 0.15);
        this.hoverHighlight.setStrokeStyle(2, canClean ? 0xFFDD00 : 0xFF4444, 0.5);
      } else {
        this.hoverHighlight.setVisible(false);
      }

      if (!this.selectedBuilding) {
        this.buildingSystem.removeGhost();
      }
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.isGameWon) return;

    if (pointer.rightButtonDown()) {
      this.uiSystem.deselectBuilding();
      this.selectedBuilding = null;
      this.buildingSystem.removeGhost();
      return;
    }

    const worldX = pointer.worldX;
    const worldY = pointer.worldY;
    const col = Math.floor(worldX / TILE_SIZE);
    const row = Math.floor(worldY / TILE_SIZE);

    if (this.selectedBuilding) {
      const placed = this.buildingSystem.place(col, row, this.selectedBuilding);
      if (placed) {
        this.showFloatingText(worldX, worldY - 20, 'Built!', '#00FF88');
      } else {
        const canAfford = this.buildingSystem.canAfford(this.selectedBuilding);
        if (!canAfford) {
          this.showFloatingText(worldX, worldY - 20, '⚡ Not enough energy!', '#FF4444');
        } else {
          this.showFloatingText(worldX, worldY - 20, "Can't build here!", '#FF8844');
        }
      }
    } else {
      const tile = this.tileMap.getTileAtGrid(col, row);
      if (tile && tile.type === TILE.POLLUTED) {
        const success = this.energySystem.spend(ENERGY.CLEAN_TILE_COST);
        if (success) {
          this.tileMap.restoreTile(col, row);
          this.spawnCleanParticles(worldX, worldY);
          this.showFloatingText(worldX, worldY - 24, `-⚡${ENERGY.CLEAN_TILE_COST}  🌱 Restored!`, '#00FF88');
          this.cameras.main.shake(120, 0.003);
        } else {
          this.showFloatingText(worldX, worldY - 24, '⚡ Not enough energy!', '#FF4444');
        }
      }
    }
  }

  private spawnCleanParticles(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 20 + Math.random() * 30;
      const p = this.add.image(x, y, i % 2 === 0 ? 'particle_star' : 'particle_leaf');
      p.setDepth(20);
      p.setTint(i % 3 === 0 ? 0xFFD700 : 0x00FF88);
      p.setScale(0.5 + Math.random() * 0.7);

      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: { from: 1, to: 0 },
        scale: { from: p.scaleX, to: 0 },
        angle: Phaser.Math.Between(-180, 180),
        duration: 600 + Math.random() * 400,
        ease: 'Power2.Out',
        onComplete: () => p.destroy(),
      });
    }

    const ripple = this.add.circle(x, y, 4, 0x00FF88, 0.8);
    ripple.setDepth(18);
    this.tweens.add({
      targets: ripple,
      scaleX: 8,
      scaleY: 8,
      alpha: { from: 0.8, to: 0 },
      duration: 500,
      ease: 'Power2.Out',
      onComplete: () => ripple.destroy(),
    });
  }

  private showFloatingText(x: number, y: number, text: string, color: string): void {
    const t = this.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
    });
    t.setOrigin(0.5, 0.5);
    t.setDepth(30);

    this.tweens.add({
      targets: t,
      y: y - 50,
      alpha: { from: 1, to: 0 },
      duration: 1200,
      ease: 'Power2.Out',
      onComplete: () => t.destroy(),
    });
  }

  private updateAmbientParticles(delta: number): void {
    for (const p of this.ambientParticles) {
      p.sprite.x += p.vx * (delta / 1000);
      p.sprite.y += p.vy * (delta / 1000);
      p.life -= delta;
    }
  }

  private triggerWin(): void {
    this.isGameWon = true;
    this.buildingSystem.removeGhost();

    for (let i = 0; i < 40; i++) {
      this.time.delayedCall(i * 80, () => {
        const x = this.player.getX() + Phaser.Math.Between(-200, 200);
        const y = this.player.getY() + Phaser.Math.Between(-150, 150);
        const p = this.add.image(x, y, Math.random() > 0.5 ? 'particle_star' : 'particle_leaf');
        p.setDepth(25);
        p.setTint(Phaser.Math.Between(0, 1) === 0 ? 0xFFD700 : 0x00FF88);
        p.setScale(Math.random() * 1.5 + 0.5);
        this.tweens.add({
          targets: p,
          y: y - Phaser.Math.Between(60, 140),
          x: x + Phaser.Math.Between(-40, 40),
          alpha: { from: 1, to: 0 },
          scaleX: { to: 0 },
          scaleY: { to: 0 },
          duration: 1500,
          ease: 'Power1.Out',
          onComplete: () => p.destroy(),
        });
      });
    }

    this.cameras.main.zoomTo(0.8, 1200, 'Power2.InOut');

    this.time.delayedCall(800, () => this.showWinScreen());
  }

  private showWinScreen(): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.winScreen = this.add.container(W / 2, H / 2);
    this.winScreen.setScrollFactor(0);
    this.winScreen.setDepth(500);

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.65);
    overlay.setScrollFactor(0);
    overlay.setDepth(499);

    const panel = this.add.rectangle(0, 0, 480, 320, 0x0A2A1A, 0.97);
    panel.setStrokeStyle(3, 0x00FF88, 1);

    const deco = this.add.graphics();
    deco.lineStyle(3, 0xFFD700, 0.8);
    deco.lineBetween(-240, -160, -220, -160);
    deco.lineBetween(-240, -160, -240, -140);
    deco.lineBetween(220, -160, 240, -160);
    deco.lineBetween(240, -160, 240, -140);
    deco.lineBetween(-240, 140, -220, 140);
    deco.lineBetween(-240, 140, -240, 160);
    deco.lineBetween(220, 160, 240, 160);
    deco.lineBetween(240, 140, 240, 160);

    const title = this.add.text(0, -110, '🌞 LEVEL COMPLETE!', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5, 0.5);

    const subtitle = this.add.text(0, -55, '🌿 The world is restored!', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#00FF88',
    });
    subtitle.setOrigin(0.5, 0.5);

    const pct = this.tileMap.getRestorationPercent();
    const stats = this.add.text(
      0,
      0,
      `✅ Restoration: ${pct.toFixed(1)}%\n` +
      `☀ Solar Panels: ${this.buildingSystem.getBuildingCount('solar_panel')}\n` +
      `🔋 Batteries: ${this.buildingSystem.getBuildingCount('battery')}\n` +
      `🌿 Purifiers: ${this.buildingSystem.getBuildingCount('purifier')}\n` +
      `⚡ Energy: ${Math.floor(this.energySystem.getCurrent())} / ${Math.floor(this.energySystem.getMax())}`,
      {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#AADDCC',
        lineSpacing: 8,
        align: 'center',
      },
    );
    stats.setOrigin(0.5, 0.5);

    const playAgain = this.add.text(0, 120, '[ Press R to Play Again ]', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#00D4FF',
      fontStyle: 'bold',
    });
    playAgain.setOrigin(0.5, 0.5);
    this.tweens.add({
      targets: playAgain,
      alpha: { from: 1, to: 0.3 },
      yoyo: true,
      repeat: -1,
      duration: 800,
    });

    this.winScreen.add([panel, deco, title, subtitle, stats, playAgain]);

    this.winScreen.setScale(0);
    this.tweens.add({
      targets: this.winScreen,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.Out',
    });

    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R).on('down', () => {
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(400, () => {
        this.scene.restart();
      });
    });
  }
}