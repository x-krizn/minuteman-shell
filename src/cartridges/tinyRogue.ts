import { Cartridge, CartridgeSurface, InputSnapshot } from '../types';

export function createTinyRogueCartridge(): Cartridge {
  const TILE = 12;
  const COLS = 13;
  const ROWS = 11;
  const OFFSET_X = 2;
  const OFFSET_Y = 12;

  interface Enemy {
    x: number;
    y: number;
    type: 'slime' | 'bat' | 'skel';
    hp: number;
    moveTimer: number;
  }

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
  }

  let cartSurface: CartridgeSurface | null = null;
  let playerX = 6;
  let playerY = 8;
  let playerFacing: 'up' | 'down' | 'left' | 'right' = 'down';
  let slashTimer = 0;
  let slashBox: { x: number; y: number; w: number; h: number } | null = null;
  let hearts = 3;
  let maxHearts = 3;
  let keys = 0;
  let gems = 0;
  let floor = 1;
  let invulnTimer = 0;
  let state: 'PLAYING' | 'GAMEOVER' | 'VICTORY' = 'PLAYING';

  // 0: empty, 1: wall, 2: pot, 3: chest, 4: door, 5: stairs
  let map: number[][] = [];
  let enemies: Enemy[] = [];
  let particles: Particle[] = [];

  const generateRoom = (floorNum: number) => {
    map = [];
    for (let r = 0; r < ROWS; r++) {
      const row: number[] = [];
      for (let c = 0; c < COLS; c++) {
        if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
          row.push(1); // boundary wall
        } else {
          row.push(0);
        }
      }
      map.push(row);
    }

    // Add interior obstacles
    const obstacleCount = 6 + Math.min(8, floorNum * 2);
    for (let i = 0; i < obstacleCount; i++) {
      const rx = 2 + Math.floor(Math.random() * (COLS - 4));
      const ry = 2 + Math.floor(Math.random() * (ROWS - 4));
      if (rx !== 6 || ry !== 8) {
        map[ry][rx] = Math.random() > 0.5 ? 1 : 2; // wall or pot
      }
    }

    // Chest & Key
    const chestX = 2 + Math.floor(Math.random() * (COLS - 4));
    const chestY = 2 + Math.floor(Math.random() * 3);
    map[chestY][chestX] = 3;

    // Stairs down
    const stairX = COLS - 2;
    const stairY = 1;
    map[stairY][stairX] = 5;

    // Spawn enemies
    enemies = [];
    const count = 3 + Math.min(5, floorNum);
    for (let i = 0; i < count; i++) {
      const ex = 1 + Math.floor(Math.random() * (COLS - 2));
      const ey = 1 + Math.floor(Math.random() * (ROWS - 5));
      if (map[ey][ex] === 0) {
        enemies.push({
          x: ex,
          y: ey,
          type: Math.random() > 0.6 ? 'skel' : (Math.random() > 0.4 ? 'bat' : 'slime'),
          hp: 2,
          moveTimer: Math.random() * 0.5
        });
      }
    }

    playerX = 6;
    playerY = ROWS - 2;
    invulnTimer = 0.5;
  };

  const spawnDust = (x: number, y: number, color = '#ff0') => {
    for (let i = 0; i < 6; i++) {
      particles.push({
        x: x * TILE + OFFSET_X + TILE / 2,
        y: y * TILE + OFFSET_Y + TILE / 2,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        life: 0.3,
        color
      });
    }
  };

  return {
    id: 'tiny_rogue',
    name: 'TINY ROGUE',
    version: '1.0',
    author: 'Minuteman Dungeon',
    description: 'Dungeon crawler RPG. A: Sword slash, D-Pad: Move.',

    init: (surface: CartridgeSurface) => {
      cartSurface = surface;
      hearts = 3;
      keys = 1;
      gems = 0;
      floor = 1;

      // Restore saved game from console memory if available
      const saved = surface.load() as { gems?: number; maxFloor?: number; floor?: number; keys?: number } | null;
      if (saved) {
        if (typeof saved.gems === 'number') gems = saved.gems;
        if (typeof saved.floor === 'number' && saved.floor > 1 && saved.floor <= 5) floor = saved.floor;
        if (typeof saved.keys === 'number') keys = saved.keys;
      }

      state = 'PLAYING';
      generateRoom(floor);
    },

    update: (input: InputSnapshot, dt: number) => {
      if (state !== 'PLAYING') {
        if (input.pressed.a || input.pressed.start) {
          hearts = 3;
          keys = 1;
          gems = 0;
          floor = 1;
          state = 'PLAYING';
          generateRoom(1);
          if (cartSurface) cartSurface.audio.menuSelect();
        }
        return;
      }

      if (invulnTimer > 0) invulnTimer -= dt;
      if (slashTimer > 0) slashTimer -= dt;
      else slashBox = null;

      // Player Movement
      let dx = 0;
      let dy = 0;
      if (input.pressed.left) { dx = -1; playerFacing = 'left'; }
      else if (input.pressed.right) { dx = 1; playerFacing = 'right'; }
      else if (input.pressed.up) { dy = -1; playerFacing = 'up'; }
      else if (input.pressed.down) { dy = 1; playerFacing = 'down'; }

      if (dx !== 0 || dy !== 0) {
        const nx = playerX + dx;
        const ny = playerY + dy;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
          const tile = map[ny][nx];
          if (tile === 0) {
            playerX = nx;
            playerY = ny;
            if (cartSurface) cartSurface.audio.beep(220);
          } else if (tile === 2) {
            // Pot: can break with bump or slash
            map[ny][nx] = 0;
            gems += 5;
            spawnDust(nx, ny, '#0f3');
            if (cartSurface) cartSurface.audio.coin();
          } else if (tile === 3) {
            // Chest
            if (keys > 0) {
              keys--;
              gems += 50;
              map[ny][nx] = 0;
              spawnDust(nx, ny, '#ff0');
              if (cartSurface) cartSurface.audio.powerup();
            } else {
              if (cartSurface) cartSurface.audio.menuBack();
            }
          } else if (tile === 5) {
            // Stairs
            floor++;
            if (cartSurface) {
              cartSurface.audio.powerup();
              cartSurface.save({ gems, floor, keys });
            }
            if (floor > 5) {
              state = 'VICTORY';
            } else {
              generateRoom(floor);
            }
          }
        }
      }

      // Attack
      if (input.pressed.a && slashTimer <= 0) {
        slashTimer = 0.22;
        if (cartSurface) cartSurface.audio.playTone(480, 'square', 0.08, 0.25, 200);

        let sx = playerX;
        let sy = playerY;
        if (playerFacing === 'left') sx--;
        if (playerFacing === 'right') sx++;
        if (playerFacing === 'up') sy--;
        if (playerFacing === 'down') sy++;

        slashBox = {
          x: sx * TILE + OFFSET_X,
          y: sy * TILE + OFFSET_Y,
          w: TILE,
          h: TILE
        };

        // Break pot in front
        if (sy >= 0 && sy < ROWS && sx >= 0 && sx < COLS) {
          if (map[sy][sx] === 2) {
            map[sy][sx] = 0;
            gems += 5;
            spawnDust(sx, sy, '#0f3');
            if (cartSurface) cartSurface.audio.coin();
          }
        }

        // Damage enemies in target tile
        for (let i = enemies.length - 1; i >= 0; i--) {
          const en = enemies[i];
          if (en.x === sx && en.y === sy) {
            en.hp--;
            spawnDust(sx, sy, '#f33');
            if (cartSurface) cartSurface.audio.hit();
            if (en.hp <= 0) {
              enemies.splice(i, 1);
              gems += 15;
            }
          }
        }
      }

      // Enemy AI
      enemies.forEach(en => {
        en.moveTimer -= dt;
        if (en.moveTimer <= 0) {
          en.moveTimer = en.type === 'bat' ? 0.35 : (en.type === 'skel' ? 0.7 : 0.9);
          // Try step toward player
          let edx = 0;
          let edy = 0;
          if (Math.random() < 0.7) {
            if (en.x < playerX) edx = 1;
            else if (en.x > playerX) edx = -1;
            else if (en.y < playerY) edy = 1;
            else if (en.y > playerY) edy = -1;
          } else {
            const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            const chosen = dirs[Math.floor(Math.random() * dirs.length)];
            edx = chosen[0];
            edy = chosen[1];
          }

          const targetX = en.x + edx;
          const targetY = en.y + edy;

          if (targetX === playerX && targetY === playerY) {
            // Hurt player
            if (invulnTimer <= 0) {
              hearts--;
              invulnTimer = 1.0;
              spawnDust(playerX, playerY, '#f33');
              if (cartSurface) cartSurface.audio.hit();
              if (hearts <= 0) {
                state = 'GAMEOVER';
              }
            }
          } else if (
            targetX > 0 &&
            targetX < COLS - 1 &&
            targetY > 0 &&
            targetY < ROWS - 1 &&
            map[targetY][targetX] === 0
          ) {
            en.x = targetX;
            en.y = targetY;
          }
        }
      });

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }
    },

    draw: (surface: CartridgeSurface) => {
      const g = surface.g;
      const w = surface.width;
      const h = surface.height;

      // Dark background
      g.fillStyle = '#0f2010';
      g.fillRect(0, 0, w, h);

      // Top HUD
      g.fillStyle = '#0a150a';
      g.fillRect(0, 0, w, 11);
      g.fillStyle = '#0f3';
      g.font = '8px orion-font, monospace';

      // Draw Hearts
      let heartsStr = '';
      for (let i = 0; i < maxHearts; i++) {
        heartsStr += i < hearts ? '♥ ' : '♡ ';
      }
      g.fillStyle = '#f33';
      g.fillText(heartsStr, 4, 9);

      g.fillStyle = '#ff0';
      g.fillText(`G:${gems}`, 50, 9);
      g.fillStyle = '#0af';
      g.fillText(`K:${keys}`, 95, 9);
      g.fillStyle = '#0f3';
      g.fillText(`F:${floor}`, 130, 9);

      // Draw Dungeon Grid
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const px = c * TILE + OFFSET_X;
          const py = r * TILE + OFFSET_Y;
          const tile = map[r][c];

          if (tile === 1) {
            // Stone Wall
            g.fillStyle = '#1c3820';
            g.fillRect(px, py, TILE, TILE);
            g.strokeStyle = '#0f35';
            g.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
          } else if (tile === 2) {
            // Pot
            g.fillStyle = '#8a5a2a';
            g.fillRect(px + 2, py + 3, TILE - 4, TILE - 5);
            g.fillStyle = '#ffb';
            g.fillRect(px + 4, py + 1, TILE - 8, 2);
          } else if (tile === 3) {
            // Chest
            g.fillStyle = '#b8860b';
            g.fillRect(px + 1, py + 2, TILE - 2, TILE - 4);
            g.fillStyle = '#ff0';
            g.fillRect(px + 5, py + 5, 2, 3);
          } else if (tile === 5) {
            // Stairs
            g.fillStyle = '#000';
            g.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
            g.fillStyle = '#0f3';
            g.fillRect(px + 3, py + 3, 6, 2);
            g.fillRect(px + 5, py + 5, 4, 2);
            g.fillRect(px + 7, py + 7, 2, 2);
          }
        }
      }

      // Draw Enemies
      enemies.forEach(en => {
        const ex = en.x * TILE + OFFSET_X;
        const ey = en.y * TILE + OFFSET_Y;
        if (en.type === 'slime') {
          g.fillStyle = '#4f4';
          g.beginPath();
          g.arc(ex + TILE / 2, ey + TILE / 2 + 1, 4, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#000';
          g.fillRect(ex + 4, ey + 4, 1, 2);
          g.fillRect(ex + 7, ey + 4, 1, 2);
        } else if (en.type === 'bat') {
          g.fillStyle = '#d44';
          g.fillRect(ex + 2, ey + 4, 8, 4);
          g.fillStyle = '#ff0';
          g.fillRect(ex + 5, ey + 5, 2, 2);
        } else {
          // Skeleton
          g.fillStyle = '#eee';
          g.fillRect(ex + 3, ey + 2, 6, 7);
          g.fillStyle = '#000';
          g.fillRect(ex + 4, ey + 4, 1, 2);
          g.fillRect(ex + 7, ey + 4, 1, 2);
        }
      });

      // Draw Player
      if (invulnTimer <= 0 || Math.floor(Date.now() / 80) % 2 === 0) {
        const px = playerX * TILE + OFFSET_X;
        const py = playerY * TILE + OFFSET_Y;

        // Hero sprite: blue tunic, skin face
        g.fillStyle = '#08f';
        g.fillRect(px + 2, py + 4, 8, 7);
        g.fillStyle = '#fdb';
        g.fillRect(px + 3, py + 1, 6, 5);
        g.fillStyle = '#000';
        if (playerFacing === 'left') g.fillRect(px + 3, py + 3, 1, 2);
        else if (playerFacing === 'right') g.fillRect(px + 7, py + 3, 1, 2);
        else if (playerFacing === 'down') {
          g.fillRect(px + 4, py + 3, 1, 2);
          g.fillRect(px + 7, py + 3, 1, 2);
        }
      }

      // Draw Sword Slash Arc
      if (slashBox) {
        g.fillStyle = '#fff';
        g.fillRect(slashBox.x + 2, slashBox.y + 2, slashBox.w - 4, slashBox.h - 4);
        g.strokeStyle = '#0af';
        g.strokeRect(slashBox.x, slashBox.y, slashBox.w, slashBox.h);
      }

      // Particles
      particles.forEach(p => {
        g.fillStyle = p.color;
        g.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 2);
      });

      // Modals
      if (state === 'GAMEOVER') {
        g.fillStyle = '#000d';
        g.fillRect(20, 35, 120, 75);
        g.strokeStyle = '#f33';
        g.lineWidth = 2;
        g.strokeRect(20, 35, 120, 75);

        g.fillStyle = '#f33';
        g.font = '10px orion-font, monospace';
        g.fillText('YOU PERISHED', 38, 55);

        g.fillStyle = '#ff0';
        g.font = '8px orion-font, monospace';
        g.fillText(`GEMS: ${gems}`, 44, 72);
        g.fillText(`FLOOR: B${floor}`, 44, 84);

        g.fillStyle = '#0f3';
        g.fillText('PRESS A / START', 34, 100);
      } else if (state === 'VICTORY') {
        g.fillStyle = '#000d';
        g.fillRect(20, 35, 120, 75);
        g.strokeStyle = '#ff0';
        g.lineWidth = 2;
        g.strokeRect(20, 35, 120, 75);

        g.fillStyle = '#ff0';
        g.font = '10px orion-font, monospace';
        g.fillText('DUNGEON CLEARED!', 26, 55);

        g.fillStyle = '#0f3';
        g.font = '8px orion-font, monospace';
        g.fillText(`TOTAL GEMS: ${gems}`, 36, 74);
        g.fillText('YOU ARE A LEGEND!', 32, 88);
        g.fillText('PRESS A / START', 34, 102);
      }
    },

    saveState: () => ({ gems, floor, keys })
  };
}
