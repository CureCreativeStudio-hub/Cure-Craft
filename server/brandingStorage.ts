import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  isSupabaseConfigured,
  getSupabase,
  uploadToSupabaseStorage,
  ensureStorageBucket,
  SUPABASE_STORAGE_BUCKET,
  SUPABASE_URL,
} from './supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local fallback directories (for Node.js dev / Cloud Run)
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(ROOT_DIR, 'data');
export const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const BRANDING_FILE = path.resolve(DATA_DIR, 'branding.json');

// Ensure local directories exist if running in environment with filesystem access
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch {
  // Read-only filesystem (e.g. Vercel serverless), ignore error
}

export interface StudioBadgeConfig {
  url: string | null;
  fit: 'cover' | 'contain';
  scale: number;
  shape: 'circle' | 'squircle' | 'pill';
  customBorder: boolean;
  visible: boolean;
}

export interface HeaderBannerConfig {
  url: string | null;
  focalPointY: 'top' | 'center' | 'bottom';
  overlayDarkness: number;
  blur: number;
  textPosition: 'left' | 'center';
  visible: boolean;
}

export interface BrandingState {
  published: {
    studioBadge: StudioBadgeConfig;
    headerBanner: HeaderBannerConfig;
    publishedAt: number;
    publishedBy: string;
    version: number;
  };
  draft: {
    studioBadge: StudioBadgeConfig;
    headerBanner: HeaderBannerConfig;
    updatedAt: number;
  };
}

export const DEFAULT_BRANDING_STATE: BrandingState = {
  published: {
    studioBadge: {
      url: null,
      fit: 'cover',
      scale: 100,
      shape: 'circle',
      customBorder: true,
      visible: true,
    },
    headerBanner: {
      url: null,
      focalPointY: 'center',
      overlayDarkness: 70,
      blur: 0,
      textPosition: 'left',
      visible: true,
    },
    publishedAt: Date.now(),
    publishedBy: 'Cure Creative Studio',
    version: 1,
  },
  draft: {
    studioBadge: {
      url: null,
      fit: 'cover',
      scale: 100,
      shape: 'circle',
      customBorder: true,
      visible: true,
    },
    headerBanner: {
      url: null,
      focalPointY: 'center',
      overlayDarkness: 70,
      blur: 0,
      textPosition: 'left',
      visible: true,
    },
    updatedAt: Date.now(),
  },
};

// Memory cache
let inMemoryState: BrandingState = JSON.parse(JSON.stringify(DEFAULT_BRANDING_STATE));
let isInitialized = false;

/**
 * Load branding state from Supabase Database, Supabase Storage config, or local file.
 */
export async function loadBrandingState(): Promise<BrandingState> {
  const supabase = getSupabase();

  if (supabase) {
    // 1. Try reading from Supabase Table `curecraft_branding`
    try {
      const { data, error } = await supabase
        .from('curecraft_branding')
        .select('*')
        .eq('id', 'singleton')
        .maybeSingle();

      if (!error && data && data.published) {
        inMemoryState = {
          published: { ...DEFAULT_BRANDING_STATE.published, ...data.published },
          draft: { ...DEFAULT_BRANDING_STATE.draft, ...(data.draft || data.published) },
        };
        isInitialized = true;
        return inMemoryState;
      }
    } catch (dbErr) {
      console.warn('[BrandingStorage] Could not load from Supabase table:', dbErr);
    }

    // 2. Fallback: Try reading `config/curecraft-branding-state.json` from Supabase Storage bucket
    try {
      const { data: fileData, error: fileErr } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .download('config/curecraft-branding-state.json');

      if (!fileErr && fileData) {
        const text = await fileData.text();
        const parsed = JSON.parse(text);
        if (parsed.published) {
          inMemoryState = {
            published: { ...DEFAULT_BRANDING_STATE.published, ...parsed.published },
            draft: { ...DEFAULT_BRANDING_STATE.draft, ...(parsed.draft || parsed.published) },
          };
          isInitialized = true;
          return inMemoryState;
        }
      }
    } catch (storageErr) {
      console.warn('[BrandingStorage] Could not load from Supabase bucket config:', storageErr);
    }
  }

  // 3. Fallback: Local filesystem
  try {
    if (fs.existsSync(BRANDING_FILE)) {
      const data = fs.readFileSync(BRANDING_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      inMemoryState = {
        published: { ...DEFAULT_BRANDING_STATE.published, ...parsed.published },
        draft: { ...DEFAULT_BRANDING_STATE.draft, ...parsed.draft },
      };
      isInitialized = true;
      return inMemoryState;
    }
  } catch (err) {
    console.warn('[BrandingStorage] Could not read local branding.json:', err);
  }

  isInitialized = true;
  return inMemoryState;
}

/**
 * Get current branding state synchronously (from memory cache), initiating async refresh.
 */
export function getBrandingStateSync(): BrandingState {
  if (!isInitialized) {
    // Attempt local read sync if available
    try {
      if (fs.existsSync(BRANDING_FILE)) {
        const data = fs.readFileSync(BRANDING_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        inMemoryState = {
          published: { ...DEFAULT_BRANDING_STATE.published, ...parsed.published },
          draft: { ...DEFAULT_BRANDING_STATE.draft, ...parsed.draft },
        };
        isInitialized = true;
      }
    } catch {
      // ignore
    }
    // Asynchronously sync from cloud
    loadBrandingState().catch(() => {});
  }
  return inMemoryState;
}

/**
 * Persist branding state to Supabase Database, Supabase Storage, and local disk.
 */
export async function saveBrandingState(state: BrandingState): Promise<void> {
  inMemoryState = JSON.parse(JSON.stringify(state));

  const supabase = getSupabase();

  if (supabase) {
    // 1. Try saving to Supabase Table `curecraft_branding`
    try {
      const { error } = await supabase.from('curecraft_branding').upsert({
        id: 'singleton',
        published: state.published,
        draft: state.draft,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('[BrandingStorage] Table upsert notice:', error.message);
      }
    } catch (err: any) {
      console.warn('[BrandingStorage] Table upsert error:', err?.message || err);
    }

    // 2. Also save to Supabase Storage bucket as a persistent configuration backup
    try {
      await ensureStorageBucket();
      const stateBuffer = Buffer.from(JSON.stringify(state, null, 2), 'utf-8');
      await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .upload('config/curecraft-branding-state.json', stateBuffer, {
          contentType: 'application/json',
          upsert: true,
          cacheControl: '0',
        });
    } catch (err: any) {
      console.warn('[BrandingStorage] Storage config backup error:', err?.message || err);
    }
  }

  // 3. Fallback: Save to local filesystem if accessible
  try {
    fs.writeFileSync(BRANDING_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // In serverless environments, local disk is read-only
  }
}

/**
 * Upload an image asset buffer and return permanent URL.
 */
export async function saveAssetFile(
  buffer: Buffer,
  extension: string,
  mimeType: string,
  assetType: 'badge' | 'banner'
): Promise<{ url: string; storageProvider: 'supabase' | 'local'; fileName: string }> {
  const fileHash = crypto.randomBytes(12).toString('hex');
  const safeName = `${assetType}-${Date.now()}-${fileHash}.${extension}`;

  // If Supabase is configured, upload to persistent cloud storage
  if (isSupabaseConfigured()) {
    const uploadRes = await uploadToSupabaseStorage(safeName, buffer, mimeType);
    if (uploadRes.success && uploadRes.publicUrl) {
      return {
        url: uploadRes.publicUrl,
        storageProvider: 'supabase',
        fileName: safeName,
      };
    } else {
      console.warn('[BrandingStorage] Supabase upload failed, falling back to local:', uploadRes.error);
    }
  }

  // Fallback to local storage (Node.js dev or Cloud Run)
  try {
    const filePath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(filePath, buffer);
    return {
      url: `/uploads/${safeName}`,
      storageProvider: 'local',
      fileName: safeName,
    };
  } catch (localErr) {
    // If local filesystem is read-only (e.g. Vercel without Supabase configured),
    // convert to durable data URI so the image is not lost
    const base64 = buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64}`;
    return {
      url: dataUri,
      storageProvider: 'local',
      fileName: safeName,
    };
  }
}

/**
 * Diagnostic info for admin interface
 */
export async function getSystemDiagnostic() {
  const supabaseConfigured = isSupabaseConfigured();
  let bucketExists = false;
  let tableExists = false;

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      bucketExists = Boolean(buckets?.some((b) => b.name === SUPABASE_STORAGE_BUCKET || b.id === SUPABASE_STORAGE_BUCKET));
    } catch {
      bucketExists = false;
    }

    try {
      const { error } = await supabase.from('curecraft_branding').select('id').limit(1);
      tableExists = !error;
    } catch {
      tableExists = false;
    }
  }

  return {
    storageProvider: supabaseConfigured ? 'supabase' : 'local',
    supabaseConfigured,
    supabaseUrl: SUPABASE_URL ? SUPABASE_URL.replace(/(https:\/\/[^.]+).*/, '$1.supabase.co') : null,
    supabaseBucket: SUPABASE_STORAGE_BUCKET,
    bucketReady: bucketExists,
    tableReady: tableExists,
    envChecklist: {
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
      SUPABASE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY),
      ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD),
    },
  };
}
