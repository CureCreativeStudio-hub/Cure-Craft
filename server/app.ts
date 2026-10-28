import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  loadBrandingState,
  getBrandingStateSync,
  saveBrandingState,
  saveAssetFile,
  getSystemDiagnostic,
  UPLOADS_DIR,
  DEFAULT_BRANDING_STATE,
} from './brandingStorage.js';
import { isSupabaseConfigured } from './supabaseClient.js';

const ADMIN_PASSWORD_ENV = process.env.ADMIN_PASSWORD;
const DEFAULT_FALLBACK_PASSWORD = 'curecraft-admin-2025';
const TOKEN_SECRET =
  process.env.TOKEN_SECRET ||
  `curecraft-secure-salt-2025-${ADMIN_PASSWORD_ENV || DEFAULT_FALLBACK_PASSWORD}`;

// Authentication helpers (HMAC-SHA256 Token)
export function generateAdminToken(): string {
  const payload = {
    role: 'owner',
    timestamp: Date.now(),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadB64)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8')
    );
    // Token valid for 7 days
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.timestamp > maxAge) {
      return false;
    }
    return payload.role === 'owner';
  } catch {
    return false;
  }
}

// Admin Auth Middleware
export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : ((req.headers['x-admin-token'] as string) || (req.cookies?.admin_token as string));

  if (verifyAdminToken(token)) {
    next();
  } else {
    res.status(401).json({
      success: false,
      error: 'Unauthorized. Invalid or expired admin credentials.',
    });
  }
}

export function createApp() {
  const app = express();

  // JSON payload parser with generous limit
  app.use(express.json({ limit: '15mb' }));

  // Static serving for local uploads (if on Node server)
  app.use(
    '/uploads',
    express.static(UPLOADS_DIR, {
      maxAge: '1d',
      immutable: true,
    })
  );

  const apiRouter = express.Router();

  // ==========================================
  // Public Branding API (Accessible to all visitors)
  // ==========================================
  apiRouter.get('/branding/public', async (_req: Request, res: Response) => {
    try {
      const state = await loadBrandingState();
      res.setHeader(
        'Cache-Control',
        'public, max-age=15, stale-while-revalidate=60'
      );
      res.json(state.published);
    } catch (err: any) {
      console.error('[API] Error loading public branding:', err);
      res.json(DEFAULT_BRANDING_STATE.published);
    }
  });

  // ==========================================
  // Admin Authentication API
  // ==========================================
  apiRouter.post('/admin/login', (req: Request, res: Response) => {
    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Password is required to authenticate.',
      });
      return;
    }

    const input = password.trim();
    const envPass = (ADMIN_PASSWORD_ENV || '').trim();

    // Authenticate if matches configured env password or the default studio password
    const isMatch =
      (envPass && input === envPass) ||
      input === DEFAULT_FALLBACK_PASSWORD;

    if (isMatch) {
      const token = generateAdminToken();
      res.json({
        success: true,
        token,
        message: 'Authenticated as Cure Craft Owner',
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid password. Access denied.',
      });
    }
  });

  apiRouter.get('/admin/check-auth', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : ((req.headers['x-admin-token'] as string) || (req.cookies?.admin_token as string));

    if (verifyAdminToken(token)) {
      res.json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });

  // ==========================================
  // Admin Diagnostics & System Status
  // ==========================================
  apiRouter.get(
    '/admin/system-status',
    requireAdminAuth,
    async (_req: Request, res: Response) => {
      try {
        const diagnostics = await getSystemDiagnostic();
        res.json({
          success: true,
          diagnostics,
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: err?.message || 'Failed to inspect system status',
        });
      }
    }
  );

  // ==========================================
  // Admin Branding Management API (Protected)
  // ==========================================

  // Get current draft and published state
  apiRouter.get(
    '/admin/branding/draft',
    requireAdminAuth,
    async (_req: Request, res: Response) => {
      try {
        const state = await loadBrandingState();
        const isBadgeDirty =
          JSON.stringify(state.draft.studioBadge) !==
          JSON.stringify(state.published.studioBadge);
        const isBannerDirty =
          JSON.stringify(state.draft.headerBanner) !==
          JSON.stringify(state.published.headerBanner);

        res.json({
          draft: state.draft,
          published: state.published,
          isBadgeDirty,
          isBannerDirty,
          hasUnpublishedChanges: isBadgeDirty || isBannerDirty,
          storageProvider: isSupabaseConfigured() ? 'supabase' : 'local',
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: err?.message || 'Failed to read draft state',
        });
      }
    }
  );

  // Update draft settings (crop, positioning, overlay, etc.)
  apiRouter.put(
    '/admin/branding/draft',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const state = await loadBrandingState();
        const { studioBadge, headerBanner } = req.body;

        if (studioBadge) {
          state.draft.studioBadge = {
            ...state.draft.studioBadge,
            ...studioBadge,
          };
        }
        if (headerBanner) {
          state.draft.headerBanner = {
            ...state.draft.headerBanner,
            ...headerBanner,
          };
        }

        state.draft.updatedAt = Date.now();
        await saveBrandingState(state);

        const isBadgeDirty =
          JSON.stringify(state.draft.studioBadge) !==
          JSON.stringify(state.published.studioBadge);
        const isBannerDirty =
          JSON.stringify(state.draft.headerBanner) !==
          JSON.stringify(state.published.headerBanner);

        res.json({
          success: true,
          draft: state.draft,
          isBadgeDirty,
          isBannerDirty,
          hasUnpublishedChanges: isBadgeDirty || isBannerDirty,
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: err?.message || 'Failed to update draft settings',
        });
      }
    }
  );

  // Image Upload Handler (Stores in Supabase Storage or local fallback)
  apiRouter.post(
    '/admin/branding/upload',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const { fileData, assetType } = req.body;

        if (!fileData || typeof fileData !== 'string') {
          res.status(400).json({
            success: false,
            error: 'Missing image file data.',
          });
          return;
        }

        if (assetType !== 'badge' && assetType !== 'banner') {
          res.status(400).json({
            success: false,
            error: 'Invalid assetType. Must be "badge" or "banner".',
          });
          return;
        }

        // Parse base64 data URI
        const match = fileData.match(
          /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/
        );
        if (!match) {
          res.status(400).json({
            success: false,
            error: 'Invalid data URL format. Expected base64 image.',
          });
          return;
        }

        const mimeType = match[1].toLowerCase();
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // File size check (max 15MB)
        const MAX_SIZE = 15 * 1024 * 1024;
        if (buffer.length > MAX_SIZE) {
          res.status(400).json({
            success: false,
            error: 'File size exceeds maximum allowable limit of 15MB.',
          });
          return;
        }

        // Validate MIME type & file extension
        let extension = 'png';
        const allowedMimes = [
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/webp',
          'image/svg+xml',
        ];
        if (!allowedMimes.includes(mimeType)) {
          res.status(400).json({
            success: false,
            error: `Unsupported file format (${mimeType}). Accepted formats: PNG, JPG, JPEG, WebP, SVG.`,
          });
          return;
        }

        if (mimeType === 'image/jpeg' || mimeType === 'image/jpg')
          extension = 'jpg';
        else if (mimeType === 'image/webp') extension = 'webp';
        else if (mimeType === 'image/svg+xml') extension = 'svg';

        // Magic bytes inspection
        if (extension === 'png') {
          const isPng =
            buffer[0] === 0x89 &&
            buffer[1] === 0x50 &&
            buffer[2] === 0x4e &&
            buffer[3] === 0x47;
          if (!isPng) {
            res.status(400).json({ success: false, error: 'Corrupt or invalid PNG header.' });
            return;
          }
        } else if (extension === 'jpg') {
          const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
          if (!isJpg) {
            res.status(400).json({ success: false, error: 'Corrupt or invalid JPEG header.' });
            return;
          }
        } else if (extension === 'webp') {
          const isRiff = buffer.toString('utf-8', 0, 4) === 'RIFF';
          const isWebp = buffer.toString('utf-8', 8, 12) === 'WEBP';
          if (!isRiff || !isWebp) {
            res.status(400).json({ success: false, error: 'Corrupt or invalid WebP header.' });
            return;
          }
        } else if (extension === 'svg') {
          // SVG Sanitization
          let svgContent = buffer.toString('utf-8');
          if (!svgContent.includes('<svg')) {
            res.status(400).json({ success: false, error: 'Invalid SVG file structure.' });
            return;
          }
          svgContent = svgContent
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/\son\w+="[^"]*"/gi, '')
            .replace(/\son\w+='[^']*'/gi, '')
            .replace(/href=["']javascript:[^"']*["']/gi, '');

          buffer.write(svgContent, 'utf-8');
        }

        // Save file to persistent cloud storage (or local fallback)
        const savedAsset = await saveAssetFile(
          buffer,
          extension,
          mimeType,
          assetType
        );

        // Update draft asset URL
        const state = await loadBrandingState();
        if (assetType === 'badge') {
          state.draft.studioBadge.url = savedAsset.url;
          state.draft.studioBadge.visible = true;
        } else if (assetType === 'banner') {
          state.draft.headerBanner.url = savedAsset.url;
          state.draft.headerBanner.visible = true;
        }
        state.draft.updatedAt = Date.now();
        await saveBrandingState(state);

        res.json({
          success: true,
          url: savedAsset.url,
          storageProvider: savedAsset.storageProvider,
          fileName: savedAsset.fileName,
          size: buffer.length,
          mimeType,
          draft: state.draft,
        });
      } catch (err: any) {
        console.error('[API] Upload error:', err);
        res.status(500).json({
          success: false,
          error: err?.message || 'File upload failed.',
        });
      }
    }
  );

  // Publish Draft to Live
  apiRouter.post(
    '/admin/branding/publish',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const { target } = req.body; // 'badge' | 'banner' | 'all'
        const state = await loadBrandingState();

        if (target === 'badge') {
          state.published.studioBadge = JSON.parse(
            JSON.stringify(state.draft.studioBadge)
          );
        } else if (target === 'banner') {
          state.published.headerBanner = JSON.parse(
            JSON.stringify(state.draft.headerBanner)
          );
        } else {
          // 'all'
          state.published.studioBadge = JSON.parse(
            JSON.stringify(state.draft.studioBadge)
          );
          state.published.headerBanner = JSON.parse(
            JSON.stringify(state.draft.headerBanner)
          );
        }

        state.published.publishedAt = Date.now();
        state.published.version = (state.published.version || 1) + 1;
        await saveBrandingState(state);

        res.json({
          success: true,
          published: state.published,
          draft: state.draft,
          message: `Successfully published ${target || 'branding'} to live website.`,
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: err?.message || 'Failed to publish branding.',
        });
      }
    }
  );

  // Discard draft changes and revert to published
  apiRouter.post(
    '/admin/branding/discard',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const { target } = req.body; // 'badge' | 'banner' | 'all'
        const state = await loadBrandingState();

        if (target === 'badge') {
          state.draft.studioBadge = JSON.parse(
            JSON.stringify(state.published.studioBadge)
          );
        } else if (target === 'banner') {
          state.draft.headerBanner = JSON.parse(
            JSON.stringify(state.published.headerBanner)
          );
        } else {
          state.draft.studioBadge = JSON.parse(
            JSON.stringify(state.published.studioBadge)
          );
          state.draft.headerBanner = JSON.parse(
            JSON.stringify(state.published.headerBanner)
          );
        }

        state.draft.updatedAt = Date.now();
        await saveBrandingState(state);

        res.json({
          success: true,
          draft: state.draft,
          message: 'Unpublished draft changes discarded.',
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: err?.message || 'Failed to discard draft changes.',
        });
      }
    }
  );

  // Restore Default Branded Fallback for either asset independently
  apiRouter.post(
    '/admin/branding/restore-default',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const { target } = req.body; // 'badge' | 'banner'
        const state = await loadBrandingState();

        if (target === 'badge') {
          state.draft.studioBadge = {
            ...DEFAULT_BRANDING_STATE.draft.studioBadge,
            url: null,
          };
        } else if (target === 'banner') {
          state.draft.headerBanner = {
            ...DEFAULT_BRANDING_STATE.draft.headerBanner,
            url: null,
          };
        }

        state.draft.updatedAt = Date.now();
        await saveBrandingState(state);

        res.json({
          success: true,
          draft: state.draft,
          message: `Restored default branded fallback for ${target}. Click 'Publish' to make live.`,
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: err?.message || 'Failed to restore default fallback.',
        });
      }
    }
  );

  // Mount apiRouter on BOTH '/api' and '/' to guarantee compatibility with:
  // 1. Direct requests: /api/admin/login
  // 2. Vercel rewrites: /api/(.*) -> /api/$1 or /api
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  return app;
}

export default createApp();
