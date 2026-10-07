import { Cartridge, CartridgeSurface, InputSnapshot } from '../types';

export const KNIGHT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAASCAYAAAAQeC39AAABhElEQVRIDa2WMZLCMAxFyQ7HgXq5AUPDHei4ABXNNltxATruQLOzN9hbZSOPpZEVybY8ygxj2ZGe9WUlZNrUr1ncnsTcM41idXFqic5/v19F4odjmtdiCn82iWJ1c6wkC0AWtAGhA+KiWCEcOG76LYKSjSM7iR6TOMBEBo49gOxDHIjFeBwlZysXcH67v9BcTumSTosWnEYAa9YYiygzE60VCwhGPr4vaGoxeE+OEawWA/Zc5WSemMwwz1cAw69nOYJlMj56MmA+0OdRVwTLZFiKVwGn8zUJ+nk/YbTiNNERLDfDbEUUomXqXYtgeRlW5VcVYmKsGOZSmBEsN6P7xAZakNTJag+woJizwaF9uGEK2+0/yY+96mnNY0SxOAf2zwVSU2m+FUGUrJRK6liMZLW2awpDQBZX63V05SP9uXJRA6zUhp7OaQqDT5nakXMVNTuCAwXh4vJnllps8xmTSQ488BKR5qxInrfrtMSRABCXRal7wGINTqCGnwnPN6I4fJ8m8x+NOLZlMyexbAAAAABJRU5ErkJggg==';

export function createWalkCartridge(): Cartridge {
  const SPEED = 40; // pixels per second at full tilt
  const FACES_RIGHT = true;
  let x = 0;
  let y = 0;
  let t = 0; // walk-cycle clock, runs only while moving
  let flip = false;

  return {
    id: 'walk',
    name: 'WALK TEST',
    version: '0.1',
    author: 'Minuteman Shell',
    description: 'Proves the asset loader. Knight walks wherever the stick points, playing a 3-frame walk cycle.',

    assets: {
      knight: {
        src: KNIGHT_PNG,
        cw: 18,
        ch: 18,
        frames: 3,
        fps: 6,
        ax: 9,
        ay: 18 // feet, bottom center of the cell
      }
    },

    init: (surface: CartridgeSurface) => {
      x = surface.width / 2;
      y = surface.height / 2 + 9;
      t = 0;
      flip = false;
    },

    update: (input: InputSnapshot, dt: number) => {
      const sx = input.stick.x;
      const sy = input.stick.y;
      x += sx * SPEED * dt;
      y += sy * SPEED * dt;
      if (sx !== 0 || sy !== 0) t += dt;
      else t = 0;
      if (sx < -0.1) flip = FACES_RIGHT;
      else if (sx > 0.1) flip = !FACES_RIGHT;
    },

    draw: (surface: CartridgeSurface) => {
      const g = surface.g;
      const knight = surface.assets.knight;
      x = Math.max(9, Math.min(surface.width - 9, x));
      y = Math.max(18, Math.min(surface.height, y));
      g.fillStyle = '#0f300f';
      g.fillRect(0, 0, surface.width, surface.height);

      g.font = '8px orion-font, monospace';
      g.fillStyle = '#4ade80';
      g.fillText('WALK TEST (DEMO)', 8, 12);
      g.fillStyle = '#22c55e';
      g.fillText('STICK / D-PAD TO MOVE', 8, 22);

      if (knight) {
        knight.draw(g, knight.frameAt(t), x, y, flip);
      }
    }
  };
}
