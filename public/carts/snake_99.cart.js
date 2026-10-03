// SNAKE 99 CARTRIDGE (v1.0)
(() => {
  const TILE = 8;
  const COLS = 20;
  const ROWS = 16;
  const OFFSET_Y = 16;

  let snake = [];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let food = { x: 10, y: 8 };
  let score = 0;
  let highScore = 0;
  let moveInterval = 0.12;
  let moveTimer = 0;
  let state = 'PLAYING';

  const spawnFood = () => {
    food = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS)
    };
  };

  const resetGame = () => {
    snake = [{ x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    moveInterval = 0.12;
    moveTimer = 0;
    state = 'PLAYING';
    spawnFood();
  };

  Minuteman.register({
    id: 'snake_99',
    name: 'SNAKE 99',
    version: '1.0',
    author: 'Minuteman Arcade',
    description: 'Classic arcade snake. D-Pad: Turn.',

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

      if (input.pressed.up && dir.y === 0) nextDir = { x: 0, y: -1 };
      else if (input.pressed.down && dir.y === 0) nextDir = { x: 0, y: 1 };
      else if (input.pressed.left && dir.x === 0) nextDir = { x: -1, y: 0 };
      else if (input.pressed.right && dir.x === 0) nextDir = { x: 1, y: 0 };

      moveTimer += dt;
      if (moveTimer >= moveInterval) {
        moveTimer = 0;
        dir = nextDir;
        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || snake.some(s => s.x === head.x && s.y === head.y)) {
          state = 'GAMEOVER';
          if (score > highScore) highScore = score;
          return;
        }

        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
          score += 10;
          spawnFood();
          moveInterval = Math.max(0.05, 0.12 - Math.floor(score / 50) * 0.01);
        } else {
          snake.pop();
        }
      }
    },

    draw: (surface) => {
      const g = surface.g;
      const w = surface.width;
      const h = surface.height;

      g.fillStyle = '#0f260f';
      g.fillRect(0, 0, w, h);

      g.fillStyle = '#0f35';
      g.fillRect(0, 0, w, OFFSET_Y);
      g.fillStyle = '#0f3';
      g.font = '8px orion-font, monospace';
      g.fillText(`SCORE:${score}`, 4, 11);
      g.fillText(`BEST:${highScore}`, 96, 11);

      g.fillStyle = '#f33';
      g.fillRect(food.x * TILE + 1, food.y * TILE + OFFSET_Y + 1, TILE - 2, TILE - 2);

      snake.forEach((s, idx) => {
        g.fillStyle = idx === 0 ? '#0f3' : '#0a2';
        g.fillRect(s.x * TILE + 1, s.y * TILE + OFFSET_Y + 1, TILE - 2, TILE - 2);
      });

      if (state === 'GAMEOVER') {
        g.fillStyle = '#000d';
        g.fillRect(20, 45, 120, 65);
        g.fillStyle = '#f33';
        g.fillText('GAME OVER', 46, 64);
        g.fillStyle = '#0f3';
        g.fillText(`FINAL: ${score}`, 48, 80);
      }
    },

    saveState: () => ({ highScore, lastScore: score })
  });
})();
