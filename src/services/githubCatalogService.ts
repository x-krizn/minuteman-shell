import { CatalogCartridgeItem, CatalogManifest, Cartridge, GitSyncConfig } from '../types';
import { cartridgeRegistry } from '../cartridges/registry';
import { memoryCard } from '../memory/memoryCard';

const CATALOG_CACHE_KEY = 'minuteman_catalog_manifest_cache';
const CARTS_CODE_CACHE_KEY = 'minuteman_catalog_carts_code_cache';

export interface CatalogFetchResult {
  success: boolean;
  source: 'github' | 'local' | 'offline_cache';
  totalCartridges: number;
  newOrUpdated: number;
  catalogVersion?: string;
  message: string;
}

export interface RepoVerificationResult {
  ok: boolean;
  message: string;
  isPrivate?: boolean;
  defaultBranch?: string;
  stars?: number;
}

type CatalogListener = (items: CatalogCartridgeItem[]) => void;

class GitHubCatalogService {
  private cachedItems: CatalogCartridgeItem[] = [];
  private lastSyncedAt: string | null = null;
  private isFetching = false;
  private listeners: Set<CatalogListener> = new Set();

  constructor() {
    this.loadFromCache();
  }

  public subscribe(listener: CatalogListener): () => void {
    this.listeners.add(listener);
    if (this.cachedItems.length > 0) {
      listener(this.cachedItems);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => {
      try {
        l(this.cachedItems);
      } catch (err) {
        console.error('Catalog listener error:', err);
      }
    });
  }

  public getCachedItems(): CatalogCartridgeItem[] {
    return [...this.cachedItems];
  }

  public getLastSyncedAt(): string | null {
    return this.lastSyncedAt;
  }

  public getIsFetching(): boolean {
    return this.isFetching;
  }

  private loadFromCache() {
    try {
      const raw = localStorage.getItem(CATALOG_CACHE_KEY);
      if (raw) {
        const manifest = JSON.parse(raw) as CatalogManifest;
        if (manifest && Array.isArray(manifest.cartridges)) {
          this.cachedItems = manifest.cartridges;
          this.lastSyncedAt = manifest.updatedAt || null;
        }
      }
    } catch {
      // Ignored
    }
  }

  /**
   * Helper to parse owner and repo name from full GitHub URLs:
   * e.g. "https://github.com/alice/minuteman-carts.git" -> { owner: 'alice', repo: 'minuteman-carts' }
   */
  public parseRepoUrl(url: string): { owner: string; repo: string } | null {
    if (!url || typeof url !== 'string') return null;
    const clean = url.trim().replace(/\.git$/, '');
    const match = clean.match(/github\.com[/:]([^/]+)\/([^/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
    return null;
  }

  /**
   * Test connection to a remote GitHub repository
   */
  public async testConnection(config: Partial<GitSyncConfig>): Promise<RepoVerificationResult> {
    const owner = config.repoOwner?.trim();
    const repo = config.repoName?.trim();

    if (!owner || !repo) {
      return { ok: false, message: 'Please specify both GitHub Owner and Repository Name' };
    }

    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json'
      };
      if (config.token?.trim()) {
        headers.Authorization = `token ${config.token.trim()}`;
      }

      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (res.status === 404) {
        return {
          ok: false,
          message: config.token ? 'Repository not found or token lacks access' : 'Repository not found (or is private; token required)'
        };
      }
      if (res.status === 401) {
        return { ok: false, message: 'Bad credentials: Personal Access Token is invalid or expired' };
      }
      if (!res.ok) {
        return { ok: false, message: `GitHub API error (${res.status})` };
      }

      const info = await res.json();
      return {
        ok: true,
        message: `Connected: ${info.full_name} (${info.private ? 'Private' : 'Public'})`,
        isPrivate: info.private,
        defaultBranch: info.default_branch,
        stars: info.stargazers_count
      };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : 'Network error verifying repository'
      };
    }
  }

  /**
   * Fetches 'catalog.json' from GitHub repository (or fallback) and populates cartridge list
   */
  public async fetchCatalog(overrideConfig?: Partial<GitSyncConfig>): Promise<CatalogFetchResult> {
    if (this.isFetching) {
      return {
        success: true,
        source: 'offline_cache',
        totalCartridges: this.cachedItems.length,
        newOrUpdated: 0,
        message: 'Sync already in progress'
      };
    }

    this.isFetching = true;
    const gitConfig: GitSyncConfig = {
      ...memoryCard.getGitConfig(),
      ...(overrideConfig || {})
    };

    let manifest: CatalogManifest | null = null;
    let source: 'github' | 'local' | 'offline_cache' = 'local';
    const isGitTarget = Boolean(gitConfig.repoOwner && gitConfig.repoName);

    // 1. Try to fetch catalog.json from remote GitHub repository if configured
    if (isGitTarget) {
      const branch = gitConfig.branch || 'main';
      const possibleUrls = [
        `https://raw.githubusercontent.com/${gitConfig.repoOwner}/${gitConfig.repoName}/${branch}/catalog.json`,
        `https://raw.githubusercontent.com/${gitConfig.repoOwner}/${gitConfig.repoName}/${branch}/carts/catalog.json`,
        `https://raw.githubusercontent.com/${gitConfig.repoOwner}/${gitConfig.repoName}/${branch}/public/catalog.json`
      ];

      const headers: Record<string, string> = {};
      if (gitConfig.token) {
        headers.Authorization = `token ${gitConfig.token}`;
      }

      for (const url of possibleUrls) {
        try {
          const res = await fetch(url, { headers, cache: 'no-cache' });
          if (res.ok) {
            manifest = await res.json();
            source = 'github';
            break;
          }
        } catch {
          // Continue to next URL candidate
        }
      }
    }

    // 2. If GitHub fetch didn't yield a catalog, fallback to local host catalog.json
    if (!manifest) {
      const localCandidates = ['/catalog.json', '/carts/manifest.json'];
      for (const localUrl of localCandidates) {
        try {
          const res = await fetch(localUrl, { cache: 'no-cache' });
          if (res.ok) {
            manifest = await res.json();
            source = 'local';
            break;
          }
        } catch {
          // Ignored
        }
      }
    }

    // 3. If network unavailable, fallback to previously stored offline cache
    if (!manifest) {
      try {
        const raw = localStorage.getItem(CATALOG_CACHE_KEY);
        if (raw) {
          manifest = JSON.parse(raw);
          source = 'offline_cache';
        }
      } catch {}
    }

    if (!manifest || !Array.isArray(manifest.cartridges)) {
      this.isFetching = false;
      return {
        success: false,
        source: 'local',
        totalCartridges: this.cachedItems.length,
        newOrUpdated: 0,
        message: 'Could not load catalog.json from repository or local cache.'
      };
    }

    // Save manifest cache
    this.cachedItems = manifest.cartridges;
    this.lastSyncedAt = new Date().toISOString();
    try {
      localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(manifest));
    } catch {}

    // 4. Download and register any new/updated cartridges
    const codeCacheRaw = localStorage.getItem(CARTS_CODE_CACHE_KEY);
    const codeCache: Record<string, { code: string; version: string }> = codeCacheRaw ? JSON.parse(codeCacheRaw) : {};
    let newOrUpdated = 0;

    for (const item of manifest.cartridges) {
      const isCached = codeCache[item.id] && codeCache[item.id].version === item.version;

      if (!isCached) {
        // Resolve script URL (relative paths resolve against GitHub raw if source was GitHub)
        let scriptUrl = item.file;
        if (source === 'github' && !item.file.startsWith('http') && gitConfig.repoOwner && gitConfig.repoName) {
          const cleanPath = item.file.startsWith('/') ? item.file.slice(1) : item.file;
          scriptUrl = `https://raw.githubusercontent.com/${gitConfig.repoOwner}/${gitConfig.repoName}/${gitConfig.branch || 'main'}/${cleanPath}`;
        }

        try {
          const fetchHeaders: Record<string, string> = {};
          if (source === 'github' && gitConfig.token) {
            fetchHeaders.Authorization = `token ${gitConfig.token}`;
          }

          const scriptRes = await fetch(scriptUrl, { headers: fetchHeaders, cache: 'no-cache' });
          if (scriptRes.ok) {
            const code = await scriptRes.text();
            const registered = this.evaluateAndRegister(code);
            if (registered) {
              codeCache[item.id] = { code, version: item.version };
              newOrUpdated++;
            }
          }
        } catch (fetchErr) {
          cartridgeRegistry.logError(`CATALOG FETCH ${item.id} ERR: ${String(fetchErr)}`);
        }
      } else {
        // Run from existing cache to ensure registration
        this.evaluateAndRegister(codeCache[item.id].code);
      }
    }

    try {
      localStorage.setItem(CARTS_CODE_CACHE_KEY, JSON.stringify(codeCache));
    } catch {}

    this.isFetching = false;
    this.notify();

    const resultMessage = source === 'github'
      ? `Fetched from GitHub (${gitConfig.repoOwner}/${gitConfig.repoName}): ${manifest.cartridges.length} carts (${newOrUpdated} updated)`
      : source === 'local'
      ? `Loaded local catalog: ${manifest.cartridges.length} carts (${newOrUpdated} updated)`
      : `Restored ${manifest.cartridges.length} carts from offline cache`;

    return {
      success: true,
      source,
      totalCartridges: manifest.cartridges.length,
      newOrUpdated,
      catalogVersion: manifest.catalogVersion,
      message: resultMessage
    };
  }

  private evaluateAndRegister(code: string): boolean {
    try {
      const fn = new Function('Minuteman', code);
      let registeredCart: Cartridge | null = null;
      const mockMinuteman = {
        register: (c: Cartridge) => {
          registeredCart = c;
        }
      };
      fn(mockMinuteman);

      if (registeredCart) {
        return cartridgeRegistry.register(registeredCart);
      }
      return false;
    } catch (e) {
      cartridgeRegistry.logError(`DYNAMIC REG ERROR: ${String(e)}`);
      return false;
    }
  }
}

export const githubCatalogService = new GitHubCatalogService();
