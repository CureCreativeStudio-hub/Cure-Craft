import React from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { PRESET_PROMPTS } from '../data/sectionsData';
import { SavedPrompt } from '../types/prompt';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: SavedPrompt) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#040e15] border border-[#156876]/50 rounded-[28px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:px-6 border-b border-[#156876]/30 bg-[#081a24]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-[#156876]/40 text-[#00E4FF] border border-[#00E4FF]/40 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F9FA]">Curated Designer Presets</h2>
              <p className="text-xs text-[#8CA0A8]">
                Pre-configured studio archetypes to jumpstart your creative image production.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8CA0A8] hover:text-[#F5F9FA] hover:bg-[#156876]/40 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_PROMPTS.map((preset) => (
            <div
              key={preset.id}
              className="p-5 rounded-[24px] bg-[#081a24] border border-[#156876]/40 hover:border-[#00E4FF]/60 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-[#00E4FF]/10"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-sm text-[#F5F9FA] group-hover:text-[#00E4FF] transition-colors">
                    {preset.title}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-1 mb-3.5">
                  {preset.tags?.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-[#156876]/30 text-[#8CA0A8] border border-[#156876]/50"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-[#8CA0A8] line-clamp-4 leading-relaxed bg-[#000611] p-3.5 rounded-[18px] border border-[#156876]/30 mb-4 font-sans">
                  {preset.promptText}
                </p>
              </div>

              <button
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-full text-xs font-bold bg-[#156876]/30 group-hover:bg-[#00E4FF] text-[#F5F9FA] group-hover:text-[#000611] border border-[#156876]/60 group-hover:border-[#00E4FF] flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Load into Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
