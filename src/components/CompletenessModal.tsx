import React from 'react';
import { X, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';
import { CompletenessScore } from '../types/prompt';

interface CompletenessModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: CompletenessScore;
  onJumpToCategory: (categoryKey: string) => void;
}

export const CompletenessModal: React.FC<CompletenessModalProps> = ({
  isOpen,
  onClose,
  score,
  onJumpToCategory,
}) => {
  if (!isOpen) return null;

  const getScoreColor = (val: number) => {
    if (val >= 85) return 'text-[#00E4FF] bg-[#00E4FF]/15 border-[#00E4FF]/40 shadow-[0_0_12px_rgba(0,228,255,0.3)]';
    if (val >= 60) return 'text-[#438D96] bg-[#438D96]/15 border-[#438D96]/40';
    if (val >= 40) return 'text-amber-300 bg-amber-400/10 border-amber-400/40';
    return 'text-[#8CA0A8] bg-[#156876]/20 border-[#156876]/40';
  };

  const mapKeyToSectionId: Record<string, string> = {
    style: 'sec-01',
    purpose: 'sec-02',
    subject: 'sec-05',
    face: 'sec-06',
    pose: 'sec-07',
    outfit: 'sec-08',
    camera: 'sec-09',
    background: 'sec-10',
    lighting: 'sec-11',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#040e15] border border-[#156876]/50 rounded-[28px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:px-6 border-b border-[#156876]/30 bg-[#081a24]">
          <div className="flex items-center gap-3.5">
            <div className={`px-4 py-2 rounded-full border font-mono font-bold text-lg ${getScoreColor(score.total)}`}>
              {score.total}%
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F5F9FA]">
                Prompt Completeness Analysis
              </h2>
              <p className="text-xs text-[#8CA0A8]">
                Weighted breakdown of the 9 essential creative dimensions.
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

        {/* Progress bar track - Fully Rounded */}
        <div className="w-full bg-[#000611] px-6 py-2">
          <div className="w-full bg-[#156876]/30 h-2.5 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#438D96] to-[#00E4FF] rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(0,228,255,0.4)]"
              style={{ width: `${score.total}%` }}
            />
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Actionable Suggestions - Rounded Container */}
          {score.suggestions.length > 0 && (
            <div className="p-4 rounded-[22px] bg-[#156876]/20 border border-[#00E4FF]/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#00E4FF] uppercase tracking-wider">
                <Lightbulb className="w-4 h-4" />
                <span>Recommended Enhancements</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#F5F9FA]">
                {score.suggestions.map((sug, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#00E4FF] font-bold">•</span>
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Breakdown List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#8CA0A8] uppercase tracking-wider mb-2 px-1">
              Core Categories ({score.categoriesCompleted} of {score.totalCategories} filled)
            </h3>

            {score.breakdown.map((item) => (
              <div
                key={item.key}
                onClick={() => {
                  const secId = mapKeyToSectionId[item.key];
                  if (secId) {
                    onJumpToCategory(secId);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-[20px] border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  item.completed
                    ? 'bg-[#081a24] border-[#156876]/50 hover:border-[#00E4FF]/60'
                    : 'bg-[#000611] border-[#156876]/30 hover:border-[#438D96]/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#00E4FF] shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#8CA0A8]/50 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h4 className={`text-xs font-bold truncate ${item.completed ? 'text-[#F5F9FA]' : 'text-[#8CA0A8]'}`}>
                      {item.label}
                    </h4>
                    {item.reason && (
                      <p className="text-[11px] text-[#8CA0A8]/70 truncate">
                        {item.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                    item.completed ? 'bg-[#00E4FF]/10 text-[#00E4FF] border border-[#00E4FF]/30' : 'bg-[#156876]/20 text-[#8CA0A8]/60'
                  }`}>
                    {item.earned} / {item.max} pts
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Scoring Methodology Note - Rounded */}
          <div className="p-3.5 bg-[#000611] rounded-[20px] border border-[#156876]/30 text-[11px] text-[#8CA0A8] leading-relaxed">
            <p>
              <strong className="text-[#F5F9FA]">Scoring Transparency:</strong> Cure Craft evaluates prompts across 9 visual parameters. Weights are dynamically recalculated if you switch between Portrait subjects and Product/Scene subjects so non-human projects are never unfairly penalized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
