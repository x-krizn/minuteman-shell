import { GitSyncConfig, MemorySlot, SaveSnapshot } from '../types';

const STORAGE_KEY = 'minuteman_memory_card';
const GIT_CONFIG_KEY = 'minuteman_git_config';
const MAX_SNAPSHOTS_PER_SLOT = 10;

export interface GitSyncNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: string;
}

type NotificationListener = (notification: GitSyncNotification) => void;

class MemoryCardSystem {
  private slots: Record<string, MemorySlot> = {};
  private gitConfig: GitSyncConfig = {
    repoUrl: '',
    repoOwner: '',
    repoName: '',
    branch: 'main',
    token: ''
  };
  private notificationListeners: Set<NotificationListener> = new Set();

  constructor() {
    this.loadFromStorage();
    this.loadGitConfig();
  }

  public subscribeNotification(listener: NotificationListener): () => void {
    this.notificationListeners.add(listener);
    return () => {
      this.notificationListeners.delete(listener);
    };
  }

  private dispatchNotification(title: string, message: string, type: 'success' | 'error' | 'info') {
    const notification: GitSyncNotification = {
      id: Math.random().toString(36).slice(2, 9),
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    this.notificationListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (err) {
        console.error('Notification dispatch error:', err);
      }
    });
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.slots = JSON.parse(raw);
      }
    } catch {
      this.slots = {};
    }
  }

  private persistToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.slots));
    } catch (e) {
      console.warn('Memory card storage quota reached', e);
    }
  }

  private loadGitConfig() {
    try {
      const raw = localStorage.getItem(GIT_CONFIG_KEY);
      if (raw) {
        this.gitConfig = { ...this.gitConfig, ...JSON.parse(raw) };
      }
    } catch {
      // Ignored
    }
  }

  public getGitConfig(): GitSyncConfig {
    return { ...this.gitConfig };
  }

  public setGitConfig(config: Partial<GitSyncConfig>) {
    this.gitConfig = { ...this.gitConfig, ...config };
    try {
      localStorage.setItem(GIT_CONFIG_KEY, JSON.stringify(this.gitConfig));
    } catch {}
  }

  public saveCartridgeData(cartId: string, cartName: string, data: unknown, description?: string): boolean {
    if (!cartId) return false;
    try {
      const json = JSON.stringify(data);
      const sizeBytes = new Blob([json]).size;
      const now = new Date().toISOString();

      const existingSlot = this.slots[cartId];
      const snapshots: SaveSnapshot[] = existingSlot?.snapshots ? [...existingSlot.snapshots] : [];

      // If existing data differs, push previous state into undo stack snapshot
      if (existingSlot && existingSlot.data !== undefined) {
        const prevJson = JSON.stringify(existingSlot.data);
        if (prevJson !== json) {
          snapshots.unshift({
            id: 'snap_' + Math.random().toString(36).slice(2, 9),
            timestamp: existingSlot.updatedAt,
            sizeBytes: existingSlot.sizeBytes,
            data: existingSlot.data,
            description: description || `Auto-save checkpoint`
          });
          // Limit undo history
          if (snapshots.length > MAX_SNAPSHOTS_PER_SLOT) {
            snapshots.pop();
          }
        }
      }

      this.slots[cartId] = {
        cartId,
        cartName,
        updatedAt: now,
        sizeBytes,
        data,
        dirty: true,
        snapshots
      };

      this.persistToStorage();
      return true;
    } catch (e) {
      console.error('Failed to save cartridge data:', e);
      return false;
    }
  }

  public loadCartridgeData(cartId: string): unknown | null {
    if (!cartId || !this.slots[cartId]) return null;
    return this.slots[cartId].data;
  }

  public getAllSlots(): MemorySlot[] {
    return Object.values(this.slots);
  }

  public getSlot(cartId: string): MemorySlot | undefined {
    return this.slots[cartId];
  }

  public getSnapshots(cartId: string): SaveSnapshot[] {
    const slot = this.slots[cartId];
    return slot?.snapshots ? [...slot.snapshots] : [];
  }

  /**
   * Revert save state to a previous snapshot (local undo)
   */
  public revertToSnapshot(cartId: string, snapshotId: string): boolean {
    const slot = this.slots[cartId];
    if (!slot || !slot.snapshots) return false;

    const snapIndex = slot.snapshots.findIndex(s => s.id === snapshotId);
    if (snapIndex === -1) return false;

    const targetSnapshot = slot.snapshots[snapIndex];

    // Preserve the current state before reverting so user can re-revert
    const currentAsSnap: SaveSnapshot = {
      id: 'snap_' + Math.random().toString(36).slice(2, 9),
      timestamp: slot.updatedAt,
      sizeBytes: slot.sizeBytes,
      data: slot.data,
      description: 'Pre-revert state'
    };

    // Remove the target snapshot from the list and put current state at top
    const updatedSnapshots = slot.snapshots.filter(s => s.id !== snapshotId);
    updatedSnapshots.unshift(currentAsSnap);

    slot.data = targetSnapshot.data;
    slot.sizeBytes = targetSnapshot.sizeBytes;
    slot.updatedAt = new Date().toISOString();
    slot.dirty = true;
    slot.snapshots = updatedSnapshots.slice(0, MAX_SNAPSHOTS_PER_SLOT);

    this.persistToStorage();
    return true;
  }

  /**
   * Create an explicit named snapshot (checkpoint)
   */
  public createManualSnapshot(cartId: string, description: string = 'Manual checkpoint'): boolean {
    const slot = this.slots[cartId];
    if (!slot || slot.data === undefined) return false;

    const snapshots = slot.snapshots ? [...slot.snapshots] : [];
    snapshots.unshift({
      id: 'snap_' + Math.random().toString(36).slice(2, 9),
      timestamp: new Date().toISOString(),
      sizeBytes: slot.sizeBytes,
      data: slot.data,
      description
    });

    slot.snapshots = snapshots.slice(0, MAX_SNAPSHOTS_PER_SLOT);
    this.persistToStorage();
    return true;
  }

  public deleteSnapshot(cartId: string, snapshotId: string): boolean {
    const slot = this.slots[cartId];
    if (!slot || !slot.snapshots) return false;

    slot.snapshots = slot.snapshots.filter(s => s.id !== snapshotId);
    this.persistToStorage();
    return true;
  }

  public deleteSlot(cartId: string): boolean {
    if (this.slots[cartId]) {
      delete this.slots[cartId];
      this.persistToStorage();
      return true;
    }
    return false;
  }

  public formatMemoryCard() {
    this.slots = {};
    this.persistToStorage();
  }

  public getPendingSyncCount(): number {
    return Object.values(this.slots).filter(s => s.dirty).length;
  }

  public exportBackup(): string {
    return JSON.stringify({
      version: '1.0',
      system: 'minuteman',
      exportedAt: new Date().toISOString(),
      slots: this.slots
    }, null, 2);
  }

  public importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed.slots === 'object') {
        this.slots = { ...this.slots, ...parsed.slots };
        this.persistToStorage();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public async syncToGit(): Promise<{ success: boolean; message: string }> {
    const { repoOwner, repoName, branch, token } = this.gitConfig;
    if (!repoOwner || !repoName || !token) {
      const msg = 'Git credentials missing. Configure in settings.';
      this.dispatchNotification('Git Push Failed', msg, 'error');
      return { success: false, message: msg };
    }

    try {
      const path = 'minuteman-saves.xks';
      const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}?ref=${branch}`;

      // 1. Check existing file sha if present
      let sha: string | undefined;
      const getRes = await fetch(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      if (getRes.ok) {
        const body = await getRes.json();
        sha = body.sha;
      }

      // 2. Prepare payload
      const contentStr = this.exportBackup();
      const encoded = btoa(unescape(encodeURIComponent(contentStr)));

      const putRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`, {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Minuteman Memory Card sync: ${new Date().toLocaleTimeString()}`,
          content: encoded,
          branch,
          sha
        })
      });

      if (!putRes.ok) {
        const errData = await putRes.json().catch(() => ({}));
        const err = errData.message || `Git API error (${putRes.status})`;
        this.dispatchNotification('Git Push Failed', err, 'error');
        return {
          success: false,
          message: err
        };
      }

      // Mark all slots as synced
      Object.values(this.slots).forEach(slot => {
        slot.dirty = false;
      });
      this.persistToStorage();

      this.setGitConfig({ lastSynced: new Date().toISOString() });

      const msg = `Synced ${Object.keys(this.slots).length} save(s) to ${repoOwner}/${repoName}`;
      this.dispatchNotification('Git Push Complete', msg, 'success');
      return {
        success: true,
        message: msg
      };
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : 'Network error during Git sync';
      this.dispatchNotification('Git Push Failed', err, 'error');
      return {
        success: false,
        message: err
      };
    }
  }

  public async syncFromGit(): Promise<{ success: boolean; message: string }> {
    const { repoOwner, repoName, branch, token } = this.gitConfig;
    if (!repoOwner || !repoName || !token) {
      const msg = 'Git credentials missing.';
      this.dispatchNotification('Git Pull Failed', msg, 'error');
      return { success: false, message: msg };
    }

    try {
      const path = 'minuteman-saves.xks';
      const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}?ref=${branch}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      if (!res.ok) {
        const msg = `Save file not found on ${branch} branch`;
        this.dispatchNotification('Git Pull Notice', msg, 'info');
        return { success: false, message: msg };
      }

      const body = await res.json();
      const decoded = decodeURIComponent(escape(atob(body.content)));
      const ok = this.importBackup(decoded);

      if (ok) {
        Object.values(this.slots).forEach(slot => {
          slot.dirty = false;
        });
        this.persistToStorage();
        this.setGitConfig({ lastSynced: new Date().toISOString() });
        const msg = `Restored ${Object.keys(this.slots).length} save(s) from Git`;
        this.dispatchNotification('Git Pull Complete', msg, 'success');
        return { success: true, message: msg };
      }
      const err = 'Invalid save data in remote file';
      this.dispatchNotification('Git Pull Failed', err, 'error');
      return { success: false, message: err };
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : 'Network error during Git pull';
      this.dispatchNotification('Git Pull Failed', err, 'error');
      return {
        success: false,
        message: err
      };
    }
  }
}

export const memoryCard = new MemoryCardSystem();
