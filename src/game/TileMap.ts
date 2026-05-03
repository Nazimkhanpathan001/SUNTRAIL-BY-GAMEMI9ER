// ─── Tile Map System ─────────────────────────────────────────────────────────

import Phaser from 'phaser';
import { TILE_SIZE, MAP_COLS, MAP_ROWS, TILE, WIN_PERCENT } from './constants';
import type { TileType } from './constants';

export interface TileData {
  type: TileType;
  sprite: Phaser.GameObjects.Image;
  col: number;
  row: number;
  isRestoring: boolean;
  restoreProgress: number; // 0 → 1
}

export class TileMap {
  private scene: Phaser.Scene;
  public tiles: TileData[][] = [];
  public tileGroup: Phaser.GameObjects.Group;
  private totalPolluted: number = 0;
  private restoredCount: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.tileGroup = scene.add.group();
  }

  generate(): void {
    // Deterministic pseudo-random map generation
    const seed = (x: number, y: number) => {
      const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
      return n - Math.floor(n);
    };

    for (let row = 0; row < MAP_ROWS; row++) {
      this.tiles[row] = [];
      for (let col = 0; col < MAP_COLS; col++) {
        const s = seed(col, row);
        let type: TileType;

        // Border / water ring
        if (row === 0 || row === MAP_ROWS - 1 || col === 0 || col === MAP_COLS - 1) {
          type = TILE.WATER;
        } else if (row === 1 || row === MAP_ROWS - 2 || col === 1 || col === MAP_COLS - 2) {
          type = TILE.STONE;
        } else {
          // Inner map: mostly polluted with some stones
          if (s < 0.06) {
            type = TILE.STONE;
          } else {
            type = TILE.POLLUTED;
          }
        }

        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;
        const textureKey = this.getTextureKey(type);
        const sprite = this.scene.add.image(x, y, textureKey);
        sprite.setDepth(0);

        if (type === TILE.POLLUTED) this.totalPolluted++;

        this.tiles[row][col] = {
          type,
          sprite,
          col,
          row,
          isRestoring: false,
          restoreProgress: 0,
        };

        this.tileGroup.add(sprite);
      }
    }
  }

  private getTextureKey(type: TileType): string {
    switch (type) {
      case TILE.POLLUTED: return 'tile_polluted';
      case TILE.RESTORED: return 'tile_restored';
      case TILE.WATER:    return 'tile_water';
      case TILE.STONE:    return 'tile_stone';
      default:            return 'tile_polluted';
    }
  }

  getTileAt(worldX: number, worldY: number): TileData | null {
    const col = Math.floor(worldX / TILE_SIZE);
    const row = Math.floor(worldY / TILE_SIZE);
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return null;
    return this.tiles[row][col];
  }

  getTileAtGrid(col: number, row: number): TileData | null {
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return null;
    return this.tiles[row][col];
  }

  isPolluted(col: number, row: number): boolean {
    const tile = this.getTileAtGrid(col, row);
    return tile !== null && tile.type === TILE.POLLUTED;
  }

  isRestored(col: number, row: number): boolean {
    const tile = this.getTileAtGrid(col, row);
    return tile !== null && tile.type === TILE.RESTORED;
  }

  isBuildable(col: number, row: number): boolean {
    const tile = this.getTileAtGrid(col, row);
    return tile !== null && (tile.type === TILE.POLLUTED || tile.type === TILE.RESTORED);
  }

  restoreTile(col: number, row: number, _instant: boolean = false): boolean {
    const tile = this.getTileAtGrid(col, row);
    if (!tile || tile.type !== TILE.POLLUTED) return false;

    tile.type = TILE.RESTORED;
    tile.sprite.setTexture('tile_restored');
    this.restoredCount++;

    // Flash animation
    this.scene.tweens.add({
      targets: tile.sprite,
      scaleX: { from: 1.1, to: 1 },
      scaleY: { from: 1.1, to: 1 },
      duration: 300,
      ease: 'Back.Out',
    });

    return true;
  }

  // Slowly restore a tile (used by purifier)
  tickRestoring(col: number, row: number, delta: number): boolean {
    const tile = this.getTileAtGrid(col, row);
    if (!tile || tile.type !== TILE.POLLUTED) return false;

    tile.isRestoring = true;
    tile.restoreProgress += delta / 3000; // 3 seconds to restore

    // Show transition texture
    if (tile.restoreProgress > 0.3 && tile.restoreProgress < 0.8) {
      tile.sprite.setTexture('tile_transition');
    }

    if (tile.restoreProgress >= 1) {
      tile.isRestoring = false;
      tile.restoreProgress = 0;
      this.restoreTile(col, row);
      return true;
    }
    return false;
  }

  getRestorationPercent(): number {
    if (this.totalPolluted === 0) return 100;
    return (this.restoredCount / this.totalPolluted) * 100;
  }

  getRestoredCount(): number { return this.restoredCount; }
  getTotalPolluted(): number { return this.totalPolluted; }

  isWinCondition(): boolean {
    return this.getRestorationPercent() >= WIN_PERCENT;
  }

  // Get nearby polluted tiles to a position (for purifier)
  getNearbyPolluted(centerCol: number, centerRow: number, radius: number): TileData[] {
    const result: TileData[] = [];
    for (let r = centerRow - radius; r <= centerRow + radius; r++) {
      for (let c = centerCol - radius; c <= centerCol + radius; c++) {
        const tile = this.getTileAtGrid(c, r);
        if (tile && tile.type === TILE.POLLUTED && !tile.isRestoring) {
          result.push(tile);
        }
      }
    }
    return result;
  }
}
