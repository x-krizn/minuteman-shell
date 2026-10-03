import React from 'react';

interface KeyboardGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardGuideModal: React.FC<KeyboardGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const keymaps = [
    { button: 'D-PAD UP', keys: 'W  or  ↑ Arrow' },
    { button: 'D-PAD DOWN', keys: 'S  or  ↓ Arrow' },
    { button: 'D-PAD LEFT', keys: 'A  or  ← Arrow' },
    { button: 'D-PAD RIGHT', keys: 'D  or  → Arrow' },
    { button: 'A BUTTON', keys: 'K  or  Z  or  Space' },
    { button: 'B BUTTON', keys: 'J  or  X' },
    { button: 'X BUTTON', keys: 'U  or  C' },
    { button: 'Y BUTTON', keys: 'I  or  V' },
    { button: 'START', keys: 'Enter' },
    { button: 'SELECT', keys: 'Shift  or  Tab' },
    { button: 'DEV TOOLKIT', keys: '` (Backtick)  or  F2' },
    { button: 'LEAVE GAME', keys: 'START + SELECT together' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#181d1a] border-2 border-[#00ff33]/40 rounded-xl max-w-md w-full p-5 shadow-2xl text-emerald-100 font-mono">
        <div className="flex items-center justify-between border-b border-emerald-900 pb-3 mb-4">
          <h3 className="text-sm font-bold text-[#00ff33] tracking-wider uppercase">
            Desktop Keyboard Controls
          </h3>
          <button
            onClick={onClose}
            className="text-emerald-400 hover:text-white px-2 py-1 text-sm rounded hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {keymaps.map((km, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 px-2.5 rounded bg-emerald-950/40 border border-emerald-900/40"
            >
              <span className="font-bold text-emerald-300">{km.button}</span>
              <span className="text-white bg-black/50 px-2 py-0.5 rounded border border-emerald-800/50">
                {km.keys}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-emerald-400/70 text-center">
          On-screen buttons also respond to mouse clicks, mouse dragging, and mobile touch sliding!
        </p>

        <div className="mt-4 pt-3 border-t border-emerald-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded bg-[#00ff33] text-black hover:bg-[#33ff66] transition-colors"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
};
