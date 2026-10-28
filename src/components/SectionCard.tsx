import React from 'react';
import { ChevronRight, RotateCcw, Check } from 'lucide-react';

interface SectionCardProps {
  number: string;
  title: string;
  description: string;
  isFilled: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  children: React.ReactNode;
  id?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  number,
  title,
  description,
  isFilled,
  isOpen,
  onToggle,
  onClear,
  children,
  id,
}) => {
  return (
    <div
      id={id}
      className={`border rounded-[24px] transition-all duration-200 scroll-mt-24 min-w-0 w-full overflow-hidden ${
        isOpen
          ? 'bg-[#081a24] border-[#438D96]/70 shadow-xl shadow-black/60'
          : 'bg-[#040e15] border-[#156876]/40 hover:border-[#438D96]/60 hover:bg-[#081a24]/60'
      }`}
    >
      {/* Header Bar */}
      <div
        onClick={onToggle}
        className="flex items-center justify-between p-3 sm:p-5 cursor-pointer select-none gap-2 min-w-0 group"
      >
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          {/* Section Number Badge - Fully Rounded Circle Preserving Number */}
          <div
            className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all ${
              isFilled
                ? 'bg-[#00E4FF] text-[#000611] shadow-[0_0_14px_rgba(0,228,255,0.45)]'
                : 'bg-[#156876]/30 text-[#8CA0A8] border border-[#156876]/60 group-hover:border-[#438D96]'
            }`}
          >
            {number}
          </div>

          {/* Title & Description */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="text-xs sm:text-base font-bold text-[#F5F9FA] tracking-tight truncate">
                {title}
              </h3>
              {isFilled && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#00E4FF] bg-[#00E4FF]/10 px-2.5 py-0.5 rounded-full border border-[#00E4FF]/30">
                  <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                  Specified
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-[#8CA0A8] truncate max-w-[200px] xs:max-w-xs sm:max-w-md">
              {description}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-1 sm:ml-2" onClick={(e) => e.stopPropagation()}>
          {isFilled && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 sm:p-1.5 px-2 sm:px-2.5 text-[#8CA0A8] hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors text-xs flex items-center gap-1 border border-transparent hover:border-rose-500/20"
              title="Clear this section"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden md:inline">Clear</span>
            </button>
          )}

          {/* Circular Expand/Collapse Arrow Indicator */}
          <button
            type="button"
            onClick={onToggle}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border transition-all duration-200 shrink-0 ${
              isOpen
                ? 'bg-[#156876]/40 border-[#00E4FF]/60 text-[#00E4FF] shadow-[0_0_10px_rgba(0,228,255,0.25)]'
                : 'bg-[#000611] border-[#156876]/60 text-[#8CA0A8] hover:text-[#00E4FF] hover:border-[#438D96] hover:bg-[#156876]/30'
            }`}
            aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
            title={isOpen ? 'Collapse section' : 'Expand section'}
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-200 ease-in-out ${
                isOpen ? 'rotate-90 text-[#00E4FF]' : 'rotate-0 text-[#8CA0A8]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isOpen && (
        <div className="px-3.5 sm:px-5 pb-5 sm:pb-6 pt-1 border-t border-[#156876]/30 space-y-4 animate-in fade-in duration-150 min-w-0">
          {children}
        </div>
      )}
    </div>
  );
};
