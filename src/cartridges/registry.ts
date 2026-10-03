import { Cartridge, CartridgeSurface } from '../types';
import { createPocketJumpCartridge } from './pocketJump';
import { createSnake99Cartridge } from './snake99';
import { createStarPatrolCartridge } from './starPatrol';
import { createTemplateCartridge } from './template';
import { createTinyRogueCartridge } from './tinyRogue';

export const CONSOLE_ABI_VERSION = '1.0.0';

export interface CartridgeManifestItem {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  file: string;
}

export interface CartridgeManifest {
  catalogVersion: string;
  updatedAt?: string;
  cartridges: CartridgeManifestItem[];
}

const BUILT_IN_FACTORIES: (() => Cartridge)[] = [
  createStarPatrolCartridge,
  createTinyRogueCartridge,
  createSnake99Cartridge,
  createPocketJumpCartridge,
  createTemplateCartridge
];

const DYNAMIC_CACHE_KEY = 'minuteman_dynamic_carts_cache';
const DYNAMIC_MANIFEST_KEY = 'minuteman_dynamic_manifest';

class CartridgeRegistry {
  private cartridges: Cartridge[] = [];
  private errors: string[] = [];
  private readonly MAX_ERRORS = 30;
  private isFetchingCatalog = false;

  constructor() {
    this.reloadBuiltIns();
    this.loadCustomFromStorage();
    this.loadDynamicCartsFromOfflineCache();
  }

  public reloadBuiltIns() {
    this.cartridges = BUILT_IN_FACTORIES.map(fn => fn());
  }

  public getCartridges(): Cartridge[] {
    return [...this.cartridges];
  }

  public getCartridge(id: string): Cartridge | undefined {
    return this.cartridges.find(c => c.id === id);
  }

  public getErrors(): string[] {
    return [...this.errors];
  }

  public logError(msg: string) {
    this.errors.push(msg);
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors.shift();
    }
  }

  public clearErrors() {
    this.errors = [];
  }

  public register(cart: Cartridge): boolean {
    if (!cart || typeof cart !== 'object') {
      this.logError('REGISTER: NOT AN OBJECT');
      return false;
    }
    if (typeof cart.id !== 'string' || cart.id.trim() === '') {
      this.logError('REGISTER: MISSING ID');
      return false;
    }
    if (typeof cart.name !== 'string' || cart.name.trim() === '') {
      this.logError(`REGISTER ${cart.id}: MISSING NAME`);
      return false;
    }
    if (typeof cart.update !== 'function' || typeof cart.draw !== 'function') {
      this.logError(`REGISTER ${cart.id}: NEEDS update AND draw`);
      return false;
    }

    const existingIndex = this.cartridges.findIndex(c => c.id === cart.id);
    if (existingIndex >= 0) {
      this.cartridges[existingIndex] = cart;
    } else {
      this.cartridges.push(cart);
    }
    return true;
  }

  public addCustomCartridge(cart: Cartridge, codeStr?: string): boolean {
    const ok = this.register(cart);
    if (ok && codeStr) {
      try {
        const stored = this.getCustomCartridgesFromStorage();
        stored[cart.id] = {
          id: cart.id,
          name: cart.name,
          version: cart.version || '1.0',
          code: codeStr
        };
        localStorage.setItem('minuteman_custom_carts', JSON.stringify(stored));
      } catch (e) {
        this.logError('FAILED TO SAVE TO LOCALSTORAGE: ' + String(e));
      }
    }
    return ok;
  }

  public removeCustomCartridge(id: string): boolean {
    const isBuiltIn = BUILT_IN_FACTORIES.some(fn => fn().id === id);
    if (isBuiltIn) return false;

    this.cartridges = this.cartridges.filter(c => c.id !== id);
    try {
      const stored = this.getCustomCartridgesFromStorage();
      delete stored[id];
      localStorage.setItem('minuteman_custom_carts', JSON.stringify(stored));
    } catch {}
    return true;
  }

  private getCustomCartridgesFromStorage(): Record<string, { id: string; name: string; version: string; code: string }> {
    try {
      const raw = localStorage.getItem('minuteman_custom_carts');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private loadCustomFromStorage() {
    const custom = this.getCustomCartridgesFromStorage();
    Object.values(custom).forEach(item => {
      try {
        const fn = new Function('Minuteman', item.code);
        let registeredCart: Cartridge | null = null;
        const mockMinuteman = {
          register: (c: Cartridge) => {
            registeredCart = c;
          }
        };
        fn(mockMinuteman);
        if (registeredCart) {
          this.register(registeredCart);
        }
      } catch (e) {
        this.logError(`LOAD CUSTOM ${item.id} ERROR: ${String(e)}`);
      }
    });
  }

  // Load dynamically cached cartridges from localStorage (works 100% offline)
  private loadDynamicCartsFromOfflineCache() {
    try {
      const raw = localStorage.getItem(DYNAMIC_CACHE_KEY);
      if (!raw) return;
      const cached = JSON.parse(raw) as Record<string, { code: string; version: string }>;
      Object.entries(cached).forEach(([id, entry]) => {
        try {
          const fn = new Function('Minuteman', entry.code);
          let registeredCart: Cartridge | null = null;
          const mockMinuteman = {
            register: (c: Cartridge) => {
              registeredCart = c;
            }
          };
          fn(mockMinuteman);
          if (registeredCart) {
            this.register(registeredCart);
          }
        } catch (e) {
          this.logError(`OFFLINE CACHE ${id} EVAL ERROR: ${String(e)}`);
        }
      });
    } catch (e) {
      this.logError(`OFFLINE CACHE LOAD ERROR: ${String(e)}`);
    }
  }

  // Zero-build Dynamic Library Fetcher:
  // Fetches carts/manifest.json and fetches any new or updated .cart.js files
  public async fetchDynamicCatalog(manifestUrl: string = '/carts/manifest.json'): Promise<{ updated: number; total: number }> {
    if (this.isFetchingCatalog) return { updated: 0, total: this.cartridges.length };
    this.isFetchingCatalog = true;

    let updatedCount = 0;

    try {
      const res = await fetch(manifestUrl, { cache: 'no-cache' });
      if (!res.ok) {
        throw new Error(`Failed to fetch catalog (HTTP ${res.status})`);
      }

      const manifest = (await res.json()) as CartridgeManifest;
      if (!manifest || !Array.isArray(manifest.cartridges)) {
        throw new Error('Invalid cartridge manifest format');
      }

      localStorage.setItem(DYNAMIC_MANIFEST_KEY, JSON.stringify(manifest));

      const cacheRaw = localStorage.getItem(DYNAMIC_CACHE_KEY);
      const cache: Record<string, { code: string; version: string }> = cacheRaw ? JSON.parse(cacheRaw) : {};

      for (const item of manifest.cartridges) {
        // If not cached or version changed
        if (!cache[item.id] || cache[item.id].version !== item.version) {
          try {
            const scriptRes = await fetch(item.file, { cache: 'no-cache' });
            if (scriptRes.ok) {
              const code = await scriptRes.text();
              const fn = new Function('Minuteman', code);
              let registeredCart: Cartridge | null = null;
              const mockMinuteman = {
                register: (c: Cartridge) => {
                  registeredCart = c;
                }
              };
              fn(mockMinuteman);

              if (registeredCart) {
                this.register(registeredCart);
                cache[item.id] = { code, version: item.version };
                updatedCount++;
              }
            }
          } catch (scriptErr) {
            this.logError(`FETCH CART ${item.id} FAIL: ${String(scriptErr)}`);
          }
        }
      }

      localStorage.setItem(DYNAMIC_CACHE_KEY, JSON.stringify(cache));
    } catch (err: unknown) {
      // Offline fallback: already loaded from offline cache in constructor
      this.logError(`CATALOG SYNC NOTICE: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.isFetchingCatalog = false;
    }

    return { updated: updatedCount, total: this.cartridges.length };
  }

  // Wraps surface with forward/backward compatible ABI safeguards
  public prepareSurfaceABI(rawSurface: CartridgeSurface): CartridgeSurface {
    return {
      ...rawSurface,
      // Provide defensive audio fallbacks so future audio additions don't crash old carts
      audio: {
        ...rawSurface.audio,
        beep: rawSurface.audio.beep || (() => {}),
        laser: rawSurface.audio.laser || (() => {}),
        jump: rawSurface.audio.jump || (() => {}),
        hit: rawSurface.audio.hit || (() => {}),
        coin: rawSurface.audio.coin || (() => {}),
        powerup: rawSurface.audio.powerup || (() => {}),
        playTone: rawSurface.audio.playTone || (() => {})
      },
      save: rawSurface.save || (() => false),
      load: rawSurface.load || (() => null)
    };
  }
}

export const cartridgeRegistry = new CartridgeRegistry();
