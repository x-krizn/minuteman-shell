import { Cartridge, CartridgeSurface, InputSnapshot } from '../types';

export function createPocketJumpCartridge(): Cartridge {
  interface Platform {
    x: number;
    y: number;
    w: number;
    h: number;
    type: 'normal' | 'moving' | 'crumbly' | 'spring';
    vx?: number;
    broken?: boolean;
  }

  interface Star {
    x: number;
    y: number;
    collected: boolean;
  }

  let cartSurface: CartridgeSurface | null = null;
  let px = 80;
  let py = 100;
  let pvx = 0;
  let pvy = 0;
  let cameraY = 0;
  let score = 0;
  let highScore = 0;
  let state: 'PLAYING' | 'GAMEOVER' = 'PLAYING';
  let platforms: Platform[] = [];
  let stars: Star[] = [];
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

  const spawnHigherPlatforms = (topY: number) => {
    let currentY = platforms.length > 0 ? platforms[platforms.length - 1].y : 0;
    while (currentY > topY - 144) {
      currentY -= 26 + Math.random() * 16;
      const rx = 10 + Math.random() * 100;
      const roll = Math.random();
      let type: Platform['type'] = 'normal';
      let vx: number | undefined;

      if (roll < 0.25) {
        type = 'moving';
        vx = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 30);
      } else if (roll < 0.45) {
        type = 'crumbly';
      } else if (roll < 0.6) {
        type = 'spring';
      }

      platforms.push({
        x: rx,
        y: currentY,
        w: 30,
        h: 5,
        type,
        vx
      });

      if (Math.random() < 0.3) {
        stars.push({ x: rx + 12, y: currentY - 10, collected: false });
      }
    }
  };

  const resetGame = () => {
    px = 80;
    py = 100;
    pvx = 0;
    pvy = -180;
    cameraY = 0;
    score = 0;
    superJumps = 1;
    state = 'PLAYING';
    generatePlatforms();
    spawnHigherPlatforms(-300);
  };

  return {
    id: 'pocket_jump',
    name: 'POCKET JUMP',
    version: '1.0',
    author: 'Minuteman Arcade',
    description: 'Vertical platform hopper. D-Pad: Tilt, A: Boost.',

    init: (surface: CartridgeSurface) => {
      cartSurface = surface;
      resetGame();

      // Read from Minuteman Memory Bus
      const saved = surface.load() as { highScore?: number } | null;
      if (saved && typeof saved.highScore === 'number') {
        highScore = saved.highScore;
      }
    },

    update: (input: InputSnapshot, dt: number) => {
      if (state === 'GAMEOVER') {
        if (input.pressed.a || input.pressed.start) {
          resetGame();
          if (cartSurface) cartSurface.audio.menuSelect();
        }
        return;
      }

      // Tilt
      const MOVE_ACCEL = 350;
      if (input.held.left) pvx -= MOVE_ACCEL * dt;
      else if (input.held.right) pvx += MOVE_ACCEL * dt;
      else pvx *= 0.85;

      pvx = Math.max(-120, Math.min(120, pvx));
      px += pvx * dt;

      // Screen wrapping
      if (px < -6) px = 166;
      else if (px > 166) px = -6;

      // Super jump
      if (input.pressed.a && superJumps > 0) {
        superJumps--;
        pvy = -340;
        if (cartSurface) cartSurface.audio.powerup();
      }

      // Gravity
      pvy += 450 * dt;
      py += pvy * dt;

      // Update camera
      if (py < cameraY + 70) {
        const diff = (cameraY + 70) - py;
        cameraY -= diff;
        score = Math.max(score, Math.floor(-cameraY));
        spawnHigherPlatforms(cameraY);
      }

      // Moving platforms
      platforms.forEach(pl => {
        if (pl.type === 'moving' && pl.vx) {
          pl.x += pl.vx * dt;
          if (pl.x < 10 || pl.x + pl.w > 150) {
            pl.vx *= -1;
          }
        }
      });

      // Platform bounce collisions (only when falling)
      if (pvy > 0) {
        for (let i = 0; i < platforms.length; i++) {
          const pl = platforms[i];
          if (pl.broken) continue;

          // Check feet overlap
          if (
            px + 6 > pl.x &&
            px - 6 < pl.x + pl.w &&
            py + 6 >= pl.y &&
            py <= pl.y + 7
          ) {
            if (pl.type === 'spring') {
              pvy = -320;
              if (cartSurface) cartSurface.audio.powerup();
            } else if (pl.type === 'crumbly') {
              pl.broken = true;
              pvy = -180;
              if (cartSurface) cartSurface.audio.hit();
            } else {
              pvy = -210;
              if (cartSurface) cartSurface.audio.jump();
            }
            break;
          }
        }
      }

      // Star collection
      stars.forEach(s => {
        if (!s.collected && Math.hypot(s.x - px, s.y - py) < 12) {
          s.collected = true;
          score += 25;
          if (cartSurface) cartSurface.audio.coin();
        }
      });

      // Cleanup offscreen platforms below
      platforms = platforms.filter(pl => pl.y < cameraY + 180);
      stars = stars.filter(s => s.y < cameraY + 180);

      // Death check (fell below screen)
      if (py > cameraY + 144) {
        state = 'GAMEOVER';
        if (cartSurface) cartSurface.audio.hit();
        if (score > highScore) {
          highScore = score;
        }
        if (cartSurface) {
          cartSurface.save({ highScore, lastAltitude: score });
        }
      }
    },

    draw: (surface: CartridgeSurface) => {
      const g = surface.g;
      const w = surface.width;
      const h = surface.height;

      // Dark background with height gradient tint
      g.fillStyle = '#0f241a';
      g.fillRect(0, 0, w, h);

      // Platforms
      platforms.forEach(pl => {
        const screenY = pl.y - cameraY;
        if (screenY < -10 || screenY > h + 10 || pl.broken) return;

        if (pl.type === 'normal') {
          g.fillStyle = '#0f3';
          g.fillRect(pl.x, screenY, pl.w, pl.h);
        } else if (pl.type === 'moving') {
          g.fillStyle = '#0df';
          g.fillRect(pl.x, screenY, pl.w, pl.h);
        } else if (pl.type === 'spring') {
          g.fillStyle = '#ff0';
          g.fillRect(pl.x, screenY, pl.w, pl.h);
          g.fillStyle = '#f50';
          g.fillRect(pl.x + pl.w / 2 - 3, screenY - 3, 6, 3);
        } else if (pl.type === 'crumbly') {
          g.fillStyle = '#a64';
          g.fillRect(pl.x, screenY, pl.w, pl.h);
        }
      });

      // Stars
      stars.forEach(s => {
        if (s.collected) return;
        const screenY = s.y - cameraY;
        if (screenY < -10 || screenY > h + 10) return;
        g.fillStyle = Math.floor(Date.now() / 120) % 2 === 0 ? '#ff0' : '#ffa';
        g.fillRect(s.x - 2, screenY - 2, 5, 5);
      });

      // Player jumper character
      const screenPlayerY = py - cameraY;
      g.fillStyle = '#fff';
      g.fillRect(px - 5, screenPlayerY - 6, 10, 10);
      g.fillStyle = '#0f3';
      g.fillRect(px - 3, screenPlayerY - 4, 6, 6);
      g.fillStyle = '#000';
      g.fillRect(pvx >= 0 ? px : px - 3, screenPlayerY - 4, 2, 2);

      // Top HUD bar
      g.fillStyle = '#0008';
      g.fillRect(0, 0, w, 12);
      g.fillStyle = '#0f3';
      g.font = '8px orion-font, monospace';
      g.fillText(`ALT:${score}m`, 4, 10);
      g.fillText(`BEST:${highScore}m`, 64, 10);
      g.fillStyle = superJumps > 0 ? '#ff0' : '#555';
      g.fillText(`BOOST:${superJumps}`, 118, 10);

      // Game Over Screen
      if (state === 'GAMEOVER') {
        g.fillStyle = '#000d';
        g.fillRect(20, 45, 120, 65);
        g.strokeStyle = '#0f3';
        g.strokeRect(20, 45, 120, 65);

        g.fillStyle = '#f33';
        g.font = '10px orion-font, monospace';
        g.fillText('SPLATTED!', 50, 64);

        g.fillStyle = '#0f3';
        g.font = '8px orion-font, monospace';
        g.fillText(`ALTITUDE: ${score}m`, 38, 80);

        g.fillStyle = '#ff0';
        g.fillText('PRESS A / START', 34, 96);
      }
    },

    saveState: () => ({ highScore, lastAltitude: score })
  };
}
