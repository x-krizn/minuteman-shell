import React, { useState } from 'react';
import { Cartridge } from '../types';
import { cartridgeRegistry } from '../cartridges/registry';
import { soundEngine } from '../audio/soundEngine';

interface CartridgeWorkshopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCartridge: (cart: Cartridge) => void;
}

const STARTER_CODE = `// MINUTEMAN CUSTOM CARTRIDGE
(() => {
  let x = 80;
  let y = 72;
  let score = 0;
  let targetX = 40;
  let targetY = 40;

  Minuteman.register({
    id: 'coin_catcher',
    name: 'COIN CATCHER',
    version: '1.0',
    description: 'Catch coins before time runs out!',

    init: (surface) => {
      x = surface.width / 2;
      y = surface.height / 2;
      score = 0;
      targetX = 20 + Math.random() * 120;
      targetY = 20 + Math.random() * 100;
    },

    update: (input, dt) => {
      const speed = 70;
      if (input.held.left)  x -= speed * dt;
      if (input.held.right) x += speed * dt;
      if (input.held.up)    y -= speed * dt;
      if (input.held.down)  y += speed * dt;

      // Keep inside screen
      x = Math.max(6, Math.min(154, x));
      y = Math.max(16, Math.min(138, y));

      // Check coin collision
      if (Math.hypot(x - targetX, y - targetY) < 10) {
        score += 10;
        targetX = 15 + Math.random() * 130;
        targetY = 20 + Math.random() * 105;
        if (surface.audio) surface.audio.coin();
      }
    },

    draw: (surface) => {
      const g = surface.g;
      const w = surface.width;
      const h = surface.height;

      // Clear screen
      g.fillStyle = '#0f2b18';
      g.fillRect(0, 0, w, h);

      // Top HUD
      g.fillStyle = '#0f3';
      g.font = '8px orion-font, monospace';
      g.fillText('SCORE: ' + score, 4, 10);

      // Coin
      g.fillStyle = '#ff0';
      g.fillRect(Math.floor(targetX - 3), Math.floor(targetY - 3), 6, 6);

      // Player
      g.fillStyle = '#0f3';
      g.fillRect(Math.floor(x - 4), Math.floor(y - 4), 8, 8);
      g.fillStyle = '#000';
      g.fillRect(Math.floor(x - 2), Math.floor(y - 2), 4, 4);
    }
  });
})();
`;

export const CartridgeWorkshopModal: React.FC<CartridgeWorkshopModalProps> = ({
  isOpen,
  onClose,
  onRunCartridge
}) => {
  const [code, setCode] = useState(STARTER_CODE);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestAndInstall = () => {
    setError(null);
    setSuccessMsg(null);
    try {
      let registeredCart: Cartridge | null = null;
      const mockMinuteman = {
        register: (c: Cartridge) => {
          registeredCart = c;
        }
      };

      const runner = new Function('Minuteman', code);
      runner(mockMinuteman);

      if (!registeredCart) {
        throw new Error('Code must call Minuteman.register({ id, name, update, draw })');
      }

      const cartToInstall: Cartridge = registeredCart;
      const ok = cartridgeRegistry.addCustomCartridge(cartToInstall, code);
      if (!ok) {
        throw new Error('Registry rejected cartridge. Check ID and name.');
      }

      soundEngine.powerup();
      setSuccessMsg(`Installed "${cartToInstall.name}"! Starting...`);
      setTimeout(() => {
        onRunCartridge(cartToInstall);
        onClose();
      }, 700);
    } catch (err: unknown) {
      soundEngine.menuBack();
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCode(content);
        setSuccessMsg(`Loaded ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom_game.cart.js';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1c221e] border-2 border-[#00ff33]/50 rounded-xl max-w-3xl w-full flex flex-col max-h-[90vh] shadow-2xl text-emerald-100 overflow-hidden font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#00ff33]/30 bg-[#141815]">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00ff33] animate-pulse" />
            <h2 className="text-sm sm:text-base font-bold text-[#00ff33] tracking-wider uppercase">
              Minuteman Cartridge Workshop
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-400 hover:text-white px-2 py-1 text-sm rounded hover:bg-white/10 transition-colors"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-300/80">
            <span>Edit or paste JavaScript that conforms to the Minuteman cartridge contract:</span>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-2.5 py-1 rounded bg-emerald-950 border border-emerald-700/60 hover:bg-emerald-900 text-emerald-300 transition-colors">
                Load .js/.cart
                <input
                  type="file"
                  accept=".js,.cart"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              <button
                onClick={handleDownload}
                className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-700/60 hover:bg-emerald-900 text-emerald-300 transition-colors"
              >
                Export .cart.js
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 min-h-[220px] rounded border border-[#00ff33]/30 bg-[#0d120f] overflow-hidden flex flex-col">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="w-full h-full p-3 bg-transparent text-[#00ff33] text-xs font-mono leading-relaxed outline-none resize-none selection:bg-[#00ff33]/30"
              style={{ tabSize: 2 }}
            />
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-2.5 rounded bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <span className="font-bold">ERROR:</span> {error}
            </div>
          )}
          {successMsg && (
            <div className="p-2.5 rounded bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <span className="font-bold">SUCCESS:</span> {successMsg}
            </div>
          )}

          {/* API Cheat Sheet */}
          <div className="p-2.5 rounded bg-[#131a15] border border-emerald-900/60 text-[11px] text-emerald-400/80 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <span className="font-bold text-white">Input:</span> input.held[key], input.pressed[key] (up, down, left, right, a, b, x, y, start, select)
            </div>
            <div>
              <span className="font-bold text-white">Surface:</span> surface.g (Canvas2D), surface.width (160), surface.height (144)
            </div>
            <div>
              <span className="font-bold text-white">Audio:</span> surface.audio.beep(), .laser(), .jump(), .hit(), .coin(), .powerup()
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#00ff33]/30 bg-[#141815]">
          <span className="text-[11px] text-emerald-500/70">
            Emergency exit in-game: START + SELECT
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCode(STARTER_CODE)}
              className="px-3 py-1.5 text-xs rounded border border-emerald-800 text-emerald-400 hover:bg-emerald-900/40 transition-colors"
            >
              Reset Starter
            </button>
            <button
              onClick={handleTestAndInstall}
              className="px-4 py-1.5 text-xs font-bold rounded bg-[#00ff33] text-black hover:bg-[#33ff66] transition-colors shadow-lg shadow-[#00ff33]/20"
            >
              COMPILE & INSERT CARTRIDGE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
