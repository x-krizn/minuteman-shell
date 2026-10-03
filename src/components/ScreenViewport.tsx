import React, { useRef, useEffect, useCallback } from 'react';
import { ConsolePalette } from '../types';

interface ScreenViewportProps {
  palette: ConsolePalette;
  isCartridgeRunning: boolean;
  scanlines: boolean;
  shellTitle?: string;
  shellLines?: string[];
  shellSelectedIndex?: number;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

export const ScreenViewport: React.FC<ScreenViewportProps> = ({
  palette,
  isCartridgeRunning,
  scanlines,
  shellTitle,
  shellLines,
  shellSelectedIndex = -1,
  showSearch = false,
  searchQuery = '',
  onSearchChange,
  onCanvasReady
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fitCanvas = useCallback(() => {
    const vp = viewportRef.current;
    const canvas = canvasRef.current;
    if (!vp || !canvas) return;

    const w = vp.clientWidth;
    const h = vp.clientHeight;
    if (!w || !h) return;

    // Integer scaling for sharp pixel art
    let scale = Math.min(w / 160, h / 144);
    if (scale >= 1) scale = Math.floor(scale);

    canvas.style.width = `${Math.floor(160 * scale)}px`;
    canvas.style.height = `${Math.floor(144 * scale)}px`;
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady]);

  useEffect(() => {
    fitCanvas();
    window.addEventListener('resize', fitCanvas);
    return () => window.removeEventListener('resize', fitCanvas);
  }, [fitCanvas, isCartridgeRunning]);

  return (
    <div
      ref={viewportRef}
      id="screen-viewport"
      className="flex-1 m-3 sm:m-4 rounded-lg relative flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: palette.screenBg,
        border: `4px solid ${palette.screenBorder}`,
        minWidth: 0,
        minHeight: 0
      }}
    >
      {/* 2D Canvas for running cartridges */}
      <canvas
        ref={canvasRef}
        id="screen-canvas"
        width={160}
        height={144}
        className={`pixel-canvas ${isCartridgeRunning ? 'block' : 'hidden'}`}
        style={{
          backgroundColor: palette.screenBg
        }}
      />

      {/* Text layer for Shell Menus / Splash / HowTo / Debug / Settings */}
      {!isCartridgeRunning && (
        <div
          id="screen-text"
          className="text-center p-2 max-w-full max-h-full overflow-hidden select-none font-normal"
          style={{
            color: palette.screenText,
            letterSpacing: '2px'
          }}
        >
          {shellTitle && (
            <div className="ui-title mb-2 text-xs font-bold tracking-wider opacity-90 border-b border-current/30 pb-1">
              {shellTitle}
            </div>
          )}

          {showSearch && (
            <div className="mb-2 px-2 flex items-center gap-1.5 w-full max-w-[190px] mx-auto">
              <div
                className="flex-1 flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px]"
                style={{
                  borderColor: `${palette.screenText}50`,
                  backgroundColor: `${palette.screenText}15`
                }}
              >
                <span className="opacity-75 text-[9px]">🔍</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => onSearchChange?.(e.target.value)}
                  placeholder="FILTER CARTS..."
                  className="w-full bg-transparent outline-none text-[9px] font-mono uppercase tracking-wider placeholder:opacity-50"
                  style={{ color: palette.screenText }}
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange?.('')}
                    className="opacity-70 hover:opacity-100 text-[9px] px-1 font-bold"
                    style={{ color: palette.screenText }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}
          {shellLines && (
            <div className="flex flex-col gap-1 text-[11px] leading-relaxed">
              {shellLines.map((line, idx) => {
                const isSelected = idx === shellSelectedIndex;
                return (
                  <div
                    key={idx}
                    className={`ui-line px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                      isSelected ? 'font-bold' : 'opacity-85'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: palette.screenText,
                            color: palette.screenBg
                          }
                        : undefined
                    }
                  >
                    {line === '' ? '\u00A0' : line}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CRT Scanline Overlay */}
      {scanlines && (
        <div className="crt-scanlines absolute inset-0 rounded pointer-events-none" />
      )}
    </div>
  );
};
