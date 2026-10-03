import React, { useState, useEffect } from 'react';
import { memoryCard } from '../memory/memoryCard';
import { soundEngine } from '../audio/soundEngine';
import { githubCatalogService, RepoVerificationResult } from '../services/githubCatalogService';
import { GitSyncConfig } from '../types';
import {
  HardDrive,
  Cloud,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  GitBranch,
  Github,
  Check,
  Package,
  Layers,
  RotateCcw,
  History,
  Bookmark,
  Plus
} from 'lucide-react';

interface MemoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SyncPhase = 'idle' | 'connecting' | 'serializing' | 'committing' | 'complete' | 'error';

export const MemoryCardModal: React.FC<MemoryCardModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'slots' | 'git' | 'catalog'>('slots');
  const [gitConfig, setGitConfig] = useState<GitSyncConfig>(memoryCard.getGitConfig());
  const [showToken, setShowToken] = useState(false);
  const [expandedSnapshots, setExpandedSnapshots] = useState<Record<string, boolean>>({});

  // Sync state & visual animations
  const [syncPhase, setSyncPhase] = useState<SyncPhase>('idle');
  const [syncType, setSyncType] = useState<'push' | 'pull' | 'catalog'>('push');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Test connection state
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<RepoVerificationResult | null>(null);

  // Catalog sync state
  const [isFetchingCatalog, setIsFetchingCatalog] = useState(false);
  const [catalogItems, setCatalogItems] = useState(githubCatalogService.getCachedItems());

  const [, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setGitConfig(memoryCard.getGitConfig());
      setCatalogItems(githubCatalogService.getCachedItems());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const slots = memoryCard.getAllSlots();
  const pendingCount = memoryCard.getPendingSyncCount();
  const isSyncing = syncPhase === 'connecting' || syncPhase === 'serializing' || syncPhase === 'committing';

  // Handle URL change with auto-parsing
  const handleRepoUrlChange = (url: string) => {
    const parsed = githubCatalogService.parseRepoUrl(url);
    if (parsed) {
      setGitConfig(prev => ({
        ...prev,
        repoUrl: url,
        repoOwner: parsed.owner,
        repoName: parsed.repo
      }));
    } else {
      setGitConfig(prev => ({ ...prev, repoUrl: url }));
    }
    setTestResult(null);
  };

  const handleSaveGitConfig = (e: React.FormEvent) => {
    e.preventDefault();
    memoryCard.setGitConfig(gitConfig);
    soundEngine.menuSelect();
    setStatusMsg({ text: 'Git settings saved to Minuteman console memory.', type: 'success' });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setTestResult(null);
    setStatusMsg(null);
    const res = await githubCatalogService.testConnection(gitConfig);
    setIsTestingConn(false);
    setTestResult(res);
    if (res.ok) {
      soundEngine.powerup();
    } else {
      soundEngine.menuBack();
    }
  };

  // Push saves to GitHub with phased animations
  const handleSyncToGit = async () => {
    setSyncType('push');
    setSyncPhase('connecting');
    setStatusMsg(null);

    // Simulated phase pacing for visual feedback
    const t1 = setTimeout(() => setSyncPhase('serializing'), 350);
    const t2 = setTimeout(() => setSyncPhase('committing'), 750);

    const res = await memoryCard.syncToGit();
    clearTimeout(t1);
    clearTimeout(t2);

    if (res.success) {
      setSyncPhase('complete');
      soundEngine.powerup();
      setStatusMsg({ text: res.message, type: 'success' });
      setRefreshKey(k => k + 1);
      setTimeout(() => setSyncPhase('idle'), 5000);
    } else {
      setSyncPhase('error');
      soundEngine.menuBack();
      setStatusMsg({ text: res.message, type: 'error' });
    }
  };

  // Pull saves from GitHub with phased animations
  const handleSyncFromGit = async () => {
    setSyncType('pull');
    setSyncPhase('connecting');
    setStatusMsg(null);

    const t1 = setTimeout(() => setSyncPhase('committing'), 400);

    const res = await memoryCard.syncFromGit();
    clearTimeout(t1);

    if (res.success) {
      setSyncPhase('complete');
      soundEngine.powerup();
      setStatusMsg({ text: res.message, type: 'success' });
      setRefreshKey(k => k + 1);
      setTimeout(() => setSyncPhase('idle'), 5000);
    } else {
      setSyncPhase('error');
      soundEngine.menuBack();
      setStatusMsg({ text: res.message, type: 'error' });
    }
  };

  // Fetch dynamic catalog.json from repo
  const handleFetchCatalogFromRepo = async () => {
    setIsFetchingCatalog(true);
    setSyncType('catalog');
    setSyncPhase('connecting');
    setStatusMsg(null);

    const res = await githubCatalogService.fetchCatalog(gitConfig);
    setIsFetchingCatalog(false);

    if (res.success) {
      setSyncPhase('complete');
      soundEngine.powerup();
      setCatalogItems(githubCatalogService.getCachedItems());
      setStatusMsg({ text: res.message, type: 'success' });
      setRefreshKey(k => k + 1);
      setTimeout(() => setSyncPhase('idle'), 5000);
    } else {
      setSyncPhase('error');
      soundEngine.menuBack();
      setStatusMsg({ text: res.message, type: 'error' });
    }
  };

  const handleExportFile = () => {
    const data = memoryCard.exportBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minuteman_memory_card_${new Date().toISOString().slice(0, 10)}.xks`;
    a.click();
    URL.revokeObjectURL(url);
    soundEngine.coin();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (content && memoryCard.importBackup(content)) {
        soundEngine.powerup();
        setStatusMsg({ text: `Imported saves from ${file.name}`, type: 'success' });
        setRefreshKey(k => k + 1);
      } else {
        soundEngine.menuBack();
        setStatusMsg({ text: 'Failed to parse backup file', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteSlot = (cartId: string) => {
    if (confirm(`Delete save for "${cartId}"?`)) {
      memoryCard.deleteSlot(cartId);
      soundEngine.menuBack();
      setRefreshKey(k => k + 1);
    }
  };

  const handleRevertSnapshot = (cartId: string, snapId: string) => {
    if (confirm('Revert to this snapshot? Current state will be stored as an undo point.')) {
      if (memoryCard.revertToSnapshot(cartId, snapId)) {
        soundEngine.powerup();
        setStatusMsg({ text: `Reverted "${cartId}" save state (undo checkpoint created).`, type: 'success' });
        setRefreshKey(k => k + 1);
      }
    }
  };

  const handleCreateSnapshot = (cartId: string) => {
    const desc = prompt('Enter a label for this checkpoint snapshot (optional):', 'Manual checkpoint');
    if (desc !== null) {
      if (memoryCard.createManualSnapshot(cartId, desc || 'Manual checkpoint')) {
        soundEngine.coin();
        setStatusMsg({ text: `Created snapshot checkpoint for "${cartId}".`, type: 'success' });
        setRefreshKey(k => k + 1);
      }
    }
  };

  const handleDeleteSnapshot = (cartId: string, snapId: string) => {
    if (confirm('Delete this historical snapshot?')) {
      memoryCard.deleteSnapshot(cartId, snapId);
      soundEngine.menuBack();
      setRefreshKey(k => k + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fade-in font-mono">
      <div className="bg-[#181d1a] border-2 border-emerald-500/50 rounded-xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-emerald-100 overflow-hidden relative">
        
        {/* Animated Progress Bar (visible during sync operations) */}
        {isSyncing && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-950 overflow-hidden z-20">
            <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-400 animate-[pulse_1s_infinite] w-full" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-emerald-900 bg-[#121614]">
          <div className="flex items-center gap-2.5">
            <HardDrive className="text-emerald-400" size={18} />
            <h2 className="text-sm sm:text-base font-bold text-emerald-400 tracking-wider uppercase">
              Minuteman Memory Card
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              HOST STORAGE
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-400 hover:text-white px-2 py-1 text-sm rounded hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-emerald-900 bg-[#141916] text-xs font-bold">
          <button
            onClick={() => setActiveTab('slots')}
            className={`flex-1 py-2.5 tracking-wider transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'slots'
                ? 'border-b-2 border-emerald-400 text-emerald-300 bg-emerald-950/40'
                : 'text-emerald-500/70 hover:text-emerald-300'
            }`}
          >
            <HardDrive size={13} />
            <span>SAVES ({slots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('git')}
            className={`flex-1 py-2.5 tracking-wider transition-colors flex items-center justify-center gap-2 relative ${
              activeTab === 'git'
                ? 'border-b-2 border-emerald-400 text-emerald-300 bg-emerald-950/40'
                : 'text-emerald-500/70 hover:text-emerald-300'
            }`}
          >
            <Cloud size={13} />
            <span>GIT CLOUD CONFIG</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-2.5 tracking-wider transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'catalog'
                ? 'border-b-2 border-emerald-400 text-emerald-300 bg-emerald-950/40'
                : 'text-emerald-500/70 hover:text-emerald-300'
            }`}
          >
            <Layers size={13} />
            <span>CARTRIDGE CATALOG ({catalogItems.length})</span>
          </button>
        </div>

        {/* Active Sync Visual Feedback Animation Banner */}
        {isSyncing && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs shadow-lg animate-pulse flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="animate-spin text-emerald-400" size={16} />
              <div>
                <div className="font-bold tracking-wider text-emerald-300">
                  {syncType === 'push' && 'PUSHING SAVES TO GITHUB REPOSITORY...'}
                  {syncType === 'pull' && 'PULLING SAVES FROM GITHUB REPOSITORY...'}
                  {syncType === 'catalog' && 'FETCHING catalog.json FROM REPOSITORY...'}
                </div>
                <div className="text-[10px] text-emerald-400/80 mt-0.5">
                  {syncPhase === 'connecting' && 'Step 1/3: Authenticating & connecting to GitHub API...'}
                  {syncPhase === 'serializing' && 'Step 2/3: Serializing console memory blocks...'}
                  {syncPhase === 'committing' && 'Step 3/3: Committing minuteman-saves.xks to Git branch...'}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-emerald-300">
              IN PROGRESS
            </span>
          </div>
        )}

        {/* Completed Sync Success Banner Animation */}
        {syncPhase === 'complete' && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-emerald-950/90 border-2 border-emerald-400 text-emerald-200 text-xs shadow-lg flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold">
                <Check size={13} />
              </div>
              <div>
                <span className="font-bold text-emerald-300">GIT SYNC OPERATION COMPLETE</span>
                <p className="text-[10px] text-emerald-400/90 mt-0.5">
                  {statusMsg?.text || 'Memory state synchronized with remote repository.'}
                </p>
              </div>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-900 border border-emerald-500 text-emerald-200 font-bold uppercase tracking-wider">
              SUCCESS
            </span>
          </div>
        )}

        {/* Error Banner Animation */}
        {syncPhase === 'error' && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-red-950/90 border-2 border-red-500 text-red-200 text-xs shadow-lg flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="text-red-400" size={16} />
              <div>
                <span className="font-bold text-red-300">SYNC OPERATION FAILED</span>
                <p className="text-[10px] text-red-300/80 mt-0.5">
                  {statusMsg?.text || 'Please verify repository name, branch, and token credentials.'}
                </p>
              </div>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded bg-red-900 border border-red-500 text-red-200 font-bold uppercase tracking-wider">
              ERROR
            </span>
          </div>
        )}

        {/* Regular Status Message */}
        {statusMsg && syncPhase === 'idle' && (
          <div
            className={`mx-4 mt-4 p-2.5 rounded text-xs flex items-center gap-2 border animate-fade-in ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/70 border-red-500/50 text-red-200'
            }`}
          >
            {statusMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Body content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* TAB 1: SAVE SLOTS */}
          {activeTab === 'slots' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-emerald-400/80">
                <span>Console Memory Blocks ({slots.length}):</span>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-2 py-1 rounded bg-emerald-950 border border-emerald-800 text-[11px] hover:bg-emerald-900 transition-colors flex items-center gap-1">
                    <Upload size={11} />
                    <span>Import .xks</span>
                    <input
                      type="file"
                      accept=".xks,.json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleExportFile}
                    className="px-2 py-1 rounded bg-emerald-950 border border-emerald-800 text-[11px] hover:bg-emerald-900 transition-colors flex items-center gap-1"
                  >
                    <Download size={11} />
                    <span>Backup .xks</span>
                  </button>
                </div>
              </div>

              {slots.length === 0 ? (
                <div className="text-center py-10 text-xs text-emerald-600/70 border border-dashed border-emerald-900/60 rounded-lg">
                  MEMORY CARD IS EMPTY.
                  <p className="mt-1 text-[11px] text-emerald-700">
                    Play any cartridge to automatically write save blocks.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {slots.map(slot => {
                    const snapCount = slot.snapshots?.length || 0;
                    const isExpanded = !!expandedSnapshots[slot.cartId];

                    return (
                      <div
                        key={slot.cartId}
                        className="rounded-lg bg-black/40 border border-emerald-900/60 overflow-hidden text-xs hover:border-emerald-700/60 transition-colors"
                      >
                        <div className="p-3 flex items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="font-bold text-white uppercase flex items-center gap-2">
                              <span>{slot.cartName}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                  slot.dirty
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                                }`}
                              >
                                {slot.dirty ? 'OFFLINE SAVE' : 'GIT SYNCED'}
                              </span>
                            </div>
                            <div className="text-[10px] text-emerald-500/70">
                              {slot.sizeBytes} bytes · Active: {new Date(slot.updatedAt).toLocaleTimeString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCreateSnapshot(slot.cartId)}
                              title="Create checkpoint snapshot"
                              className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[10px] flex items-center gap-1 transition-colors"
                            >
                              <Plus size={10} />
                              <span>Checkpoint</span>
                            </button>

                            <button
                              onClick={() => setExpandedSnapshots(prev => ({ ...prev, [slot.cartId]: !prev[slot.cartId] }))}
                              title="View undo history and snapshots"
                              className={`px-2 py-1 rounded border text-[10px] flex items-center gap-1 transition-colors ${
                                isExpanded
                                  ? 'bg-emerald-900 border-emerald-500 text-white font-bold'
                                  : 'bg-black/60 border-emerald-900 text-emerald-400 hover:bg-emerald-950'
                              }`}
                            >
                              <History size={10} />
                              <span>Undo Stack ({snapCount})</span>
                            </button>

                            <button
                              onClick={() => handleDeleteSlot(slot.cartId)}
                              className="p-1.5 rounded hover:bg-red-950/40 text-emerald-700 hover:text-red-400 transition-colors ml-1"
                              title="Delete Save Block"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Snapshots Undo Stack */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 border-t border-emerald-950 bg-black/60 space-y-1.5 animate-fade-in">
                            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-between">
                              <span>Snapshot History (Revert / Undo):</span>
                              <span className="text-[9px] text-emerald-600 font-normal">Reverting stores an undo point</span>
                            </div>

                            {snapCount === 0 ? (
                              <div className="text-[10px] text-emerald-700 italic py-2 text-center">
                                No prior snapshots recorded yet. Auto-saves and checkpoints will appear here.
                              </div>
                            ) : (
                              <div className="space-y-1 max-h-40 overflow-y-auto">
                                {slot.snapshots!.map((snap, sIdx) => (
                                  <div
                                    key={snap.id}
                                    className="p-2 rounded bg-[#101412] border border-emerald-900/50 flex items-center justify-between gap-2 text-[10px]"
                                  >
                                    <div className="space-y-0.5">
                                      <div className="text-emerald-200 font-bold flex items-center gap-1.5">
                                        <Bookmark size={9} className="text-emerald-400" />
                                        <span>{snap.description || `Checkpoint #${snapCount - sIdx}`}</span>
                                      </div>
                                      <div className="text-[9px] text-emerald-600">
                                        {new Date(snap.timestamp).toLocaleString()} ({snap.sizeBytes} bytes)
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleRevertSnapshot(slot.cartId, snap.id)}
                                        className="px-2 py-0.5 rounded bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors flex items-center gap-1 text-[9px]"
                                        title="Revert save data to this snapshot"
                                      >
                                        <RotateCcw size={9} />
                                        <span>Revert</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSnapshot(slot.cartId, snap.id)}
                                        className="p-1 rounded text-emerald-700 hover:text-red-400 transition-colors"
                                        title="Delete this snapshot"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GIT CLOUD CONFIGURATION */}
          {activeTab === 'git' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-black/40 border border-emerald-900/70 text-[11px] text-emerald-300/90 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                  <Github size={14} />
                  <span>Personal Git Cloud Persistence</span>
                </div>
                Connect your GitHub repository to sync saves across phones, laptops, and desktop browsers.
                Minuteman stores your saves as <code className="text-emerald-300 font-bold bg-black/60 px-1 py-0.5 rounded">minuteman-saves.xks</code>.
              </div>

              <form onSubmit={handleSaveGitConfig} className="space-y-3.5">
                {/* 1. Repository URL with Auto-Parser */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold">
                      Git Repository URL (Auto-fills Owner & Repo)
                    </label>
                    <span className="text-[10px] text-emerald-600">HTTPS or SSH</span>
                  </div>
                  <input
                    type="text"
                    value={gitConfig.repoUrl || ''}
                    onChange={e => handleRepoUrlChange(e.target.value)}
                    placeholder="https://github.com/username/my-minuteman-console"
                    className="w-full px-3 py-2 rounded bg-black/60 border border-emerald-900 text-emerald-200 outline-none focus:border-emerald-400 font-mono text-xs"
                  />
                </div>

                {/* 2. Owner & Repo Name (Auto-populated or manual) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-emerald-500 uppercase mb-1 font-bold">
                      Repository Owner / User
                    </label>
                    <input
                      type="text"
                      value={gitConfig.repoOwner}
                      onChange={e => {
                        setGitConfig({ ...gitConfig, repoOwner: e.target.value });
                        setTestResult(null);
                      }}
                      placeholder="e.g. octocat"
                      className="w-full px-2.5 py-1.5 rounded bg-black/50 border border-emerald-900 text-emerald-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-emerald-500 uppercase mb-1 font-bold">
                      Repository Name
                    </label>
                    <input
                      type="text"
                      value={gitConfig.repoName}
                      onChange={e => {
                        setGitConfig({ ...gitConfig, repoName: e.target.value });
                        setTestResult(null);
                      }}
                      placeholder="e.g. minuteman-saves"
                      className="w-full px-2.5 py-1.5 rounded bg-black/50 border border-emerald-900 text-emerald-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* 3. Branch & Token */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-500 uppercase mb-1 font-bold">
                      <GitBranch size={11} />
                      <span>Branch</span>
                    </div>
                    <input
                      type="text"
                      value={gitConfig.branch}
                      onChange={e => {
                        setGitConfig({ ...gitConfig, branch: e.target.value });
                        setTestResult(null);
                      }}
                      placeholder="main"
                      className="w-full px-2.5 py-1.5 rounded bg-black/50 border border-emerald-900 text-emerald-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-emerald-500 uppercase mb-1 font-bold">
                      <span>Personal Access Token (PAT)</span>
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="text-emerald-400 hover:text-white flex items-center gap-0.5"
                      >
                        {showToken ? <EyeOff size={11} /> : <Eye size={11} />}
                        <span>{showToken ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={gitConfig.token}
                      onChange={e => {
                        setGitConfig({ ...gitConfig, token: e.target.value });
                        setTestResult(null);
                      }}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-2.5 py-1.5 rounded bg-black/50 border border-emerald-900 text-emerald-200 outline-none focus:border-emerald-500"
                    />
                    <div className="text-[9px] text-emerald-600 mt-1">
                      Needs <code className="text-emerald-400">repo</code> (or fine-grained <code className="text-emerald-400">Contents: Read & write</code>)
                    </div>
                  </div>
                </div>

                {/* Test Connection Banner */}
                {testResult && (
                  <div
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      testResult.ok
                        ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                        : 'bg-red-950/70 border-red-500/60 text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {testResult.ok ? <Check size={14} className="text-emerald-400" /> : <AlertCircle size={14} className="text-red-400" />}
                      <span>{testResult.message}</span>
                    </div>
                    {testResult.ok && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-emerald-300">
                        {testResult.isPrivate ? 'PRIVATE REPO' : 'PUBLIC REPO'}
                      </span>
                    )}
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    disabled={isTestingConn || !gitConfig.repoOwner || !gitConfig.repoName}
                    onClick={handleTestConnection}
                    className="px-3 py-1.5 text-xs rounded bg-black/60 border border-emerald-800 text-emerald-300 hover:bg-emerald-950 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {isTestingConn && <RefreshCw size={11} className="animate-spin" />}
                    <span>Test Repository Access</span>
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold rounded bg-emerald-900 border border-emerald-500 text-emerald-200 hover:bg-emerald-800 transition-colors shadow-sm"
                  >
                    Save Git Settings
                  </button>
                </div>
              </form>

              {/* Sync Actions Bar */}
              <div className="pt-4 border-t border-emerald-900/60 flex flex-wrap gap-2.5 items-center justify-between">
                <span className="text-[10px] text-emerald-500/70">
                  {gitConfig.lastSynced
                    ? `Last synced: ${new Date(gitConfig.lastSynced).toLocaleString()}`
                    : 'Not yet synced with Git'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    disabled={isSyncing}
                    onClick={handleSyncFromGit}
                    className="px-3 py-1.5 rounded bg-black/60 border border-emerald-800 text-emerald-300 hover:bg-emerald-950 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Download size={12} />
                    <span>Pull from Git</span>
                  </button>
                  <button
                    disabled={isSyncing}
                    onClick={handleSyncToGit}
                    className="px-4 py-1.5 rounded bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <Cloud size={12} />
                    <span>{isSyncing ? 'Syncing...' : 'Push Saves to Git'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DYNAMIC CARTRIDGE CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-black/40 border border-emerald-900/70 text-[11px] text-emerald-300/90 leading-relaxed flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-400 mb-0.5">Dynamic Cartridge Catalog Engine</div>
                  <span>
                    Minuteman queries <code className="text-emerald-300 font-bold bg-black/60 px-1 py-0.5 rounded">catalog.json</code> to discover new games on the fly without rebuilding.
                  </span>
                </div>
                <button
                  disabled={isFetchingCatalog}
                  onClick={handleFetchCatalogFromRepo}
                  className="px-3 py-1.5 rounded bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors flex items-center gap-1.5 shrink-0 ml-3 disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isFetchingCatalog ? 'animate-spin' : ''} />
                  <span>{isFetchingCatalog ? 'Checking...' : 'Check Repo for Carts'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] text-emerald-500 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Discovered Cartridges ({catalogItems.length})</span>
                  <span className="text-[10px] text-emerald-600 lowercase">
                    {githubCatalogService.getLastSyncedAt()
                      ? `updated ${new Date(githubCatalogService.getLastSyncedAt()!).toLocaleTimeString()}`
                      : 'local manifest'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {catalogItems.map(cart => (
                    <div
                      key={cart.id}
                      className="p-3 rounded-lg bg-black/40 border border-emerald-900/70 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white uppercase">{cart.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            v{cart.version}
                          </span>
                          {cart.author && (
                            <span className="text-[10px] text-emerald-600">by {cart.author}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-400/80">{cart.description}</p>
                        <div className="text-[9px] font-mono text-emerald-600">
                          Script: {cart.file}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 font-mono">
                          READY
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-emerald-900 bg-[#121614] flex justify-between items-center text-[11px] text-emerald-600">
          <div className="flex items-center gap-2">
            <span>Minuteman Console Host · Sandboxed Storage</span>
            {pendingCount > 0 && (
              <span className="text-amber-400 font-bold">({pendingCount} save pending Git push)</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-900 transition-colors border border-emerald-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
