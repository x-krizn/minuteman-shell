// TINY ROGUE CARTRIDGE (v1.0)
(() => {
  const TILE = 12;
  const COLS = 13;
  const ROWS = 11;
  const OFFSET_X = 2;
  const OFFSET_Y = 12;

  let playerX = 6;
  let playerY = 8;
  let playerFacing = 'down';
  let slashTimer = 0;
  let slashBox = null;
  let hearts = 3;
  let keys = 1;
  let gems = 0;
  let floor = 1;
  let invulnTimer = 0;
  let state = 'PLAYING';
  let map = [];
  let enemies = [];
  let particles = [];

  const generateRoom = (floorNum) => {
    map = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        row.push(r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1 ? 1 : 0);
      }
      map.push(row);
    }

    for (let i = 0; i < 8; i++) {
      const rx = 2 + Math.floor(Math.random() * (COLS - 4));
      const ry = 2 + Math.floor(Math.random() * (ROWS - 4));
      if (rx !== 6 || ry !== 8) map[ry][rx] = Math.random() > 0.5 ? 1 : 2;
    }

    const chestX = 2 + Math.floor(Math.random() * (COLS - 4));
    map[2][chestX] = 3;
    map[1][COLS - 2] = 5; // Stairs

    enemies = [];
    for (let i = 0; i < 4; i++) {
      const ex = 1 + Math.floor(Math.random() * (COLS - 2));
      const ey = 1 + Math.floor(Math.random() * (ROWS - 5));
      if (map[ey][ex] === 0) {
        enemies.push({ x: ex, y: ey, type: Math.random() > 0.5 ? 'skel' : 'slime', hp: 2, moveTimer: 0.5 });
      }
    }

    playerX = 6;
    playerY = ROWS - 2;
  };

  Minuteman.register({
    id: 'tiny_rogue',
    name: 'TINY ROGUE',
    version: '1.0',
    author: 'Minuteman Dungeon',
    description: 'Dungeon crawler RPG. A: Sword slash, D-Pad: Move.',

    init: (surface) => {
      hearts = 3;
      keys = 1;
      gems = 0;
      floor = 1;
      const saved = surface.load ? surface.load() : null;
      if (saved) {
        if (typeof saved.gems === 'number') gems = saved.gems;
        if (typeof saved.floor === 'number' && saved.floor > 1 && saved.floor <= 5) floor = saved.floor;
      }
      state = 'PLAYING';
      generateRoom(floor);
    },

    update: (input, dt) => {
      if (state !== 'PLAYING') {
        if (input.pressed.a || input.pressed.start) {
          hearts = 3; keys = 1; gems = 0; floor = 1; state = 'PLAYING'; generateRoom(1);
        }
        return;
      }

      if (invulnTimer > 0) invulnTimer -= dt;
      if (slashTimer > 0) slashTimer -= dt;
      else slashBox = null;

      let dx = 0; let dy = 0;
      if (input.pressed.left) { dx = -1; playerFacing = 'left'; }
      else if (input.pressed.right) { dx = 1; playerFacing = 'right'; }
      else if (input.pressed.up) { dy = -1; playerFacing = 'up'; }
      else if (input.pressed.down) { dy = 1; playerFacing = 'down'; }

      if (dx !== 0 || dy !== 0) {
        const nx = playerX + dx;
        const ny = playerY + dy;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
          const tile = map[ny][nx];
          if (tile === 0) { playerX = nx; playerY = ny; }
          else if (tile === 2) { map[ny][nx] = 0; gems += 5; }
          else if (tile === 3 && keys > 0) { keys--; gems += 50; map[ny][nx] = 0; }
          else if (tile === 5) {
            floor++;
            if (floor > 5) state = 'VICTORY';
            else generateRoom(floor);
          }
        }
      }

      if (input.pressed.a && slashTimer <= 0) {
        slashTimer = 0.2;
        let sx = playerX; let sy = playerY;
        if (playerFacing === 'left') sx--;
        if (playerFacing === 'right') sx++;
        if (playerFacing === 'up') sy--;
        if (playerFacing === 'down') sy++;

        slashBox = { x: sx * TILE + OFFSET_X, y: sy * TILE + OFFSET_Y, w: TILE, h: TILE };
        for (let i = enemies.length - 1; i >= 0; i--) {
          const en = enemies[i];
          if (en.x === sx && en.y === sy) {
            en.hp--;
            if (en.hp <= 0) { enemies.splice(i, 1); gems += 15; }
          }
        }
      }

      enemies.forEach(en => {
        en.moveTimer -= dt;
        if (en.moveTimer <= 0) {
          en.moveTimer = 0.7;
          let edx = en.x < playerX ? 1 : (en.x > playerX ? -1 : 0);
          let edy = en.y < playerY ? 1 : (en.y > playerY ? -1 : 0);
          const tx = en.x + edx; const ty = en.y + edy;
          if (tx === playerX && ty === playerY) {
            if (invulnTimer <= 0) {
              hearts--;
              invulnTimer = 1.0;
              if (hearts <= 0) state = 'GAMEOVER';
            }
          } else if (tx > 0 && tx < COLS - 1 && ty > 0 && ty < ROWS - 1 && map[ty][tx] === 0) {
            en.x = tx; en.y = ty;
          }
        }
      });
    },

    draw: (surface) => {
      const g = surface.g;
      const w = surface.width;
      const h = surface.height;

      g.fillStyle = '#0f2010';
      g.fillRect(0, 0, w, h);

      g.fillStyle = '#0a150a';
      g.fillRect(0, 0, w, 11);
      g.fillStyle = '#f33';
      g.font = '8px orion-font, monospace';
      let heartsStr = '';
      for (let i = 0; i < 3; i++) heartsStr += i < hearts ? '♥ ' : '♡ ';
      g.fillText(heartsStr, 4, 9);
      g.fillStyle = '#ff0';
      g.fillText(`G:${gems}`, 55, 9);
      g.fillStyle = '#0f3';
      g.fillText(`F:${floor}`, 125, 9);

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const px = c * TILE + OFFSET_X;
          const py = r * TILE + OFFSET_Y;
          const tile = map[r][c];
          if (tile === 1) {
            g.fillStyle = '#1c3820';
            g.fillRect(px, py, TILE, TILE);
          } else if (tile === 2) {
            g.fillStyle = '#8a5a2a';
            g.fillRect(px + 2, py + 3, TILE - 4, TILE - 5);
          } else if (tile === 3) {
            g.fillStyle = '#b8860b';
            g.fillRect(px + 1, py + 2, TILE - 2, TILE - 4);
          } else if (tile === 5) {
            g.fillStyle = '#000';
            g.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
          }
        }
      }

      enemies.forEach(en => {
        const ex = en.x * TILE + OFFSET_X;
        const ey = en.y * TILE + OFFSET_Y;
        g.fillStyle = en.type === 'slime' ? '#4f4' : '#eee';
        g.fillRect(ex + 3, ey + 3, 6, 6);
      });

      if (invulnTimer <= 0 || Math.floor(Date.now() / 80) % 2 === 0) {
        const px = playerX * TILE + OFFSET_X;
        const py = playerY * TILE + OFFSET_Y;
        g.fillStyle = '#08f';
        g.fillRect(px + 2, py + 4, 8, 7);
        g.fillStyle = '#fdb';
        g.fillRect(px + 3, py + 1, 6, 5);
      }

      if (slashBox) {
        g.fillStyle = '#fff';
        g.fillRect(slashBox.x, slashBox.y, slashBox.w, slashBox.h);
      }

      if (state === 'GAMEOVER') {
        g.fillStyle = '#000d';
        g.fillRect(20, 35, 120, 75);
        g.fillStyle = '#f33';
        g.fillText('YOU PERISHED', 38, 55);
        g.fillStyle = '#ff0';
        g.fillText(`GEMS: ${gems}`, 44, 72);
      }
    },

    saveState: () => ({ gems, floor, keys })
  });
})();
