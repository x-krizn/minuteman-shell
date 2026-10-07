import { Cartridge, CartridgeSurface, StripAsset, StripAssetSpec } from '../types';
import { createPocketJumpCartridge } from './pocketJump';
import { createSnake99Cartridge } from './snake99';
import { createStarPatrolCartridge } from './starPatrol';
import { createTemplateCartridge } from './template';
import { createTinyRogueCartridge } from './tinyRogue';
import { createWalkCartridge } from './walk';
import { createKnightCartridge } from './knight';

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
  createKnightCartridge,
  createWalkCartridge,
  createTemplateCartridge,
  createStarPatrolCartridge,
  createTinyRogueCartridge,
  createSnake99Cartridge,
  createPocketJumpCartridge
];

const ASSET_LIMITS = {
  cellMax: 64,
  framesMax: 64,
  rowsMax: 16,
  fpsMax: 60,
  fileBytes: 32 * 1024,
  cartBytes: 256 * 1024
};
const PNG_PREFIX = 'data:image/png;base64,';

export const loadCartridgeAssets = (cart: Cartridge): Promise<Record<string, StripAsset>> => {
  const specs = cart.assets;
  if (!specs || typeof specs !== 'object') return Promise.resolve({});

  const ids = Object.keys(specs);
  let total = 0;

  try {
    ids.forEach(id => {
      const s = specs[id];
      if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error(`${cart.id}/${id}: BAD ID`);
      if (!s || typeof s !== 'object') throw new Error(`${cart.id}/${id}: SPEC MUST BE AN OBJECT`);
      const isDataUri = typeof s.src === 'string' && s.src.startsWith(PNG_PREFIX);
      const isPath = typeof s.src === 'string' && (s.src.endsWith('.png') || s.src.includes('.png'));
      if (!isDataUri && !isPath) {
        throw new Error(`${cart.id}/${id}: PNG DATA URI OR PNG PATH ONLY`);
      }
      if (!Number.isInteger(s.cw) || s.cw < 1 || s.cw > ASSET_LIMITS.cellMax) {
        throw new Error(`${cart.id}/${id}: cw MUST BE WHOLE NUMBER 1 TO ${ASSET_LIMITS.cellMax}`);
      }
      if (!Number.isInteger(s.ch) || s.ch < 1 || s.ch > ASSET_LIMITS.cellMax) {
        throw new Error(`${cart.id}/${id}: ch MUST BE WHOLE NUMBER 1 TO ${ASSET_LIMITS.cellMax}`);
      }
      if (!Number.isInteger(s.frames) || s.frames < 1 || s.frames > ASSET_LIMITS.framesMax) {
        throw new Error(`${cart.id}/${id}: frames MUST BE WHOLE NUMBER 1 TO ${ASSET_LIMITS.framesMax}`);
      }
      if (s.rows !== undefined && (!Number.isInteger(s.rows) || s.rows < 1 || s.rows > ASSET_LIMITS.rowsMax)) {
        throw new Error(`${cart.id}/${id}: rows MUST BE WHOLE NUMBER 1 TO ${ASSET_LIMITS.rowsMax}`);
      }
      const bytes = isDataUri ? Math.floor(((s.src.length - PNG_PREFIX.length) * 3) / 4) : 2048;
      if (bytes > ASSET_LIMITS.fileBytes) {
        throw new Error(`${cart.id}/${id}: FILE IS ${bytes} BYTES, LIMIT ${ASSET_LIMITS.fileBytes}`);
      }
      total += bytes;
    });

    if (total > ASSET_LIMITS.cartBytes) {
      throw new Error(`ART IS ${total} BYTES, LIMIT ${ASSET_LIMITS.cartBytes}`);
    }
  } catch (e) {
    return Promise.reject(e);
  }

  const decodeImage = (name: string, src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      let settled = false;
      const onSuccess = () => {
        if (!settled) {
          settled = true;
          resolve(img);
        }
      };
      const onError = (err?: unknown) => {
        if (!settled) {
          settled = true;
          reject(new Error(`${name}: IMAGE DID NOT DECODE ${err ? String(err) : ''}`.trim()));
        }
      };
      img.onload = onSuccess;
      img.onerror = onError;
      img.src = src;
      if (img.complete && img.naturalWidth > 0) {
        onSuccess();
      }
    });

  const makeStrip = (id: string, s: StripAssetSpec, img: HTMLImageElement): StripAsset => {
    const { cw, ch, frames } = s;
    const rows = s.rows || 1;
    const n = frames * rows;
    const fps = s.fps || 0;
    const ax = s.ax || 0;
    const ay = s.ay || 0;
    const sheet = document.createElement('canvas');
    sheet.width = img.width;
    sheet.height = img.height;
    const sg = sheet.getContext('2d');
    if (sg) {
      sg.imageSmoothingEnabled = false;
      sg.drawImage(img, 0, 0);
    }

    return {
      id,
      cw,
      ch,
      frames,
      rows,
      fps,
      frameAt: (t: number) => (fps > 0 ? Math.floor(t * fps) % n : 0),
      draw: (g: CanvasRenderingContext2D, i: number, x: number, y: number, flipX?: boolean) => {
        const f = Math.floor(i) % n;
        const fi = f < 0 ? f + n : f;
        const sx = (fi % frames) * cw;
        const sy = Math.floor(fi / frames) * ch;
        const px = Math.round(x);
        const dy = Math.round(y) - ay;
        if (!flipX) {
          g.drawImage(sheet, sx, sy, cw, ch, px - ax, dy, cw, ch);
          return;
        }
        g.save();
        g.translate(px, 0);
        g.scale(-1, 1);
        g.drawImage(sheet, sx, sy, cw, ch, -ax, dy, cw, ch);
        g.restore();
      }
    };
  };

  return Promise.all(
    ids.map(id =>
      decodeImage(`${cart.id}/${id}`, specs[id].src).then(img => {
        const s = specs[id];
        const w = s.cw * s.frames;
        const h = s.ch * (s.rows || 1);
        if (img.width !== w || img.height !== h) {
          throw new Error(
            `${cart.id}/${id}: IMAGE IS ${img.width}x${img.height}, EXPECTED ${w}x${h}`
          );
        }
        return makeStrip(id, s, img);
      })
    )
  ).then(list => {
    const lib: Record<string, StripAsset> = {};
    list.forEach(st => {
      lib[st.id] = st;
    });
    return lib;
  });
};

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
      load: rawSurface.load || (() => null),
      assets: rawSurface.assets || {}
    };
  }
}

export const cartridgeRegistry = new CartridgeRegistry();
