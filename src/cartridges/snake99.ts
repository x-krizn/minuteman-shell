import { Cartridge, CartridgeSurface, InputSnapshot } from '../types';

export function createSnake99Cartridge(): Cartridge {
  const TILE = 8;
  const COLS = 20;
  const ROWS = 16;
  const OFFSET_Y = 16;

  interface Point { x: number; y: number }

  let cartSurface: CartridgeSurface | null = null;
  let snake: Point[] = [];
  let dir: Point = { x: 1, y: 0 };
  let nextDir: Point = { x: 1, y: 0 };
  let food: Point = { x: 10, y: 8 };
  let bonus: { x: number; y: number; timer: number } | null = null;
  let score = 0;
  let highScore = 0;
  let moveInterval = 0.12;
  let moveTimer = 0;
  let state: 'PLAYING' | 'GAMEOVER' = 'PLAYING';

  const spawnFood = () => {
    let attempts = 0;
    while (attempts < 100) {
      const fx = Math.floor(Math.random() * COLS);
      const fy = Math.floor(Math.random() * ROWS);
      if (!snake.some(s => s.x === fx && s.y === fy)) {
        food = { x: fx, y: fy };
        break;
      }
      attempts++;
    }
  };

  const spawnBonus = () => {
    const bx = Math.floor(Math.random() * COLS);
    const by = Math.floor(Math.random() * ROWS);
    if (!snake.some(s => s.x === bx && s.y === by) && (bx !== food.x || by !== food.y)) {
      bonus = { x: bx, y: by, timer: 6.0 };
    }
  };

  const resetGame = () => {
    snake = [
      { x: 5, y: 8 },
      { x: 4, y: 8 },
      { x: 3, y: 8 }
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    moveInterval = 0.12;
    moveTimer = 0;
    bonus = null;
    state = 'PLAYING';
    spawnFood();
  };

  return {
    id: 'snake_99',
    name: 'SNAKE 99',
    version: '1.0',
    author: 'Minuteman Arcade',
    description: 'Classic arcade snake. D-Pad: Turn.',

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

      // Input buffering
      if (input.pressed.up && dir.y === 0) nextDir = { x: 0, y: -1 };
      else if (input.pressed.down && dir.y === 0) nextDir = { x: 0, y: 1 };
      else if (input.pressed.left && dir.x === 0) nextDir = { x: -1, y: 0 };
      else if (input.pressed.right && dir.x === 0) nextDir = { x: 1, y: 0 };

      if (bonus) {
        bonus.timer -= dt;
        if (bonus.timer <= 0) bonus = null;
      }

      moveTimer += dt;
      if (moveTimer >= moveInterval) {
        moveTimer = 0;
        dir = nextDir;

        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

        // Wall collision (wrap around or wall)
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
          state = 'GAMEOVER';
          if (cartSurface) cartSurface.audio.hit();
          if (score > highScore) {
            highScore = score;
          }
          if (cartSurface) {
            cartSurface.save({ highScore, lastScore: score });
          }
          return;
        }

        // Self collision
        if (snake.some(s => s.x === head.x && s.y === head.y)) {
          state = 'GAMEOVER';
          if (cartSurface) cartSurface.audio.hit();
          if (score > highScore) {
            highScore = score;
          }
          if (cartSurface) {
            cartSurface.save({ highScore, lastScore: score });
          }
          return;
        }

        snake.unshift(head);

        // Check food
        if (head.x === food.x && head.y === food.y) {
          score += 10;
          if (cartSurface) cartSurface.audio.coin();
          spawnFood();
          moveInterval = Math.max(0.05, 0.12 - Math.floor(score / 50) * 0.01);

          if (Math.random() < 0.25 && !bonus) {
            spawnBonus();
          }
        } else if (bonus && head.x === bonus.x && head.y === bonus.y) {
          score += 50;
          if (cartSurface) cartSurface.audio.powerup();
          bonus = null;
        } else {
          snake.pop();
        }
      }
    },

    draw: (surface: CartridgeSurface) => {
      const g = surface.g;
      const w = surface.width;
      const h = surface.height;

      // Dark background
      g.fillStyle = '#0f260f';
      g.fillRect(0, 0, w, h);

      // Top HUD
      g.fillStyle = '#0f35';
      g.fillRect(0, 0, w, OFFSET_Y);
      g.fillStyle = '#0f3';
      g.font = '8px orion-font, monospace';
      g.fillText(`SCORE:${score}`, 4, 11);
      g.fillText(`BEST:${highScore}`, 96, 11);

      // Arena boundary
      g.strokeStyle = '#0f34';
      g.strokeRect(0, OFFSET_Y, w, h - OFFSET_Y);

      // Draw Food
      g.fillStyle = '#f33';
      g.fillRect(food.x * TILE + 1, food.y * TILE + OFFSET_Y + 1, TILE - 2, TILE - 2);

      // Draw Bonus
      if (bonus) {
        g.fillStyle = Math.floor(Date.now() / 100) % 2 === 0 ? '#ff0' : '#fa0';
        g.fillRect(bonus.x * TILE, bonus.y * TILE + OFFSET_Y, TILE, TILE);
      }

      // Draw Snake
      snake.forEach((s, idx) => {
        g.fillStyle = idx === 0 ? '#0f3' : '#0a2';
        g.fillRect(s.x * TILE + 1, s.y * TILE + OFFSET_Y + 1, TILE - 2, TILE - 2);
      });

      // Game Over Screen
      if (state === 'GAMEOVER') {
        g.fillStyle = '#000d';
        g.fillRect(20, 45, 120, 65);
        g.strokeStyle = '#0f3';
        g.strokeRect(20, 45, 120, 65);

        g.fillStyle = '#f33';
        g.font = '10px orion-font, monospace';
        g.fillText('GAME OVER', 46, 64);

        g.fillStyle = '#0f3';
        g.font = '8px orion-font, monospace';
        g.fillText(`FINAL: ${score}`, 48, 80);

        g.fillStyle = '#ff0';
        g.fillText('PRESS A / START', 34, 96);
      }
    },

    saveState: () => ({ highScore, lastScore: score })
  };
}
