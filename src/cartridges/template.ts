import { Cartridge, CartridgeSurface, InputSnapshot } from '../types';

export function createTemplateCartridge(): Cartridge {
  let x = 0;
  let y = 0;
  let big = false;
  let cartSurface: CartridgeSurface | null = null;
  const SPEED = 60; // pixels per second

  return {
    id: 'template',
    name: 'TEMPLATE',
    version: '0.1',
    author: 'Minuteman Shell',
    description: 'Original template cart: D-pad moves square, A toggles size.',

    init: (surface: CartridgeSurface) => {
      cartSurface = surface;
      x = surface.width / 2;
      y = surface.height / 2;
      big = false;
    },

    update: (input: InputSnapshot, dt: number) => {
      let sx = input.stick?.x || 0;
      let sy = input.stick?.y || 0;
      if (sx === 0 && sy === 0) {
        if (input.held.left) sx = -1;
        if (input.held.right) sx = 1;
        if (input.held.up) sy = -1;
        if (input.held.down) sy = 1;
      }
      x += sx * SPEED * dt;
      y += sy * SPEED * dt;
      if (input.pressed.a) {
        big = !big;
        if (cartSurface) cartSurface.audio.beep(big ? 660 : 440);
      }
    },

    draw: (surface: CartridgeSurface) => {
      const g = surface.g;
      const size = big ? 24 : 12;
      const half = size / 2;
      x = Math.max(half, Math.min(surface.width - half, x));
      y = Math.max(half, Math.min(surface.height - half, y));

      g.fillStyle = '#0f300f'; // clear: the shell does not
      g.fillRect(0, 0, surface.width, surface.height);
      g.fillStyle = '#0f3';
      g.fillRect(Math.round(x - half), Math.round(y - half), size, size);

      // Simple HUD instructions
      g.fillStyle = '#0f3a';
      g.fillRect(2, 2, surface.width - 4, 10);
      g.fillStyle = '#0f300f';
      g.font = '8px orion-font, monospace';
      g.fillText('D-PAD: MOVE  A: SIZE', 6, 9);
    }
  };
}
