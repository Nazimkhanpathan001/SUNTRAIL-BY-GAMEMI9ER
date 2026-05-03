// ─── Energy System ───────────────────────────────────────────────────────────

import { ENERGY } from './constants';

export interface EnergySnapshot {
  current: number;
  max: number;
  percent: number;
  isBlackout: boolean;
  netFlow: number; // energy/sec (positive = gaining, negative = losing)
}

export class EnergySystem {
  private current: number;
  private max: number;
  private generation: number = 0;  // energy per second from all sources
  private consumption: number = 0; // energy per second consumed
  private blackout: boolean = false;
  private blackoutTimer: number = 0;

  // Listeners
  private onBlackout?: () => void;
  private onRestore?: () => void;

  constructor() {
    this.current = ENERGY.START;
    this.max = ENERGY.MAX;
  }

  setCallbacks(onBlackout: () => void, onRestore: () => void): void {
    this.onBlackout = onBlackout;
    this.onRestore = onRestore;
  }

  update(delta: number): void {
    const dt = delta / 1000; // convert ms to seconds
    const net = this.generation - this.consumption;
    this.current = Math.min(this.max, Math.max(0, this.current + net * dt));

    if (this.current <= 0 && !this.blackout) {
      this.blackout = true;
      this.blackoutTimer = 0;
      this.onBlackout?.();
    }

    if (this.blackout) {
      this.blackoutTimer += delta;
      // Auto-recover from blackout after 4 seconds if generation > 0
      if (this.blackoutTimer > 4000 && this.generation > 0) {
        this.current = 10;
        this.blackout = false;
        this.onRestore?.();
      }
    }

    if (this.current > 5 && this.blackout) {
      this.blackout = false;
      this.onRestore?.();
    }
  }

  spend(amount: number): boolean {
    if (this.current < amount) return false;
    this.current -= amount;
    if (this.current <= 0) {
      this.current = 0;
      if (!this.blackout) {
        this.blackout = true;
        this.blackoutTimer = 0;
        this.onBlackout?.();
      }
    }
    return true;
  }

  addGeneration(rate: number): void {
    this.generation += rate;
  }

  removeGeneration(rate: number): void {
    this.generation = Math.max(0, this.generation - rate);
  }

  addConsumption(rate: number): void {
    this.consumption += rate;
  }

  removeConsumption(rate: number): void {
    this.consumption = Math.max(0, this.consumption - rate);
  }

  increaseMax(amount: number): void {
    this.max += amount;
  }

  decreaseMax(amount: number): void {
    this.max = Math.max(ENERGY.MAX, this.max - amount);
  }

  getSnapshot(): EnergySnapshot {
    return {
      current: this.current,
      max: this.max,
      percent: this.current / this.max,
      isBlackout: this.blackout,
      netFlow: this.generation - this.consumption,
    };
  }

  isBlackout(): boolean { return this.blackout; }
  getCurrent(): number { return this.current; }
  getMax(): number { return this.max; }
  getGeneration(): number { return this.generation; }
  getConsumption(): number { return this.consumption; }
}
