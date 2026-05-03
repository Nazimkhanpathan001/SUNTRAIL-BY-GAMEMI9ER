// ─── Boot / Splash Scene ─────────────────────────────────────────────────────

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0A1628, 0x0A1628, 0x0D2A1A, 0x0D2A1A, 1);
    bg.fillRect(0, 0, W, H);

    // Draw sun logo
    const sunG = this.add.graphics();
    const cx = W / 2, cy = H / 2 - 60;
    const sunR = 50;

    // Sun rays
    sunG.lineStyle(4, 0xFFD700, 0.6);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      sunG.lineBetween(
        cx + Math.cos(a) * (sunR + 10), cy + Math.sin(a) * (sunR + 10),
        cx + Math.cos(a) * (sunR + 28), cy + Math.sin(a) * (sunR + 28)
      );
    }

    // Sun body
    sunG.fillStyle(0xFFD700);
    sunG.fillCircle(cx, cy, sunR);
    sunG.fillStyle(0xFFE55C);
    sunG.fillCircle(cx, cy, sunR - 10);
    sunG.fillStyle(0xFFFAB0, 0.5);
    sunG.fillCircle(cx - 12, cy - 12, 16);

    // Title
    const title = this.add.text(cx, cy + 60, 'SunTrail', {
      fontFamily: 'monospace',
      fontSize: '52px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    title.setOrigin(0.5, 0);

    const subtitle = this.add.text(cx, cy + 120, 'Eco Revival', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#00FF88',
      fontStyle: 'bold',
    });
    subtitle.setOrigin(0.5, 0);

    const tagline = this.add.text(cx, cy + 158, 'Restore the world, one solar panel at a time', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#88BBAA',
    });
    tagline.setOrigin(0.5, 0);

    // Loading bar
    const barBg = this.add.rectangle(cx, H - 80, 300, 20, 0x111122);
    barBg.setStrokeStyle(2, 0x334466);
    const bar = this.add.rectangle(cx - 148, H - 80, 2, 16, 0xFFD700);
    bar.setOrigin(0, 0.5);

    const loadingTxt = this.add.text(cx, H - 55, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#668877',
    });
    loadingTxt.setOrigin(0.5, 0.5);

    // Credits
    const credits = this.add.text(cx, H - 24, '⌨ WASD to move  |  Click to clean/build  |  1/2/3 to select buildings', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#446655',
    });
    credits.setOrigin(0.5, 0.5);

    // Animate loading bar and transition
    this.tweens.add({
      targets: bar,
      displayWidth: 296,
      duration: 1400,
      ease: 'Power2.InOut',
      onUpdate: (tween) => {
        const pct = Math.floor(tween.progress * 100);
        loadingTxt.setText(`Loading... ${pct}%`);
      },
      onComplete: () => {
        loadingTxt.setText('Ready!');
        loadingTxt.setColor('#00FF88');
        this.time.delayedCall(300, () => {
          this.cameras.main.fadeOut(500);
          this.time.delayedCall(500, () => {
            this.scene.start('GameScene');
          });
        });
      },
    });

    // Animate sun
    this.tweens.add({
      targets: sunG,
      angle: { from: 0, to: 360 },
      duration: 8000,
      repeat: -1,
      ease: 'Linear',
    });

    this.tweens.add({
      targets: [title, subtitle],
      y: `-=5`,
      yoyo: true,
      repeat: -1,
      duration: 2000,
      ease: 'Sine.InOut',
    });

    this.cameras.main.fadeIn(400);
  }
}
