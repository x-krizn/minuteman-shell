/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cartridge,
  CartridgeSurface,
  ConsolePalette,
  GamepadButtonKey,
  GamepadState,
  InputSnapshot,
  ShellScreen
} from './types';
import { CONSOLE_PALETTES } from './palettes';
import { soundEngine } from './audio/soundEngine';
import { cartridgeRegistry, loadCartridgeAssets } from './cartridges/registry';
import { VirtualGamepad } from './components/VirtualGamepad';
import { ScreenViewport } from './components/ScreenViewport';
import { CartridgeWorkshopModal } from './components/CartridgeWorkshopModal';
import { KeyboardGuideModal } from './components/KeyboardGuideModal';
import { MemoryCardModal } from './components/MemoryCardModal';
import { GitSyncToast } from './components/GitSyncToast';
import { DevToolkitOverlay, DevToolkitStats } from './components/DevToolkitOverlay';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { memoryCard } from './memory/memoryCard';
import { githubCatalogService } from './services/githubCatalogService';
import {
  Volume2,
  VolumeX,
  Tv,
  Palette,
  Keyboard,
  Maximize2,
  Minimize2,
  PlusSquare,
  RotateCcw,
  HardDrive,
  Cpu
} from 'lucide-react';

const INITIAL_GAMEPAD_STATE: GamepadState = {
  up: false,
  down: false,
  left: false,
  right: false,
  a: false,
  b: false,
  x: false,
  y: false,
  l: false,
  r: false,
  start: false,
  select: false
};

const MENU_ITEMS = [
  { label: 'HOW-TO', go: 'howto' as ShellScreen },
  { label: 'CARTRIDGES', go: 'carts' as ShellScreen },
  { label: 'MEMORY CARD', go: 'memory' as ShellScreen },
  { label: 'SETTINGS', go: 'settings' as ShellScreen },
  { label: 'DEBUGGER', go: 'debug' as ShellScreen },
  { label: 'CREDITS', go: 'credits' as ShellScreen },
  { label: 'EXIT', go: 'exit' as ShellScreen }
];

const HOWTO_LINES = [
  'D-PAD: MOVE / TURN',
  'A: ACTION / SELECT',
  'B: BACK / CANCEL',
  'START: PAUSE / ADVANCE',
  'START + SELECT: LEAVE GAME',
  '',
  'KEYBOARD: WASD / ARROWS,',
  'K / Z: A, J / X: B, ENTER'
];

export default function App() {
  // Console appearance & settings
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [scanlines, setScanlines] = useState(true);
  const [muted, setMuted] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const [showKeyHints, setShowKeyHints] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isOnline = useOnlineStatus();

  // Auto-fetch dynamic cartridge library from repo / catalog.json
  useEffect(() => {
    githubCatalogService.fetchCatalog().catch(() => {});
  }, []);

  // Modals & Overlays
  const [isWorkshopOpen, setIsWorkshopOpen] = useState(false);
  const [isKeyGuideOpen, setIsKeyGuideOpen] = useState(false);
  const [isMemoryCardOpen, setIsMemoryCardOpen] = useState(false);
  const [isDevToolkitOpen, setIsDevToolkitOpen] = useState(false);

  // Dev Toolkit stats & controls
  const isDevPausedRef = useRef(false);
  const devStepFrameRef = useRef(false);
  const frameCountRef = useRef(0);
  const frameHistoryRef = useRef<number[]>(new Array(40).fill(16.6));
  const lastButtonRef = useRef<string>('');
  const startTimeRef = useRef<number>(performance.now());
  const lastDevStatsUpdateRef = useRef<number>(0);
  const [devStats, setDevStats] = useState<DevToolkitStats>({
    fps: 60,
    frameTimeMs: 16.6,
    frameHistory: new Array(40).fill(16.6),
    frameCount: 0,
    uptimeSeconds: 0,
    isPaused: false,
    activeCartridge: null,
    heldState: { ...INITIAL_GAMEPAD_STATE },
    lastButton: '',
    memorySlotsCount: 0,
    pendingSyncCount: 0,
    snapshotsCount: 0,
    canvasScale: 2,
    isMuted: false,
    volume: 1
  });

  // Shell State Machine
  const [currentScreen, setCurrentScreen] = useState<ShellScreen>('splash');
  const [menuIndex, setMenuIndex] = useState(0);
  const [cartIndex, setCartIndex] = useState(0);
  const [settingsIndex, setSettingsIndex] = useState(0);
  const [activeCartridge, setActiveCartridge] = useState<Cartridge | null>(null);
  const [isCartReady, setIsCartReady] = useState(false);
  const [cartSearchQuery, setCartSearchQuery] = useState('');
  const cartSearchQueryRef = useRef('');

  // Shell Display cache for React rendering
  const [shellTitle, setShellTitle] = useState<string>('');
  const [shellLines, setShellLines] = useState<string[]>([]);
  const [shellSelectedIndex, setShellSelectedIndex] = useState<number>(-1);

  // References for Game Loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const surfaceRef = useRef<CartridgeSurface | null>(null);
  const heldRef = useRef<GamepadState>({ ...INITIAL_GAMEPAD_STATE });
  const prevHeldRef = useRef<GamepadState>({ ...INITIAL_GAMEPAD_STATE });
  const stickRef = useRef({ x: 0, y: 0 });
  const [heldDisplay, setHeldDisplay] = useState<GamepadState>({ ...INITIAL_GAMEPAD_STATE });

  const activeCartRef = useRef<Cartridge | null>(null);
  const activeReadyRef = useRef<boolean>(false);
  const runTokenRef = useRef<number>(0);
  const currentScreenRef = useRef<ShellScreen>('splash');
  const menuIndexRef = useRef<number>(0);
  const cartIndexRef = useRef<number>(0);
  const settingsIndexRef = useRef<number>(0);
  const splashTimerRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Sync refs with state
  useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);
  useEffect(() => {
    menuIndexRef.current = menuIndex;
  }, [menuIndex]);
  useEffect(() => {
    cartIndexRef.current = cartIndex;
  }, [cartIndex]);
  useEffect(() => {
    settingsIndexRef.current = settingsIndex;
  }, [settingsIndex]);
  useEffect(() => {
    activeCartRef.current = activeCartridge;
  }, [activeCartridge]);

  const palette = CONSOLE_PALETTES[paletteIndex] || CONSOLE_PALETTES[0];

  // Button state change handler (from touch, pointer, or keyboard)
  const handleButtonChange = useCallback((key: GamepadButtonKey, isDown: boolean) => {
    if (isDown) {
      lastButtonRef.current = key;
    }
    if (heldRef.current[key] !== isDown) {
      heldRef.current[key] = isDown;
      setHeldDisplay({ ...heldRef.current });
    }
  }, []);

  const handleToggleDevPause = useCallback(() => {
    isDevPausedRef.current = !isDevPausedRef.current;
    setDevStats(prev => ({ ...prev, isPaused: isDevPausedRef.current }));
  }, []);

  const handleStepDevFrame = useCallback(() => {
    devStepFrameRef.current = true;
  }, []);

  // Keyboard mapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Dev Toolkit on backtick (`) or F2
      if (e.key === '`' || e.code === 'Backquote' || e.key === 'F2') {
        e.preventDefault();
        setIsDevToolkitOpen(prev => !prev);
        return;
      }

      // Don't intercept keyboard shortcuts when typing in inputs or textareas
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      let key: GamepadButtonKey | null = null;
      if (['ArrowUp', 'KeyW'].includes(e.code)) key = 'up';
      else if (['ArrowDown', 'KeyS'].includes(e.code)) key = 'down';
      else if (['ArrowLeft', 'KeyA'].includes(e.code)) key = 'left';
      else if (['ArrowRight', 'KeyD'].includes(e.code)) key = 'right';
      else if (['KeyK', 'KeyZ', 'Space'].includes(e.code)) key = 'a';
      else if (['KeyJ', 'KeyX'].includes(e.code)) key = 'b';
      else if (['KeyU', 'KeyC'].includes(e.code)) key = 'x';
      else if (['KeyI', 'KeyV'].includes(e.code)) key = 'y';
      else if (['KeyQ'].includes(e.code)) key = 'l';
      else if (['KeyE'].includes(e.code)) key = 'r';
      else if (['Enter'].includes(e.code)) key = 'start';
      else if (['ShiftLeft', 'ShiftRight', 'Tab'].includes(e.code)) key = 'select';

      if (key) {
        e.preventDefault();
        handleButtonChange(key, true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      let key: GamepadButtonKey | null = null;
      if (['ArrowUp', 'KeyW'].includes(e.code)) key = 'up';
      else if (['ArrowDown', 'KeyS'].includes(e.code)) key = 'down';
      else if (['ArrowLeft', 'KeyA'].includes(e.code)) key = 'left';
      else if (['ArrowRight', 'KeyD'].includes(e.code)) key = 'right';
      else if (['KeyK', 'KeyZ', 'Space'].includes(e.code)) key = 'a';
      else if (['KeyJ', 'KeyX'].includes(e.code)) key = 'b';
      else if (['KeyU', 'KeyC'].includes(e.code)) key = 'x';
      else if (['KeyI', 'KeyV'].includes(e.code)) key = 'y';
      else if (['KeyQ'].includes(e.code)) key = 'l';
      else if (['KeyE'].includes(e.code)) key = 'r';
      else if (['Enter'].includes(e.code)) key = 'start';
      else if (['ShiftLeft', 'ShiftRight', 'Tab'].includes(e.code)) key = 'select';

      if (key) {
        e.preventDefault();
        handleButtonChange(key, false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleButtonChange]);

  // Read input snapshot once per frame
  const readInput = (): InputSnapshot => {
    const held = { ...heldRef.current };
    const prev = prevHeldRef.current;
    const pressed: GamepadState = { ...INITIAL_GAMEPAD_STATE };
    const released: GamepadState = { ...INITIAL_GAMEPAD_STATE };

    (Object.keys(held) as GamepadButtonKey[]).forEach(k => {
      pressed[k] = held[k] && !prev[k];
      released[k] = !held[k] && prev[k];
    });

    prevHeldRef.current = held;
    return { held, pressed, released, stick: { ...stickRef.current } };
  };

  // Stop running cartridge
  const stopCart = useCallback(() => {
    runTokenRef.current++;
    const cart = activeCartRef.current;
    activeCartRef.current = null;
    activeReadyRef.current = false;
    setIsCartReady(false);
    setActiveCartridge(null);

    if (surfaceRef.current) {
      surfaceRef.current.assets = {};
    }

    if (cart) {
      // Auto-persist cartridge state if supported
      if (typeof cart.saveState === 'function') {
        try {
          const stateData = cart.saveState();
          if (stateData !== undefined) {
            memoryCard.saveCartridgeData(cart.id, cart.name, stateData);
          }
        } catch (e) {
          cartridgeRegistry.logError(`${cart.id} auto-save: ${String(e)}`);
        }
      }

      if (typeof cart.destroy === 'function') {
        try {
          cart.destroy();
        } catch (e) {
          cartridgeRegistry.logError(`${cart.id} destroy: ${String(e)}`);
        }
      }
    }
  }, []);

  // Start cartridge
  const startCart = useCallback((cart: Cartridge) => {
    stopCart();
    activeCartRef.current = cart;
    setActiveCartridge(cart);
    activeReadyRef.current = false;
    setIsCartReady(false);
    setShellTitle('');
    setShellLines(['LOADING...']);
    setShellSelectedIndex(-1);
    const token = ++runTokenRef.current;

    const surface = surfaceRef.current;
    if (surface) {
      surface.g.clearRect(0, 0, surface.width, surface.height);
      surface.assets = {};
    }

    const runInit = () => {
      try {
        soundEngine.powerup();
        const res = typeof cart.init === 'function' && surface ? cart.init(surface) : undefined;
        if (res && typeof (res as Promise<void>).then === 'function') {
          (res as Promise<void>).then(
            () => {
              if (token === runTokenRef.current) {
                activeReadyRef.current = true;
                setIsCartReady(true);
              }
            },
            (e: unknown) => {
              if (token === runTokenRef.current) {
                cartridgeRegistry.logError(`${cart.id} init async: ${String(e)}`);
                stopCart();
                setCurrentScreen('debug');
              }
            }
          );
        } else {
          activeReadyRef.current = true;
          setIsCartReady(true);
        }
      } catch (e: unknown) {
        cartridgeRegistry.logError(`${cart.id} init: ${String(e)}`);
        stopCart();
        setCurrentScreen('debug');
      }
    };

    if (!cart.assets) {
      runInit();
      return;
    }

    loadCartridgeAssets(cart)
      .then(assets => {
        if (token === runTokenRef.current) {
          if (surfaceRef.current) {
            surfaceRef.current.assets = assets;
          }
          runInit();
        }
      })
      .catch(e => {
        if (token === runTokenRef.current) {
          cartridgeRegistry.logError(`${cart.id} assets: ${String(e)}`);
          stopCart();
          setCurrentScreen('debug');
        }
      });
  }, [stopCart]);

  // Canvas Ready callback
  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
    const g = canvas.getContext('2d');
    if (g) {
      g.imageSmoothingEnabled = false;
      const currentAssets = surfaceRef.current?.assets || {};
      surfaceRef.current = cartridgeRegistry.prepareSurfaceABI({
        g,
        width: 160,
        height: 144,
        audio: soundEngine,
        assets: currentAssets,
        save: (data: unknown) => {
          const c = activeCartRef.current;
          if (c) {
            return memoryCard.saveCartridgeData(c.id, c.name, data);
          }
          return false;
        },
        load: () => {
          const c = activeCartRef.current;
          if (c) {
            return memoryCard.loadCartridgeData(c.id);
          }
          return null;
        }
      });
    }
  }, []);

  // Main Display Loop
  useEffect(() => {
    let animId: number;

    const frame = (now: number) => {
      animId = requestAnimationFrame(frame);
      const dtMs = Math.min(Math.max(now - lastTimeRef.current, 0), 100);
      lastTimeRef.current = now;

      frameCountRef.current++;
      frameHistoryRef.current.push(dtMs);
      if (frameHistoryRef.current.length > 40) {
        frameHistoryRef.current.shift();
      }

      // Periodically update devStats at 10Hz without impacting 60fps render
      if (now - lastDevStatsUpdateRef.current >= 100) {
        lastDevStatsUpdateRef.current = now;
        const avgDt = frameHistoryRef.current.reduce((a, b) => a + b, 0) / frameHistoryRef.current.length;
        const currentFps = avgDt > 0 ? 1000 / avgDt : 60;
        const canvas = canvasRef.current;
        const canvasScale = canvas && canvas.clientWidth ? Math.max(1, Math.round(canvas.clientWidth / 160)) : 1;
        const slots = memoryCard.getAllSlots();
        const snapshotsCount = slots.reduce((acc, s) => acc + (s.snapshots?.length || 0), 0);

        setDevStats({
          fps: currentFps,
          frameTimeMs: dtMs,
          frameHistory: [...frameHistoryRef.current],
          frameCount: frameCountRef.current,
          uptimeSeconds: (now - startTimeRef.current) / 1000,
          isPaused: isDevPausedRef.current,
          activeCartridge: activeCartRef.current,
          heldState: { ...heldRef.current },
          lastButton: lastButtonRef.current,
          memorySlotsCount: slots.length,
          pendingSyncCount: memoryCard.getPendingSyncCount(),
          snapshotsCount,
          canvasScale,
          isMuted: soundEngine.isMuted(),
          volume: soundEngine.getVolume()
        });
      }

      const input = readInput();
      const p = input.pressed;
      const h = input.held;

      const runningCart = activeCartRef.current;

      // In-cartridge execution
      if (runningCart) {
        // Emergency escape: START + SELECT together
        if (h.start && h.select && (p.start || p.select)) {
          soundEngine.menuBack();
          stopCart();
          setCurrentScreen('carts');
          return;
        }

        if (!activeReadyRef.current) {
          setShellTitle('');
          setShellLines(['LOADING...']);
          setShellSelectedIndex(-1);
          return;
        }

        const surface = surfaceRef.current;
        if (surface) {
          const shouldTick = !isDevPausedRef.current || devStepFrameRef.current;
          if (devStepFrameRef.current) {
            devStepFrameRef.current = false;
          }

          if (shouldTick) {
            try {
              runningCart.update(input, dtMs / 1000);
            } catch (e: unknown) {
              cartridgeRegistry.logError(`${runningCart.id} update: ${String(e)}`);
              stopCart();
              setCurrentScreen('debug');
              return;
            }
          }

          try {
            runningCart.draw(surface);
          } catch (e: unknown) {
            cartridgeRegistry.logError(`${runningCart.id} draw: ${String(e)}`);
            stopCart();
            setCurrentScreen('debug');
          }
        }
        return;
      }

      // Shell Screen State Machine
      const curScreen = currentScreenRef.current;

      switch (curScreen) {
        case 'splash': {
          splashTimerRef.current += dtMs;
          const anyPress = Object.values(p).some(Boolean);
          if (splashTimerRef.current >= 1500 || anyPress) {
            soundEngine.menuSelect();
            setCurrentScreen('menu');
          } else {
            setShellTitle('');
            setShellLines(['GAMES, BUDDY.']);
            setShellSelectedIndex(-1);
          }
          break;
        }

        case 'menu': {
          let nextIndex = menuIndexRef.current;
          if (p.up) {
            nextIndex = (nextIndex + MENU_ITEMS.length - 1) % MENU_ITEMS.length;
            soundEngine.menuMove();
          } else if (p.down) {
            nextIndex = (nextIndex + 1) % MENU_ITEMS.length;
            soundEngine.menuMove();
          }
          if (nextIndex !== menuIndexRef.current) {
            menuIndexRef.current = nextIndex;
            setMenuIndex(nextIndex);
          }

          if (p.a || p.start) {
            soundEngine.menuSelect();
            setCurrentScreen(MENU_ITEMS[nextIndex].go);
          }

          setShellTitle('MINUTEMAN SHELL');
          setShellLines(MENU_ITEMS.map(m => m.label));
          setShellSelectedIndex(nextIndex);
          break;
        }

        case 'carts': {
          const allCarts = cartridgeRegistry.getCartridges();
          const query = cartSearchQueryRef.current.trim().toLowerCase();
          const carts = query ? allCarts.filter(c => c.name.toLowerCase().includes(query)) : allCarts;

          if (p.b) {
            if (cartSearchQueryRef.current !== '') {
              cartSearchQueryRef.current = '';
              setCartSearchQuery('');
              soundEngine.menuBack();
              break;
            }
            soundEngine.menuBack();
            setCurrentScreen('menu');
            break;
          }

          if (p.select || p.y) {
            if (cartSearchQueryRef.current !== '') {
              cartSearchQueryRef.current = '';
              setCartSearchQuery('');
              soundEngine.menuSelect();
              break;
            }
          }

          if (carts.length === 0) {
            setShellTitle(query ? `FILTER (${allCarts.length})` : 'CARTRIDGES');
            setShellLines([
              'NO MATCHING CARTS',
              `FOR: "${cartSearchQueryRef.current.slice(0, 14)}"`,
              '',
              'B/SELECT: CLEAR'
            ]);
            setShellSelectedIndex(-1);
            break;
          }

          let nextCartIdx = cartIndexRef.current;
          if (nextCartIdx >= carts.length) nextCartIdx = 0;

          if (p.up) {
            nextCartIdx = (nextCartIdx + carts.length - 1) % carts.length;
            soundEngine.menuMove();
          } else if (p.down) {
            nextCartIdx = (nextCartIdx + 1) % carts.length;
            soundEngine.menuMove();
          }

          if (nextCartIdx !== cartIndexRef.current) {
            cartIndexRef.current = nextCartIdx;
            setCartIndex(nextCartIdx);
          }

          if (p.a || p.start) {
            startCart(carts[nextCartIdx]);
            break;
          }

          setShellTitle(query ? `CARTS (${carts.length}/${allCarts.length})` : `CARTRIDGES (${allCarts.length})`);
          setShellLines(carts.map(c => c.name));
          setShellSelectedIndex(nextCartIdx);
          break;
        }

        case 'memory': {
          if (p.b) {
            soundEngine.menuBack();
            setCurrentScreen('menu');
            break;
          }
          if (p.a || p.start) {
            soundEngine.menuSelect();
            setIsMemoryCardOpen(true);
            break;
          }
          if (p.x) {
            soundEngine.menuSelect();
            memoryCard.syncToGit().then(res => {
              if (res.success) soundEngine.powerup();
              else soundEngine.menuBack();
            });
            break;
          }

          const slots = memoryCard.getAllSlots();
          const pending = memoryCard.getPendingSyncCount();
          const gitConf = memoryCard.getGitConfig();
          const isConfigured = Boolean(gitConf.repoOwner && gitConf.repoName);

          const memLines = [
            `BLOCKS: ${slots.length} SAVES`,
            `GIT: ${isConfigured ? 'LINKED' : 'NOT LINKED'}`,
            `SYNC: ${pending > 0 ? `${pending} PENDING` : 'UP TO DATE'}`,
            '',
            'A: MEMORY CARD UI',
            'X: SYNC TO GIT',
            'B: BACK'
          ];

          setShellTitle('MEMORY CARD');
          setShellLines(memLines);
          setShellSelectedIndex(-1);
          break;
        }

        case 'settings': {
          if (p.b) {
            soundEngine.menuBack();
            setCurrentScreen('menu');
            break;
          }

          const settingsOptions = [
            `THEME: ${palette.name}`,
            `SCANLINES: ${scanlines ? 'ON' : 'OFF'}`,
            `SOUND: ${muted ? 'MUTED' : 'ON'}`,
            `HAPTICS: ${haptics ? 'ON' : 'OFF'}`,
            `KEY HINTS: ${showKeyHints ? 'SHOWN' : 'HIDDEN'}`,
            'B: BACK'
          ];

          let nextIdx = settingsIndexRef.current;
          if (p.up) {
            nextIdx = (nextIdx + settingsOptions.length - 1) % settingsOptions.length;
            soundEngine.menuMove();
          } else if (p.down) {
            nextIdx = (nextIdx + 1) % settingsOptions.length;
            soundEngine.menuMove();
          }

          if (nextIdx !== settingsIndexRef.current) {
            settingsIndexRef.current = nextIdx;
            setSettingsIndex(nextIdx);
          }

          if (p.a || p.start || p.right || p.left) {
            soundEngine.menuSelect();
            if (nextIdx === 0) {
              setPaletteIndex(prev => (prev + 1) % CONSOLE_PALETTES.length);
            } else if (nextIdx === 1) {
              setScanlines(prev => !prev);
            } else if (nextIdx === 2) {
              setMuted(prev => {
                const nextVal = !prev;
                soundEngine.setMuted(nextVal);
                return nextVal;
              });
            } else if (nextIdx === 3) {
              setHaptics(prev => !prev);
            } else if (nextIdx === 4) {
              setShowKeyHints(prev => !prev);
            } else if (nextIdx === 5) {
              setCurrentScreen('menu');
            }
          }

          setShellTitle('SETTINGS');
          setShellLines(settingsOptions);
          setShellSelectedIndex(nextIdx);
          break;
        }

        case 'howto': {
          if (p.b || p.a || p.start) {
            soundEngine.menuBack();
            setCurrentScreen('menu');
          } else {
            setShellTitle('HOW TO PLAY');
            setShellLines([...HOWTO_LINES, '', 'B: BACK']);
            setShellSelectedIndex(-1);
          }
          break;
        }

        case 'debug': {
          if (p.b) {
            soundEngine.menuBack();
            setCurrentScreen('menu');
            break;
          }
          if (p.x) {
            cartridgeRegistry.clearErrors();
            soundEngine.menuSelect();
          }

          const activeKeys = (Object.keys(h) as GamepadButtonKey[]).filter(k => h[k]);
          const errors = cartridgeRegistry.getErrors();
          const debugInfo = [
            `PAD: ${activeKeys.length ? activeKeys.join(' ').toUpperCase() : 'NONE'}`,
            `CARTS: ${cartridgeRegistry.getCartridges().length}`,
            `ERRORS: ${errors.length ? errors.length : 'NONE'}`
          ];

          if (errors.length > 0) {
            errors.slice(-4).forEach(err => debugInfo.push(`! ${err.slice(0, 18)}`));
            debugInfo.push('X: CLEAR ERRORS');
          }

          debugInfo.push('B: BACK');
          setShellTitle('DEBUGGER');
          setShellLines(debugInfo);
          setShellSelectedIndex(-1);
          break;
        }

        case 'credits': {
          if (p.b || p.a || p.start) {
            soundEngine.menuBack();
            setCurrentScreen('menu');
          } else {
            setShellTitle('CREDITS');
            setShellLines([
              'MINUTEMAN VIRTUAL GAMEPAD',
              'VERSION 1.0',
              '',
              '8-BIT CHASSIS & RUNNER',
              'RETRO PIXEL SYNTHESIS',
              '',
              'B: BACK'
            ]);
            setShellSelectedIndex(-1);
          }
          break;
        }

        case 'exit': {
          if (p.b || p.a || p.start) {
            soundEngine.menuBack();
            setCurrentScreen('menu');
          } else {
            setShellTitle('SHUTDOWN');
            setShellLines([
              'CONSOLE SUSPENDED.',
              '',
              'SAFE TO CLOSE BROWSER.',
              '',
              'B: RESUME SHELL'
            ]);
            setShellSelectedIndex(-1);
          }
          break;
        }
      }
    };

    lastTimeRef.current = performance.now();
    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [palette, scanlines, muted, haptics, showKeyHints, startCart, stopCart]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      className="w-screen h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-200"
      style={{
        backgroundColor: '#16191b',
        backgroundImage: 'radial-gradient(#252a30 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      {/* Top Desktop Helper Toolbar (Hidden on narrow mobile screens) */}
      <header className="hidden sm:flex items-center justify-between w-full max-w-[440px] px-3 py-2 text-xs text-white/80 z-10">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-widest text-[#00ff33]">MINUTEMAN</span>
          <span className="text-[10px] text-white/40">SYSTEM</span>
        </div>

        <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg border border-white/10">
          <PWAInstallButton compact />

          <button
            onClick={() => setIsWorkshopOpen(true)}
            title="Cartridge Workshop (Create & Load)"
            className="p-1 rounded hover:bg-white/10 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 text-[11px]"
          >
            <PlusSquare size={13} />
            <span>Workshop</span>
          </button>

          <button
            onClick={() => setIsMemoryCardOpen(true)}
            title="Memory Card (Saves & Git Cloud)"
            className="p-1 rounded hover:bg-white/10 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 text-[11px] relative"
          >
            <HardDrive size={13} />
            <span>Memory</span>
            {memoryCard.getPendingSyncCount() > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse absolute -top-0.5 -right-0.5" />
            )}
          </button>

          <span className="text-white/20">|</span>

          <button
            onClick={() => setPaletteIndex(prev => (prev + 1) % CONSOLE_PALETTES.length)}
            title={`Cycle Palette: ${palette.name}`}
            className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <Palette size={13} />
          </button>

          <button
            onClick={() => setScanlines(prev => !prev)}
            title={scanlines ? 'Disable CRT Scanlines' : 'Enable CRT Scanlines'}
            className={`p-1 rounded hover:bg-white/10 transition-colors ${
              scanlines ? 'text-emerald-400' : 'text-white/40'
            }`}
          >
            <Tv size={13} />
          </button>

          <button
            onClick={() => {
              setMuted(prev => {
                const nextVal = !prev;
                soundEngine.setMuted(nextVal);
                return nextVal;
              });
            }}
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
            className={`p-1 rounded hover:bg-white/10 transition-colors ${
              muted ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>

          <button
            onClick={() => setIsKeyGuideOpen(true)}
            title="Desktop Keyboard Guide"
            className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <Keyboard size={13} />
          </button>

          <button
            onClick={() => setIsDevToolkitOpen(prev => !prev)}
            title="Dev Toolkit (` or F2): FPS, Input, Clock, Memory"
            className={`p-1 rounded hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px] ${
              isDevToolkitOpen ? 'text-emerald-400 bg-white/10 font-bold' : 'text-white/70 hover:text-white'
            }`}
          >
            <Cpu size={13} />
            <span className="hidden md:inline">Dev</span>
          </button>

          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </header>

      {/* Main Handheld Console Shell */}
      <main
        id="game-container"
        className="w-full h-full sm:h-[840px] sm:max-h-[96vh] sm:w-[410px] sm:rounded-2xl sm:shadow-[0_20px_50px_rgba(0,0,0,0.8)] sm:border-4 sm:border-black/40 flex flex-col relative overflow-hidden transition-colors duration-200"
        style={{
          backgroundColor: palette.bodyBg
        }}
      >
        {/* Hardware Bezel Header on Desktop */}
        <div className="hidden sm:flex items-center justify-between px-6 pt-3 pb-1 select-none">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                activeCartridge ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
              } shadow-[0_0_8px_currentColor]`}
            />
            <span className="text-[10px] tracking-widest text-black/60 font-bold uppercase">
              {activeCartridge ? 'CARTRIDGE RUNNING' : 'SHELL READY'}
            </span>
          </div>

          {/* Active Cartridge Label / Slot */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/10 border border-black/20 text-[9px] font-bold text-black/70">
            <span>CART:</span>
            <span className="text-black uppercase">
              {activeCartridge ? activeCartridge.name : 'BUILT-IN SHELL'}
            </span>
            {activeCartridge && (
              <button
                onClick={() => {
                  soundEngine.menuBack();
                  stopCart();
                  setCurrentScreen('carts');
                }}
                className="hover:text-red-700 ml-1"
                title="Eject / Exit Cartridge"
              >
                <RotateCcw size={10} />
              </button>
            )}
          </div>
        </div>

        {/* 3.2 SCREEN VIEWPORT */}
        <ScreenViewport
          palette={palette}
          isCartridgeRunning={activeCartridge !== null && isCartReady}
          scanlines={scanlines}
          shellTitle={shellTitle}
          shellLines={shellLines}
          shellSelectedIndex={shellSelectedIndex}
          showSearch={currentScreen === 'carts'}
          searchQuery={cartSearchQuery}
          onSearchChange={(q) => {
            setCartSearchQuery(q);
            cartSearchQueryRef.current = q;
            cartIndexRef.current = 0;
            setCartIndex(0);
          }}
          onCanvasReady={handleCanvasReady}
        />

        {/* Decorative Brand Text & Stereo Speaker Grills between screen & controls */}
        <div className="flex items-center justify-between px-7 py-1 select-none">
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-[3px] font-bold text-black/50 italic font-mono">
              MINUTEMAN
            </span>
          </div>

          {/* Speaker Slits */}
          <div className="flex gap-1 items-center rotate-[-25deg] opacity-40">
            <div className="w-1 h-3.5 bg-black/60 rounded-full" />
            <div className="w-1 h-4 bg-black/60 rounded-full" />
            <div className="w-1 h-4 bg-black/60 rounded-full" />
            <div className="w-1 h-3.5 bg-black/60 rounded-full" />
          </div>
        </div>

        {/* 3.3 VIRTUAL GAMEPAD ASSEMBLY */}
        <VirtualGamepad
          palette={palette}
          held={heldDisplay}
          onButtonChange={handleButtonChange}
          onStickChange={(s) => {
            stickRef.current = s;
          }}
          showKeyHints={showKeyHints}
          hapticsEnabled={haptics}
        />
      </main>

      {/* Floating Action Button for Mobile Users to open Workshop & Memory */}
      <div className="sm:hidden fixed top-2 right-2 z-30 flex items-center gap-1">
        <PWAInstallButton compact />
        <button
          onClick={() => setPaletteIndex(prev => (prev + 1) % CONSOLE_PALETTES.length)}
          className="p-2 rounded-full bg-black/60 text-white/80 backdrop-blur-sm border border-white/20 active:scale-95"
          aria-label="Change Theme"
        >
          <Palette size={14} />
        </button>
        <button
          onClick={() => setIsMemoryCardOpen(true)}
          className="p-2 rounded-full bg-black/60 text-emerald-400 backdrop-blur-sm border border-emerald-500/40 active:scale-95 relative"
          aria-label="Memory Card"
        >
          <HardDrive size={14} />
          {memoryCard.getPendingSyncCount() > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse absolute top-1 right-1" />
          )}
        </button>
        <button
          onClick={() => setIsDevToolkitOpen(prev => !prev)}
          className={`p-2 rounded-full backdrop-blur-sm border active:scale-95 text-[11px] font-bold flex items-center justify-center ${
            isDevToolkitOpen
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
              : 'bg-black/60 text-emerald-400 border-emerald-500/40'
          }`}
          aria-label="Dev Toolkit"
        >
          <Cpu size={14} />
        </button>
        <button
          onClick={() => setIsWorkshopOpen(true)}
          className="p-2 rounded-full bg-black/60 text-[#00ff33] backdrop-blur-sm border border-[#00ff33]/40 active:scale-95 flex items-center gap-1 text-[11px] font-bold px-3"
        >
          <PlusSquare size={14} />
          <span>CARTS</span>
        </button>
      </div>

      {/* Dev Toolkit Overlay */}
      <DevToolkitOverlay
        isOpen={isDevToolkitOpen}
        onClose={() => setIsDevToolkitOpen(false)}
        stats={devStats}
        onTogglePause={handleToggleDevPause}
        onStepFrame={handleStepDevFrame}
      />

      {/* Floating Git Sync Toast Notifications */}
      <GitSyncToast />

      {/* Offline Status Toast */}
      {!isOnline && (
        <div className="fixed bottom-3 left-3 z-40 px-3 py-1.5 rounded-lg bg-amber-950/90 border border-amber-600/70 text-amber-200 text-xs font-mono shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>OFFLINE MODE · PLAYING FROM LOCAL CACHE</span>
        </div>
      )}

      {/* Cartridge Workshop Modal */}
      <CartridgeWorkshopModal
        isOpen={isWorkshopOpen}
        onClose={() => setIsWorkshopOpen(false)}
        onRunCartridge={(cart) => {
          startCart(cart);
        }}
      />

      {/* Memory Card Modal */}
      <MemoryCardModal
        isOpen={isMemoryCardOpen}
        onClose={() => setIsMemoryCardOpen(false)}
      />

      {/* Keyboard Shortcuts Guide Modal */}
      <KeyboardGuideModal
        isOpen={isKeyGuideOpen}
        onClose={() => setIsKeyGuideOpen(false)}
      />
    </div>
  );
}
