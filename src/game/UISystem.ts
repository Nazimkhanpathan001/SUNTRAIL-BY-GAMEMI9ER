// ─── UI System ───────────────────────────────────────────────────────────────

import Phaser from 'phaser';
import { BUILDING, ENERGY, MAP_COLS, MAP_ROWS, TILE_SIZE } from './constants';
import type { BuildingType } from './constants';
import { EnergySystem } from './EnergySystem';
import { TileMap } from './TileMap';
import { BuildingSystem } from './BuildingSystem';

const PANEL_BUILDINGS: { type: BuildingType; label: string; key: string; cost: number; color: number }[] = [
  { type: BUILDING.SOLAR_PANEL, label: 'Solar Panel', key: '1', cost: ENERGY.BUILDING_COSTS.solar_panel, color: 0xFFD700 },
  { type: BUILDING.BATTERY,     label: 'Battery',     key: '2', cost: ENERGY.BUILDING_COSTS.battery,     color: 0x4488FF },
  { type: BUILDING.PURIFIER,    label: 'Purifier',    key: '3', cost: ENERGY.BUILDING_COSTS.purifier,    color: 0x00FF99 },
];

export class UISystem {
  private scene: Phaser.Scene;
  private energy: EnergySystem;
  private tileMap: TileMap;
  private buildings: BuildingSystem;
  private cam: Phaser.Cameras.Scene2D.Camera;

  // UI Elements
  private container: Phaser.GameObjects.Container;
  private energyBarFill!: Phaser.GameObjects.Rectangle;
  private energyText!: Phaser.GameObjects.Text;
  private energyFlowText!: Phaser.GameObjects.Text;
  private restorationText!: Phaser.GameObjects.Text;
  private selectedBuildingType: BuildingType | null = null;
  private btnBgs: Phaser.GameObjects.Image[] = [];
  private btnLabels: Phaser.GameObjects.Text[] = [];
  private btnCosts: Phaser.GameObjects.Text[] = [];
  private btnIcons: Phaser.GameObjects.Image[] = [];
  private blackoutOverlay: Phaser.GameObjects.Rectangle | null = null;
  private blackoutText: Phaser.GameObjects.Text | null = null;
  private blackoutTween: Phaser.Tweens.Tween | null = null;
  private minimapBg!: Phaser.GameObjects.Image;
  private minimapGraphics!: Phaser.GameObjects.Graphics;
  private keyListeners: Phaser.Input.Keyboard.Key[] = [];
  private statsText!: Phaser.GameObjects.Text;
  private helpText!: Phaser.GameObjects.Text;
  private cleanCostText!: Phaser.GameObjects.Text;
  private energyBarBg!: Phaser.GameObjects.Rectangle;
  private energyBarBorder!: Phaser.GameObjects.Rectangle;

  private onBuildingSelect?: (type: BuildingType | null) => void;

  constructor(
    scene: Phaser.Scene,
    energy: EnergySystem,
    tileMap: TileMap,
    buildings: BuildingSystem,
  ) {
    this.scene = scene;
    this.energy = energy;
    this.tileMap = tileMap;
    this.buildings = buildings;
    this.cam = scene.cameras.main;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(100);

    this.buildEnergyPanel();
    this.buildBuildingPanel();
    this.buildMinimap();
    this.buildStatsPanel();
    this.buildHelpText();
    this.buildBlackoutOverlay();
    this.setupKeyboardShortcuts();
  }

  setOnBuildingSelect(cb: (type: BuildingType | null) => void): void {
    this.onBuildingSelect = cb;
  }

  // ── Energy Panel (top-left) ───────────────────────────────────────────────
  private buildEnergyPanel(): void {

    // Background card
    const card = this.scene.add.rectangle(8, 8, 240, 100, 0x0A1628, 0.88);
    card.setOrigin(0, 0);
    card.setStrokeStyle(2, 0x1E3A5F, 1);

    // Corner accent lines
    const acc = this.scene.add.graphics();
    acc.lineStyle(2, 0x00D4FF, 0.7);
    acc.lineBetween(8, 8, 28, 8);
    acc.lineBetween(8, 8, 8, 28);
    acc.lineBetween(228, 8, 248, 8);
    acc.lineBetween(248, 8, 248, 28);
    acc.lineBetween(8, 88, 8, 108);
    acc.lineBetween(8, 108, 28, 108);

    // Icon sun
    const sunIcon = this.scene.add.graphics();
    sunIcon.fillStyle(0xFFD700, 1);
    sunIcon.fillCircle(30, 30, 8);
    sunIcon.lineStyle(2, 0xFFD700, 0.8);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      sunIcon.lineBetween(30 + Math.cos(a) * 10, 30 + Math.sin(a) * 10, 30 + Math.cos(a) * 14, 30 + Math.sin(a) * 14);
    }

    // Energy label
    const lbl = this.scene.add.text(48, 18, '⚡ ENERGY', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#FFD700',
      fontStyle: 'bold',
    });

    // Bar background
    this.energyBarBg = this.scene.add.rectangle(20, 40, 220, 20, 0x111122, 1);
    this.energyBarBg.setOrigin(0, 0);
    this.energyBarBg.setStrokeStyle(1, 0x334466, 1);

    // Bar fill
    this.energyBarFill = this.scene.add.rectangle(22, 42, 0, 16, 0xFFD700, 1);
    this.energyBarFill.setOrigin(0, 0);

    // Sheen on bar
    const barSheen = this.scene.add.rectangle(22, 42, 216, 8, 0xFFFFAA, 0.18);
    barSheen.setOrigin(0, 0);

    // Energy text overlay
    this.energyText = this.scene.add.text(130, 42, '80 / 200', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    this.energyText.setOrigin(0.5, 0);

    // Flow indicator
    this.energyFlowText = this.scene.add.text(20, 66, '▲ +0.0/s', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#00FF88',
    });

    // Restoration text
    this.restorationText = this.scene.add.text(20, 82, '🌱 Restored: 0%', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#88FFCC',
    });

    this.container.add([card, acc, sunIcon, lbl, this.energyBarBg, this.energyBarFill, barSheen, this.energyText, this.energyFlowText, this.restorationText]);

    // Energy bar border (on top)
    this.energyBarBorder = this.scene.add.rectangle(20, 40, 220, 20, 0x000000, 0);
    this.energyBarBorder.setOrigin(0, 0);
    this.energyBarBorder.setStrokeStyle(1, 0x5588BB, 0.7);
    this.container.add(this.energyBarBorder);
  }

  // ── Building Panel (bottom-center) ────────────────────────────────────────
  private buildBuildingPanel(): void {
    const W = this.cam.width;
    const H = this.cam.height;
    const panelW = PANEL_BUILDINGS.length * 112 + 20;
    const panelX = (W - panelW) / 2;
    const panelY = H - 100;

    // Panel background
    const bg = this.scene.add.rectangle(panelX - 8, panelY - 12, panelW + 16, 100, 0x0A1628, 0.9);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, 0x1E3A5F, 1);
    this.container.add(bg);

    // Title
    const title = this.scene.add.text(W / 2, panelY - 8, '🏗 BUILD MENU', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#88BBDD',
    });
    title.setOrigin(0.5, 1);
    this.container.add(title);

    PANEL_BUILDINGS.forEach((item, i) => {
      const bx = panelX + i * 112;
      const by = panelY;

      // Button background
      const btnBg = this.scene.add.image(bx + 50, by + 36, 'ui_btn_bg');
      btnBg.setDisplaySize(108, 72);
      this.btnBgs.push(btnBg);
      this.container.add(btnBg);

      // Key badge
      const keyBadge = this.scene.add.rectangle(bx + 14, by + 8, 20, 18, item.color, 0.8);
      keyBadge.setStrokeStyle(1, 0xFFFFFF, 0.5);
      this.container.add(keyBadge);

      const keyTxt = this.scene.add.text(bx + 14, by + 8, item.key, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#000000',
        fontStyle: 'bold',
      });
      keyTxt.setOrigin(0.5, 0.5);
      this.container.add(keyTxt);

      // Building icon (small version)
      const icon = this.scene.add.image(bx + 50, by + 30, `building_${item.type}`);
      icon.setDisplaySize(38, 38);
      this.btnIcons.push(icon);
      this.container.add(icon);

      // Label
      const lbl = this.scene.add.text(bx + 50, by + 53, item.label, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#AACCEE',
        fontStyle: 'bold',
        align: 'center',
      });
      lbl.setOrigin(0.5, 0);
      this.btnLabels.push(lbl);
      this.container.add(lbl);

      // Cost
      const costTxt = this.scene.add.text(bx + 50, by + 65, `⚡ ${item.cost}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#FFD700',
        align: 'center',
      });
      costTxt.setOrigin(0.5, 0);
      this.btnCosts.push(costTxt);
      this.container.add(costTxt);

      // Click handler
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.on('pointerdown', () => this.selectBuilding(item.type));
      btnBg.on('pointerover', () => {
        if (this.selectedBuildingType !== item.type) {
          btnBg.setTint(0xDDEEFF);
        }
      });
      btnBg.on('pointerout', () => {
        if (this.selectedBuildingType !== item.type) {
          btnBg.clearTint();
        }
      });
    });

    // Clean tile cost info
    this.cleanCostText = this.scene.add.text(W / 2, H - 6, `Click polluted tile to clean (⚡ ${ENERGY.CLEAN_TILE_COST})  |  E = Deselect  |  Right-click = Cancel`, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#667788',
    });
    this.cleanCostText.setOrigin(0.5, 1);
    this.container.add(this.cleanCostText);
  }

  // ── Minimap (top-right) ───────────────────────────────────────────────────
  private buildMinimap(): void {
    const W = this.cam.width;
    const mmW = 136, mmH = 104;
    const mmX = W - mmW - 12;
    const mmY = 12;

    this.minimapBg = this.scene.add.image(mmX + mmW / 2, mmY + mmH / 2, 'minimap_bg');
    this.minimapBg.setDisplaySize(mmW, mmH);
    this.container.add(this.minimapBg);

    this.minimapGraphics = this.scene.add.graphics();
    this.minimapGraphics.setScrollFactor(0);
    this.minimapGraphics.setDepth(101);

    const title = this.scene.add.text(mmX + mmW / 2, mmY + 4, 'MINIMAP', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#668899',
    });
    title.setOrigin(0.5, 0);
    this.container.add(title);
  }

  // ── Stats Panel ───────────────────────────────────────────────────────────
  private buildStatsPanel(): void {
    const W = this.cam.width;

    this.statsText = this.scene.add.text(W - 12, 122, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#88AABB',
      align: 'right',
    });
    this.statsText.setOrigin(1, 0);
    this.container.add(this.statsText);
  }

  // ── Help Text ─────────────────────────────────────────────────────────────
  private buildHelpText(): void {
    this.helpText = this.scene.add.text(8, this.cam.height - 6, 'WASD/Arrow Keys = Move', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#446655',
    });
    this.helpText.setOrigin(0, 1);
    this.container.add(this.helpText);
  }

  // ── Blackout Overlay ──────────────────────────────────────────────────────
  private buildBlackoutOverlay(): void {
    const W = this.cam.width;
    const H = this.cam.height;

    this.blackoutOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x220000, 0);
    this.blackoutOverlay.setScrollFactor(0);
    this.blackoutOverlay.setDepth(200);

    this.blackoutText = this.scene.add.text(W / 2, H / 2, '⚫ BLACKOUT!\nEnergy depleted!\nBuild more Solar Panels!', {
      fontFamily: 'monospace',
      fontSize: '26px',
      color: '#FF4444',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.blackoutText.setOrigin(0.5, 0.5);
    this.blackoutText.setScrollFactor(0);
    this.blackoutText.setDepth(201);
    this.blackoutText.setAlpha(0);
  }

  // ── Keyboard Shortcuts ────────────────────────────────────────────────────
  private setupKeyboardShortcuts(): void {
    const kb = this.scene.input.keyboard!;

    const key1 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    const key2 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    const key3 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    const keyE = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    key1.on('down', () => this.selectBuilding(BUILDING.SOLAR_PANEL));
    key2.on('down', () => this.selectBuilding(BUILDING.BATTERY));
    key3.on('down', () => this.selectBuilding(BUILDING.PURIFIER));
    keyE.on('down', () => this.deselectBuilding());

    this.keyListeners.push(key1, key2, key3, keyE);
  }

  selectBuilding(type: BuildingType): void {
    if (this.selectedBuildingType === type) {
      this.deselectBuilding();
      return;
    }
    this.selectedBuildingType = type;
    this.onBuildingSelect?.(type);
    this.updateBtnStyles();
  }

  public deselectBuilding(): void {
    this.selectedBuildingType = null;
    this.onBuildingSelect?.(null);
    this.updateBtnStyles();
  }

  private updateBtnStyles(): void {
    PANEL_BUILDINGS.forEach((item, i) => {
      const isSelected = this.selectedBuildingType === item.type;
      const texture = isSelected ? 'ui_btn_selected' : 'ui_btn_bg';
      this.btnBgs[i].setTexture(texture);
      this.btnBgs[i].clearTint();

      const canAfford = this.energy.getCurrent() >= item.cost;
      this.btnCosts[i].setColor(canAfford ? '#FFD700' : '#FF4444');
      this.btnLabels[i].setColor(isSelected ? '#FFFFFF' : '#AACCEE');
      this.btnIcons[i].setAlpha(canAfford ? 1 : 0.5);
    });
  }

  getSelectedBuilding(): BuildingType | null {
    return this.selectedBuildingType;
  }

  showBlackout(): void {
    if (this.blackoutTween) this.blackoutTween.stop();
    this.blackoutOverlay?.setAlpha(0.35);
    this.blackoutText?.setAlpha(1);
    this.blackoutTween = this.scene.tweens.add({
      targets: this.blackoutText,
      alpha: { from: 1, to: 0.4 },
      yoyo: true,
      repeat: -1,
      duration: 600,
    });
  }

  hideBlackout(): void {
    if (this.blackoutTween) {
      this.blackoutTween.stop();
      this.blackoutTween = null;
    }
    this.blackoutOverlay?.setAlpha(0);
    this.blackoutText?.setAlpha(0);
  }

  update(playerX: number, playerY: number): void {
    const snap = this.energy.getSnapshot();

    // Energy bar
    const pct = snap.percent;
    const barW = Math.floor(pct * 216);
    this.energyBarFill.setDisplaySize(Math.max(0, barW), 16);

    // Color: yellow → orange → red based on level
    if (pct > 0.5) {
      this.energyBarFill.setFillStyle(0x44DD00 + Math.floor((pct - 0.5) * 2 * 0xBB9900));
    } else if (pct > 0.25) {
      this.energyBarFill.setFillStyle(0xFFAA00);
    } else {
      this.energyBarFill.setFillStyle(0xFF3300);
    }
    if (snap.percent > 0.6) this.energyBarFill.setFillStyle(0xFFD700);

    this.energyText.setText(`${Math.floor(snap.current)} / ${Math.floor(snap.max)}`);

    const flow = snap.netFlow;
    const flowStr = flow >= 0 ? `▲ +${flow.toFixed(1)}/s` : `▼ ${flow.toFixed(1)}/s`;
    this.energyFlowText.setText(flowStr);
    this.energyFlowText.setColor(flow >= 0 ? '#00FF88' : '#FF6644');

    const pctRestored = this.tileMap.getRestorationPercent();
    this.restorationText.setText(`🌱 Restored: ${pctRestored.toFixed(1)}%`);

    // Stats
    const solarCount = this.buildings.getBuildingCount(BUILDING.SOLAR_PANEL);
    const batteryCount = this.buildings.getBuildingCount(BUILDING.BATTERY);
    const purifierCount = this.buildings.getBuildingCount(BUILDING.PURIFIER);
    this.statsText.setText(
      `☀ Panels: ${solarCount}  🔋 Battery: ${batteryCount}  🌿 Purifier: ${purifierCount}`
    );

    // Button affordability
    this.updateBtnStyles();

    // Minimap
    this.drawMinimap(playerX, playerY);
  }

  private drawMinimap(playerX: number, playerY: number): void {
    const W = this.cam.width;
    const mmW = 128, mmH = 96;
    const mmX = W - mmW - 16;
    const mmY = 16;
    const cellW = mmW / MAP_COLS;
    const cellH = mmH / MAP_ROWS;

    this.minimapGraphics.clear();

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tile = this.tileMap.tiles[row]?.[col];
        if (!tile) continue;
        let color: number;
        switch (tile.type) {
          case 1: color = 0x3DAA4E; break; // restored
          case 2: color = 0x3A7BD5; break; // water
          case 3: color = 0x888888; break; // stone
          default: color = 0x8B6914; break; // polluted
        }
        this.minimapGraphics.fillStyle(color, 1);
        this.minimapGraphics.fillRect(
          mmX + col * cellW,
          mmY + row * cellH,
          Math.ceil(cellW), Math.ceil(cellH)
        );
      }
    }

    // Buildings on minimap
    for (const b of this.buildings.buildings) {
      const bColor = b.type === 'solar_panel' ? 0xFFD700
                   : b.type === 'battery'     ? 0x4488FF
                   : 0x00FF99;
      this.minimapGraphics.fillStyle(bColor, 1);
      this.minimapGraphics.fillRect(mmX + b.col * cellW, mmY + b.row * cellH, 3, 3);
    }

    // Player dot
    const px = mmX + (playerX / TILE_SIZE) * cellW;
    const py = mmY + (playerY / TILE_SIZE) * cellH;
    this.minimapGraphics.fillStyle(0xFFFFFF, 1);
    this.minimapGraphics.fillRect(px - 2, py - 2, 4, 4);
    this.minimapGraphics.lineStyle(1, 0x00D4FF, 1);
    this.minimapGraphics.strokeRect(px - 2, py - 2, 4, 4);
  }
}
