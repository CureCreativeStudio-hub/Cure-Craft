import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Bookmark, 
  RotateCcw, 
  CheckCircle2
} from 'lucide-react';
import { SiteBrandingConfig, DEFAULT_BRANDING } from '../types/branding';
import { fetchPublicBranding } from '../services/brandingService';

interface HeaderProps {
  score: number;
  savedCount: number;
  onOpenLibrary: () => void;
  onOpenPresets: () => void;
  onOpenScoreBreakdown: () => void;
  onResetWorkspace: () => void;
  overrideBranding?: SiteBrandingConfig; // Used for live preview in admin
}

export const Header: React.FC<HeaderProps> = ({
  score,
  savedCount,
  onOpenLibrary,
  onOpenPresets,
  onOpenScoreBreakdown,
  onResetWorkspace,
  overrideBranding,
}) => {
  const [branding, setBranding] = useState<SiteBrandingConfig>(overrideBranding || DEFAULT_BRANDING);

  useEffect(() => {
    if (overrideBranding) {
      setBranding(overrideBranding);
      return;
    }

    // Fetch shared published branding from server
    fetchPublicBranding().then((data) => {
      setBranding(data);
    });
  }, [overrideBranding]);

  const { studioBadge, headerBanner } = branding;

  const getScoreColor = (val: number) => {
    if (val >= 85) return 'text-[#00E4FF] border-[#00E4FF]/60 bg-[#00E4FF]/15 shadow-[0_0_10px_rgba(0,228,255,0.25)]';
    if (val >= 60) return 'text-[#438D96] border-[#438D96]/60 bg-[#438D96]/15';
    if (val >= 40) return 'text-amber-300 border-amber-400/40 bg-amber-400/10';
    return 'text-[#8CA0A8] border-[#156876]/60 bg-[#081a24]';
  };

  const getBadgeShapeClass = () => {
    switch (studioBadge.shape) {
      case 'squircle':
        return 'rounded-[20px]';
      case 'pill':
        return 'rounded-full aspect-[4/3]';
      case 'circle':
      default:
        return 'rounded-full';
    }
  };

  const isCentered = headerBanner.textPosition === 'center';

  return (
    <header className="relative w-full border-b border-[#156876]/40 bg-[#000611] overflow-hidden select-none">
      {/* 1. Shared Published Header Banner Background (if active) */}
      {headerBanner.url && headerBanner.visible && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-no-repeat transition-all duration-300 pointer-events-none"
          style={{
            backgroundImage: `url(${headerBanner.url})`,
            backgroundPosition: `center ${headerBanner.focalPointY}`,
            filter: headerBanner.blur > 0 ? `blur(${headerBanner.blur}px)` : 'none',
          }}
        />
      )}

      {/* Dark overlay for text legibility */}
      <div 
        className="absolute inset-0 z-1 pointer-events-none transition-opacity duration-300"
        style={{
          backgroundColor: '#000611',
          opacity: headerBanner.url && headerBanner.visible
            ? headerBanner.overlayDarkness / 100 
            : 0.95,
        }}
      />

      {/* Fallback ambient curves (rendered when banner is empty or overlay is high) */}
      {(!headerBanner.url || !headerBanner.visible || headerBanner.overlayDarkness > 60) && (
        <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden opacity-35">
          <svg className="w-full h-full" viewBox="0 0 1440 240" fill="none" preserveAspectRatio="none">
            <path d="M-100 240 C 300 120, 600 260, 1000 80 C 1200 -20, 1400 100, 1600 60" stroke="#156876" strokeWidth="1.5" strokeOpacity="0.4" />
            <path d="M-50 240 C 450 60, 850 200, 1500 40" stroke="#00E4FF" strokeWidth="1" strokeOpacity="0.3" />
            <radialGradient id="header-ambient-glow" cx="20%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#438D96" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#000611" stopOpacity="0" />
            </radialGradient>
            <rect width="100%" height="100%" fill="url(#header-ambient-glow)" />
          </svg>
        </div>
      )}

      {/* Main Public Header Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className={`flex flex-col ${isCentered ? 'items-center text-center' : 'md:flex-row md:items-center md:justify-between'} gap-5`}>
          
          {/* Brand & Wordmark Area */}
          <div className={`flex items-center gap-3.5 sm:gap-5 min-w-0 ${isCentered ? 'flex-col sm:flex-row justify-center' : ''}`}>
            
            {/* 2. Shared Published Studio Badge (or Default Branded Fallback) */}
            {studioBadge.visible && (
              <div 
                className={`w-12 h-12 sm:w-16 sm:h-16 overflow-hidden ${getBadgeShapeClass()} ${
                  studioBadge.customBorder ? 'border-2 border-[#00E4FF] glow-cyan' : 'border border-[#156876]/60'
                } bg-[#081a24] flex items-center justify-center shrink-0 transition-transform`}
                style={{
                  transform: studioBadge.scale !== 100 ? `scale(${studioBadge.scale / 100})` : undefined,
                }}
              >
                {studioBadge.url ? (
                  <img 
                    src={studioBadge.url} 
                    alt="Cure Craft Studio Badge" 
                    className={`w-full h-full ${studioBadge.fit === 'contain' ? 'object-contain p-1' : 'object-cover'}`}
                  />
                ) : (
                  // Default branded CSS-based fallback mark
                  <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-[#081a24] via-[#0b2432] to-[#156876]">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#156876]/40 border border-[#00E4FF]/60 flex items-center justify-center text-[#00E4FF] font-extrabold text-base sm:text-lg tracking-wider">
                      CC
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Typography */}
            <div className="min-w-0 flex-1">
              <div className={`flex items-center gap-2 sm:gap-3 flex-wrap ${isCentered ? 'justify-center' : ''}`}>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[#F5F9FA] truncate">
                  Cure Craft
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 sm:px-3 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#156876]/40 text-[#00E4FF] border border-[#438D96]/50">
                  Cure Creative Studio
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#00E4FF] mt-0.5 tracking-tight truncate sm:whitespace-normal">
                Your vision. More precisely crafted.
              </p>
              <p className="text-xs text-[#8CA0A8] hidden sm:block mt-0.5 max-w-xl">
                A creative prompt-building workspace for designers who want more control over every visual detail.
              </p>
            </div>
          </div>

          {/* Public Visitor Action Bar (No owner-only controls) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 self-start md:self-center">
            
            {/* Presets Button */}
            <button
              onClick={onOpenPresets}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#081a24] text-[#F5F9FA] border border-[#156876]/50 hover:border-[#00E4FF]/60 hover:text-[#00E4FF] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00E4FF]" />
              <span>Presets</span>
            </button>

            {/* Saved Prompts Library Button */}
            <button
              onClick={onOpenLibrary}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#081a24] text-[#F5F9FA] border border-[#156876]/50 hover:border-[#00E4FF]/60 hover:text-[#00E4FF] transition-all"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#438D96]" />
              <span>Library</span>
              <span className="px-1.5 sm:px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#156876]/60 text-[#00E4FF] border border-[#438D96]/40">
                {savedCount}
              </span>
            </button>

            {/* Completeness Badge Button */}
            <button
              onClick={onOpenScoreBreakdown}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${getScoreColor(score)}`}
              title="Click to view completeness breakdown"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Score: {score}%</span>
            </button>

            {/* Reset Workspace */}
            <button
              onClick={onResetWorkspace}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs text-[#8CA0A8] hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all"
              title="Reset workspace fields to clean state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Signature Radiant Cyan & Teal Horizon Line Divider */}
      <div className="w-full h-[2px] bg-gradient-to-r from-[#00E4FF] via-[#438D96] to-[#00E4FF] horizon-glow" />
    </header>
  );
};
