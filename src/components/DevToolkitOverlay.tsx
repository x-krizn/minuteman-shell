import React, { useState, useEffect, useRef } from 'react';
import { GamepadState, Cartridge } from '../types';
import {
  Activity,
  Clock,
  Gamepad2,
  HardDrive,
  Pause,
  Play,
  SkipForward,
  X,
  Minimize2,
  Maximize2,
  Terminal,
  Volume2,
  VolumeX,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface DevToolkitStats {
  fps: number;
  frameTimeMs: number;
  frameHistory: number[]; // last 40 frames in ms
  frameCount: number;
  uptimeSeconds: number;
  isPaused: boolean;
  activeCartridge: Cartridge | null;
  heldState: GamepadState;
  lastButton?: string;
  memorySlotsCount: number;
  pendingSyncCount: number;
  snapshotsCount: number;
  canvasScale: number;
  isMuted: boolean;
  volume: number;
}

interface DevToolkitOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DevToolkitStats;
  onTogglePause: () => void;
  onStepFrame: () => void;
}

export const DevToolkitOverlay: React.FC<DevToolkitOverlayProps> = ({
  isOpen,
  onClose,
  stats,
  onTogglePause,
  onStepFrame
}) => {
  const [activeTab, setActiveTab] = useState<'perf' | 'input' | 'clock' | 'memory'>('perf');
  const [isMinimized, setIsMinimized] = useState(false);
  const [clockTime, setClockTime] = useState(new Date());

  // Real-time clock tick (every 100ms for precision)
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTime(new Date());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const {
    fps,
    frameTimeMs,
    frameHistory,
    frameCount,
    uptimeSeconds,
    isPaused,
    activeCartridge,
    heldState,
    lastButton,
    memorySlotsCount,
    pendingSyncCount,
    snapshotsCount,
    canvasScale,
    isMuted,
    volume
  } = stats;

  const fpsColor =
    fps >= 55 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-red-400';

  const formatUptime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    const ms = Math.floor((totalSec % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
  };

  const padButtons: { key: keyof GamepadState; label: string }[] = [
    { key: 'up', label: '▲' },
    { key: 'left', label: '◀' },
    { key: 'down', label: '▼' },
    { key: 'right', label: '▶' }
  ];

  const actionButtons: { key: keyof GamepadState; label: string; color: string }[] = [
    { key: 'y', label: 'Y', color: '#ff4444' },
    { key: 'x', label: 'X', color: '#3388ff' },
    { key: 'b', label: 'B', color: '#ffaa00' },
    { key: 'a', label: 'A', color: '#00dd44' }
  ];

  return (
    <div className="fixed top-12 left-3 sm:left-4 z-50 font-mono text-xs select-none">
      {/* MINIMIZED HUD PILL */}
      {isMinimized ? (
        <div className="bg-[#121614]/95 border border-emerald-500/80 rounded-lg p-2 text-emerald-300 shadow-2xl backdrop-blur-md flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className={`font-bold ${fpsColor}`}>{fps.toFixed(1)} FPS</span>
            <span className="text-[10px] opacity-60">({frameTimeMs.toFixed(1)}ms)</span>
          </div>

          <div className="text-[10px] text-emerald-400/80 border-l border-emerald-900 pl-2">
            {clockTime.toLocaleTimeString()}
          </div>

          <div className="flex items-center gap-1 border-l border-emerald-900 pl-2">
            <button
              onClick={onTogglePause}
              title={isPaused ? 'Resume Game' : 'Pause Game'}
              className="p-1 rounded hover:bg-emerald-950 text-emerald-300"
            >
              {isPaused ? <Play size={12} className="text-amber-400" /> : <Pause size={12} />}
            </button>
            <button
              onClick={() => setIsMinimized(false)}
              title="Expand Dev Toolkit"
              className="p-1 rounded hover:bg-emerald-950 text-emerald-300"
            >
              <Maximize2 size={12} />
            </button>
            <button
              onClick={onClose}
              title="Close Dev Overlay"
              className="p-1 rounded hover:bg-emerald-950 text-emerald-400 hover:text-white"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        /* EXPANDED DEV TOOLKIT WINDOW */
        <div className="w-[320px] sm:w-[350px] bg-[#121614]/95 border-2 border-emerald-500/70 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-emerald-100 overflow-hidden backdrop-blur-md flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-900/80 bg-[#0c100e]">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-emerald-400" />
              <span className="font-bold text-[11px] tracking-wider text-emerald-400 uppercase">
                MINUTEMAN DEV TOOLKIT
              </span>
              {isPaused && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600 font-bold">
                  PAUSED
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                title="Minimize to HUD"
                className="p-1 rounded text-emerald-400 hover:text-white hover:bg-emerald-950"
              >
                <Minimize2 size={12} />
              </button>
              <button
                onClick={onClose}
                title="Close"
                className="p-1 rounded text-emerald-400 hover:text-white hover:bg-emerald-950"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Quick HUD Strip */}
          <div className="grid grid-cols-3 divide-x divide-emerald-950 border-b border-emerald-900/60 bg-[#161c18] px-2 py-1.5 text-center text-[10px]">
            <div>
              <div className="text-emerald-600 text-[9px] uppercase">FRAMERATE</div>
              <div className={`font-bold text-xs ${fpsColor}`}>{fps.toFixed(1)} FPS</div>
            </div>
            <div>
              <div className="text-emerald-600 text-[9px] uppercase">FRAME TIME</div>
              <div className="font-bold text-xs text-emerald-200">{frameTimeMs.toFixed(1)} ms</div>
            </div>
            <div>
              <div className="text-emerald-600 text-[9px] uppercase">SYSTEM TIME</div>
              <div className="font-bold text-xs text-emerald-300">{clockTime.toLocaleTimeString()}</div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-emerald-900/80 bg-[#0e1210] text-[10px] font-bold">
            <button
              onClick={() => setActiveTab('perf')}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1 transition-colors ${
                activeTab === 'perf'
                  ? 'border-b-2 border-emerald-400 text-emerald-300 bg-emerald-950/40'
                  : 'text-emerald-600 hover:text-emerald-300'
              }`}
            >
              <Activity size={11} />
              <span>PERF</span>
            </button>
            <button
              onClick={() => setActiveTab('input')}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1 transition-colors ${
                activeTab === 'input'
                  ? 'border-b-2 border-emerald-400 text-emerald-300 bg-emerald-950/40'
                  : 'text-emerald-600 hover:text-emerald-300'
              }`}
            >
              <Gamepad2 size={11} />
              <span>INPUT</span>
            </button>
            <button
              onClick={() => setActiveTab('clock')}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1 transition-colors ${
                activeTab === 'clock'
                  ? 'border-b-2 border-emerald-400 text-emerald-300 bg-emerald-950/40'
                  : 'text-emerald-600 hover:text-emerald-300'
              }`}
            >
              <Clock size={11} />
              <span>CLOCK</span>
            </button>
            <button
              onClick={() => setActiveTab('memory')}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1 transition-colors ${
                activeTab === 'memory'
                  ? 'border-b-2 border-emerald-400 text-emerald-300 bg-emerald-950/40'
                  : 'text-emerald-600 hover:text-emerald-300'
              }`}
            >
              <HardDrive size={11} />
              <span>HOST</span>
            </button>
          </div>

          {/* Tab Body */}
          <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
            {/* TAB 1: PERFORMANCE & FPS INSPECTOR */}
            {activeTab === 'perf' && (
              <div className="space-y-3">
                {/* Frame Time Sparkline */}
                <div>
                  <div className="flex items-center justify-between text-[10px] text-emerald-500 mb-1">
                    <span>Frame Times (Last 40 Frames)</span>
                    <span className="text-emerald-400 font-bold">16.6ms target</span>
                  </div>
                  <div className="h-12 w-full bg-black/60 border border-emerald-900/80 rounded p-1 flex items-end gap-[2px] relative overflow-hidden">
                    {/* 16.6ms reference line (60fps) */}
                    <div
                      className="absolute left-0 right-0 border-b border-dashed border-emerald-500/40 pointer-events-none"
                      style={{ bottom: '50%' }}
                    />
                    {frameHistory.map((ft, i) => {
                      // Normalize: 16.6ms is at 50% height (33.3ms is 100%)
                      const heightPercent = Math.min(100, Math.max(8, (ft / 33.3) * 100));
                      const isSlow = ft > 20;
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-t-sm transition-all duration-75 ${
                            isSlow ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                          title={`Frame ${i}: ${ft.toFixed(1)}ms`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Performance Stats List */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded bg-black/40 border border-emerald-950">
                    <span className="text-emerald-600 block">TOTAL FRAMES</span>
                    <span className="font-bold text-white text-xs">{frameCount.toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-emerald-950">
                    <span className="text-emerald-600 block">TARGET REFRESH</span>
                    <span className="font-bold text-white text-xs">60.00 Hz</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-emerald-950">
                    <span className="text-emerald-600 block">VIRTUAL RES</span>
                    <span className="font-bold text-white text-xs">160 × 144 px</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-emerald-950">
                    <span className="text-emerald-600 block">INTEGER SCALE</span>
                    <span className="font-bold text-emerald-400 text-xs">{canvasScale}x</span>
                  </div>
                </div>

                {/* Frame Stepping Controls */}
                <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-500">Execution Flow:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={onTogglePause}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
                        isPaused
                          ? 'bg-amber-500 text-black hover:bg-amber-400'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900'
                      }`}
                    >
                      {isPaused ? <Play size={10} /> : <Pause size={10} />}
                      <span>{isPaused ? 'Resume' : 'Pause'}</span>
                    </button>
                    <button
                      disabled={!isPaused}
                      onClick={onStepFrame}
                      className="px-2 py-1 rounded bg-black/50 border border-emerald-800 text-emerald-300 hover:bg-emerald-950 transition-colors flex items-center gap-1 text-[10px] disabled:opacity-40"
                      title="Advance exactly 1 frame"
                    >
                      <SkipForward size={10} />
                      <span>Step</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: REAL-TIME INPUT INSPECTOR */}
            {activeTab === 'input' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] text-emerald-500">
                  <span>Controller Matrix:</span>
                  <span className="text-emerald-400">
                    Last Event: <strong className="uppercase">{lastButton || 'None'}</strong>
                  </span>
                </div>

                {/* Input Matrix Grid */}
                <div className="p-3 bg-black/50 border border-emerald-900/80 rounded-lg flex items-center justify-around gap-4">
                  {/* D-Pad visual */}
                  <div className="space-y-1 text-center">
                    <span className="text-[9px] text-emerald-600 uppercase block">D-PAD</span>
                    <div className="inline-grid grid-cols-3 grid-rows-3 gap-1 w-16 h-16 p-1 bg-black/60 rounded border border-emerald-950">
                      <div />
                      <div
                        className={`rounded-sm flex items-center justify-center text-[8px] font-bold ${
                          heldState.up ? 'bg-emerald-400 text-black shadow-md shadow-emerald-400/50' : 'bg-emerald-950/40 text-emerald-700'
                        }`}
                      >
                        ▲
                      </div>
                      <div />
                      <div
                        className={`rounded-sm flex items-center justify-center text-[8px] font-bold ${
                          heldState.left ? 'bg-emerald-400 text-black shadow-md shadow-emerald-400/50' : 'bg-emerald-950/40 text-emerald-700'
                        }`}
                      >
                        ◀
                      </div>
                      <div className="bg-emerald-950/20" />
                      <div
                        className={`rounded-sm flex items-center justify-center text-[8px] font-bold ${
                          heldState.right ? 'bg-emerald-400 text-black shadow-md shadow-emerald-400/50' : 'bg-emerald-950/40 text-emerald-700'
                        }`}
                      >
                        ▶
                      </div>
                      <div />
                      <div
                        className={`rounded-sm flex items-center justify-center text-[8px] font-bold ${
                          heldState.down ? 'bg-emerald-400 text-black shadow-md shadow-emerald-400/50' : 'bg-emerald-950/40 text-emerald-700'
                        }`}
                      >
                        ▼
                      </div>
                      <div />
                    </div>
                  </div>

                  {/* Action Diamond visual */}
                  <div className="space-y-1 text-center">
                    <span className="text-[9px] text-emerald-600 uppercase block">ACTIONS (6-BTN)</span>
                    <div className="flex flex-col gap-1 items-center">
                      {/* L & R shoulder row */}
                      <div className="flex gap-2">
                        <div
                          className={`w-6 h-4 rounded text-[8px] flex items-center justify-center font-bold ${
                            heldState.l ? 'bg-white text-black shadow-md' : 'bg-black/60 text-emerald-700 border border-emerald-950'
                          }`}
                        >
                          L
                        </div>
                        <div
                          className={`w-6 h-4 rounded text-[8px] flex items-center justify-center font-bold ${
                            heldState.r ? 'bg-white text-black shadow-md' : 'bg-black/60 text-emerald-700 border border-emerald-950'
                          }`}
                        >
                          R
                        </div>
                      </div>

                      {/* YXBA diamond */}
                      <div className="inline-grid grid-cols-3 grid-rows-3 gap-1 w-16 h-16 p-1 bg-black/60 rounded border border-emerald-950">
                        <div />
                        <div
                          className={`rounded-sm flex items-center justify-center text-[8px] font-bold ${
                            heldState.y ? 'bg-[#ffff96] text-black shadow-md' : 'bg-emerald-950/40 text-emerald-700'
                          }`}
                        >
                          Y
                        </div>
                        <div />
                        <div
                          className={`rounded-sm flex items-center justify-center text-[8px] font-bold ${
                            heldState.x ? 'bg-[#9696ff] text-white shadow-md' : 'bg-emerald-950/40 text-emerald-700'
                          }`}
                        >
                          X
                        </div>
                        <div className="bg-emerald-950/20" />
                        <div
                          className={`rounded-sm flex items-center justify-center text-[8px] font-bold ${
                            heldState.b ? 'bg-[#ff0000] text-white shadow-md' : 'bg-emerald-950/40 text-emerald-700'
                          }`}
                        >
                          B
                        </div>
                        <div />
                        <div
                          className={`rounded-sm flex items-center justify-center text-[8px] font-bold ${
                            heldState.a ? 'bg-[#7bab7b] text-black shadow-md' : 'bg-emerald-950/40 text-emerald-700'
                          }`}
                        >
                          A
                        </div>
                        <div />
                      </div>
                    </div>
                  </div>
                </div>

                {/* System buttons row */}
                <div className="flex items-center justify-center gap-3 text-[10px]">
                  <div
                    className={`px-3 py-1 rounded border ${
                      heldState.start
                        ? 'bg-emerald-400 text-black border-emerald-400 font-bold'
                        : 'bg-black/40 text-emerald-700 border-emerald-950'
                    }`}
                  >
                    START
                  </div>
                  <div
                    className={`px-3 py-1 rounded border ${
                      heldState.select
                        ? 'bg-emerald-400 text-black border-emerald-400 font-bold'
                        : 'bg-black/40 text-emerald-700 border-emerald-950'
                    }`}
                  >
                    SHIFT (SELECT)
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PRECISION CLOCKS & STOPWATCH */}
            {activeTab === 'clock' && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-black/50 border border-emerald-900/80 space-y-2">
                  <div>
                    <span className="text-[9px] text-emerald-600 uppercase block font-bold">
                      SYSTEM WALL CLOCK
                    </span>
                    <div className="font-bold text-base text-emerald-300 tracking-wider">
                      {clockTime.toLocaleTimeString()}.
                      <span className="text-xs text-emerald-500">
                        {String(clockTime.getMilliseconds()).padStart(3, '0')}
                      </span>
                    </div>
                    <span className="text-[9px] text-emerald-600">
                      {clockTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-emerald-950 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-emerald-600 uppercase block font-bold">
                        SESSION UPTIME
                      </span>
                      <div className="font-bold text-sm text-white">
                        {formatUptime(uptimeSeconds)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-emerald-600 uppercase block font-bold">
                        CYCLE COUNTER
                      </span>
                      <div className="font-bold text-xs text-emerald-400">
                        {Math.floor(uptimeSeconds * 60)} ticks
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded bg-black/30 border border-emerald-950 text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-emerald-600">Audio Synth Engine:</span>
                    <span className={isMuted ? 'text-red-400' : 'text-emerald-400 font-bold'}>
                      {isMuted ? 'MUTED' : `ACTIVE (${Math.round(volume * 100)}%)`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-600">Haptics Engine:</span>
                    <span className="text-emerald-400 font-bold">
                      {typeof navigator !== 'undefined' && 'vibrate' in navigator ? 'SUPPORTED' : 'UNAVAILABLE'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CARTRIDGE & MEMORY HOST */}
            {activeTab === 'memory' && (
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-black/50 border border-emerald-900/80 space-y-1 text-[10px]">
                  <div className="text-emerald-400 font-bold uppercase mb-1 flex items-center justify-between">
                    <span>Active Cartridge</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300">
                      {activeCartridge ? 'RUNNING' : 'SHELL OS'}
                    </span>
                  </div>
                  {activeCartridge ? (
                    <>
                      <div className="text-white font-bold text-xs">{activeCartridge.name}</div>
                      <div className="text-emerald-600">ID: {activeCartridge.id} · v{activeCartridge.version || '1.0'}</div>
                      {activeCartridge.author && (
                        <div className="text-emerald-600">Author: {activeCartridge.author}</div>
                      )}
                    </>
                  ) : (
                    <div className="text-emerald-600 italic">No cartridge loaded in bus.</div>
                  )}
                </div>

                {/* Memory Card Diagnostics */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded bg-black/40 border border-emerald-950">
                    <span className="text-emerald-600 block">SAVES ON CARD</span>
                    <span className="font-bold text-white text-xs">{memorySlotsCount} Slots</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-emerald-950">
                    <span className="text-emerald-600 block">GIT SYNC PENDING</span>
                    <span className={`font-bold text-xs ${pendingSyncCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {pendingSyncCount} Blocks
                    </span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-emerald-950 col-span-2">
                    <span className="text-emerald-600 block">LOCAL UNDO SNAPSHOTS</span>
                    <span className="font-bold text-emerald-300 text-xs">{snapshotsCount} Checkpoints</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 border-t border-emerald-950 bg-[#0c100e] flex items-center justify-between text-[9px] text-emerald-600">
            <span>Press ` (Backtick) or F2 to toggle</span>
            <span className="font-mono">ABI v1.0.0</span>
          </div>
        </div>
      )}
    </div>
  );
};
