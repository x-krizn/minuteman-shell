// STAR PATROL CARTRIDGE (v1.0)
(() => {
  let playerX = 80;
  let playerY = 120;
  let playerSpeed = 75;
  let shield = 100;
  let score = 0;
  let highScore = 0;
  let lives = 3;
  let wave = 1;
  let state = 'PLAYING';
  let stars = [];
  let lasers = [];
  let enemies = [];
  let particles = [];
  let powerups = [];
  let shootTimer = 0;
  let spawnTimer = 0;
  let invulnTimer = 0;
  let gunLevel = 1;

  const resetGame = () => {
    playerX = 80;
    playerY = 120;
    shield = 100;
    score = 0;
    lives = 3;
    wave = 1;
    state = 'PLAYING';
    lasers = [];
    enemies = [];
    particles = [];
    powerups = [];
    gunLevel = 1;
    invulnTimer = 2;
  };

  const spawnExplosion = (x, y, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const spd = 20 + Math.random() * 40;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.3 + Math.random() * 0.3
      });
    }
  };

  Minuteman.register({
    id: 'star_patrol',
    name: 'STAR PATROL',
    version: '1.0',
    author: 'Minuteman Arcade',
    description: 'Arcade space shooter. A: Laser, B: Boost, D-Pad: Fly.',

    init: (surface) => {
      resetGame();
      const saved = surface.load ? surface.load() : null;
      if (saved && typeof saved.highScore === 'number') {
        highScore = saved.highScore;
      }

      stars = [];
      for (let i = 0; i < 35; i++) {
        stars.push({
          x: Math.random() * surface.width,
          y: Math.random() * surface.height,
          s: Math.random() > 0.7 ? 2 : 1,
          speed: 15 + Math.random() * 35
        });
      }
    },

    update: (input, dt) => {
      stars.forEach(s => {
        s.y += s.speed * dt;
        if (s.y > 144) {
          s.y = 0;
          s.x = Math.random() * 160;
        }
      });

      if (state === 'GAMEOVER') {
        if (input.pressed.a || input.pressed.start) {
          resetGame();
        }
        return;
      }

      let currentSpeed = playerSpeed;
      if (input.held.b && shield > 5) {
        currentSpeed = playerSpeed * 1.5;
        shield -= 15 * dt;
      } else {
        shield = Math.min(100, shield + 4 * dt);
      }

      if (input.held.left) playerX -= currentSpeed * dt;
      if (input.held.right) playerX += currentSpeed * dt;
      if (input.held.up) playerY -= currentSpeed * dt;
      if (input.held.down) playerY += currentSpeed * dt;

      playerX = Math.max(8, Math.min(152, playerX));
      playerY = Math.max(14, Math.min(136, playerY));

      if (invulnTimer > 0) invulnTimer -= dt;

      shootTimer -= dt;
      if ((input.held.a || input.pressed.a) && shootTimer <= 0) {
        shootTimer = gunLevel === 1 ? 0.22 : 0.14;
        if (gunLevel === 1) {
          lasers.push({ x: playerX, y: playerY - 6, vy: -150 });
        } else {
          lasers.push({ x: playerX - 4, y: playerY - 6, vy: -160 });
          lasers.push({ x: playerX + 4, y: playerY - 6, vy: -160 });
        }
      }

      for (let i = lasers.length - 1; i >= 0; i--) {
        lasers[i].y += lasers[i].vy * dt;
        if (lasers[i].y < -4) lasers.splice(i, 1);
      }

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnTimer = Math.max(0.6, 2.0 - wave * 0.15);
        const roll = Math.random();
        if (roll < 0.5) {
          enemies.push({ x: 16 + Math.random() * 128, y: -10, vx: (Math.random() - 0.5) * 40, vy: 35 + Math.random() * 30, hp: 1, type: 'drone', r: 5 });
        } else if (roll < 0.8) {
          enemies.push({ x: 16 + Math.random() * 128, y: -12, vx: (Math.random() - 0.5) * 20, vy: 20 + Math.random() * 25, hp: 3, type: 'rock', r: 7 });
        } else {
          enemies.push({ x: 20 + Math.random() * 120, y: -14, vx: (Math.random() - 0.5) * 50, vy: 25, hp: 5, type: 'cruiser', r: 8 });
        }
      }

      for (let i = enemies.length - 1; i >= 0; i--) {
        const en = enemies[i];
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (en.x < en.r || en.x > 160 - en.r) en.vx *= -1;

        const pDist = Math.hypot(en.x - playerX, en.y - playerY);
        if (pDist < en.r + 5 && invulnTimer <= 0) {
          spawnExplosion(en.x, en.y, 8);
          enemies.splice(i, 1);
          if (shield > 30) {
            shield -= 30;
            invulnTimer = 0.5;
          } else {
            lives--;
            shield = 100;
            invulnTimer = 1.8;
            gunLevel = 1;
            if (lives <= 0) {
              state = 'GAMEOVER';
              if (score > highScore) highScore = score;
            }
          }
          continue;
        }

        let enemyDead = false;
        for (let l = lasers.length - 1; l >= 0; l--) {
          const lz = lasers[l];
          if (Math.hypot(en.x - lz.x, en.y - lz.y) < en.r + 3) {
            lasers.splice(l, 1);
            en.hp--;
            if (en.hp <= 0) { enemyDead = true; break; }
          }
        }

        if (enemyDead) {
          spawnExplosion(en.x, en.y, en.type === 'cruiser' ? 14 : 7);
          enemies.splice(i, 1);
          score += en.type === 'cruiser' ? 150 : (en.type === 'rock' ? 50 : 30);
          if (Math.random() < 0.2) {
            powerups.push({ x: en.x, y: en.y, vy: 30, type: Math.random() > 0.5 ? 'shield' : 'gun' });
          }
          continue;
        }

        if (en.y > 154) enemies.splice(i, 1);
      }

      for (let i = powerups.length - 1; i >= 0; i--) {
        const pw = powerups[i];
        pw.y += pw.vy * dt;
        if (Math.hypot(pw.x - playerX, pw.y - playerY) < 10) {
          if (pw.type === 'shield') shield = Math.min(100, shield + 50);
          else gunLevel = 2;
          score += 25;
          powerups.splice(i, 1);
          continue;
        }
        if (pw.y > 150) powerups.splice(i, 1);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }

      wave = 1 + Math.floor(score / 500);
    },

    draw: (surface) => {
      const g = surface.g;
      const w = surface.width;
      const h = surface.height;

      g.fillStyle = '#0a1a0a';
      g.fillRect(0, 0, w, h);

      g.fillStyle = '#0f35';
      stars.forEach(s => g.fillRect(Math.floor(s.x), Math.floor(s.y), s.s, s.s));

      powerups.forEach(pw => {
        g.fillStyle = pw.type === 'shield' ? '#0af' : '#fa0';
        g.fillRect(pw.x - 3, pw.y - 3, 6, 6);
      });

      g.fillStyle = '#0f3';
      lasers.forEach(l => g.fillRect(Math.floor(l.x - 1), Math.floor(l.y - 3), 2, 6));

      enemies.forEach(en => {
        if (en.type === 'drone') {
          g.fillStyle = '#f55';
          g.fillRect(en.x - 4, en.y - 3, 8, 6);
        } else if (en.type === 'rock') {
          g.fillStyle = '#8a8';
          g.beginPath();
          g.arc(en.x, en.y, en.r, 0, Math.PI * 2);
          g.fill();
        } else {
          g.fillStyle = '#d3f';
          g.fillRect(en.x - 7, en.y - 4, 14, 8);
        }
      });

      if (invulnTimer <= 0 || Math.floor(Date.now() / 80) % 2 === 0) {
        g.fillStyle = '#0f3';
        g.beginPath();
        g.moveTo(playerX, playerY - 6);
        g.lineTo(playerX + 5, playerY + 5);
        g.lineTo(playerX - 5, playerY + 5);
        g.closePath();
        g.fill();
      }

      particles.forEach(p => {
        g.fillStyle = '#ff0';
        g.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 2);
      });

      g.fillStyle = '#0f300faa';
      g.fillRect(0, 0, w, 11);
      g.fillStyle = '#0f3';
      g.font = '8px orion-font, monospace';
      g.fillText(`S:${score}`, 2, 9);
      g.fillText(`W:${wave}`, 68, 9);
      g.fillText(`L:${lives}`, 105, 9);

      if (state === 'GAMEOVER') {
        g.fillStyle = '#000c';
        g.fillRect(20, 35, 120, 75);
        g.strokeStyle = '#0f3';
        g.lineWidth = 2;
        g.strokeRect(20, 35, 120, 75);
        g.fillStyle = '#f33';
        g.fillText('MISSION FAILED', 34, 52);
        g.fillStyle = '#0f3';
        g.fillText(`SCORE: ${score}`, 38, 68);
        g.fillText(`BEST:  ${highScore}`, 38, 80);
      }
    },

    saveState: () => ({ highScore, lastScore: score, bestWave: wave })
  });
})();
