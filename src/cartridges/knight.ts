import { Cartridge, CartridgeSurface, InputSnapshot, SoundEngine } from '../types';
import { KNIGHT_PNG } from './walk';

export const ITEMS_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAFFUlEQVR4Ae1ZPXcTOxBdc/gT0CYtNPY5UJA2KXALhd2SpIMi/hlJAV0MrV1Aa4qkTQo4x26gTZoUuElNu+iuPZvZ2dGX1w7xh94JkkZzR3OvpF15X5JsykaBhShwetBMKTBvk+0+6uFwmOLPNddj22B6mqRJ/W601khqd72w1v8ijuxAvNFoZDnztsxcFUCSBygdJmmMCIfdQe2gWc/U7w5GXvEQnycXMxfHxbZLiRXIj1i46W4ITUyuPgRh0QrNjDyfC6NmvtC5CsFMJzVF2tCvmSLt6g7InJAQOwKJ7MtInj4E0UQg8rXD4hHDQsTuOqQA8qORVHOSHMakCHYBPIRcw7T6BweDzK3bbbrcnWPyaEhn1y4xz4DM3TwDJCzvP8pbc2pI8ghLQtBY1FRYTFpQUbvIh84xdwFCJw71o6PByWY2I4Zvd7hWnua3C4DzT+qj5s8DQos6ZIVLPrbYNL+ZIxfBPCdICNioLdKI6pYEIHWzKEiC/kwzZkJ+7nlbZkfzYTX5H8Qn4hIzz776EMTEhddhJHlK0EWcfFDn8zHjvMj7joEqACXF8glujv6Mk/rTJwnVAFKbai3YvAhrsV220sXA5RwyhjMOolqBMNpdQPOtYqvXJzdQGcPcD+bOV86x6W8U2CiwQgqYn1T4/aD+sgqh2frRqoQ/OvpVCX919d6LL12EiBjI5+0ZRAD5KniQr4IH+RC8KoBB5uCQIORDNSdPNiwFtX01J0++MXhO3odXBSBQoS5/SygM+zrtn22fi3O80/ntHPcNXl9/UF3CBFhR8lDEehXGYPZDrQL525vbpG3+m7WMxzdJpzMrOknG478GrK88RbXuAJCvUkC+SgH5KmVC3h9BFWBdyEMeVQDzJa30o8EYSjabvudvz0u+/Zf9ks2G7/ebJd+Tk+clmw2/s/Ol5Lu9/alks+Fzu/mUiHdX8OsrB04bu193U+2VKP1s/VZrkGqvRJu/tF9cvEu1V6L02/Q3CqyxAuqDwXbtlP9XxabbsuMzXlMSeACiGf0gXBa88yY4A+/Cplhq/HQF+W4okPN1lgWvXoR85FZp3H0EKlyCIFKVSxDwVS5BwIdcgtZ+B2wEwFZZ52K/CMkPIeYqEHMRkp/Aei96UXj5Cez4+FkUXn4C29r6qOJLRwCvr5Ehn38TMMTRho2/2my7Bj573/YS+iAC4mjDFopvt7+brzk32RQgjjZsofjLy/3p16AkAXF8HIFNwzvfApkIcifYmCv2jPjNnjISZpoQnwgRhih6gfh4vF80il5pB4jxle+uvQDWhyDOPC/1yIcgzjwvZ2/O1IcQ96E2zirOPC+93usoPM48L69efVbxRZYMIR8YoW8ACrEseKsARCS2BnGIJQVAnFgRY+eexX/uAsgkHroQCxcAgjxkERb2FuCkta3Px+Wuuc9+0A5AshqJ2EQlaRnTNx47X2V/nhBvuwJLP60PG4ovzsSr+K8L4xqzzRe0AygwBZErR+MhNcWAb0gc7s/jh2DhDzx8eRyODRKAg2dJgmN4LJ4I99HaHEfjMXjCUBzC5j+GaIAcQ2pgKFCIf4zPImMjD4qfC7AoIjbSvvlonBK1xQm1a3FgW9hrUEsME8JO5DQfsvl8Y2K45gx6BlBSVWuQCkmc5iERqE91TAzCoNbi3asAPBlXW03UsHZh+BjwUiQtJjDBQfkEi2prSUois8ytxUUcxH5QAsxCzoexkV9ZAVyEuVi0+P8AZkYXIxg5q60AAAAASUVORK5CYII=';

export const TILES_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABN0lEQVR42u1YQQ7CIBDcF3gw8erJi3fPHn2AL/DsA3yCD/BN/guD6ZhNI7Tb0EXLNBmhOAw4AWFXtrt9SGG13oTz5RpyHCtSmp5jacjt/ggpQCDHsSKl6TmWhhyOp5ACBHIcK1KanmNp0AAaQANoAA2gATSgcQNwLUQj6rGEgObk+LrtGz9OysK36lvnL5iUnhjqsUQHcJbGl/dH93wau3os0RmcpfFFf6k7tvLOB/uhVciYmLp0jO6pPwQZc5ZGYsmzWevNrT8EGvBNoF96GtAfv8oK0IPXWAFTfzy3wBQDSqah/xG8B9Q+h2vrSe09WFuPBtAAGtC4AbwHMB/AfADDYRpQUHAonvcyYGxIPcsKyA3uYYAln/DTWwB/VMwH8B7AfADzAQyGaAANoAGLzAfUli799nwBunGjDJZNVAgAAAAASUVORK5CYII=';

interface Enemy {
  x: number;
  y: number;
  dir: number;
  hp: number;
  maxHp: number;
  stun: number;
  kind: 'slime' | 'bat';
  animT: number;
  baseY?: number;
}

interface PickupItem {
  x: number;
  y: number;
  c: string;
  id: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity?: boolean;
}

interface RunState {
  got: Record<string, boolean>;
  hasDouble: boolean;
  maxHp: number;
  hp: number;
  maxAp: number;
  ap: number;
  maxEp: number;
  ep: number;
  maxSp: number;
  sp: number;
  coins: number;
  keys: number;
  atkV: number;
  face: number;
  t: number;
  coyote: number;
  buffer: number;
  airJumps: number;
  jumping: boolean;
  ground: boolean;
  inv: number;
  kb: number;
  atk: number;
  atkCd: number;
  swung: number[];
  msg: string;
  msgT: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  room: string;
  rx: number;
  ry: number;
  enemies: Enemy[];
  picks: PickupItem[];
  particles: Particle[];
  shake: number;
}

export function createKnightCartridge(): Cartridge {
  const T = 16, COLS = 10, ROWS = 9, W = 160, H = 144;
  const HALF = 5, BODY_H = 16;
  const G = 700, JUMP = 270, RUN = 60, MAXFALL = 320;
  const START = { room: '0,0', x: 32, y: 128 };
  let audio: SoundEngine | null = null;

  // Static puzzle/tutorial rooms
  const STATIC_ROOMS: Record<string, string[]> = {
    '0,0': [
      '##########',
      '#........#',
      '#........#',
      '#........#',
      '#..ooo...#',
      '#..###...#',
      '..........',
      '..........',
      '##########'
    ],
    '1,0': [
      '####..####',
      '#........#',
      '#........#',
      '#..####..#',
      '#........#',
      '#........#',
      '..........',
      '.1...E....',
      '##########'
    ],
    '2,0': [
      '##########',
      '#........#',
      '#........#',
      '#........#',
      '#........#',
      '#........#',
      '.........#',
      '.......D.L',
      '##########'
    ],
    '3,0': [
      '##########',
      '#........#',
      '#........#',
      '#........#',
      '#........#',
      '#........#',
      '#........#',
      '.G.B.Y.oo.',
      '##########'
    ],
    '1,-1': [
      '##########',
      '#........#',
      '#........#',
      '#........#',
      '#........#',
      '#........#',
      '#........#',
      '#.E...KH.#',
      '####..####'
    ]
  };

  const proceduralRooms: Record<string, string[]> = {};
  const proceduralTitles: Record<string, string> = {};

  const ITEMS: Record<string, { i: number; k: string; s?: 'hp' | 'ap' | 'ep' | 'sp' }> = {
    o: { i: 0, k: 'coin' },
    K: { i: 2, k: 'key' },
    D: { i: -1, k: 'ability' },
    H: { i: 4, k: 'gem', s: 'hp' },
    G: { i: 5, k: 'gem', s: 'ap' },
    B: { i: 6, k: 'gem', s: 'ep' },
    Y: { i: 7, k: 'gem', s: 'sp' },
    '1': { i: 8, k: 'potion', s: 'hp' },
    '2': { i: 9, k: 'potion', s: 'ap' },
    '3': { i: 10, k: 'potion', s: 'ep' },
    '4': { i: 11, k: 'potion', s: 'sp' }
  };

  const STAT_COLOR = { ap: '#44cc44', ep: '#6666ff', sp: '#cccc44' };
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Sword attack hitboxes: 0 stab, 1 slash up, 2 slash forward, 3 slash down
  const ATK = [
    { x0: 2, x1: 15, y0: 4, y1: 8 },
    { x0: 4, x1: 14, y0: 0, y1: 11 },
    { x0: 3, x1: 14, y0: 4, y1: 13 },
    { x0: 4, x1: 15, y0: 5, y1: 15 }
  ];

  let S: RunState;
  const fontFamily = 'orion-font, monospace';

  // Seeded procedural rooms
  const getOrCreateRoom = (rx: number, ry: number): string[] => {
    const key = `${rx},${ry}`;
    if (STATIC_ROOMS[key]) return STATIC_ROOMS[key];
    if (proceduralRooms[key]) return proceduralRooms[key];

    let seed = ((rx * 73856093) ^ (ry * 19349663) ^ 0x5bd1e995) >>> 0;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    const BIOME_NAMES = [
      'OBSIDIAN MINES',
      'FORGOTTEN CATACOMBS',
      'CRYSTAL CAVERNS',
      'ANCIENT RUINS',
      'DEEP UNDERGROUND',
      'MYSTIC VAULT',
      'SHADOW GROTTO'
    ];
    const bIdx = Math.floor(rand() * BIOME_NAMES.length);
    proceduralTitles[key] = `${BIOME_NAMES[bIdx]} [${rx},${ry}]`;

    const grid: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));

    for (let tx = 0; tx < COLS; tx++) {
      grid[0][tx] = '#';
      grid[ROWS - 1][tx] = '#';
    }
    for (let ty = 0; ty < ROWS; ty++) {
      grid[ty][0] = '#';
      grid[ty][COLS - 1] = '#';
    }

    // Connect neighbors
    const leftKey = `${rx - 1},${ry}`;
    const leftRoom = STATIC_ROOMS[leftKey] || proceduralRooms[leftKey];
    if (leftRoom) {
      for (let ty = 1; ty < ROWS - 1; ty++) {
        if (leftRoom[ty][COLS - 1] === '.') grid[ty][0] = '.';
      }
    } else {
      grid[6][0] = '.'; grid[7][0] = '.';
    }

    const rightKey = `${rx + 1},${ry}`;
    const rightRoom = STATIC_ROOMS[rightKey] || proceduralRooms[rightKey];
    if (rightRoom) {
      for (let ty = 1; ty < ROWS - 1; ty++) {
        if (rightRoom[ty][0] === '.') grid[ty][COLS - 1] = '.';
      }
    } else {
      grid[6][COLS - 1] = '.'; grid[7][COLS - 1] = '.';
    }

    const topKey = `${rx},${ry - 1}`;
    const topRoom = STATIC_ROOMS[topKey] || proceduralRooms[topKey];
    if (topRoom) {
      for (let tx = 1; tx < COLS - 1; tx++) {
        if (topRoom[ROWS - 1][tx] === '.') grid[0][tx] = '.';
      }
    } else if (rand() < 0.3) {
      grid[0][4] = '.'; grid[0][5] = '.';
    }

    const bottomKey = `${rx},${ry + 1}`;
    const bottomRoom = STATIC_ROOMS[bottomKey] || proceduralRooms[bottomKey];
    if (bottomRoom) {
      for (let tx = 1; tx < COLS - 1; tx++) {
        if (bottomRoom[0][tx] === '.') grid[ROWS - 1][tx] = '.';
      }
    } else if (rand() < 0.3) {
      grid[ROWS - 1][4] = '.'; grid[ROWS - 1][5] = '.';
    }

    const arch = rand();
    if (arch < 0.25) {
      for (let x = 2; x <= 4; x++) grid[5][x] = '#';
      for (let x = 5; x <= 7; x++) grid[3][x] = '#';
      if (rand() < 0.8) grid[4][3] = 'E';
      grid[2][6] = 'o';
    } else if (arch < 0.5) {
      for (let x = 3; x <= 6; x++) grid[5][x] = '#';
      grid[4][4] = 'o'; grid[4][5] = 'o';
      if (rand() < 0.7) grid[7][4] = 'E';
    } else if (arch < 0.75) {
      for (let x = 2; x <= 3; x++) grid[4][x] = '#';
      for (let x = 6; x <= 7; x++) grid[4][x] = '#';
      grid[3][2] = rand() < 0.5 ? '1' : '2';
      grid[3][7] = 'o';
      grid[7][5] = 'E';
    } else {
      grid[5][2] = '#'; grid[4][5] = '#'; grid[5][7] = '#';
      const rare = rand();
      if (rare < 0.2) grid[3][5] = 'G';
      else if (rare < 0.4) grid[3][5] = 'B';
      else if (rare < 0.6) grid[3][5] = 'Y';
      else grid[3][5] = '3';
      if (rand() < 0.6) grid[7][3] = 'E';
    }

    if (rand() < 0.4 && grid[7][2] === '.') grid[7][2] = 'o';
    if (rand() < 0.4 && grid[7][7] === '.') grid[7][7] = 'o';

    const roomLines = grid.map(r => r.join(''));
    proceduralRooms[key] = roomLines;
    return roomLines;
  };

  const solidChar = (key: string, c: string) => c === '#' || (c === 'L' && !S.got[`${key}:L`]);
  const neighbor = (dx: number, dy: number) => getOrCreateRoom(S.rx + dx, S.ry + dy);

  const solidAt = (tx: number, ty: number): boolean => {
    const cur = getOrCreateRoom(S.rx, S.ry);
    if (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS) return solidChar(S.room, cur[ty][tx]);
    const dx = tx < 0 ? -1 : tx >= COLS ? 1 : 0;
    const dy = ty < 0 ? -1 : ty >= ROWS ? 1 : 0;
    if (dx && dy) return true;
    const n = neighbor(dx, dy);
    return !n || solidChar(`${S.rx + dx},${S.ry + dy}`, n[(ty + ROWS) % ROWS][(tx + COLS) % COLS]);
  };

  const hits = (x: number, y: number): boolean => {
    const x0 = Math.floor((x - HALF) / T),
      x1 = Math.floor((x + HALF - 0.001) / T);
    const y0 = Math.floor((y - BODY_H) / T),
      y1 = Math.floor((y - 0.001) / T);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (solidAt(tx, ty)) return true;
      }
    }
    return false;
  };

  const spawnParticles = (x: number, y: number, color: string, count: number = 6, grav: boolean = true) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const spd = 25 + Math.random() * 55;
      S.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - (grav ? 30 : 0),
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        color,
        size: Math.random() < 0.5 ? 1 : 2,
        gravity: grav
      });
    }
  };

  const spawnDust = (x: number, y: number) => {
    for (let i = 0; i < 4; i++) {
      S.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y,
        vx: (Math.random() - 0.5) * 20,
        vy: -10 - Math.random() * 15,
        life: 0.15 + Math.random() * 0.1,
        maxLife: 0.25,
        color: '#c0c8d0',
        size: 1,
        gravity: false
      });
    }
  };

  const moveX = (dx: number) => {
    const sg = Math.sign(dx);
    let n = Math.abs(dx);
    while (n > 0) {
      const s = Math.min(1, n);
      if (hits(S.x + sg * s, S.y)) {
        S.vx = 0;
        return;
      }
      S.x += sg * s;
      n -= s;
    }
  };

  const moveY = (dy: number) => {
    const wasGround = S.ground;
    S.ground = false;
    const sg = Math.sign(dy);
    let n = Math.abs(dy);
    while (n > 0) {
      const s = Math.min(1, n);
      if (hits(S.x, S.y + sg * s)) {
        if (sg > 0) {
          S.ground = true;
          if (!wasGround && S.vy > 100) {
            spawnDust(S.x, S.y);
          }
        }
        S.vy = 0;
        return;
      }
      S.y += sg * s;
      n -= s;
    }
  };

  const overlap = (
    a: { x0: number; x1: number; y0: number; y1: number },
    b: { x0: number; x1: number; y0: number; y1: number }
  ) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

  const bodyBox = () => ({ x0: S.x - HALF, x1: S.x + HALF, y0: S.y - BODY_H, y1: S.y });
  const enemyBox = (e: Enemy) => ({ x0: e.x - 7, x1: e.x + 7, y0: e.y - 10, y1: e.y });

  const ROW_CEILING = 0, ROW_WALL_A = 1, ROW_FLOOR = 3;
  const isWall = (tx: number, ty: number) => solidAt(tx, ty - 1) && solidAt(tx, ty + 1);
  const tileIndex = (tx: number, ty: number) => {
    let row: number;
    if (!solidAt(tx, ty - 1)) row = ROW_FLOOR;
    else if (!solidAt(tx, ty + 1)) row = ROW_CEILING;
    else {
      let k = 0;
      while (ty - k - 1 >= 0 && solidAt(tx, ty - k - 1) && isWall(tx, ty - k - 1)) k++;
      row = ROW_WALL_A + (k % 2);
    }
    const h = ((tx * 73856093) ^ (ty * 19349663) ^ (S.rx * 83492791) ^ (S.ry * 49979687)) >>> 0;
    return row * 4 + ((h >>> 8) % 4);
  };

  const enterRoom = (key: string) => {
    S.room = key;
    const [rx, ry] = key.split(',').map(Number);
    S.rx = rx;
    S.ry = ry;
    S.enemies = [];
    S.picks = [];

    const rows = getOrCreateRoom(rx, ry);
    rows.forEach((row, ty) => {
      for (let tx = 0; tx < COLS; tx++) {
        const c = row[tx];
        if (c === 'E') {
          // In top caves, spawn bats; on ground, spawn slimes
          const isFlying = ty < 4;
          S.enemies.push({
            x: tx * T + 8,
            y: (ty + 1) * T,
            baseY: (ty + 1) * T,
            dir: -1,
            hp: 2,
            maxHp: 2,
            stun: 0,
            kind: isFlying ? 'bat' : 'slime',
            animT: Math.random() * 2
          });
        } else if (ITEMS[c] && !S.got[`${key}:${tx},${ty}`]) {
          S.picks.push({ x: tx * T + 8, y: ty * T + 8, c, id: `${key}:${tx},${ty}` });
        }
      }
    });

    if (proceduralTitles[key]) {
      say(proceduralTitles[key]);
    }
  };

  const respawn = () => {
    S.x = START.x;
    S.y = START.y;
    S.vx = 0;
    S.vy = 0;
    S.hp = S.maxHp;
    S.inv = 0;
    S.kb = 0;
    S.atk = 0;
    S.particles = [];
    enterRoom(START.room);
  };

  const say = (text: string) => {
    S.msg = text;
    S.msgT = 2;
  };

  // Custom Pixel-Art Sprites & UI
  const drawSlime = (g: CanvasRenderingContext2D, x: number, y: number, dir: number, animT: number, stun: boolean) => {
    const isWobble = Math.floor(animT * 4) % 2 === 0;
    const px = Math.round(x);
    const py = Math.round(y);

    if (stun) {
      // White silhouette on hit
      g.fillStyle = '#ffffff';
      g.fillRect(px - 6, py - 9, 12, 9);
      return;
    }

    // Shadow blob beneath
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.fillRect(px - 6, py - 1, 12, 2);

    if (isWobble) {
      // Frame 0: Flat squished crawl
      g.fillStyle = '#22082b'; // Dark outline
      g.fillRect(px - 6, py - 8, 12, 8);
      g.fillStyle = '#7a1f94'; // Dark purple
      g.fillRect(px - 5, py - 7, 10, 6);
      g.fillStyle = '#b347d4'; // Body magenta
      g.fillRect(px - 4, py - 6, 8, 4);
      g.fillStyle = '#e8a3fc'; // Top shine
      g.fillRect(px - 3, py - 7, 5, 2);

      // Glowing eyes
      const eyeX = dir > 0 ? px + 1 : px - 4;
      g.fillStyle = '#ffffff';
      g.fillRect(eyeX, py - 5, 3, 2);
      g.fillStyle = '#ff2244';
      g.fillRect(eyeX + (dir > 0 ? 1 : 0), py - 5, 2, 2);
    } else {
      // Frame 1: Tall stretch bounce
      g.fillStyle = '#22082b';
      g.fillRect(px - 5, py - 10, 10, 10);
      g.fillStyle = '#7a1f94';
      g.fillRect(px - 4, py - 9, 8, 8);
      g.fillStyle = '#b347d4';
      g.fillRect(px - 3, py - 8, 6, 6);
      g.fillStyle = '#e8a3fc';
      g.fillRect(px - 2, py - 9, 4, 2);

      const eyeX = dir > 0 ? px : px - 3;
      g.fillStyle = '#ffffff';
      g.fillRect(eyeX, py - 7, 3, 2);
      g.fillStyle = '#ff2244';
      g.fillRect(eyeX + (dir > 0 ? 1 : 0), py - 7, 2, 2);
    }
  };

  const drawBat = (g: CanvasRenderingContext2D, x: number, y: number, dir: number, animT: number, stun: boolean) => {
    const wingsUp = Math.floor(animT * 6) % 2 === 0;
    const px = Math.round(x);
    const py = Math.round(y);

    if (stun) {
      g.fillStyle = '#ffffff';
      g.fillRect(px - 6, py - 8, 12, 8);
      return;
    }

    g.fillStyle = '#1c102b'; // Dark wing border
    g.fillRect(px - 7, wingsUp ? py - 8 : py - 4, 14, 6);
    g.fillStyle = '#473063'; // Wing webbing
    g.fillRect(px - 6, wingsUp ? py - 7 : py - 3, 12, 4);
    g.fillStyle = '#2a1a40'; // Bat torso
    g.fillRect(px - 3, py - 6, 6, 6);
    // Glowing eyes
    g.fillStyle = '#ff2255';
    g.fillRect(dir > 0 ? px : px - 2, py - 5, 2, 2);
  };

  const drawHeart = (g: CanvasRenderingContext2D, x: number, y: number, full: boolean, pulse: boolean) => {
    const off = pulse ? Math.round(Math.sin(performance.now() / 120) * 1) : 0;
    const px = Math.round(x);
    const py = Math.round(y) - off;

    // Outer dark outline (8x7 heart)
    g.fillStyle = full ? '#3d0808' : '#1c0808';
    g.fillRect(px + 1, py, 2, 1);
    g.fillRect(px + 4, py, 2, 1);
    g.fillRect(px, py + 1, 7, 3);
    g.fillRect(px + 1, py + 4, 5, 1);
    g.fillRect(px + 2, py + 5, 3, 1);
    g.fillRect(px + 3, py + 6, 1, 1);

    if (full) {
      // Full heart interior
      g.fillStyle = '#d41717';
      g.fillRect(px + 1, py + 1, 2, 2);
      g.fillRect(px + 4, py + 1, 2, 2);
      g.fillRect(px + 1, py + 2, 5, 2);
      g.fillRect(px + 2, py + 4, 3, 1);
      // Top white sheen
      g.fillStyle = '#ffffff';
      g.fillRect(px + 1, py + 1, 1, 1);
      g.fillStyle = '#ff7b7b';
      g.fillRect(px + 2, py + 1, 1, 1);
      g.fillRect(px + 4, py + 1, 1, 1);
    } else {
      // Empty container socket
      g.fillStyle = '#281010';
      g.fillRect(px + 1, py + 1, 5, 3);
      g.fillRect(px + 2, py + 4, 3, 1);
      g.fillStyle = '#140505';
      g.fillRect(px + 2, py + 2, 3, 2);
    }
  };

  const drawWingedRelic = (g: CanvasRenderingContext2D, x: number, y: number, bob: number, t: number) => {
    const px = Math.round(x);
    const py = Math.round(y + bob);

    // Glowing cyan aura rings
    const auraAlpha = 0.25 + Math.sin(t * 4) * 0.15;
    g.fillStyle = `rgba(80, 230, 255, ${auraAlpha})`;
    g.fillRect(px - 7, py - 7, 14, 14);

    // Wing feathers (gold)
    g.fillStyle = '#ffd242';
    // Left wing
    g.fillRect(px - 6, py - 4, 4, 2);
    g.fillRect(px - 5, py - 2, 3, 2);
    g.fillRect(px - 4, py, 2, 2);
    // Right wing
    g.fillRect(px + 2, py - 4, 4, 2);
    g.fillRect(px + 2, py - 2, 3, 2);
    g.fillRect(px + 2, py, 2, 2);

    // Relic central core
    g.fillStyle = '#005577';
    g.fillRect(px - 2, py - 4, 4, 8);
    g.fillStyle = '#4deeea';
    g.fillRect(px - 1, py - 3, 2, 6);
    g.fillStyle = '#ffffff';
    g.fillRect(px - 1, py - 2, 2, 2);

    // Orbiting sparkle pixels
    const a1 = t * 3;
    const a2 = t * 3 + Math.PI;
    g.fillStyle = '#ffffff';
    g.fillRect(Math.round(px + Math.cos(a1) * 8), Math.round(py + Math.sin(a1) * 5), 1, 1);
    g.fillRect(Math.round(px + Math.cos(a2) * 8), Math.round(py + Math.sin(a2) * 5), 1, 1);
  };

  const drawSwordSlashFX = (
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    atkV: number,
    face: number,
    timer: number
  ) => {
    const px = Math.round(x);
    const py = Math.round(y);
    const progress = Math.max(0, Math.min(1, 1 - timer / 0.2));

    g.save();
    if (face < 0) {
      g.translate(px, py);
      g.scale(-1, 1);
      g.translate(-px, -py);
    }

    g.fillStyle = 'rgba(255, 255, 255, 0.9)';
    if (atkV === 0) {
      // Stab: Forward piercing beam
      const len = 12 * (1 - progress);
      g.fillRect(px + 8, py - 2, Math.round(len), 3);
      g.fillStyle = '#66ccff';
      g.fillRect(px + 6, py - 1, Math.round(len + 4), 1);
    } else if (atkV === 1) {
      // Slash Up: Crescent sweeping skyward
      g.fillRect(px + 6, py - 12 + progress * 4, 8, 2);
      g.fillRect(px + 10, py - 8, 4, 6);
      g.fillStyle = '#66ccff';
      g.fillRect(px + 8, py - 10, 4, 3);
    } else if (atkV === 2) {
      // Slash Forward: Wide horizontal cleave
      g.fillRect(px + 10, py - 6, 8, 2);
      g.fillRect(px + 12, py - 4, 4, 6);
      g.fillRect(px + 8, py + 2, 8, 2);
      g.fillStyle = '#66ccff';
      g.fillRect(px + 10, py - 2, 6, 4);
    } else if (atkV === 3) {
      // Slash Down: Downward overhead smash
      g.fillRect(px + 6, py + 4, 8, 2);
      g.fillRect(px + 10, py, 4, 6);
      g.fillStyle = '#66ccff';
      g.fillRect(px + 8, py + 2, 4, 3);
    }
    g.restore();
  };

  return {
    id: 'knight',
    name: 'KNIGHT (PROTO)',
    version: '0.3',
    author: 'Minuteman Metroidvania',
    description: 'Metroidvania world with hand-crafted static areas, animated monsters, sword combos, gems, relics, and endless dungeons.',

    assets: {
      knight: { src: KNIGHT_PNG, cw: 18, ch: 18, frames: 3, fps: 6, ax: 9, ay: 18 },
      tiles: { src: TILES_PNG, cw: 16, ch: 16, frames: 4, rows: 4 },
      items: { src: ITEMS_PNG, cw: 16, ch: 16, frames: 4, rows: 4, ax: 8, ay: 8 }
    },

    init: (surface: CartridgeSurface) => {
      audio = surface.audio || null;
      S = {
        got: {},
        hasDouble: false,
        maxHp: 3,
        hp: 3,
        maxAp: 0,
        ap: 0,
        maxEp: 0,
        ep: 0,
        maxSp: 0,
        sp: 0,
        coins: 0,
        keys: 0,
        atkV: 0,
        face: 1,
        t: 0,
        coyote: 0,
        buffer: 0,
        airJumps: 0,
        jumping: false,
        ground: false,
        inv: 0,
        kb: 0,
        atk: 0,
        atkCd: 0,
        swung: [],
        msg: '',
        msgT: 0,
        x: START.x,
        y: START.y,
        vx: 0,
        vy: 0,
        room: START.room,
        rx: 0,
        ry: 0,
        enemies: [],
        picks: [],
        particles: [],
        shake: 0
      };
      respawn();
    },

    update: (input: InputSnapshot, dt: number) => {
      dt = Math.min(dt, 0.033);
      let sx = input.stick ? input.stick.x : 0;
      if (Math.abs(sx) < 0.2) {
        if (input.held.left) sx = -1;
        else if (input.held.right) sx = 1;
      }

      S.coyote -= dt;
      S.buffer -= dt;
      S.inv -= dt;
      S.kb -= dt;
      S.atk -= dt;
      S.atkCd -= dt;
      S.msgT -= dt;
      S.shake = Math.max(0, S.shake - dt * 10);

      // Particles update
      S.particles = S.particles.filter(p => {
        p.life -= dt;
        if (p.life <= 0) return false;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.gravity) p.vy += 220 * dt;
        return true;
      });

      if (input.pressed.a) S.buffer = 0.1;

      if (S.kb <= 0) {
        S.vx = sx * RUN;
        if (sx > 0.1) S.face = 1;
        else if (sx < -0.1) S.face = -1;
      }

      // Attack with sword move
      if (input.pressed.b && S.atkCd <= 0) {
        let sy = input.stick ? input.stick.y : 0;
        if (input.held.up) sy = -1;
        else if (input.held.down) sy = 1;

        S.atkV = sy < -0.5 ? 1 : sy > 0.5 ? 3 : Math.abs(sx) > 0.3 ? 2 : 0;
        S.atk = 0.2;
        S.atkCd = 0.35;
        S.swung = [];
        if (audio) audio.laser();
      }

      // Jumping
      if (S.buffer > 0) {
        if (S.coyote > 0) {
          S.vy = -JUMP;
          S.coyote = 0;
          S.buffer = 0;
          S.jumping = true;
          spawnDust(S.x, S.y);
          if (audio) audio.jump();
        } else if (S.airJumps > 0) {
          S.vy = -JUMP;
          S.airJumps--;
          S.buffer = 0;
          S.jumping = true;
          spawnParticles(S.x, S.y - 8, '#66ccff', 8, false);
          if (audio) audio.jump();
        }
      }

      if (S.jumping && !input.held.a && S.vy < -JUMP * 0.4) S.vy = -JUMP * 0.4;
      if (S.vy >= 0) S.jumping = false;
      S.vy = Math.min(S.vy + G * dt, MAXFALL);

      moveX(S.vx * dt);
      moveY(S.vy * dt);

      if (S.ground) {
        S.coyote = 0.08;
        S.airJumps = S.hasDouble ? 1 : 0;
      }
      S.t = S.ground && Math.abs(S.vx) > 1 ? S.t + dt : 0;

      // Room edge boundaries
      if (S.x < 0) {
        S.x += W;
        enterRoom(`${S.rx - 1},${S.ry}`);
      } else if (S.x >= W) {
        S.x -= W;
        enterRoom(`${S.rx + 1},${S.ry}`);
      }
      if (S.y < 0) {
        S.y += H;
        enterRoom(`${S.rx},${S.ry - 1}`);
      } else if (S.y > H) {
        S.y -= H;
        enterRoom(`${S.rx},${S.ry + 1}`);
      }

      // Enemy behavior & patrol
      S.enemies.forEach(e => {
        if (e.hp <= 0) return;
        e.animT += dt;
        if (e.stun > 0) {
          e.stun -= dt;
          return;
        }

        if (e.kind === 'slime') {
          const nx = e.x + e.dir * 22 * dt;
          const ahead = nx + e.dir * 7;
          const wall = solidAt(Math.floor(ahead / T), Math.floor((e.y - 1) / T));
          const floor = solidAt(Math.floor(ahead / T), Math.floor((e.y + 1) / T));
          if (wall || !floor || ahead < 4 || ahead > W - 4) e.dir = -e.dir;
          else e.x = nx;
        } else if (e.kind === 'bat') {
          // Swooping flying wave
          e.x += e.dir * 30 * dt;
          if (e.baseY) {
            e.y = e.baseY + Math.sin(e.animT * 4) * 6;
          }
          if (e.x < 8 || e.x > W - 8 || solidAt(Math.floor(e.x / T), Math.floor(e.y / T))) {
            e.dir = -e.dir;
          }
        }
      });

      // Sword attack collision & strike feel
      if (S.atk > 0) {
        const f = S.face;
        const b = ATK[S.atkV];
        const box =
          f > 0
            ? { x0: S.x + 5 + b.x0, x1: S.x + 5 + b.x1 + 1 }
            : { x0: S.x - 5 - (b.x1 + 1), x1: S.x - 5 - b.x0 };
        const hitBox = {
          x0: box.x0,
          x1: box.x1,
          y0: S.y - 16 + b.y0,
          y1: S.y - 16 + b.y1 + 1
        };

        S.enemies.forEach((e, i) => {
          if (e.hp > 0 && S.swung.indexOf(i) < 0 && overlap(hitBox, enemyBox(e))) {
            S.swung.push(i);
            e.hp--;
            e.stun = 0.25;
            e.x += f * 8;
            S.shake = 0.15;
            spawnParticles(e.x, e.y - 5, '#ffe570', 8, false);

            if (audio) audio.hit();

            if (e.hp <= 0) {
              spawnParticles(e.x, e.y - 5, e.kind === 'slime' ? '#c445db' : '#5d417a', 14, true);
              if (Math.random() < 0.6) {
                // Drop coin on defeat
                S.picks.push({ x: e.x, y: e.y - 6, c: 'o', id: `${S.room}:drop_${Date.now()}` });
              }
            }
          }
        });
      }

      // Player damage
      if (S.inv <= 0) {
        const me = bodyBox();
        const foe = S.enemies.find(e => e.hp > 0 && overlap(me, enemyBox(e)));
        if (foe) {
          S.hp--;
          S.inv = 1.0;
          S.kb = 0.2;
          S.shake = 0.25;
          S.vx = (S.x < foe.x ? -1 : 1) * 110;
          S.vy = -140;
          spawnParticles(S.x, S.y - 8, '#ff3333', 10, true);
          if (audio) audio.hit();

          if (S.hp <= 0) {
            say('YOU DIED');
            respawn();
          }
        }
      }

      // Unlock doors
      const lx = Math.floor((S.x + S.face * (HALF + 1)) / T);
      const ly = Math.floor((S.y - 8) / T);
      const curRoom = getOrCreateRoom(S.rx, S.ry);
      if (
        S.keys > 0 &&
        Math.abs(sx) > 0.1 &&
        lx >= 0 &&
        lx < COLS &&
        ly >= 0 &&
        ly < ROWS &&
        curRoom[ly][lx] === 'L' &&
        !S.got[`${S.room}:L`]
      ) {
        S.keys--;
        S.got[`${S.room}:L`] = true;
        say('UNLOCKED');
        spawnParticles(lx * T + 8, ly * T + 8, '#ffdd44', 12, false);
        if (audio) audio.powerup();
      }

      // Pickups collection
      S.picks = S.picks.filter(pk => {
        if (Math.abs(pk.x - S.x) > 10 || Math.abs(pk.y - (S.y - 8)) > 12) return true;
        const it = ITEMS[pk.c];
        if (!it) return false;
        S.got[pk.id] = true;

        if (it.k === 'coin') {
          S.coins++;
          spawnParticles(pk.x, pk.y, '#ffd700', 6, false);
          if (audio) audio.coin();
        } else if (it.k === 'key') {
          S.keys++;
          say('KEY');
          spawnParticles(pk.x, pk.y, '#ffd700', 10, false);
          if (audio) audio.powerup();
        } else if (it.k === 'gem' && it.s) {
          const statKey = `max${cap(it.s)}` as keyof RunState;
          (S[statKey] as number)++;
          (S[it.s] as number) = S[statKey] as number;
          say(`+1 MAX ${it.s.toUpperCase()}`);
          spawnParticles(pk.x, pk.y, '#88ff88', 12, false);
          if (audio) audio.powerup();
        } else if (it.k === 'potion' && it.s) {
          const maxKey = `max${cap(it.s)}` as keyof RunState;
          (S[it.s] as number) = Math.min(S[maxKey] as number, (S[it.s] as number) + 2);
          say(`+2 ${it.s.toUpperCase()}`);
          spawnParticles(pk.x, pk.y, '#ff44aa', 10, false);
          if (audio) audio.powerup();
        } else {
          S.hasDouble = true;
          say('DOUBLE JUMP');
          spawnParticles(pk.x, pk.y, '#4deeea', 16, false);
          if (audio) audio.powerup();
        }
        return false;
      });
    },

    draw: (surface: CartridgeSurface) => {
      const g = surface.g;
      const knight = surface.assets.knight;
      const tiles = surface.assets.tiles;
      const items = surface.assets.items;

      g.save();

      // Screen shake offset
      if (S.shake > 0) {
        const ox = (Math.random() - 0.5) * 3;
        const oy = (Math.random() - 0.5) * 3;
        g.translate(Math.round(ox), Math.round(oy));
      }

      // Atmospheric Dungeon Masonry Backdrop
      g.fillStyle = '#0b0f14';
      g.fillRect(0, 0, W, H);

      // Subtle subterranean brick pattern
      g.fillStyle = '#111720';
      for (let by = 0; by < H; by += 8) {
        const offset = (Math.floor(by / 8) % 2) * 8;
        for (let bx = 0; bx < W; bx += 16) {
          g.fillRect(bx + offset, by, 15, 7);
        }
      }

      // Foreground Cave Geometry
      const rows = getOrCreateRoom(S.rx, S.ry);
      for (let ty = 0; ty < ROWS; ty++) {
        for (let tx = 0; tx < COLS; tx++) {
          if (rows[ty][tx] === 'L') {
            if (!S.got[`${S.room}:L`] && items) {
              items.draw(g, 3, tx * T + 8, ty * T + 8);
            }
            continue;
          }
          if (rows[ty][tx] !== '#') continue;
          if (tiles) {
            tiles.draw(g, tileIndex(tx, ty), tx * T, ty * T);
          } else {
            g.fillStyle = '#2d4734';
            g.fillRect(tx * T, ty * T, T, T);
          }
        }
      }

      // Pickups & Collectibles
      const nowMs = performance.now();
      S.picks.forEach(pk => {
        const bob = Math.round(Math.sin(nowMs / 250) * 1.5);
        const it = ITEMS[pk.c];
        if (it && it.i >= 0 && items) {
          items.draw(g, it.i, pk.x, pk.y + (it.k === 'coin' || it.k === 'key' ? 0 : bob));
          return;
        }
        // Mystic Winged Relic for Double Jump
        drawWingedRelic(g, pk.x, pk.y, bob, nowMs / 1000);
      });

      // Animated Enemies
      S.enemies.forEach(e => {
        if (e.hp <= 0) return;
        const isStunned = e.stun > 0;
        if (e.kind === 'slime') {
          drawSlime(g, e.x, e.y, e.dir, e.animT, isStunned);
        } else {
          drawBat(g, e.x, e.y, e.dir, e.animT, isStunned);
        }
      });

      // Particles
      S.particles.forEach(p => {
        g.fillStyle = p.color;
        g.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      });

      // Knight Character Sprite
      const isInvFlash = S.inv > 0 && Math.floor(S.inv * 16) % 2 === 0;
      if (!isInvFlash) {
        // Frame 0: Idle, Frame 1: Mid-walk / Jump pose, Frame 2: Step
        const frame = S.ground ? (S.t > 0 && knight ? knight.frameAt(S.t) : 0) : 1;
        // Lean slightly forward during sword attack
        const attackShift = S.atk > 0 ? S.face * 1 : 0;
        if (knight) {
          knight.draw(g, frame, S.x + attackShift, S.y, S.face < 0);
        } else {
          g.fillStyle = '#ffffff';
          g.fillRect(S.x - HALF, S.y - BODY_H, HALF * 2, BODY_H);
        }
      }

      // Sword Attack & Dynamic Slash Arc FX
      if (S.atk > 0) {
        if (items) {
          items.draw(g, 12 + S.atkV, S.x + S.face * 13, S.y - 8, S.face < 0);
        }
        drawSwordSlashFX(g, S.x, S.y - 8, S.atkV, S.face, S.atk);
      }

      // Pixel-Art Heart Containers HUD (HP)
      const lowHp = S.hp === 1;
      for (let i = 0; i < S.maxHp; i++) {
        drawHeart(g, 4 + i * 9, 4, i < S.hp, lowHp && i === 0);
      }

      // Stat meters (AP, EP, SP)
      const stats = ['ap', 'ep', 'sp'] as const;
      stats.forEach((st, row) => {
        const maxVal = S[`max${cap(st)}` as keyof RunState] as number;
        const curVal = S[st as keyof RunState] as number;
        for (let i = 0; i < maxVal; i++) {
          g.fillStyle = i < curVal ? STAT_COLOR[st] : '#181f29';
          g.fillRect(4 + i * 6, 14 + row * 6, 4, 4);
          g.fillStyle = '#05070a';
          g.strokeRect(4 + i * 6 - 0.5, 14 + row * 6 - 0.5, 5, 5);
        }
      });

      // Coin counter with icon
      if (items) {
        items.draw(g, 0, W - 22, 8);
      }
      g.font = `8px ${fontFamily}`;
      g.fillStyle = '#ffffff';
      g.fillText(String(S.coins), W - 12, 12);

      // Key inventory
      for (let i = 0; i < S.keys; i++) {
        if (items) {
          items.draw(g, 2, W - 10, 22 + i * 9);
        }
      }

      // Biome / Event Banner with retro styled pill
      if (S.msgT > 0) {
        g.font = `8px ${fontFamily}`;
        const tw = g.measureText(S.msg).width;
        g.fillStyle = 'rgba(10, 15, 20, 0.85)';
        g.fillRect(Math.round(W / 2 - tw / 2 - 4), 26, Math.round(tw + 8), 12);
        g.strokeStyle = '#4deeea';
        g.lineWidth = 1;
        g.strokeRect(Math.round(W / 2 - tw / 2 - 4.5), 25.5, Math.round(tw + 9), 13);

        g.textAlign = 'center';
        g.fillStyle = '#ffffff';
        g.fillText(S.msg, W / 2, 35);
        g.textAlign = 'left';
      }

      g.restore();
    }
  };
}
