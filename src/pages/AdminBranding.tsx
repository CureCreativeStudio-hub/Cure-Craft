import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Lock, 
  Upload, 
  X, 
  AlertCircle, 
  ArrowLeft, 
  Eye, 
  Smartphone, 
  Monitor, 
  LogOut, 
  CheckCircle2, 
  Save,
  Cloud,
  Database,
  Server,
  Copy,
  Check,
  ExternalLink,
  Settings,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  getStoredAdminToken, 
  setStoredAdminToken, 
  adminLogin, 
  checkAdminAuth, 
  fetchDraftBranding, 
  updateDraftBranding, 
  uploadBrandingAsset, 
  publishBranding, 
  discardDraftBranding, 
  restoreDefaultBranding,
  fetchSystemDiagnostics,
  DraftBrandingResponse,
  SystemDiagnostics
} from '../services/brandingService';
import { Header } from '../components/Header';
import { ConfirmModal } from '../components/ConfirmModal';
import { SiteBrandingConfig } from '../types/branding';

const SQL_SCHEMA_SNIPPET = `-- Run in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS curecraft_branding (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  published JSONB NOT NULL,
  draft JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE curecraft_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for branding"
  ON curecraft_branding FOR SELECT TO public USING (true);

CREATE POLICY "Service role full access"
  ON curecraft_branding FOR ALL TO service_role USING (true) WITH CHECK (true);
`;

export const AdminBranding: React.FC = () => {
  const [token, setToken] = useState<string | null>(getStoredAdminToken());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  
  // Login form state
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Branding draft and publish data
  const [data, setData] = useState<DraftBrandingResponse | null>(null);
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File upload state
  const [uploadingTarget, setUploadingTarget] = useState<'badge' | 'banner' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const badgeFileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  // Simulator mode ('desktop' | 'mobile')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  // Verify auth on mount
  useEffect(() => {
    const existingToken = getStoredAdminToken();
    if (existingToken) {
      checkAdminAuth(existingToken).then((valid) => {
        if (valid) {
          setIsAuthenticated(true);
          setToken(existingToken);
          loadDraft(existingToken);
          loadDiagnostics(existingToken);
        } else {
          setStoredAdminToken(null);
          setToken(null);
          setIsAuthenticated(false);
        }
        setIsCheckingAuth(false);
      });
    } else {
      setIsCheckingAuth(false);
    }
  }, []);

  const loadDraft = async (authToken: string) => {
    setIsLoading(true);
    try {
      const res = await fetchDraftBranding(authToken);
      setData(res);
    } catch (err: any) {
      showToast('Error loading branding state: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDiagnostics = async (authToken: string) => {
    try {
      const diag = await fetchSystemDiagnostics(authToken);
      setDiagnostics(diag);
    } catch {
      // Diagnostic check is optional
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setIsLoggingIn(true);
    setLoginError('');

    const res = await adminLogin(passwordInput);
    setIsLoggingIn(false);

    if (res.success && res.token) {
      setToken(res.token);
      setIsAuthenticated(true);
      loadDraft(res.token);
      loadDiagnostics(res.token);
    } else {
      setLoginError(res.error || 'Authentication failed. Please check credentials.');
    }
  };

  const handleLogout = () => {
    setStoredAdminToken(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  // Helper to optimize image size client-side if file is large (> 2MB)
  // Ensures payload stays comfortably within Vercel Serverless Function 4.5MB limit
  const optimizeImageIfNeeded = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // If SVG or small file (< 2MB), keep original data URI directly
      if (file.type === 'image/svg+xml' || file.size < 2 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file from disk.'));
        reader.readAsDataURL(file);
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension constraints
        const maxDim = 2560;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to raw reader
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Keep PNG format for PNGs (to preserve transparency), or WebP/JPEG
        const outFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outFormat, 0.92);
        resolve(dataUrl);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        // Fallback to direct file reader
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      };

      img.src = objectUrl;
    });
  };

  // Upload Handler with validation
  const handleFileUpload = async (target: 'badge' | 'banner', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadError(null);

    // Validate size (15MB)
    if (file.size > 15 * 1024 * 1024) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is 15MB.`);
      return;
    }

    // Validate mime type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setUploadError(`Unsupported format (${file.type}). Allowed: PNG (transparent supported), JPG, WebP, SVG.`);
      return;
    }

    setUploadingTarget(target);

    try {
      const fileData = await optimizeImageIfNeeded(file);
      const res = await uploadBrandingAsset(token, {
        fileData,
        fileName: file.name,
        assetType: target,
      });

      const storageTypeLabel = res.storageProvider === 'supabase' ? 'Supabase Cloud Storage' : 'Server Storage';
      showToast(`Uploaded ${target} image to ${storageTypeLabel}. Click "Publish" to make live.`);

      if (data) {
        setData({
          ...data,
          draft: res.draft,
          isBadgeDirty: target === 'badge' ? true : data.isBadgeDirty,
          isBannerDirty: target === 'banner' ? true : data.isBannerDirty,
          hasUnpublishedChanges: true,
        });
      }
      loadDiagnostics(token);
    } catch (err: any) {
      setUploadError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploadingTarget(null);
      // Reset input value so re-selecting same file triggers change
      if (e.target) e.target.value = '';
    }
  };

  // Update draft patch
  const handlePatchDraft = async (patch: { studioBadge?: any; headerBanner?: any }) => {
    if (!token || !data) return;
    try {
      const res = await updateDraftBranding(token, patch);
      setData({
        ...data,
        draft: res.draft,
        isBadgeDirty: res.isBadgeDirty,
        isBannerDirty: res.isBannerDirty,
        hasUnpublishedChanges: res.hasUnpublishedChanges,
      });
    } catch (err: any) {
      showToast('Error updating draft: ' + err.message);
    }
  };

  // Publish target
  const handlePublish = async (target: 'badge' | 'banner' | 'all') => {
    if (!token) return;
    try {
      const res = await publishBranding(token, target);
      showToast(res.message || 'Published to live site successfully.');
      if (token) {
        loadDraft(token);
        loadDiagnostics(token);
      }
    } catch (err: any) {
      showToast('Publish failed: ' + err.message);
    }
  };

  // Discard target
  const handleDiscard = async (target: 'badge' | 'banner' | 'all') => {
    if (!token) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Discard Unpublished Changes?',
      message: `Are you sure you want to discard unpublished draft edits for ${target}? The draft will be reverted to match the currently published live configuration.`,
      confirmLabel: 'Discard Changes',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await discardDraftBranding(token, target);
          showToast(res.message);
          if (token) loadDraft(token);
        } catch (err: any) {
          showToast('Discard failed: ' + err.message);
        }
      },
    });
  };

  // Restore default fallback
  const handleRestoreDefault = async (target: 'badge' | 'banner') => {
    if (!token) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Default Branded Fallback?',
      message: `Restore default branded fallback for ${target}? This removes custom uploads and activates the Cure Craft core design system styling. Click 'Publish' after to make it live.`,
      confirmLabel: 'Restore Default',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await restoreDefaultBranding(token, target);
          showToast(res.message);
          if (token) loadDraft(token);
        } catch (err: any) {
          showToast('Restore failed: ' + err.message);
        }
      },
    });
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SNIPPET);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Construct draft preview object
  const previewBranding: SiteBrandingConfig = {
    studioBadge: data?.draft.studioBadge || {
      url: null,
      fit: 'cover',
      scale: 100,
      shape: 'circle',
      customBorder: true,
      visible: true,
    },
    headerBanner: data?.draft.headerBanner || {
      url: null,
      focalPointY: 'center',
      overlayDarkness: 70,
      blur: 0,
      textPosition: 'left',
      visible: true,
    },
    updatedAt: data?.draft.updatedAt || Date.now(),
    version: data?.published.version || 1,
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#000611] flex items-center justify-center text-[#8CA0A8]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#00E4FF] border-t-transparent rounded-full animate-spin" />
          <span>Verifying authorization...</span>
        </div>
      </div>
    );
  }

  // Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#000611] text-[#F5F9FA] flex flex-col items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-md bg-[#081a24] border border-[#156876]/60 rounded-[28px] p-5 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-[#156876]/40 border-2 border-[#00E4FF] glow-cyan mx-auto flex items-center justify-center text-[#00E4FF]">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#F5F9FA]">Cure Craft Admin</h1>
            <p className="text-xs text-[#8CA0A8]">
              Owner-Controlled Branding & Asset Management Portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#8CA0A8] uppercase tracking-wider">
                Owner Secret Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#8CA0A8]" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#000611] border border-[#156876]/70 rounded-full text-sm text-[#F5F9FA] placeholder-[#8CA0A8]/50 focus:outline-none focus:border-[#00E4FF] focus:ring-1 focus:ring-[#00E4FF]"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-[#8CA0A8]/80 px-2 pt-0.5">
                Default: <code className="text-[#00E4FF] font-mono">curecraft-admin-2025</code> (Configurable via <code className="text-[#00E4FF] font-mono">ADMIN_PASSWORD</code>)
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-[18px] bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn || !passwordInput.trim()}
              className="w-full py-2.5 px-4 rounded-full text-sm font-bold bg-[#00E4FF] hover:bg-white text-[#000611] transition-all shadow-[0_0_15px_rgba(0,228,255,0.35)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#000611] border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Authenticate & Access Branding</span>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#156876]/30">
            <Link
              to="/"
              className="text-xs text-[#8CA0A8] hover:text-[#00E4FF] flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Workspace</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Owner Administration Interface
  return (
    <div className="min-h-screen bg-[#000611] text-[#F5F9FA] flex flex-col font-sans selection:bg-[#00E4FF] selection:text-[#000611]">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-full bg-[#156876] text-[#00E4FF] border border-[#00E4FF]/60 shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#00E4FF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Navbar */}
      <nav className="border-b border-[#156876]/50 bg-[#081a24] px-4 sm:px-8 py-3.5 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-full bg-[#156876]/30 hover:bg-[#156876]/60 text-[#8CA0A8] hover:text-[#00E4FF] transition-colors"
              title="Return to Public Workspace"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-[#F5F9FA]">
                  Owner Branding Center
                </h1>
                <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-[#00E4FF]/10 text-[#00E4FF] border border-[#00E4FF]/30">
                  Owner Authenticated
                </span>

                {/* Cloud Storage Status Pill */}
                {diagnostics?.storageProvider === 'supabase' ? (
                  <button
                    onClick={() => setShowDiagnosticsModal(true)}
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 hover:bg-emerald-500/20 transition-colors"
                    title="Supabase Cloud Storage is active and permanent"
                  >
                    <Cloud className="w-3 h-3 text-emerald-400" />
                    <span>Supabase Cloud Active</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowDiagnosticsModal(true)}
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 flex items-center gap-1.5 hover:bg-amber-400/20 transition-colors"
                    title="Using local storage. Click to view Vercel Supabase setup"
                  >
                    <AlertCircle className="w-3 h-3 text-amber-300" />
                    <span>Local Mode (Setup Supabase)</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-[#8CA0A8]">
                Centralized shared branding for all public visitors across devices and deployments
              </p>
            </div>
          </div>

          {/* Master Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowDiagnosticsModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-[#8CA0A8] hover:text-[#00E4FF] hover:bg-[#156876]/30 border border-[#156876]/50 transition-colors"
              title="Inspect Storage Provider & Vercel Configuration"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Diagnostics</span>
            </button>

            {data?.hasUnpublishedChanges && (
              <button
                onClick={() => handlePublish('all')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#00E4FF] hover:bg-white text-[#000611] transition-all shadow-[0_0_15px_rgba(0,228,255,0.4)]"
              >
                <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Publish All to Live Site</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-[#8CA0A8] hover:text-rose-400 hover:bg-rose-500/10 border border-[#156876]/50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Upload Error Banner */}
        {uploadError && (
          <div className="p-4 rounded-[20px] bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button onClick={() => setUploadError(null)} className="p-1 rounded-full hover:bg-rose-500/20">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Live Simulator Preview Frame */}
        <section className="bg-[#081a24] border border-[#156876]/50 rounded-[28px] p-5 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#156876]/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-full bg-[#156876]/40 text-[#00E4FF]">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#F5F9FA]">Live Draft Simulator</h2>
                <p className="text-xs text-[#8CA0A8]">
                  Real-time preview of how visitors see the published header on different devices.
                </p>
              </div>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#000611] p-1 rounded-full border border-[#156876]/60">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full transition-all ${
                    previewDevice === 'desktop'
                      ? 'bg-[#00E4FF] text-[#000611] font-bold shadow-sm'
                      : 'text-[#8CA0A8] hover:text-[#F5F9FA]'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full transition-all ${
                    previewDevice === 'mobile'
                      ? 'bg-[#00E4FF] text-[#000611] font-bold shadow-sm'
                      : 'text-[#8CA0A8] hover:text-[#F5F9FA]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>
          </div>

          {/* Simulator Viewport */}
          <div className="bg-[#000611] p-4 sm:p-6 rounded-[24px] border border-[#156876]/30 flex justify-center overflow-hidden">
            <div 
              className={`transition-all duration-300 w-full overflow-hidden border border-[#156876]/50 rounded-[24px] shadow-2xl ${
                previewDevice === 'mobile' ? 'max-w-[390px]' : 'max-w-full'
              }`}
            >
              <Header
                score={85}
                savedCount={3}
                onOpenLibrary={() => {}}
                onOpenPresets={() => {}}
                onOpenScoreBreakdown={() => {}}
                onResetWorkspace={() => {}}
                overrideBranding={previewBranding}
              />
            </div>
          </div>
        </section>

        {/* 2 Independent Asset Configuration Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ========================================== */}
          {/* ASSET 1: STUDIO BADGE CONTROLS */}
          {/* ========================================== */}
          <div className="bg-[#081a24] border border-[#156876]/50 rounded-[28px] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#156876]/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#156876]/40 text-[#00E4FF] flex items-center justify-center font-bold text-xs border border-[#00E4FF]/40">
                  01
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F5F9FA]">Studio Badge Asset</h3>
                  <p className="text-xs text-[#8CA0A8]">Compact emblem, mark, or studio insignia</p>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-1.5">
                {data?.isBadgeDirty ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                    Draft Unsaved
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Live
                  </span>
                )}
              </div>
            </div>

            {/* Current Badge Thumbnail & Upload */}
            <div className="p-4 rounded-[22px] bg-[#000611] border border-[#156876]/40 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 rounded-full border-2 border-[#00E4FF] glow-cyan bg-[#081a24] flex items-center justify-center overflow-hidden shrink-0">
                {data?.draft.studioBadge.url ? (
                  <img
                    src={data.draft.studioBadge.url}
                    alt="Badge Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#081a24] to-[#156876] flex items-center justify-center text-[#00E4FF] font-extrabold text-lg">
                    CC
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1 text-center sm:text-left">
                <div>
                  <p className="text-xs font-semibold text-[#F5F9FA]">
                    {data?.draft.studioBadge.url ? 'Custom Badge Active' : 'Default CSS Monogram Active'}
                  </p>
                  <p className="text-[11px] text-[#8CA0A8]">
                    PNG (transparent), JPG, WebP, or SVG. Max 15MB.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <input
                    type="file"
                    ref={badgeFileRef}
                    onChange={(e) => handleFileUpload('badge', e)}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                  />
                  <button
                    onClick={() => badgeFileRef.current?.click()}
                    disabled={uploadingTarget === 'badge'}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#00E4FF] hover:bg-white text-[#000611] transition-all flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingTarget === 'badge' ? 'Uploading...' : 'Upload Badge'}</span>
                  </button>

                  {data?.draft.studioBadge.url && (
                    <button
                      onClick={() => handleRestoreDefault('badge')}
                      className="px-3 py-1.5 rounded-full text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors"
                      title="Remove uploaded image and restore Cure Craft CSS fallback"
                    >
                      Restore Fallback
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Badge Settings Controls */}
            <div className="space-y-4 pt-1">
              
              {/* Shape Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#8CA0A8] uppercase tracking-wider">
                  Badge Geometry
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['circle', 'squircle', 'pill'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handlePatchDraft({ studioBadge: { shape: s } })}
                      className={`py-1.5 px-3 rounded-full text-xs font-semibold border capitalize transition-all ${
                        data?.draft.studioBadge.shape === s
                          ? 'bg-[#00E4FF] text-[#000611] border-[#00E4FF] shadow-sm'
                          : 'bg-[#000611] text-[#8CA0A8] border-[#156876]/60 hover:text-[#F5F9FA]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fit Mode */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#8CA0A8] uppercase tracking-wider">
                  Image Fit
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['cover', 'contain'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => handlePatchDraft({ studioBadge: { fit: f } })}
                      className={`py-1.5 px-3 rounded-full text-xs font-semibold border capitalize transition-all ${
                        data?.draft.studioBadge.fit === f
                          ? 'bg-[#00E4FF] text-[#000611] border-[#00E4FF]'
                          : 'bg-[#000611] text-[#8CA0A8] border-[#156876]/60 hover:text-[#F5F9FA]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-[#8CA0A8]">
                  <span>SCALE</span>
                  <span className="font-mono text-[#00E4FF]">{data?.draft.studioBadge.scale || 100}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="130"
                  value={data?.draft.studioBadge.scale || 100}
                  onChange={(e) => handlePatchDraft({ studioBadge: { scale: Number(e.target.value) } })}
                  className="w-full accent-[#00E4FF]"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#F5F9FA]">Electric Cyan Glowing Halo</span>
                <button
                  type="button"
                  onClick={() => handlePatchDraft({ studioBadge: { customBorder: !data?.draft.studioBadge.customBorder } })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    data?.draft.studioBadge.customBorder ? 'bg-[#00E4FF]' : 'bg-[#156876]/40'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-[#000611] absolute top-0.5 transition-transform ${
                      data?.draft.studioBadge.customBorder ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#F5F9FA]">Display Studio Badge</span>
                <button
                  type="button"
                  onClick={() => handlePatchDraft({ studioBadge: { visible: !data?.draft.studioBadge.visible } })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    data?.draft.studioBadge.visible ? 'bg-[#00E4FF]' : 'bg-[#156876]/40'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-[#000611] absolute top-0.5 transition-transform ${
                      data?.draft.studioBadge.visible ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Badge Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[#156876]/30">
              {data?.isBadgeDirty ? (
                <button
                  onClick={() => handleDiscard('badge')}
                  className="text-xs text-[#8CA0A8] hover:text-[#F5F9FA] px-3 py-1.5 rounded-full hover:bg-[#156876]/30"
                >
                  Discard Changes
                </button>
              ) : <div />}

              <button
                onClick={() => handlePublish('badge')}
                disabled={!data?.isBadgeDirty}
                className="px-4 py-2 rounded-full text-xs font-bold bg-[#156876] hover:bg-[#00E4FF] text-[#F5F9FA] hover:text-[#000611] border border-[#00E4FF]/40 transition-all disabled:opacity-40"
              >
                Publish Badge Only
              </button>
            </div>
          </div>

          {/* ========================================== */}
          {/* ASSET 2: FULL HEADER BANNER CONTROLS */}
          {/* ========================================== */}
          <div className="bg-[#081a24] border border-[#156876]/50 rounded-[28px] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#156876]/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#156876]/40 text-[#00E4FF] flex items-center justify-center font-bold text-xs border border-[#00E4FF]/40">
                  02
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F5F9FA]">Full Header Banner Asset</h3>
                  <p className="text-xs text-[#8CA0A8]">Wide panoramic artwork behind workspace header</p>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-1.5">
                {data?.isBannerDirty ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                    Draft Unsaved
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Live
                  </span>
                )}
              </div>
            </div>

            {/* Current Banner Thumbnail & Upload */}
            <div className="p-4 rounded-[22px] bg-[#000611] border border-[#156876]/40 space-y-3">
              <div className="w-full h-24 rounded-[16px] border border-[#156876]/60 bg-[#081a24] overflow-hidden relative flex items-center justify-center">
                {data?.draft.headerBanner.url ? (
                  <img
                    src={data.draft.headerBanner.url}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: `center ${data.draft.headerBanner.focalPointY}` }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#000611] via-[#081a24] to-[#156876] flex items-center justify-center text-[#8CA0A8] text-xs font-semibold">
                    Default Midnight Ambient Curves
                  </div>
                )}
                <div className="absolute inset-0 bg-[#000611] pointer-events-none opacity-30" />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-[#8CA0A8]">
                  {data?.draft.headerBanner.url ? 'Custom Banner Active' : 'Default Design System Active'}
                </span>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={bannerFileRef}
                    onChange={(e) => handleFileUpload('banner', e)}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />
                  <button
                    onClick={() => bannerFileRef.current?.click()}
                    disabled={uploadingTarget === 'banner'}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#00E4FF] hover:bg-white text-[#000611] transition-all flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingTarget === 'banner' ? 'Uploading...' : 'Upload Banner'}</span>
                  </button>

                  {data?.draft.headerBanner.url && (
                    <button
                      onClick={() => handleRestoreDefault('banner')}
                      className="px-3 py-1.5 rounded-full text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors"
                      title="Remove uploaded banner and restore Cure Craft default"
                    >
                      Restore Fallback
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Banner Settings Controls */}
            <div className="space-y-4 pt-1">
              
              {/* Focal Point Y */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#8CA0A8] uppercase tracking-wider">
                  Vertical Focal Point
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['top', 'center', 'bottom'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => handlePatchDraft({ headerBanner: { focalPointY: pos } })}
                      className={`py-1.5 px-3 rounded-full text-xs font-semibold border capitalize transition-all ${
                        data?.draft.headerBanner.focalPointY === pos
                          ? 'bg-[#00E4FF] text-[#000611] border-[#00E4FF]'
                          : 'bg-[#000611] text-[#8CA0A8] border-[#156876]/60 hover:text-[#F5F9FA]'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Positioning */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#8CA0A8] uppercase tracking-wider">
                  Header Content Alignment
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['left', 'center'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => handlePatchDraft({ headerBanner: { textPosition: align } })}
                      className={`py-1.5 px-3 rounded-full text-xs font-semibold border capitalize transition-all ${
                        data?.draft.headerBanner.textPosition === align
                          ? 'bg-[#00E4FF] text-[#000611] border-[#00E4FF]'
                          : 'bg-[#000611] text-[#8CA0A8] border-[#156876]/60 hover:text-[#F5F9FA]'
                      }`}
                    >
                      {align} Aligned
                    </button>
                  ))}
                </div>
              </div>

              {/* Overlay Darkness Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-[#8CA0A8]">
                  <span>DARK OVERLAY OPACITY</span>
                  <span className="font-mono text-[#00E4FF]">{data?.draft.headerBanner.overlayDarkness || 70}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="95"
                  value={data?.draft.headerBanner.overlayDarkness || 70}
                  onChange={(e) => handlePatchDraft({ headerBanner: { overlayDarkness: Number(e.target.value) } })}
                  className="w-full accent-[#00E4FF]"
                />
              </div>

              {/* Blur Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-[#8CA0A8]">
                  <span>BACKGROUND BLUR</span>
                  <span className="font-mono text-[#00E4FF]">{data?.draft.headerBanner.blur || 0}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={data?.draft.headerBanner.blur || 0}
                  onChange={(e) => handlePatchDraft({ headerBanner: { blur: Number(e.target.value) } })}
                  className="w-full accent-[#00E4FF]"
                />
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#F5F9FA]">Display Full Header Banner</span>
                <button
                  type="button"
                  onClick={() => handlePatchDraft({ headerBanner: { visible: !data?.draft.headerBanner.visible } })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    data?.draft.headerBanner.visible ? 'bg-[#00E4FF]' : 'bg-[#156876]/40'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-[#000611] absolute top-0.5 transition-transform ${
                      data?.draft.headerBanner.visible ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Banner Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[#156876]/30">
              {data?.isBannerDirty ? (
                <button
                  onClick={() => handleDiscard('banner')}
                  className="text-xs text-[#8CA0A8] hover:text-[#F5F9FA] px-3 py-1.5 rounded-full hover:bg-[#156876]/30"
                >
                  Discard Changes
                </button>
              ) : <div />}

              <button
                onClick={() => handlePublish('banner')}
                disabled={!data?.isBannerDirty}
                className="px-4 py-2 rounded-full text-xs font-bold bg-[#156876] hover:bg-[#00E4FF] text-[#F5F9FA] hover:text-[#000611] border border-[#00E4FF]/40 transition-all disabled:opacity-40"
              >
                Publish Banner Only
              </button>
            </div>
          </div>
        </div>

        {/* Documentation & Deployment Notes */}
        <section className="bg-[#081a24] border border-[#156876]/40 rounded-[28px] p-6 text-xs text-[#8CA0A8] space-y-3">
          <div className="flex items-center gap-2 text-[#00E4FF] font-bold">
            <Shield className="w-4 h-4" />
            <span>Architecture & Deployment Notes</span>
          </div>
          <p className="leading-relaxed">
            • <strong>Shared Persistence:</strong> Uploaded images are stored in persistent cloud storage (Supabase Storage) and referenced via permanent URLs in the database. All visitors across browsers, devices, and Vercel deployments immediately see the identical published branding.
          </p>
          <p className="leading-relaxed">
            • <strong>Independent Fallbacks:</strong> Updating, replacing, or restoring the Studio Badge or Full Header Banner operates independently and will never alter the other asset.
          </p>
          <p className="leading-relaxed">
            • <strong>Vercel Serverless Integration:</strong> The API runs via Vercel Serverless Functions (<code className="text-[#00E4FF] font-mono">/api</code>). Ensure your environment variables are set in Vercel Project Settings → Environment Variables.
          </p>
        </section>
      </main>

      {/* Cloud Storage & Vercel Diagnostics Modal */}
      {showDiagnosticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000611]/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#081a24] border border-[#156876] rounded-[28px] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#156876]/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-full bg-[#156876]/40 text-[#00E4FF]">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F5F9FA]">Cloud Storage & Database Diagnostics</h3>
                  <p className="text-xs text-[#8CA0A8]">Permanent branding persistence status across Vercel deployments</p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="p-1.5 rounded-full hover:bg-[#156876]/40 text-[#8CA0A8] hover:text-[#F5F9FA] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Storage Provider Status Card */}
            <div className="p-4 rounded-[20px] bg-[#000611] border border-[#156876]/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#00E4FF]" />
                  <span className="text-xs font-bold text-[#F5F9FA]">Active Storage Engine</span>
                </div>
                {diagnostics?.storageProvider === 'supabase' ? (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Supabase Cloud Active
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Local Storage Fallback
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-[14px] bg-[#081a24] border border-[#156876]/30">
                  <span className="text-[11px] text-[#8CA0A8] block">Supabase Storage Bucket:</span>
                  <span className="font-mono text-[#00E4FF] font-semibold">{diagnostics?.supabaseBucket || 'branding-assets'}</span>
                </div>
                <div className="p-2.5 rounded-[14px] bg-[#081a24] border border-[#156876]/30">
                  <span className="text-[11px] text-[#8CA0A8] block">Database Table:</span>
                  <span className="font-mono text-[#00E4FF] font-semibold">
                    {diagnostics?.tableReady ? 'curecraft_branding (Connected)' : 'curecraft_branding (Ready / Storage Sync)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Vercel Environment Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#8CA0A8] uppercase tracking-wider flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-[#00E4FF]" />
                Vercel Project Settings → Environment Variables Checklist
              </h4>
              <div className="bg-[#000611] rounded-[20px] p-4 border border-[#156876]/50 space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[#156876]/30">
                  <span className="font-mono text-[#F5F9FA]">SUPABASE_URL</span>
                  {diagnostics?.envChecklist.SUPABASE_URL ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-semibold">
                      <Check className="w-3.5 h-3.5" /> Configured
                    </span>
                  ) : (
                    <span className="text-amber-400 text-[11px] font-semibold">Missing (Add in Vercel)</span>
                  )}
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#156876]/30">
                  <span className="font-mono text-[#F5F9FA]">SUPABASE_SERVICE_ROLE_KEY</span>
                  {diagnostics?.envChecklist.SUPABASE_KEY ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-semibold">
                      <Check className="w-3.5 h-3.5" /> Configured
                    </span>
                  ) : (
                    <span className="text-amber-400 text-[11px] font-semibold">Missing (Add in Vercel)</span>
                  )}
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="font-mono text-[#F5F9FA]">ADMIN_PASSWORD</span>
                  {diagnostics?.envChecklist.ADMIN_PASSWORD ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-semibold">
                      <Check className="w-3.5 h-3.5" /> Custom Set
                    </span>
                  ) : (
                    <span className="text-[#8CA0A8] text-[11px]">Using default (curecraft-admin-2025)</span>
                  )}
                </div>
              </div>
            </div>

            {/* SQL Table Creation Snippet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8CA0A8] uppercase tracking-wider">
                  Optional: Supabase SQL Migration Script
                </span>
                <button
                  onClick={handleCopySql}
                  className="text-xs text-[#00E4FF] hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#156876]/40 hover:bg-[#156876] transition-colors"
                >
                  {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copySuccess ? 'Copied SQL!' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre className="p-3 bg-[#000611] border border-[#156876]/40 rounded-[18px] text-[11px] font-mono text-[#8CA0A8] overflow-x-auto select-all">
                {SQL_SCHEMA_SNIPPET}
              </pre>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-[#156876]/30">
              <button
                onClick={() => {
                  if (token) loadDiagnostics(token);
                }}
                className="px-3.5 py-2 rounded-full text-xs font-semibold text-[#8CA0A8] hover:text-[#00E4FF] hover:bg-[#156876]/30 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recheck Connection</span>
              </button>

              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="px-5 py-2 rounded-full text-xs font-bold bg-[#00E4FF] text-[#000611] hover:bg-white transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
};
