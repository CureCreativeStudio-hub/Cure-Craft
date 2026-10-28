import { SiteBrandingConfig, DEFAULT_BRANDING, StudioBadgeConfig, HeaderBannerConfig } from '../types/branding';

const ADMIN_TOKEN_KEY = 'curecraft_admin_token';

export function getStoredAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setStoredAdminToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

/**
 * Robust HTTP Response Parser:
 * Checks Content-Type and HTTP status before attempting JSON parsing.
 * Prevents "Unexpected token 'T' / '<' ... is not valid JSON" crashes when
 * servers or serverless proxies return HTML 404/500/redirect pages.
 */
async function parseApiResponse<T>(
  res: Response,
  actionContext = 'API Request'
): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  const contentType = res.headers.get('content-type') || '';
  let parsedJson: any = null;
  let rawText = '';

  if (contentType.includes('application/json')) {
    try {
      parsedJson = await res.json();
    } catch (parseErr: any) {
      console.warn(`[${actionContext}] JSON parsing failed:`, parseErr);
    }
  } else {
    try {
      rawText = await res.text();
    } catch {
      // ignore
    }
  }

  if (res.ok && parsedJson !== null) {
    return { ok: true, data: parsedJson as T, status: res.status };
  }

  // Determine user-friendly, descriptive error message
  let errorMessage = parsedJson?.error || parsedJson?.message;

  if (!errorMessage) {
    if (res.status === 401) {
      errorMessage = 'Invalid password or expired admin credentials.';
    } else if (res.status === 403) {
      errorMessage = 'Access denied. Owner authorization required.';
    } else if (res.status === 404) {
      errorMessage =
        'API route not found (404). Ensure Vercel Serverless Functions (/api) and environment variables are deployed.';
    } else if (res.status === 413) {
      errorMessage =
        'Uploaded image exceeds serverless function payload limit (max 15MB).';
    } else if (res.status >= 500) {
      errorMessage = `Server error (${res.status}). Verify Vercel / Supabase configuration.`;
    } else if (rawText) {
      // If server returned HTML (e.g. Vercel error page), strip tags and show clean diagnostic
      const sanitized = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      errorMessage =
        sanitized.length > 120
          ? `${sanitized.substring(0, 120)}...`
          : sanitized || `Unexpected server response (HTTP ${res.status}).`;
    } else {
      errorMessage = `Request failed with HTTP status ${res.status}.`;
    }
  }

  return {
    ok: false,
    error: errorMessage,
    status: res.status,
  };
}

// Public Branding Fetch (Read-only for all visitors)
export async function fetchPublicBranding(): Promise<SiteBrandingConfig> {
  try {
    const res = await fetch('/api/branding/public', {
      headers: { Accept: 'application/json' },
    });
    const parsed = await parseApiResponse<any>(res, 'Fetch Public Branding');
    if (parsed.ok && parsed.data) {
      const data = parsed.data;
      return {
        studioBadge: data.studioBadge || DEFAULT_BRANDING.studioBadge,
        headerBanner: data.headerBanner || DEFAULT_BRANDING.headerBanner,
        updatedAt: data.updatedAt || Date.now(),
        publishedAt: data.publishedAt,
        publishedBy: data.publishedBy,
        version: data.version || 1,
      };
    }
  } catch (err) {
    console.warn('Failed to fetch public branding, using default fallback', err);
  }
  return DEFAULT_BRANDING;
}

// Admin Authentication
export async function adminLogin(
  password: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const parsed = await parseApiResponse<{ success: boolean; token?: string; error?: string }>(
      res,
      'Admin Login'
    );

    if (parsed.ok && parsed.data?.token) {
      setStoredAdminToken(parsed.data.token);
      return { success: true, token: parsed.data.token };
    }

    return {
      success: false,
      error: parsed.error || 'Authentication failed. Please verify credentials.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network connection error. Check your internet or deployment status.',
    };
  }
}

export async function checkAdminAuth(token: string): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/check-auth', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Admin Draft & State Management
export interface DraftBrandingResponse {
  draft: {
    studioBadge: StudioBadgeConfig;
    headerBanner: HeaderBannerConfig;
    updatedAt: number;
  };
  published: {
    studioBadge: StudioBadgeConfig;
    headerBanner: HeaderBannerConfig;
    publishedAt: number;
    publishedBy: string;
    version: number;
  };
  isBadgeDirty: boolean;
  isBannerDirty: boolean;
  hasUnpublishedChanges: boolean;
  storageProvider?: 'supabase' | 'local';
}

export async function fetchDraftBranding(token: string): Promise<DraftBrandingResponse> {
  const res = await fetch('/api/admin/branding/draft', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  const parsed = await parseApiResponse<DraftBrandingResponse>(res, 'Fetch Draft Branding');
  if (!parsed.ok || !parsed.data) {
    throw new Error(parsed.error || 'Failed to fetch draft branding configuration.');
  }
  return parsed.data;
}

export async function updateDraftBranding(
  token: string,
  payload: { studioBadge?: Partial<StudioBadgeConfig>; headerBanner?: Partial<HeaderBannerConfig> }
): Promise<any> {
  const res = await fetch('/api/admin/branding/draft', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const parsed = await parseApiResponse<any>(res, 'Update Draft Branding');
  if (!parsed.ok || !parsed.data) {
    throw new Error(parsed.error || 'Failed to update draft settings.');
  }
  return parsed.data;
}

export async function uploadBrandingAsset(
  token: string,
  payload: { fileData: string; fileName: string; assetType: 'badge' | 'banner' }
): Promise<{ success: boolean; url: string; size: number; draft: any; storageProvider?: string }> {
  const res = await fetch('/api/admin/branding/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const parsed = await parseApiResponse<any>(res, 'Upload Branding Asset');
  if (!parsed.ok || !parsed.data) {
    throw new Error(parsed.error || 'Upload was rejected by server.');
  }
  return parsed.data;
}

export async function publishBranding(
  token: string,
  target: 'badge' | 'banner' | 'all'
): Promise<any> {
  const res = await fetch('/api/admin/branding/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify({ target }),
  });
  const parsed = await parseApiResponse<any>(res, 'Publish Branding');
  if (!parsed.ok || !parsed.data) {
    throw new Error(parsed.error || 'Failed to publish changes to live site.');
  }
  return parsed.data;
}

export async function discardDraftBranding(
  token: string,
  target: 'badge' | 'banner' | 'all'
): Promise<any> {
  const res = await fetch('/api/admin/branding/discard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify({ target }),
  });
  const parsed = await parseApiResponse<any>(res, 'Discard Draft');
  if (!parsed.ok || !parsed.data) {
    throw new Error(parsed.error || 'Failed to discard draft changes.');
  }
  return parsed.data;
}

export async function restoreDefaultBranding(
  token: string,
  target: 'badge' | 'banner'
): Promise<any> {
  const res = await fetch('/api/admin/branding/restore-default', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify({ target }),
  });
  const parsed = await parseApiResponse<any>(res, 'Restore Default');
  if (!parsed.ok || !parsed.data) {
    throw new Error(parsed.error || 'Failed to restore default.');
  }
  return parsed.data;
}

export interface SystemDiagnostics {
  storageProvider: 'supabase' | 'local';
  supabaseConfigured: boolean;
  supabaseUrl: string | null;
  supabaseBucket: string;
  bucketReady: boolean;
  tableReady: boolean;
  envChecklist: {
    SUPABASE_URL: boolean;
    SUPABASE_KEY: boolean;
    ADMIN_PASSWORD: boolean;
  };
}

export async function fetchSystemDiagnostics(
  token: string
): Promise<SystemDiagnostics | null> {
  try {
    const res = await fetch('/api/admin/system-status', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const parsed = await parseApiResponse<{ success: boolean; diagnostics: SystemDiagnostics }>(
      res,
      'System Diagnostics'
    );
    if (parsed.ok && parsed.data?.diagnostics) {
      return parsed.data.diagnostics;
    }
  } catch (err) {
    console.warn('Diagnostics fetch notice:', err);
  }
  return null;
}
