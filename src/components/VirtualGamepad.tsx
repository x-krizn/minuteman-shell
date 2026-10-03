import React, { useRef, useEffect, useCallback } from 'react';
import { ConsolePalette, GamepadButtonKey, GamepadState } from '../types';

interface VirtualGamepadProps {
  palette: ConsolePalette;
  held: GamepadState;
  onButtonChange: (key: GamepadButtonKey, isDown: boolean) => void;
  showKeyHints?: boolean;
  hapticsEnabled?: boolean;
}

export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({
  palette,
  held,
  onButtonChange,
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

  // Touch and pointer sliding hit-test for D-Pad
  const processDpadPoint = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const dpadKeys: GamepadButtonKey[] = ['up', 'down', 'left', 'right'];
    const active = new Set<GamepadButtonKey>();

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
  }, [held, onButtonChange, triggerHaptic]);

  const clearDpad = useCallback(() => {
    ['up', 'down', 'left', 'right'].forEach(k => {
      const key = k as GamepadButtonKey;
      if (held[key]) {
        onButtonChange(key, false);
      }
    });
  }, [held, onButtonChange]);

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

      {/* 3.3.2 ACTION BUTTON ASSEMBLY (ABXY) */}
      <div className="flex items-center justify-center">
        <div id="action-container" className="relative w-[150px] h-[150px]">
          {/* Y (top-left) */}
          <div
            id="btn-y"
            data-key="y"
            className={`action-btn btn-tactile absolute top-[10px] left-[10px] w-[48px] h-[48px] rounded-full flex flex-col items-center justify-center text-white font-bold cursor-pointer select-none text-base border-2 ${
              held.y ? 'active' : ''
            }`}
            style={{
              backgroundColor: held.y ? palette.actionBtnActive : palette.actionBtn,
              borderColor: palette.actionShadow,
              boxShadow: held.y
                ? `0 2px 0 ${palette.actionShadow}`
                : `0 4px 0 ${palette.actionShadow}`,
              transform: held.y ? 'translateY(2px)' : 'none'
            }}
            {...bindDiscreteButton('y')}
          >
            <span>Y</span>
            {showKeyHints && (
              <span className="text-[7px] text-white/70 font-mono -mt-1 pointer-events-none">I/V</span>
            )}
          </div>

          {/* X (top-right) */}
          <div
            id="btn-x"
            data-key="x"
            className={`action-btn btn-tactile absolute top-[10px] right-[10px] w-[48px] h-[48px] rounded-full flex flex-col items-center justify-center text-white font-bold cursor-pointer select-none text-base border-2 ${
              held.x ? 'active' : ''
            }`}
            style={{
              backgroundColor: held.x ? palette.actionBtnActive : palette.actionBtn,
              borderColor: palette.actionShadow,
              boxShadow: held.x
                ? `0 2px 0 ${palette.actionShadow}`
                : `0 4px 0 ${palette.actionShadow}`,
              transform: held.x ? 'translateY(2px)' : 'none'
            }}
            {...bindDiscreteButton('x')}
          >
            <span>X</span>
            {showKeyHints && (
              <span className="text-[7px] text-white/70 font-mono -mt-1 pointer-events-none">U/C</span>
            )}
          </div>

          {/* B (bottom-left) */}
          <div
            id="btn-b"
            data-key="b"
            className={`action-btn btn-tactile absolute bottom-[10px] left-[10px] w-[48px] h-[48px] rounded-full flex flex-col items-center justify-center text-white font-bold cursor-pointer select-none text-base border-2 ${
              held.b ? 'active' : ''
            }`}
            style={{
              backgroundColor: held.b ? palette.actionBtnActive : palette.actionBtn,
              borderColor: palette.actionShadow,
              boxShadow: held.b
                ? `0 2px 0 ${palette.actionShadow}`
                : `0 4px 0 ${palette.actionShadow}`,
              transform: held.b ? 'translateY(2px)' : 'none'
            }}
            {...bindDiscreteButton('b')}
          >
            <span>B</span>
            {showKeyHints && (
              <span className="text-[7px] text-white/70 font-mono -mt-1 pointer-events-none">J/X</span>
            )}
          </div>

          {/* A (bottom-right) */}
          <div
            id="btn-a"
            data-key="a"
            className={`action-btn btn-tactile absolute bottom-[10px] right-[10px] w-[48px] h-[48px] rounded-full flex flex-col items-center justify-center text-white font-bold cursor-pointer select-none text-base border-2 ${
              held.a ? 'active' : ''
            }`}
            style={{
              backgroundColor: held.a ? palette.actionBtnActive : palette.actionBtn,
              borderColor: palette.actionShadow,
              boxShadow: held.a
                ? `0 2px 0 ${palette.actionShadow}`
                : `0 4px 0 ${palette.actionShadow}`,
              transform: held.a ? 'translateY(2px)' : 'none'
            }}
            {...bindDiscreteButton('a')}
          >
            <span>A</span>
            {showKeyHints && (
              <span className="text-[7px] text-white/70 font-mono -mt-1 pointer-events-none">K/Z</span>
            )}
          </div>
        </div>
      </div>

      {/* 3.3.3 SYSTEM BUTTON ASSEMBLY (SELECT / START) */}
      <div
        id="system-container"
        className="col-span-2 flex justify-center items-center gap-9 pt-2 pb-3"
      >
        {/* SELECT */}
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
            SELECT {showKeyHints && <span className="text-[8px] opacity-70">[Shift]</span>}
          </span>
        </div>

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
      </div>
    </div>
  );
};
