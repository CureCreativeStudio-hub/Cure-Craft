export interface StudioBadgeConfig {
  url: string | null;
  fit: 'cover' | 'contain';
  scale: number; // 80 - 130
  shape: 'circle' | 'squircle' | 'pill';
  customBorder: boolean;
  visible: boolean;
}

export interface HeaderBannerConfig {
  url: string | null;
  focalPointY: 'top' | 'center' | 'bottom';
  overlayDarkness: number; // 10 - 95
  blur: number; // 0 - 16
  textPosition: 'left' | 'center';
  visible: boolean;
}

export interface SiteBrandingConfig {
  studioBadge: StudioBadgeConfig;
  headerBanner: HeaderBannerConfig;
  updatedAt: number;
  publishedAt?: number;
  publishedBy?: string;
  version: number;
}

export const DEFAULT_BRANDING: SiteBrandingConfig = {
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
  publishedAt: Date.now(),
  publishedBy: 'Cure Creative Studio',
  version: 1,
};
