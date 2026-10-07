import React, { useRef, useEffect, useCallback } from 'react';
import { ConsolePalette, GamepadButtonKey, GamepadState } from '../types';

interface VirtualGamepadProps {
  palette: ConsolePalette;
  held: GamepadState;
  onButtonChange: (key: GamepadButtonKey, isDown: boolean) => void;
  onStickChange?: (stick: { x: number; y: number }) => void;
  showKeyHints?: boolean;
  hapticsEnabled?: boolean;
}

export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({
  palette,
  held,
  onButtonChange,
  onStickChange,
  showKeyHints = false,
  hapticsEnabled = true
}) => {
  const dpadRef = useRef<HTMLDivElement>(null);
  const isPointerDownOnDpad = useRef(false);

  const triggerHaptic = useCallback(() => {
    if (hapticsEnabled && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignored
      }
    }
  }, [hapticsEnabled]);

  // Touch and pointer sliding hit-test for D-Pad with analog stick support
  const processDpadPoint = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const dpadKeys: GamepadButtonKey[] = ['up', 'down', 'left', 'right'];
    const active = new Set<GamepadButtonKey>();

    const dpadEl = dpadRef.current;
    if (dpadEl) {
      const r = dpadEl.getBoundingClientRect();
      const radius = r.width * 0.41;
      const dx = clientX - (r.left + r.width / 2);
      const dy = clientY - (r.top + r.height / 2);
      const nx = dx / radius;
      const ny = dy / radius;
      const len = Math.hypot(nx, ny);
      if (len > 0.2) {
        const out = Math.min(1, (len - 0.2) / 0.8);
        const sx = (nx / len) * out;
        const sy = (ny / len) * out;
        onStickChange?.({ x: sx, y: sy });
        if (sx < -0.4) active.add('left');
        if (sx > 0.4) active.add('right');
        if (sy < -0.4) active.add('up');
        if (sy > 0.4) active.add('down');
      } else {
        onStickChange?.({ x: 0, y: 0 });
      }
    }

    if (el && el.classList.contains('dpad-btn')) {
      const key = el.getAttribute('data-key') as GamepadButtonKey | null;
      if (key && dpadKeys.includes(key)) {
        active.add(key);
      }
    }

    dpadKeys.forEach(k => {
      const isDown = active.has(k);
      if (held[k] !== isDown) {
        onButtonChange(k, isDown);
        if (isDown) triggerHaptic();
      }
    });
  }, [held, onButtonChange, onStickChange, triggerHaptic]);

  const clearDpad = useCallback(() => {
    onStickChange?.({ x: 0, y: 0 });
    ['up', 'down', 'left', 'right'].forEach(k => {
      const key = k as GamepadButtonKey;
      if (held[key]) {
        onButtonChange(key, false);
      }
    });
  }, [held, onButtonChange, onStickChange]);

  useEffect(() => {
    const dpadEl = dpadRef.current;
    if (!dpadEl) return;

    // Touch events for mobile sliding
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      const active = new Set<GamepadButtonKey>();
      const dpadKeys: GamepadButtonKey[] = ['up', 'down', 'left', 'right'];

      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (el && el.classList.contains('dpad-btn')) {
          const key = el.getAttribute('data-key') as GamepadButtonKey | null;
          if (key && dpadKeys.includes(key)) {
            active.add(key);
          }
        }
      }

      dpadKeys.forEach(k => {
        const isDown = active.has(k);
        if (held[k] !== isDown) {
          onButtonChange(k, isDown);
          if (isDown) triggerHaptic();
        }
      });
    };

    // Mouse pointer events for desktop drag support on D-pad
    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        isPointerDownOnDpad.current = true;
        dpadEl.setPointerCapture(e.pointerId);
        processDpadPoint(e.clientX, e.clientY);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && isPointerDownOnDpad.current) {
        processDpadPoint(e.clientX, e.clientY);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        isPointerDownOnDpad.current = false;
        clearDpad();
      }
    };

    dpadEl.addEventListener('touchstart', handleTouch, { passive: false });
    dpadEl.addEventListener('touchmove', handleTouch, { passive: false });
    dpadEl.addEventListener('touchend', handleTouch, { passive: false });
    dpadEl.addEventListener('touchcancel', handleTouch, { passive: false });

    dpadEl.addEventListener('pointerdown', handlePointerDown);
    dpadEl.addEventListener('pointermove', handlePointerMove);
    dpadEl.addEventListener('pointerup', handlePointerUp);
    dpadEl.addEventListener('pointercancel', handlePointerUp);

    return () => {
      dpadEl.removeEventListener('touchstart', handleTouch);
      dpadEl.removeEventListener('touchmove', handleTouch);
      dpadEl.removeEventListener('touchend', handleTouch);
      dpadEl.removeEventListener('touchcancel', handleTouch);

      dpadEl.removeEventListener('pointerdown', handlePointerDown);
      dpadEl.removeEventListener('pointermove', handlePointerMove);
      dpadEl.removeEventListener('pointerup', handlePointerUp);
      dpadEl.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [held, onButtonChange, triggerHaptic, processDpadPoint, clearDpad]);

  // Discrete button pointer handler with PointerCapture
  const bindDiscreteButton = (key: GamepadButtonKey) => ({
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}
      if (!held[key]) {
        onButtonChange(key, true);
        triggerHaptic();
      }
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      onButtonChange(key, false);
    },
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      onButtonChange(key, false);
    }
  });

  return (
    <div
      id="virtual-gamepad"
      className="w-full relative grid grid-cols-2 select-none"
      style={{
        backgroundColor: palette.bodyBg,
        borderTop: `4px solid ${palette.accent}`,
        height: '300px',
        padding: '10px 14px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
        gridTemplateRows: '1fr auto'
      }}
    >
      {/* 3.3.1 D-PAD ASSEMBLY */}
      <div className="flex items-center justify-center">
        <div
          ref={dpadRef}
          id="dpad-container"
          className="relative w-[150px] h-[150px] touch-none"
        >
          {/* UP */}
          <div
            className={`dpad-btn absolute top-0 left-[50px] w-[50px] h-[50px] rounded-t flex flex-col items-center justify-start pt-1 cursor-pointer transition-colors ${
              held.up ? 'active' : ''
            }`}
            data-key="up"
            style={{
              backgroundColor: held.up ? palette.activeDpad : palette.dpadBg,
              border: '2px solid #101010'
            }}
          >
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-white/40 pointer-events-none mt-1" />
            {showKeyHints && (
              <span className="text-[8px] text-white/70 font-mono mt-1 pointer-events-none">W</span>
            )}
          </div>

          {/* DOWN */}
          <div
            className={`dpad-btn absolute bottom-0 left-[50px] w-[50px] h-[50px] rounded-b flex flex-col items-center justify-end pb-1 cursor-pointer transition-colors ${
              held.down ? 'active' : ''
            }`}
            data-key="down"
            style={{
              backgroundColor: held.down ? palette.activeDpad : palette.dpadBg,
              border: '2px solid #101010'
            }}
          >
            {showKeyHints && (
              <span className="text-[8px] text-white/70 font-mono mb-1 pointer-events-none">S</span>
            )}
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white/40 pointer-events-none mb-1" />
          </div>

          {/* LEFT */}
          <div
            className={`dpad-btn absolute top-[50px] left-0 w-[50px] h-[50px] rounded-l flex items-center justify-start pl-1 cursor-pointer transition-colors ${
              held.left ? 'active' : ''
            }`}
            data-key="left"
            style={{
              backgroundColor: held.left ? palette.activeDpad : palette.dpadBg,
              border: '2px solid #101010'
            }}
          >
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[6px] border-r-white/40 pointer-events-none ml-1" />
            {showKeyHints && (
              <span className="text-[8px] text-white/70 font-mono ml-1.5 pointer-events-none">A</span>
            )}
          </div>

          {/* RIGHT */}
          <div
            className={`dpad-btn absolute top-[50px] right-0 w-[50px] h-[50px] rounded-r flex items-center justify-end pr-1 cursor-pointer transition-colors ${
              held.right ? 'active' : ''
            }`}
            data-key="right"
            style={{
              backgroundColor: held.right ? palette.activeDpad : palette.dpadBg,
              border: '2px solid #101010'
            }}
          >
            {showKeyHints && (
              <span className="text-[8px] text-white/70 font-mono mr-1.5 pointer-events-none">D</span>
            )}
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px] border-l-white/40 pointer-events-none mr-1" />
          </div>

          {/* Decorative Center with directional indentation */}
          <div
            id="dpad-center"
            className="absolute top-[50px] left-[50px] w-[50px] h-[50px] flex items-center justify-center pointer-events-none"
            style={{ backgroundColor: palette.dpadBg }}
          >
            <div className="w-5 h-5 rounded-full border border-black/30 bg-black/10" />
          </div>
        </div>
      </div>

      {/* 3.3.2 ACTION BUTTON ASSEMBLY (L R Y X B A) */}
      <div className="flex items-center justify-center">
        <div id="action-container" className="relative w-[156px] h-[156px]">
          {/* L (top-left shoulder) */}
          <div
            id="btn-l"
            data-key="l"
            className={`action-btn btn-tactile absolute top-[4px] left-[10px] w-[36px] h-[36px] rounded-full flex flex-col items-center justify-center text-white font-bold cursor-pointer select-none text-xs border-2 ${
              held.l ? 'active' : ''
            }`}
            style={{
              backgroundColor: held.l ? '#5a5a5a' : '#7d7d7d',
              borderColor: '#434343',
              boxShadow: held.l ? '0 1px 0 #434343' : '0 3px 0 #434343',
              transform: held.l ? 'translateY(2px)' : 'none'
            }}
            {...bindDiscreteButton('l')}
          >
            <span>L</span>
            {showKeyHints && (
              <span className="text-[6px] text-white/70 font-mono -mt-0.5 pointer-events-none">Q</span>
            )}
          </div>

          {/* R (top-right shoulder) */}
          <div
            id="btn-r"
            data-key="r"
            className={`action-btn btn-tactile absolute top-[4px] right-[10px] w-[36px] h-[36px] rounded-full flex flex-col items-center justify-center text-white font-bold cursor-pointer select-none text-xs border-2 ${
              held.r ? 'active' : ''
            }`}
            style={{
              backgroundColor: held.r ? '#5a5a5a' : '#7d7d7d',
              borderColor: '#434343',
              boxShadow: held.r ? '0 1px 0 #434343' : '0 3px 0 #434343',
              transform: held.r ? 'translateY(2px)' : 'none'
            }}
            {...bindDiscreteButton('r')}
          >
            <span>R</span>
            {showKeyHints && (
              <span className="text-[6px] text-white/70 font-mono -mt-0.5 pointer-events-none">E</span>
            )}
          </div>

          {/* Y (upper-middle) */}
          <div
            id="btn-y"
            data-key="y"
            className={`action-btn btn-tactile absolute top-[36px] left-[59px] w-[38px] h-[38px] rounded-full flex flex-col items-center justify-center text-black font-bold cursor-pointer select-none text-sm border-2 ${
              held.y ? 'active' : ''
            }`}
            style={{
              backgroundColor: held.y ? '#ffff96' : '#c8c864',
              borderColor: '#6b6b36',
              boxShadow: held.y ? '0 1px 0 #6b6b36' : '0 3px 0 #6b6b36',
              transform: held.y ? 'translateY(2px)' : 'none'
            }}
            {...bindDiscreteButton('y')}
          >
            <span>Y</span>
            {showKeyHints && (
              <span className="text-[6px] text-black/70 font-mono -mt-0.5 pointer-events-none">I/V</span>
            )}
          </div>

          {/* X (middle-left) */}
          <div
            id="btn-x"
            data-key="x"
            className={`action-btn btn-tactile absolute top-[68px] left-[14px] w-[38px] h-[38px] rounded-full flex flex-col items-center justify-center text-white font-bold cursor-pointer select-none text-sm border-2 ${
              held.x ? 'active' : ''
            }`}
            style={{
              backgroundColor: held.x ? '#9696ff' : '#6464c8',
              borderColor: '#36366b',
              boxShadow: held.x ? '0 1px 0 #36366b' : '0 3px 0 #36366b',
              transform: held.x ? 'translateY(2px)' : 'none'
            }}
            {...bindDiscreteButton('x')}
          >
            <span>X</span>
            {showKeyHints && (
              <span className="text-[6px] text-white/70 font-mono -mt-0.5 pointer-events-none">U/C</span>
            )}
          </div>

          {/* B (middle-right) */}
          <div
            id="btn-b"
            data-key="b"
            className={`action-btn btn-tactile absolute top-[68px] right-[14px] w-[38px] h-[38px] rounded-full flex flex-col items-center justify-center text-white font-bold cursor-pointer select-none text-sm border-2 ${
              held.b ? 'active' : ''
            }`}
            style={{
              backgroundColor: held.b ? '#ff0000' : '#bc0000',
              borderColor: '#650000',
              boxShadow: held.b ? '0 1px 0 #650000' : '0 3px 0 #650000',
              transform: held.b ? 'translateY(2px)' : 'none'
            }}
            {...bindDiscreteButton('b')}
          >
            <span>B</span>
            {showKeyHints && (
              <span className="text-[6px] text-white/70 font-mono -mt-0.5 pointer-events-none">J/X</span>
            )}
          </div>

          {/* A (bottom-center) */}
          <div
            id="btn-a"
            data-key="a"
            className={`action-btn btn-tactile absolute bottom-[6px] left-[59px] w-[38px] h-[38px] rounded-full flex flex-col items-center justify-center text-white font-bold cursor-pointer select-none text-sm border-2 ${
              held.a ? 'active' : ''
            }`}
            style={{
              backgroundColor: held.a ? '#7bab7b' : '#527252',
              borderColor: '#2c3d2c',
              boxShadow: held.a ? '0 1px 0 #2c3d2c' : '0 3px 0 #2c3d2c',
              transform: held.a ? 'translateY(2px)' : 'none'
            }}
            {...bindDiscreteButton('a')}
          >
            <span>A</span>
            {showKeyHints && (
              <span className="text-[6px] text-white/70 font-mono -mt-0.5 pointer-events-none">K/Z</span>
            )}
          </div>
        </div>
      </div>

      {/* 3.3.3 SYSTEM BUTTON ASSEMBLY (SHIFT / START) */}
      <div
        id="system-container"
        className="col-span-2 flex justify-center items-center gap-9 pt-2 pb-3"
      >
        {/* START */}
        <div className="pill-btn-wrapper flex flex-col items-center">
          <div
            id="btn-start"
            data-key="start"
            className={`pill-btn btn-tactile w-[60px] h-[16px] rounded-full border-2 border-black/40 cursor-pointer ${
              held.start ? 'active' : ''
            }`}
            style={{
              backgroundColor: held.start ? '#757575' : '#4b4b4b',
              transform: 'rotate(-25deg)',
              boxShadow: held.start ? 'none' : '0 1px 2px rgba(0,0,0,0.3)'
            }}
            {...bindDiscreteButton('start')}
          />
          <span className="pill-label text-[10px] font-bold text-black/70 tracking-wider mt-2.5">
            START {showKeyHints && <span className="text-[8px] opacity-70">[Enter]</span>}
          </span>
        </div>

        {/* SHIFT (SELECT) */}
        <div className="pill-btn-wrapper flex flex-col items-center">
          <div
            id="btn-select"
            data-key="select"
            className={`pill-btn btn-tactile w-[60px] h-[16px] rounded-full border-2 border-black/40 cursor-pointer ${
              held.select ? 'active' : ''
            }`}
            style={{
              backgroundColor: held.select ? '#757575' : '#4b4b4b',
              transform: 'rotate(-25deg)',
              boxShadow: held.select ? 'none' : '0 1px 2px rgba(0,0,0,0.3)'
            }}
            {...bindDiscreteButton('select')}
          />
          <span className="pill-label text-[10px] font-bold text-black/70 tracking-wider mt-2.5">
            SHIFT {showKeyHints && <span className="text-[8px] opacity-70">[Tab]</span>}
          </span>
        </div>
      </div>
    </div>
  );
};
