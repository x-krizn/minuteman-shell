/**
 * WALK TEST - Minuteman Cartridge
 */
(function() {
  var KNIGHT_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAASCAYAAAAQeC39AAABhElEQVRIDa2WMZLCMAxFyQ7HgXq5AUPDHei4ABXNNltxATruQLOzN9hbZSOPpZEVybY8ygxj2ZGe9WUlZNrUr1ncnsTcM41idXFqic5/v19F4odjmtdiCn82iWJ1c6wkC0AWtAGhA+KiWCEcOG76LYKSjSM7iR6TOMBEBo49gOxDHIjFeBwlZysXcH67v9BcTumSTosWnEYAa9YYiygzE60VCwhGPr4vaGoxeE+OEawWA/Zc5WSemMwwz1cAw69nOYJlMj56MmA+0OdRVwTLZFiKVwGn8zUJ+nk/YbTiNNERLDfDbEUUomXqXYtgeRlW5VcVYmKsGOZSmBEsN6P7xAZakNTJag+woJizwaF9uGEK2+0/yY+96mnNY0SxOAf2zwVSU2m+FUGUrJRK6liMZLW2awpDQBZX63V05SP9uXJRA6zUhp7OaQqDT5nakXMVNTuCAwXh4vJnllps8xmTSQ488BKR5qxInrfrtMSRABCXRal7wGINTqCGnwnPN6I4fJ8m8x+NOLZlMyexbAAAAABJRU5ErkJggg==';

  var SPEED = 40;
  var FACES_RIGHT = true;
  var x = 0;
  var y = 0;
  var t = 0;
  var flip = false;

  Minuteman.register({
    id: 'walk',
    name: 'WALK TEST',
    version: '0.1',
    author: 'Minuteman Shell',
    description: 'Proves the asset loader. Knight walks wherever the stick points, playing a 3-frame walk cycle.',

    assets: {
      knight: {
        src: KNIGHT_PNG,
        cw: 18, ch: 18, frames: 3, fps: 6,
        ax: 9, ay: 18
      }
    },

    init: function(surface) {
      x = surface.width / 2;
      y = surface.height / 2 + 9;
      t = 0;
      flip = false;
    },

    update: function(input, dt) {
      var sx = input.stick ? input.stick.x : 0;
      var sy = input.stick ? input.stick.y : 0;
      if (sx === 0 && sy === 0) {
        if (input.held.left) sx = -1;
        else if (input.held.right) sx = 1;
        if (input.held.up) sy = -1;
        else if (input.held.down) sy = 1;
      }
      x += sx * SPEED * dt;
      y += sy * SPEED * dt;
      if (sx !== 0 || sy !== 0) t += dt; else t = 0;
      if (sx < -0.1) flip = FACES_RIGHT;
      else if (sx > 0.1) flip = !FACES_RIGHT;
    },

    draw: function(surface) {
      var g = surface.g;
      var knight = surface.assets ? surface.assets.knight : null;
      x = Math.max(9, Math.min(surface.width - 9, x));
      y = Math.max(18, Math.min(surface.height, y));
      g.fillStyle = '#0f300f';
      g.fillRect(0, 0, surface.width, surface.height);

      g.font = '8px monospace';
      g.fillStyle = '#4ade80';
      g.fillText('WALK TEST (DEMO)', 8, 12);
      g.fillStyle = '#22c55e';
      g.fillText('STICK / D-PAD TO MOVE', 8, 22);

      if (knight) {
        knight.draw(g, knight.frameAt(t), x, y, flip);
      }
    }
  });
})();
