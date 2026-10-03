export type GamepadButtonKey =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'a'
  | 'b'
  | 'x'
  | 'y'
  | 'start'
  | 'select';

export type GamepadState = Record<GamepadButtonKey, boolean>;

export interface InputSnapshot {
  held: GamepadState;
  pressed: GamepadState;
  released: GamepadState;
}

export interface SoundEngine {
  playTone: (freq: number, type?: OscillatorType, duration?: number, vol?: number, glideToFreq?: number) => void;
  menuMove: () => void;
  menuSelect: () => void;
  menuBack: () => void;
  beep: (pitch?: number) => void;
  laser: () => void;
  jump: () => void;
  hit: () => void;
  coin: () => void;
  powerup: () => void;
  isMuted: () => boolean;
  setMuted: (muted: boolean) => void;
  getVolume: () => number;
  setVolume: (vol: number) => void;
}

export interface CartridgeSurface {
  g: CanvasRenderingContext2D;
  width: number;
  height: number;
  audio: SoundEngine;
  save: (data: unknown) => boolean;
  load: () => unknown | null;
}

export interface Cartridge {
  id: string;
  name: string;
  version?: string;
  author?: string;
  description?: string;
  init?: (surface: CartridgeSurface) => void | Promise<void>;
  update: (input: InputSnapshot, dt: number) => void;
  draw: (surface: CartridgeSurface) => void;
  destroy?: () => void;
  saveState?: () => unknown;
  loadState?: (data: unknown) => void;
}

export interface SaveSnapshot {
  id: string;
  timestamp: string;
  sizeBytes: number;
  data: unknown;
  description?: string;
}

export interface MemorySlot {
  cartId: string;
  cartName: string;
  updatedAt: string;
  sizeBytes: number;
  data: unknown;
  dirty: boolean;
  snapshots?: SaveSnapshot[];
}

export interface GitSyncConfig {
  repoUrl?: string;
  repoOwner: string;
  repoName: string;
  branch: string;
  token: string;
  lastSynced?: string;
}

export interface CatalogCartridgeItem {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  file: string;
  tags?: string[];
}

export interface CatalogManifest {
  catalogVersion: string;
  updatedAt?: string;
  cartridges: CatalogCartridgeItem[];
}

export interface ConsolePalette {
  id: string;
  name: string;
  bodyBg: string;
  dpadBg: string;
  actionBtn: string;
  actionBtnActive: string;
  actionShadow: string;
  screenBg: string;
  screenText: string;
  screenBorder: string;
  activeDpad: string;
  accent: string;
}

export type ShellScreen =
  | 'splash'
  | 'menu'
  | 'carts'
  | 'memory'
  | 'howto'
  | 'settings'
  | 'debug'
  | 'credits'
  | 'exit';
