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

// Public Branding Fetch (Read-only for all visitors)
export async function fetchPublicBranding(): Promise<SiteBrandingConfig> {
  try {
    const res = await fetch('/api/branding/public', {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
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
export async function adminLogin(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      setStoredAdminToken(data.token);
      return { success: true, token: data.token };
    }
    return { success: false, error: data.error || 'Authentication failed' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function checkAdminAuth(token: string): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/check-auth', {
      headers: {
        'Authorization': `Bearer ${token}`,
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
}

export async function fetchDraftBranding(token: string): Promise<DraftBrandingResponse> {
  const res = await fetch('/api/admin/branding/draft', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error('Unauthorized or failed to fetch draft');
  }
  return res.json();
}

export async function updateDraftBranding(
  token: string,
  payload: { studioBadge?: Partial<StudioBadgeConfig>; headerBanner?: Partial<HeaderBannerConfig> }
): Promise<any> {
  const res = await fetch('/api/admin/branding/draft', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update draft');
  }
  return res.json();
}

export async function uploadBrandingAsset(
  token: string,
  payload: { fileData: string; fileName: string; assetType: 'badge' | 'banner' }
): Promise<{ success: boolean; url: string; size: number; draft: any }> {
  const res = await fetch('/api/admin/branding/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Upload rejected by server');
  }
  return res.json();
}

export async function publishBranding(token: string, target: 'badge' | 'banner' | 'all'): Promise<any> {
  const res = await fetch('/api/admin/branding/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ target }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to publish changes');
  }
  return res.json();
}

export async function discardDraftBranding(token: string, target: 'badge' | 'banner' | 'all'): Promise<any> {
  const res = await fetch('/api/admin/branding/discard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ target }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to discard draft');
  }
  return res.json();
}

export async function restoreDefaultBranding(token: string, target: 'badge' | 'banner'): Promise<any> {
  const res = await fetch('/api/admin/branding/restore-default', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ target }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to restore default');
  }
  return res.json();
}
