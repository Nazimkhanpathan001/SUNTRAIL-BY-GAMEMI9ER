// ─── Building System ─────────────────────────────────────────────────────────

import Phaser from 'phaser';
import { TILE_SIZE, BUILDING, ENERGY } from './constants';
import type { BuildingType } from './constants';
import { EnergySystem } from './EnergySystem';
import { TileMap } from './TileMap';

export interface BuildingData {
  type: BuildingType;
  col: number;
  row: number;
  sprite: Phaser.GameObjects.Image;
  animSprite?: Phaser.GameObjects.Image;
  timer: number; // internal timer for effects
}

export class BuildingSystem {
  private scene: Phaser.Scene;
  private energy: EnergySystem;
  private tileMap: TileMap;
  public buildings: BuildingData[] = [];
  private ghostSprite: Phaser.GameObjects.Image | null = null;
  private buildingGroup: Phaser.GameObjects.Group;
  private purifierTimers: Map<string, number> = new Map();

  constructor(scene: Phaser.Scene, energy: EnergySystem, tileMap: TileMap) {
    this.scene = scene;
    this.energy = energy;
    this.tileMap = tileMap;
    this.buildingGroup = scene.add.group();
  }

  showGhost(col: number, row: number, type: BuildingType): void {
    this.removeGhost();
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;
    const canBuild = this.tileMap.isBuildable(col, row) && !this.hasBuilding(col, row);
    const ghostKey = `ghost_${type}`;
    this.ghostSprite = this.scene.add.image(x, y, ghostKey);
    this.ghostSprite.setDepth(10);
    this.ghostSprite.setAlpha(canBuild ? 0.8 : 0.4);
    this.ghostSprite.setTint(canBuild ? 0xffffff : 0xff4444);

    // Pulsing animation
    this.scene.tweens.add({
      targets: this.ghostSprite,
      alpha: { from: 0.5, to: 0.9 },
      yoyo: true,
      repeat: -1,
      duration: 600,
    });
  }

  removeGhost(): void {
    if (this.ghostSprite) {
      this.scene.tweens.killTweensOf(this.ghostSprite);
      this.ghostSprite.destroy();
      this.ghostSprite = null;
    }
  }

  hasBuilding(col: number, row: number): boolean {
    return this.buildings.some(b => b.col === col && b.row === row);
  }

  canAfford(type: BuildingType): boolean {
    const cost = ENERGY.BUILDING_COSTS[type];
    return this.energy.getCurrent() >= cost;
  }

  place(col: number, row: number, type: BuildingType): boolean {
    if (!this.tileMap.isBuildable(col, row)) return false;
    if (this.hasBuilding(col, row)) return false;
    if (!this.canAfford(type)) return false;

    const cost = ENERGY.BUILDING_COSTS[type];
    if (!this.energy.spend(cost)) return false;

    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;

    const textureKey = `building_${type}`;
    const sprite = this.scene.add.image(x, y, textureKey);
    sprite.setDepth(4);

    // Placement bounce animation
    sprite.setScale(0);
    this.scene.tweens.add({
      targets: sprite,
      scaleX: 1,
      scaleY: 1,
      duration: 350,
      ease: 'Back.Out',
    });

    const building: BuildingData = { type, col, row, sprite, timer: 0 };
    this.buildings.push(building);
    this.buildingGroup.add(sprite);

    // Register energy effects
    switch (type) {
      case BUILDING.SOLAR_PANEL:
        this.energy.addGeneration(ENERGY.SOLAR_PANEL_GEN);
        this.addSolarAnim(building);
        break;
      case BUILDING.BATTERY:
        this.energy.increaseMax(ENERGY.BATTERY_CAPACITY_BONUS);
        this.addBatteryAnim(building);
        break;
      case BUILDING.PURIFIER:
        this.energy.addConsumption(ENERGY.PURIFIER_COST_PER_SEC);
        this.addPurifierAnim(building);
        break;
    }

    // Spawn placement particles
    this.spawnPlaceParticles(x, y, type);

    return true;
  }

  private addSolarAnim(building: BuildingData): void {
    // Shimmer / pulse
    this.scene.tweens.add({
      targets: building.sprite,
      alpha: { from: 1, to: 0.8 },
      yoyo: true,
      repeat: -1,
      duration: 1200,
      ease: 'Sine.InOut',
    });
  }

  private addBatteryAnim(building: BuildingData): void {
    // Slight scale pulse
    this.scene.tweens.add({
      targets: building.sprite,
      scaleX: { from: 1, to: 1.04 },
      scaleY: { from: 1, to: 1.04 },
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Sine.InOut',
    });
  }

  private addPurifierAnim(building: BuildingData): void {
    // Rotation of the purifier sprite
    this.scene.tweens.add({
      targets: building.sprite,
      angle: { from: -3, to: 3 },
      yoyo: true,
      repeat: -1,
      duration: 700,
      ease: 'Sine.InOut',
    });
  }

  private spawnPlaceParticles(x: number, y: number, type: BuildingType): void {
    const tint = type === BUILDING.SOLAR_PANEL ? 0xFFD700
               : type === BUILDING.BATTERY     ? 0x4488FF
               : 0x00FF99;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const px = this.scene.add.image(x, y, 'particle_sparkle');
      px.setTint(tint);
      px.setDepth(20);
      px.setScale(0.8);

      this.scene.tweens.add({
        targets: px,
        x: x + Math.cos(angle) * 40,
        y: y + Math.sin(angle) * 40,
        alpha: { from: 1, to: 0 },
        scaleX: { from: 1, to: 0 },
        scaleY: { from: 1, to: 0 },
        duration: 500,
        ease: 'Power2.Out',
        onComplete: () => px.destroy(),
      });
    }
  }

  update(delta: number): void {
    const isBlackout = this.energy.isBlackout();

    for (const building of this.buildings) {
      building.timer += delta;

      if (building.type === BUILDING.PURIFIER && !isBlackout) {
        this.updatePurifier(building, delta);
      }

      // Solar panel energy particles
      if (building.type === BUILDING.SOLAR_PANEL && !isBlackout) {
        if (Math.floor(building.timer / 1800) > Math.floor((building.timer - delta) / 1800)) {
          this.spawnEnergyParticle(building);
        }
      }
    }
  }

  private updatePurifier(building: BuildingData, delta: number): void {
    const key = `${building.col},${building.row}`;
    const elapsed = (this.purifierTimers.get(key) ?? 0) + delta;
    this.purifierTimers.set(key, elapsed);

    // Every 3 seconds, restore one nearby tile
    if (elapsed >= 3000) {
      this.purifierTimers.set(key, 0);
      const nearby = this.tileMap.getNearbyPolluted(building.col, building.row, 3);
      if (nearby.length > 0) {
        const target = nearby[Math.floor(Math.random() * Math.min(4, nearby.length))];
        this.tileMap.restoreTile(target.col, target.row);
        this.spawnPurifyParticles(
          target.col * TILE_SIZE + TILE_SIZE / 2,
          target.row * TILE_SIZE + TILE_SIZE / 2
        );
      }
    }
  }

  private spawnEnergyParticle(building: BuildingData): void {
    const x = building.sprite.x;
    const y = building.sprite.y;
    const p = this.scene.add.image(x, y, 'particle_sparkle');
    p.setTint(0xFFD700);
    p.setDepth(20);
    p.setScale(0.9);

    this.scene.tweens.add({
      targets: p,
      y: y - 30,
      x: x + Phaser.Math.Between(-15, 15),
      alpha: { from: 1, to: 0 },
      duration: 900,
      ease: 'Power1.Out',
      onComplete: () => p.destroy(),
    });
  }

  private spawnPurifyParticles(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      const p = this.scene.add.image(
        x + Phaser.Math.Between(-16, 16),
        y + Phaser.Math.Between(-16, 16),
        'particle_leaf'
      );
      p.setDepth(15);
      p.setScale(0.7 + Math.random() * 0.5);
      this.scene.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(20, 40),
        alpha: { from: 1, to: 0 },
        angle: Phaser.Math.Between(-90, 90),
        duration: 800,
        ease: 'Power1.Out',
        onComplete: () => p.destroy(),
      });
    }
  }

  getBuildingCount(type: BuildingType): number {
    return this.buildings.filter(b => b.type === type).length;
  }
}
