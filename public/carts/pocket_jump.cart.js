// POCKET JUMP CARTRIDGE (v1.0)
(() => {
  let px = 80;
  let py = 100;
  let pvx = 0;
  let pvy = -180;
  let cameraY = 0;
  let score = 0;
  let highScore = 0;
  let state = 'PLAYING';
  let platforms = [];
  let stars = [];
  let superJumps = 1;

  const generatePlatforms = () => {
    platforms = [
      { x: 60, y: 125, w: 40, h: 5, type: 'normal' },
      { x: 30, y: 95, w: 32, h: 5, type: 'normal' },
      { x: 90, y: 65, w: 32, h: 5, type: 'spring' },
      { x: 40, y: 35, w: 32, h: 5, type: 'moving', vx: 25 },
      { x: 80, y: 5, w: 32, h: 5, type: 'normal' }
    ];
    stars = [];
  };

  const spawnHigherPlatforms = (topY) => {
    let currentY = platforms.length > 0 ? platforms[platforms.length - 1].y : 0;
    while (currentY > topY - 144) {
      currentY -= 26 + Math.random() * 16;
      const rx = 10 + Math.random() * 100;
      const roll = Math.random();
      let type = 'normal';
      let vx = undefined;
      if (roll < 0.3) { type = 'moving'; vx = (Math.random() > 0.5 ? 1 : -1) * 25; }
      else if (roll < 0.6) { type = 'spring'; }
      platforms.push({ x: rx, y: currentY, w: 30, h: 5, type, vx });
    }
  };

  const resetGame = () => {
    px = 80; py = 100; pvx = 0; pvy = -180; cameraY = 0; score = 0; superJumps = 1; state = 'PLAYING';
    generatePlatforms();
    spawnHigherPlatforms(-300);
  };

  Minuteman.register({
    id: 'pocket_jump',
    name: 'POCKET JUMP',
    version: '1.0',
    author: 'Minuteman Arcade',
    description: 'Vertical platform hopper. D-Pad: Tilt, A: Boost.',

    init: (surface) => {
      resetGame();
      const saved = surface.load ? surface.load() : null;
      if (saved && typeof saved.highScore === 'number') {
        highScore = saved.highScore;
      }
    },

    update: (input, dt) => {
      if (state === 'GAMEOVER') {
        if (input.pressed.a || input.pressed.start) resetGame();
        return;
      }

      if (input.held.left) pvx -= 350 * dt;
      else if (input.held.right) pvx += 350 * dt;
      else pvx *= 0.85;

      pvx = Math.max(-120, Math.min(120, pvx));
      px += pvx * dt;

      if (px < -6) px = 166;
      else if (px > 166) px = -6;

      if (input.pressed.a && superJumps > 0) {
        superJumps--;
        pvy = -340;
      }

      pvy += 450 * dt;
      py += pvy * dt;

      if (py < cameraY + 70) {
        cameraY -= ((cameraY + 70) - py);
        score = Math.max(score, Math.floor(-cameraY));
        spawnHigherPlatforms(cameraY);
      }

      platforms.forEach(pl => {
        if (pl.type === 'moving' && pl.vx) {
          pl.x += pl.vx * dt;
          if (pl.x < 10 || pl.x + pl.w > 150) pl.vx *= -1;
        }
      });

      if (pvy > 0) {
        for (let i = 0; i < platforms.length; i++) {
          const pl = platforms[i];
          if (px + 6 > pl.x && px - 6 < pl.x + pl.w && py + 6 >= pl.y && py <= pl.y + 7) {
            pvy = pl.type === 'spring' ? -320 : -210;
            break;
          }
        }
      }

      platforms = platforms.filter(pl => pl.y < cameraY + 180);

      if (py > cameraY + 144) {
        state = 'GAMEOVER';
        if (score > highScore) highScore = score;
      }
    },

    draw: (surface) => {
      const g = surface.g;
      const w = surface.width;
      const h = surface.height;

      g.fillStyle = '#0f241a';
      g.fillRect(0, 0, w, h);

      platforms.forEach(pl => {
        const sy = pl.y - cameraY;
        if (sy < -10 || sy > h + 10) return;
        g.fillStyle = pl.type === 'normal' ? '#0f3' : (pl.type === 'moving' ? '#0df' : '#ff0');
        g.fillRect(pl.x, sy, pl.w, pl.h);
      });

      const spy = py - cameraY;
      g.fillStyle = '#fff';
      g.fillRect(px - 5, spy - 6, 10, 10);
      g.fillStyle = '#0f3';
      g.fillRect(px - 3, spy - 4, 6, 6);

      g.fillStyle = '#0008';
      g.fillRect(0, 0, w, 12);
      g.fillStyle = '#0f3';
      g.font = '8px orion-font, monospace';
      g.fillText(`ALT:${score}m`, 4, 10);
      g.fillText(`BEST:${highScore}m`, 64, 10);

      if (state === 'GAMEOVER') {
        g.fillStyle = '#000d';
        g.fillRect(20, 45, 120, 65);
        g.fillStyle = '#f33';
        g.fillText('SPLATTED!', 50, 64);
        g.fillStyle = '#0f3';
        g.fillText(`ALTITUDE: ${score}m`, 38, 80);
      }
    },

    saveState: () => ({ highScore, lastAltitude: score })
  });
})();
