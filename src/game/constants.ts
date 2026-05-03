// ─── Game Constants ──────────────────────────────────────────────────────────

export const TILE_SIZE = 48;
export const MAP_COLS = 32;
export const MAP_ROWS = 24;
export const MAP_WIDTH = MAP_COLS * TILE_SIZE;
export const MAP_HEIGHT = MAP_ROWS * TILE_SIZE;

// Tile types
export const TILE = {
  POLLUTED: 0,
  RESTORED: 1,
  WATER: 2,
  STONE: 3,
} as const;

// Building types
export const BUILDING = {
  SOLAR_PANEL: 'solar_panel',
  BATTERY: 'battery',
  PURIFIER: 'purifier',
} as const;

// Energy costs / generation
export const ENERGY = {
  MAX: 200,
  START: 80,
  CLEAN_TILE_COST: 20,
  SOLAR_PANEL_GEN: 3,       // per second
  BATTERY_CAPACITY_BONUS: 100,
  PURIFIER_COST_PER_SEC: 1,
  BUILDING_COSTS: {
    solar_panel: 30,
    battery: 40,
    purifier: 50,
  },
} as const;

// Win condition
export const WIN_PERCENT = 70; // 70% tiles restored

// Colors (hex numbers for Phaser)
export const COLORS = {
  POLLUTED: 0x8B6914,
  POLLUTED_ALT: 0xA0782A,
  RESTORED: 0x3DAA4E,
  RESTORED_ALT: 0x4CC460,
  WATER: 0x3A7BD5,
  STONE: 0x888888,
  TREE_TRUNK: 0x5C3A1E,
  TREE_LEAF: 0x2D8A3E,
  PLAYER: 0x00D4FF,
  SOLAR_PANEL: 0xFFD700,
  BATTERY: 0x4488FF,
  PURIFIER: 0x00FF99,
  ENERGY_BAR: 0xFFD700,
  UI_BG: 0x1A1A2E,
  BLACKOUT: 0x330000,
  PARTICLE: 0x00FF88,
} as const;

export type BuildingType = typeof BUILDING[keyof typeof BUILDING];
export type TileType = typeof TILE[keyof typeof TILE];
