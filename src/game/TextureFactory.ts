// ─── Procedural Texture Factory ──────────────────────────────────────────────
// Generates all pixel-art textures programmatically using Phaser Graphics

import Phaser from 'phaser';
import { TILE_SIZE, COLORS } from './constants';

export class TextureFactory {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createAll(): void {
    this.createTileTextures();
    this.createPlayerTextures();
    this.createBuildingTextures();
    this.createTreeTexture();
    this.createParticleTexture();
    this.createUITextures();
  }

  private draw(key: string, w: number, h: number, fn: (g: Phaser.GameObjects.Graphics) => void): void {
    if (this.scene.textures.exists(key)) return;
    const g = this.scene.add.graphics();
    fn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // ── Tile Textures ────────────────────────────────────────────────────────
  createTileTextures(): void {
    const T = TILE_SIZE;

    // Polluted tile
    this.draw('tile_polluted', T, T, (g) => {
      g.fillStyle(COLORS.POLLUTED);
      g.fillRect(0, 0, T, T);
      // Grid noise pattern
      g.fillStyle(COLORS.POLLUTED_ALT, 0.6);
      for (let i = 0; i < 6; i++) {
        g.fillRect(
          Math.floor((i * 7) % (T - 8)) + 2,
          Math.floor((i * 11) % (T - 8)) + 2,
          6, 4
        );
      }
      // Smog dots
      g.fillStyle(0x5C4A0A, 0.4);
      g.fillCircle(8, 12, 4);
      g.fillCircle(32, 8, 3);
      g.fillCircle(20, 36, 5);
      // Border
      g.lineStyle(1, 0x6B520F, 0.5);
      g.strokeRect(0, 0, T, T);
    });

    // Restored tile
    this.draw('tile_restored', T, T, (g) => {
      g.fillStyle(COLORS.RESTORED);
      g.fillRect(0, 0, T, T);
      // Grass detail
      g.fillStyle(COLORS.RESTORED_ALT, 0.7);
      for (let i = 0; i < 5; i++) {
        g.fillRect(
          Math.floor((i * 9 + 3) % (T - 6)),
          Math.floor((i * 13 + 2) % (T - 6)),
          3, 5
        );
      }
      g.fillStyle(0x2A7A38, 0.5);
      g.fillCircle(10, 10, 5);
      g.fillCircle(36, 28, 4);
      g.fillCircle(22, 40, 5);
      // Border
      g.lineStyle(1, 0x2A6E35, 0.4);
      g.strokeRect(0, 0, T, T);
    });

    // Water tile
    this.draw('tile_water', T, T, (g) => {
      g.fillStyle(COLORS.WATER);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x5593E8, 0.5);
      g.fillRect(4, 8, T - 8, 6);
      g.fillRect(8, 24, T - 12, 6);
      g.fillRect(2, 36, T - 6, 6);
      g.lineStyle(1, 0x2A5CB8, 0.4);
      g.strokeRect(0, 0, T, T);
    });

    // Stone tile
    this.draw('tile_stone', T, T, (g) => {
      g.fillStyle(COLORS.STONE);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x999999, 0.6);
      g.fillRect(4, 4, 18, 14);
      g.fillRect(24, 4, 18, 14);
      g.fillRect(4, 24, 14, 18);
      g.fillRect(20, 24, 22, 18);
      g.lineStyle(1, 0x666666, 0.6);
      g.strokeRect(0, 0, T, T);
    });

    // Transition tile (mid-way)
    this.draw('tile_transition', T, T, (g) => {
      g.fillStyle(0x8B7A3A);
      g.fillRect(0, 0, T, T);
      // Mix of green and brown blobs
      g.fillStyle(COLORS.RESTORED, 0.6);
      g.fillCircle(12, 12, 8);
      g.fillCircle(36, 36, 10);
      g.fillStyle(COLORS.POLLUTED, 0.6);
      g.fillCircle(34, 14, 8);
      g.fillCircle(12, 36, 8);
      g.lineStyle(1, 0x6B6020, 0.4);
      g.strokeRect(0, 0, T, T);
    });
  }

  // ── Player Textures ───────────────────────────────────────────────────────
  createPlayerTextures(): void {
    const W = 32, H = 40;

    // Player idle / base
    this.draw('player_idle', W, H, (g) => {
      // Body suit (teal/cyan solar ranger)
      g.fillStyle(0x00B4CC);
      g.fillRoundedRect(8, 14, 16, 18, 3);
      // Head
      g.fillStyle(0xFFDBAA);
      g.fillCircle(16, 11, 9);
      // Helmet visor
      g.fillStyle(0x00D4FF, 0.7);
      g.fillRoundedRect(10, 5, 12, 8, 3);
      // Chest solar emblem
      g.fillStyle(0xFFD700);
      g.fillCircle(16, 22, 4);
      g.fillStyle(0xFF8C00);
      // Sun rays on emblem
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.fillRect(16 + Math.cos(a) * 4, 22 + Math.sin(a) * 4, 2, 2);
      }
      // Legs
      g.fillStyle(0x007A99);
      g.fillRect(9, 30, 6, 9);
      g.fillRect(17, 30, 6, 9);
      // Boots
      g.fillStyle(0x004D66);
      g.fillRect(8, 37, 8, 3);
      g.fillRect(16, 37, 8, 3);
      // Arms
      g.fillStyle(0x00B4CC);
      g.fillRect(3, 15, 5, 14);
      g.fillRect(24, 15, 5, 14);
      // Gloves
      g.fillStyle(0xFFD700);
      g.fillRect(3, 27, 5, 4);
      g.fillRect(24, 27, 5, 4);
    });

    // Player walk frame 1
    this.draw('player_walk1', W, H, (g) => {
      g.fillStyle(0x00B4CC);
      g.fillRoundedRect(8, 14, 16, 18, 3);
      g.fillStyle(0xFFDBAA);
      g.fillCircle(16, 11, 9);
      g.fillStyle(0x00D4FF, 0.7);
      g.fillRoundedRect(10, 5, 12, 8, 3);
      g.fillStyle(0xFFD700);
      g.fillCircle(16, 22, 4);
      // Legs (walking position 1)
      g.fillStyle(0x007A99);
      g.fillRect(9, 30, 6, 7);
      g.fillRect(17, 32, 6, 9);
      g.fillStyle(0x004D66);
      g.fillRect(8, 35, 8, 3);
      g.fillRect(16, 39, 8, 3);
      // Arms swing
      g.fillStyle(0x00B4CC);
      g.fillRect(2, 13, 5, 14);
      g.fillRect(25, 17, 5, 14);
      g.fillStyle(0xFFD700);
      g.fillRect(2, 25, 5, 4);
      g.fillRect(25, 29, 5, 4);
    });

    // Player walk frame 2
    this.draw('player_walk2', W, H, (g) => {
      g.fillStyle(0x00B4CC);
      g.fillRoundedRect(8, 14, 16, 18, 3);
      g.fillStyle(0xFFDBAA);
      g.fillCircle(16, 11, 9);
      g.fillStyle(0x00D4FF, 0.7);
      g.fillRoundedRect(10, 5, 12, 8, 3);
      g.fillStyle(0xFFD700);
      g.fillCircle(16, 22, 4);
      // Legs (walking position 2)
      g.fillStyle(0x007A99);
      g.fillRect(9, 32, 6, 9);
      g.fillRect(17, 30, 6, 7);
      g.fillStyle(0x004D66);
      g.fillRect(8, 39, 8, 3);
      g.fillRect(16, 35, 8, 3);
      // Arms swing opposite
      g.fillStyle(0x00B4CC);
      g.fillRect(3, 17, 5, 14);
      g.fillRect(24, 13, 5, 14);
      g.fillStyle(0xFFD700);
      g.fillRect(3, 29, 5, 4);
      g.fillRect(24, 25, 5, 4);
    });
  }

  // ── Building Textures ─────────────────────────────────────────────────────
  createBuildingTextures(): void {
    const S = TILE_SIZE;

    // Solar Panel
    this.draw('building_solar_panel', S, S, (g) => {
      // Base / frame
      g.fillStyle(0x888888);
      g.fillRect(4, 4, S - 8, S - 8);
      // Panel cells
      g.fillStyle(0x1A1A6E);
      g.fillRect(6, 6, S - 12, S - 12);
      // Grid lines on panel
      g.lineStyle(1, 0x3A3A9E, 0.8);
      const cols = 3, rows = 3;
      const pw = (S - 12) / cols, ph = (S - 12) / rows;
      for (let c = 1; c < cols; c++) {
        g.lineBetween(6 + c * pw, 6, 6 + c * pw, S - 6);
      }
      for (let r = 1; r < rows; r++) {
        g.lineBetween(6, 6 + r * ph, S - 6, 6 + r * ph);
      }
      // Shine effect
      g.fillStyle(0xFFFFFF, 0.15);
      g.fillRect(8, 8, 10, 6);
      // Glow
      g.fillStyle(0xFFD700, 0.25);
      g.fillRect(6, 6, S - 12, S - 12);
      // Label
      g.fillStyle(0xFFD700);
      g.fillCircle(S / 2, S / 2, 6);
      // Sun rays
      g.lineStyle(2, 0xFFD700, 0.9);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.lineBetween(
          S / 2 + Math.cos(a) * 7, S / 2 + Math.sin(a) * 7,
          S / 2 + Math.cos(a) * 11, S / 2 + Math.sin(a) * 11
        );
      }
    });

    // Battery
    this.draw('building_battery', S, S, (g) => {
      // Outer casing
      g.fillStyle(0x2255AA);
      g.fillRoundedRect(6, 6, S - 12, S - 12, 5);
      // Inner body
      g.fillStyle(0x3366CC);
      g.fillRoundedRect(9, 9, S - 18, S - 18, 4);
      // Terminal top
      g.fillStyle(0xAAAAFF);
      g.fillRect(16, 3, 8, 5);
      // Charge bars
      const barH = 5, barW = S - 22, barX = 11;
      const barColors = [0x00FF44, 0x44FF88, 0x88FFBB, 0xAAFFDD];
      for (let i = 0; i < 4; i++) {
        g.fillStyle(barColors[i], 0.9);
        g.fillRect(barX, 12 + i * 8, barW, barH);
      }
      // Lightning bolt
      g.fillStyle(0xFFFFAA);
      const bx = S / 2, by = S / 2;
      g.fillTriangle(bx - 5, by - 8, bx + 2, by - 8, bx - 2, by + 1);
      g.fillTriangle(bx - 2, by + 1, bx + 5, by + 1, bx - 2, by + 8);
    });

    // Purifier
    this.draw('building_purifier', S, S, (g) => {
      // Base cylinder
      g.fillStyle(0x006644);
      g.fillEllipse(S / 2, S - 10, S - 8, 16);
      g.fillStyle(0x00AA66);
      g.fillRect(8, 12, S - 16, S - 22);
      g.fillStyle(0x006644);
      g.fillRect(8, 12, S - 16, 4);
      // Top dome
      g.fillStyle(0x00CC88);
      g.fillEllipse(S / 2, 14, S - 10, 16);
      // Filter vents
      g.fillStyle(0x004433, 0.8);
      for (let i = 0; i < 3; i++) {
        g.fillRect(12, 22 + i * 7, S - 24, 4);
      }
      // Emission particles (top)
      g.fillStyle(0x00FFAA, 0.8);
      g.fillCircle(S / 2, 5, 4);
      g.fillCircle(S / 2 - 6, 3, 2);
      g.fillCircle(S / 2 + 6, 3, 2);
      // Leaf symbol
      g.fillStyle(0xAAFFCC);
      g.fillEllipse(S / 2, S / 2 + 2, 14, 10);
    });

    // Ghost versions (semi-transparent, for placement preview)
    this.draw('ghost_solar_panel', S, S, (g) => {
      g.fillStyle(0xFFD700, 0.35);
      g.fillRect(4, 4, S - 8, S - 8);
      g.lineStyle(2, 0xFFD700, 0.9);
      g.strokeRect(4, 4, S - 8, S - 8);
    });

    this.draw('ghost_battery', S, S, (g) => {
      g.fillStyle(0x4488FF, 0.35);
      g.fillRoundedRect(6, 6, S - 12, S - 12, 5);
      g.lineStyle(2, 0x88BBFF, 0.9);
      g.strokeRoundedRect(6, 6, S - 12, S - 12, 5);
    });

    this.draw('ghost_purifier', S, S, (g) => {
      g.fillStyle(0x00FF99, 0.35);
      g.fillRect(8, 6, S - 16, S - 12);
      g.lineStyle(2, 0x00FFAA, 0.9);
      g.strokeRect(8, 6, S - 16, S - 12);
    });
  }

  // ── Tree Texture ─────────────────────────────────────────────────────────
  createTreeTexture(): void {
    const W = 44, H = 56;
    this.draw('tree', W, H, (g) => {
      // Shadow
      g.fillStyle(0x000000, 0.15);
      g.fillEllipse(W / 2 + 3, H - 4, 26, 8);
      // Trunk
      g.fillStyle(COLORS.TREE_TRUNK);
      g.fillRect(W / 2 - 5, H - 20, 10, 22);
      g.fillStyle(0x4A2E14);
      g.fillRect(W / 2 - 3, H - 20, 3, 22);
      // Leaves (bright green 🌳)
     g.fillStyle(0x2ecc71); // main green
     g.fillCircle(W / 2, H - 28, 18);

     g.fillStyle(0x27ae60); // darker shade
     g.fillCircle(W / 2, H - 32, 16);

     g.fillStyle(0x58d68d); // light highlight leaves
     g.fillCircle(W / 2 - 5, H - 34, 10);
     g.fillCircle(W / 2 + 6, H - 33, 9);
      // Leaves (layered circles)
      
      
      // Highlight
      g.fillStyle(0xAAFFAA, 0.25);
      g.fillCircle(W / 2 - 4, H - 36, 6);
    });

    // Dead tree (on polluted land)
    this.draw('dead_tree', W, H, (g) => {
      g.fillStyle(0x000000, 0.15);
      g.fillEllipse(W / 2 + 3, H - 4, 26, 8);
      g.fillStyle(0x4A3010);
      g.fillRect(W / 2 - 5, H - 24, 10, 26);
      g.fillStyle(0x3A2208);
      g.fillRect(W / 2 - 3, H - 24, 3, 26);
      // Bare branches
      g.lineStyle(4, 0x4A3010);
      g.lineBetween(W / 2, H - 24, W / 2 - 12, H - 38);
      g.lineBetween(W / 2, H - 24, W / 2 + 10, H - 36);
      g.lineStyle(3, 0x4A3010);
      g.lineBetween(W / 2 - 12, H - 38, W / 2 - 18, H - 46);
      g.lineBetween(W / 2 - 12, H - 38, W / 2 - 6, H - 48);
      g.lineBetween(W / 2 + 10, H - 36, W / 2 + 16, H - 46);
      g.lineBetween(W / 2 + 10, H - 36, W / 2 + 4, H - 48);
      // Smog wisps
      g.fillStyle(0x8B7340, 0.3);
      g.fillCircle(W / 2 - 8, H - 44, 5);
      g.fillCircle(W / 2 + 8, H - 42, 4);
    });
  }

  // ── Particle Texture ─────────────────────────────────────────────────────
  createParticleTexture(): void {
    this.draw('particle_star', 12, 12, (g) => {
      g.fillStyle(0x00FF88, 1);
      g.fillCircle(6, 6, 5);
      g.fillStyle(0xFFFFFF, 0.6);
      g.fillCircle(4, 4, 2);
    });

    this.draw('particle_sparkle', 8, 8, (g) => {
      g.fillStyle(0xFFD700, 1);
      g.fillRect(3, 0, 2, 8);
      g.fillRect(0, 3, 8, 2);
    });

    this.draw('particle_leaf', 10, 10, (g) => {
      g.fillStyle(0x44DD66, 1);
      g.fillEllipse(5, 5, 8, 10);
      g.lineStyle(1, 0x228844);
      g.lineBetween(5, 1, 5, 9);
    });
  }

  // ── UI Textures ──────────────────────────────────────────────────────────
  createUITextures(): void {
    // Energy bar background
    this.draw('ui_bar_bg', 202, 24, (g) => {
      g.fillStyle(0x000000, 0.6);
      g.fillRoundedRect(0, 0, 202, 24, 12);
      g.lineStyle(2, 0x444444, 0.8);
      g.strokeRoundedRect(0, 0, 202, 24, 12);
    });

    // Energy bar fill
    this.draw('ui_bar_fill', 196, 18, (g) => {
      // Gradient-like via rectangles
      g.fillStyle(0xFFAA00);
      g.fillRoundedRect(0, 0, 196, 18, 9);
      g.fillStyle(0xFFDD00, 0.6);
      g.fillRoundedRect(0, 0, 196, 9, 9);
      g.fillStyle(0xFFFFAA, 0.2);
      g.fillRoundedRect(4, 2, 180, 6, 3);
    });

    // Panel button bg
    this.draw('ui_btn_bg', 100, 70, (g) => {
      g.fillStyle(0x1A2A3A, 0.9);
      g.fillRoundedRect(0, 0, 100, 70, 10);
      g.lineStyle(2, 0x334455, 0.9);
      g.strokeRoundedRect(0, 0, 100, 70, 10);
    });

    this.draw('ui_btn_selected', 100, 70, (g) => {
      g.fillStyle(0x1A3A5A, 0.95);
      g.fillRoundedRect(0, 0, 100, 70, 10);
      g.lineStyle(2, 0x00D4FF, 1);
      g.strokeRoundedRect(0, 0, 100, 70, 10);
      // Corner accents
      g.lineStyle(3, 0x00D4FF, 0.5);
      g.lineBetween(0, 14, 0, 0);
      g.lineBetween(0, 0, 14, 0);
      g.lineBetween(86, 0, 100, 0);
      g.lineBetween(100, 0, 100, 14);
    });

    // Minimap bg
    this.draw('minimap_bg', 134, 102, (g) => {
      g.fillStyle(0x000000, 0.7);
      g.fillRoundedRect(0, 0, 134, 102, 8);
      g.lineStyle(1, 0x334455, 0.8);
      g.strokeRoundedRect(0, 0, 134, 102, 8);
    });
  }
}
