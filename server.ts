import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'curecraft-admin-2025';
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'curecraft-secure-salt-2025-' + (process.env.ADMIN_PASSWORD || 'curecraft');

// Central data directory for persistent branding records and uploaded artwork
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const BRANDING_FILE = path.resolve(DATA_DIR, 'branding.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface StudioBadgeConfig {
  url: string | null;
  fit: 'cover' | 'contain';
  scale: number;
  shape: 'circle' | 'squircle' | 'pill';
  customBorder: boolean;
  visible: boolean;
}

interface HeaderBannerConfig {
  url: string | null;
  focalPointY: 'top' | 'center' | 'bottom';
  overlayDarkness: number;
  blur: number;
  textPosition: 'left' | 'center';
  visible: boolean;
}

interface BrandingState {
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

const DEFAULT_BRANDING_STATE: BrandingState = {
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

// Load or initialize branding records
function loadBranding(): BrandingState {
  try {
    if (fs.existsSync(BRANDING_FILE)) {
      const data = fs.readFileSync(BRANDING_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return {
        published: { ...DEFAULT_BRANDING_STATE.published, ...parsed.published },
        draft: { ...DEFAULT_BRANDING_STATE.draft, ...parsed.draft },
      };
    }
  } catch (err) {
    console.error('Failed to read branding.json, using defaults', err);
  }
  saveBranding(DEFAULT_BRANDING_STATE);
  return DEFAULT_BRANDING_STATE;
}

function saveBranding(state: BrandingState): void {
  try {
    fs.writeFileSync(BRANDING_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write branding.json', err);
  }
}

let brandingData = loadBranding();

// Authentication helpers (HMAC-SHA256 Token)
function generateAdminToken(): string {
  const payload = {
    role: 'owner',
    timestamp: Date.now(),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadB64).digest('base64url');

  if (signature !== expectedSignature) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
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
function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.cookies?.admin_token as string);

  if (verifyAdminToken(token)) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Invalid or expired admin credentials.' });
  }
}

async function startServer() {
  const app = express();

  // JSON payload parser with generous limit for image uploads
  app.use(express.json({ limit: '25mb' }));

  // Static serving for uploaded branding assets
  app.use('/uploads', express.static(UPLOADS_DIR, {
    maxAge: '1d',
    immutable: true,
  }));

  // ==========================================
  // Public Branding API
  // ==========================================
  app.get('/api/branding/public', (_req: Request, res: Response) => {
    // Return only the published configuration to visitors
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    res.json(brandingData.published);
  });

  // ==========================================
  // Admin Authentication API
  // ==========================================
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Password required' });
      return;
    }

    if (password.trim() === ADMIN_PASSWORD.trim()) {
      const token = generateAdminToken();
      res.json({
        success: true,
        token,
        message: 'Authenticated as Cure Craft Owner',
      });
    } else {
      res.status(401).json({ error: 'Invalid password. Access denied.' });
    }
  });

  app.get('/api/admin/check-auth', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.cookies?.admin_token as string);

    if (verifyAdminToken(token)) {
      res.json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });

  // ==========================================
  // Admin Branding Management API (Protected)
  // ==========================================
  
  // Get draft and publish state
  app.get('/api/admin/branding/draft', requireAdminAuth, (_req: Request, res: Response) => {
    const isBadgeDirty = JSON.stringify(brandingData.draft.studioBadge) !== JSON.stringify(brandingData.published.studioBadge);
    const isBannerDirty = JSON.stringify(brandingData.draft.headerBanner) !== JSON.stringify(brandingData.published.headerBanner);

    res.json({
      draft: brandingData.draft,
      published: brandingData.published,
      isBadgeDirty,
      isBannerDirty,
      hasUnpublishedChanges: isBadgeDirty || isBannerDirty,
    });
  });

  // Update draft configuration
  app.put('/api/admin/branding/draft', requireAdminAuth, (req: Request, res: Response) => {
    const { studioBadge, headerBanner } = req.body;

    if (studioBadge) {
      brandingData.draft.studioBadge = {
        ...brandingData.draft.studioBadge,
        ...studioBadge,
      };
    }
    if (headerBanner) {
      brandingData.draft.headerBanner = {
        ...brandingData.draft.headerBanner,
        ...headerBanner,
      };
    }

    brandingData.draft.updatedAt = Date.now();
    saveBranding(brandingData);

    const isBadgeDirty = JSON.stringify(brandingData.draft.studioBadge) !== JSON.stringify(brandingData.published.studioBadge);
    const isBannerDirty = JSON.stringify(brandingData.draft.headerBanner) !== JSON.stringify(brandingData.published.headerBanner);

    res.json({
      success: true,
      draft: brandingData.draft,
      isBadgeDirty,
      isBannerDirty,
      hasUnpublishedChanges: isBadgeDirty || isBannerDirty,
    });
  });

  // Secure Image Upload Handler (PNG, JPG, WebP, sanitized SVG)
  app.post('/api/admin/branding/upload', requireAdminAuth, (req: Request, res: Response) => {
    const { fileData, fileName, assetType } = req.body;

    if (!fileData || typeof fileData !== 'string') {
      res.status(400).json({ error: 'Missing image file data.' });
      return;
    }

    // Parse base64 data URI
    const match = fileData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!match) {
      res.status(400).json({ error: 'Invalid data URL format. Expected base64 encoded image.' });
      return;
    }

    const mimeType = match[1].toLowerCase();
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // 1. File size check (max 15MB)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      res.status(400).json({ error: 'File size exceeds maximum allowable limit of 15MB.' });
      return;
    }

    // 2. Validate MIME type & file extension
    let extension = 'png';
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedMimes.includes(mimeType)) {
      res.status(400).json({ error: `Unsupported file format (${mimeType}). Accepted formats: PNG, JPG, JPEG, WebP, SVG.` });
      return;
    }

    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') extension = 'jpg';
    else if (mimeType === 'image/webp') extension = 'webp';
    else if (mimeType === 'image/svg+xml') extension = 'svg';

    // 3. Magic bytes inspection
    if (extension === 'png') {
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
      if (!isPng) {
        res.status(400).json({ error: 'Corrupt or invalid PNG header.' });
        return;
      }
    } else if (extension === 'jpg') {
      const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      if (!isJpg) {
        res.status(400).json({ error: 'Corrupt or invalid JPEG header.' });
        return;
      }
    } else if (extension === 'webp') {
      const isRiff = buffer.toString('utf-8', 0, 4) === 'RIFF';
      const isWebp = buffer.toString('utf-8', 8, 12) === 'WEBP';
      if (!isRiff || !isWebp) {
        res.status(400).json({ error: 'Corrupt or invalid WebP header.' });
        return;
      }
    } else if (extension === 'svg') {
      // SVG Sanitization
      let svgContent = buffer.toString('utf-8');
      if (!svgContent.includes('<svg')) {
        res.status(400).json({ error: 'Invalid SVG file structure.' });
        return;
      }
      // Strip potentially malicious scripts / inline handlers
      svgContent = svgContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '')
        .replace(/href=["']javascript:[^"']*["']/gi, '');

      // Re-encode sanitized SVG buffer
      buffer.write(svgContent, 'utf-8');
    }

    // 4. Save file uniquely on server
    const fileHash = crypto.randomBytes(12).toString('hex');
    const safeName = `${assetType || 'asset'}-${fileHash}.${extension}`;
    const filePath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;

    // Auto-update draft asset URL
    if (assetType === 'badge') {
      brandingData.draft.studioBadge.url = publicUrl;
      brandingData.draft.studioBadge.visible = true;
    } else if (assetType === 'banner') {
      brandingData.draft.headerBanner.url = publicUrl;
      brandingData.draft.headerBanner.visible = true;
    }
    brandingData.draft.updatedAt = Date.now();
    saveBranding(brandingData);

    res.json({
      success: true,
      url: publicUrl,
      fileName: safeName,
      size: buffer.length,
      mimeType,
      draft: brandingData.draft,
    });
  });

  // Publish Draft to Live
  app.post('/api/admin/branding/publish', requireAdminAuth, (req: Request, res: Response) => {
    const { target } = req.body; // 'badge' | 'banner' | 'all'

    if (target === 'badge') {
      brandingData.published.studioBadge = JSON.parse(JSON.stringify(brandingData.draft.studioBadge));
    } else if (target === 'banner') {
      brandingData.published.headerBanner = JSON.parse(JSON.stringify(brandingData.draft.headerBanner));
    } else {
      // 'all'
      brandingData.published.studioBadge = JSON.parse(JSON.stringify(brandingData.draft.studioBadge));
      brandingData.published.headerBanner = JSON.parse(JSON.stringify(brandingData.draft.headerBanner));
    }

    brandingData.published.publishedAt = Date.now();
    brandingData.published.version = (brandingData.published.version || 1) + 1;
    saveBranding(brandingData);

    res.json({
      success: true,
      published: brandingData.published,
      draft: brandingData.draft,
      message: `Successfully published ${target || 'branding'} to live website.`,
    });
  });

  // Discard draft changes
  app.post('/api/admin/branding/discard', requireAdminAuth, (req: Request, res: Response) => {
    const { target } = req.body; // 'badge' | 'banner' | 'all'

    if (target === 'badge') {
      brandingData.draft.studioBadge = JSON.parse(JSON.stringify(brandingData.published.studioBadge));
    } else if (target === 'banner') {
      brandingData.draft.headerBanner = JSON.parse(JSON.stringify(brandingData.published.headerBanner));
    } else {
      brandingData.draft.studioBadge = JSON.parse(JSON.stringify(brandingData.published.studioBadge));
      brandingData.draft.headerBanner = JSON.parse(JSON.stringify(brandingData.published.headerBanner));
    }

    brandingData.draft.updatedAt = Date.now();
    saveBranding(brandingData);

    res.json({
      success: true,
      draft: brandingData.draft,
      message: 'Unpublished draft changes discarded.',
    });
  });

  // Restore Default Branded Fallback for either asset independently
  app.post('/api/admin/branding/restore-default', requireAdminAuth, (req: Request, res: Response) => {
    const { target } = req.body; // 'badge' | 'banner'

    if (target === 'badge') {
      brandingData.draft.studioBadge = {
        ...DEFAULT_BRANDING_STATE.draft.studioBadge,
        url: null,
      };
    } else if (target === 'banner') {
      brandingData.draft.headerBanner = {
        ...DEFAULT_BRANDING_STATE.draft.headerBanner,
        url: null,
      };
    }

    brandingData.draft.updatedAt = Date.now();
    saveBranding(brandingData);

    res.json({
      success: true,
      draft: brandingData.draft,
      message: `Restored default branded fallback for ${target}. Click 'Publish' to make live.`,
    });
  });

  // ==========================================
  // Vite Integration (Dev) or Static Serving (Prod)
  // ==========================================
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cure Craft Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
