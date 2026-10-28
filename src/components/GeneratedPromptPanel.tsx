import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Bookmark, 
  RotateCcw, 
  RefreshCw, 
  ShieldAlert,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OutputFormat } from '../types/prompt';

interface GeneratedPromptPanelProps {
  promptText: string;
  negativeText: string;
  wordCount: number;
  charCount: number;
  format: OutputFormat;
  onChangeFormat: (format: OutputFormat) => void;
  onSavePrompt: (customText?: string) => void;
  onClearAll: () => void;
  onRebuild: () => void;
}

export const GeneratedPromptPanel: React.FC<GeneratedPromptPanelProps> = ({
  promptText,
  negativeText,
  wordCount,
  charCount,
  format,
  onChangeFormat,
  onSavePrompt,
  onClearAll,
  onRebuild,
}) => {
  const [editedPrompt, setEditedPrompt] = useState(promptText);
  const [editedNegative, setEditedNegative] = useState(negativeText);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedNegative, setCopiedNegative] = useState(false);

  useEffect(() => {
    setEditedPrompt(promptText);
  }, [promptText]);

  useEffect(() => {
    setEditedNegative(negativeText);
  }, [negativeText]);

  const isDiverged = editedPrompt !== promptText;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(editedPrompt);
      setCopiedPrompt(true);
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#00E4FF', '#438D96', '#156876', '#FFFFFF'],
      });
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyNegative = async () => {
    try {
      await navigator.clipboard.writeText(editedNegative);
      setCopiedNegative(true);
      setTimeout(() => setCopiedNegative(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleExportTxt = () => {
    const content = [
      '========================================',
      'CURE CRAFT — MASTER IMAGE PROMPT',
      '========================================',
      `Format: ${format.toUpperCase()}`,
      `Words: ${wordCount} | Characters: ${charCount}`,
      `Exported: ${new Date().toLocaleString()}`,
      '----------------------------------------',
      'PROMPT:',
      editedPrompt,
      '',
      ...(editedNegative
        ? [
            '----------------------------------------',
            'NEGATIVE EXCLUSIONS:',
            editedNegative,
            '',
          ]
        : []),
      '========================================',
      'Generated with Cure Craft Creative Studio',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cure-craft-prompt-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const formats: { id: OutputFormat; label: string; desc: string }[] = [
    { id: 'prose', label: 'Prose', desc: 'Natural fluent creative prompt' },
    { id: 'midjourney', label: 'Midjourney', desc: 'With --ar & --v 6.1 tags' },
    { id: 'flux', label: 'Flux / SD', desc: 'Direct weighted visual tokens' },
    { id: 'structured', label: 'Structured', desc: 'Categorized director blocks' },
  ];

  return (
    <div 
      className="bg-[#081a24] border border-[#156876]/50 rounded-[28px] p-4 sm:p-6 shadow-2xl relative w-full min-w-0"
    >
      {/* Top Controls Header */}
      <div className="pb-4 mb-4 border-b border-[#156876]/30">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-bold text-[#F5F9FA] tracking-tight whitespace-nowrap text-left pl-0">
              Generated Master Prompt
            </h2>
            {isDiverged && (
              <span className="text-[10px] font-semibold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                Manually Edited
              </span>
            )}
          </div>
          <p className="text-xs text-[#8CA0A8] leading-relaxed mt-1 mb-3">
            Real-time compiled synthesis of your selected creative specifications.
          </p>
        </div>

        {/* Syntax Format Pills (Tools) */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-2 pt-0.5">
          <span className="text-[11px] font-semibold text-[#438D96] uppercase tracking-wider shrink-0">
            Format:
          </span>
          <div className="flex flex-wrap sm:flex-nowrap items-center bg-[#000611] p-1 rounded-2xl sm:rounded-full border border-[#156876]/60 gap-1 w-full sm:w-auto shrink-0">
            {formats.map((f) => (
              <button
                key={f.id}
                onClick={() => onChangeFormat(f.id)}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1 text-center text-xs font-semibold rounded-full transition-all ${
                  format === f.id
                    ? 'bg-[#00E4FF] text-[#000611] shadow-[0_0_12px_rgba(0,228,255,0.4)]'
                    : 'text-[#8CA0A8] hover:text-[#F5F9FA]'
                }`}
                title={f.desc}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editable Prompt Textarea */}
      <div className="relative">
        <textarea
          rows={6}
          value={editedPrompt}
          onChange={(e) => setEditedPrompt(e.target.value)}
          placeholder="Select options from the sections to synthesize your image prompt..."
          className="w-full p-3.5 sm:p-4 bg-[#000611] border border-[#156876]/60 rounded-[22px] text-xs sm:text-sm font-sans text-[#F5F9FA] leading-relaxed placeholder-[#8CA0A8]/50 focus:outline-none focus:border-[#00E4FF] focus:ring-1 focus:ring-[#00E4FF] transition-all resize-y"
        />

        {/* Live Word & Character Counts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2.5 px-1 text-xs text-[#8CA0A8]">
          <div className="flex items-center gap-2.5 font-mono text-xs">
            <span>
              <strong className="text-[#00E4FF]">{wordCount}</strong> words
            </span>
            <span>•</span>
            <span>
              <strong className="text-[#00E4FF]">{charCount}</strong> characters
            </span>
          </div>

          {isDiverged && (
            <button
              onClick={() => {
                onRebuild();
                setEditedPrompt(promptText);
              }}
              className="flex items-center justify-center gap-1.5 text-[11px] text-[#00E4FF] hover:underline px-2.5 py-1 rounded-full bg-[#156876]/20 border border-[#00E4FF]/30 transition-all self-start sm:self-auto"
              title="Discard manual edits and rebuild from active section selections"
            >
              <RefreshCw className="w-3 h-3 shrink-0" />
              <span>Re-sync with Builder</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Action Bar - All Pill-Shaped Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-4 pt-4 border-t border-[#156876]/30">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          {/* Primary Copy Button */}
          <button
            onClick={handleCopyPrompt}
            className={`flex-1 sm:flex-initial justify-center flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-md ${
              copiedPrompt
                ? 'bg-emerald-500 text-[#000611]'
                : 'bg-[#00E4FF] hover:bg-white text-[#000611] shadow-[0_0_15px_rgba(0,228,255,0.4)] active:scale-95'
            }`}
          >
            {copiedPrompt ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
            <span>{copiedPrompt ? 'Copied Prompt!' : 'Copy Prompt'}</span>
          </button>

          {/* Export as .TXT */}
          <button
            onClick={handleExportTxt}
            className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#156876]/30 hover:bg-[#156876]/60 text-[#F5F9FA] border border-[#156876]/60 hover:border-[#00E4FF]/60 transition-all"
            title="Download prompt as .txt file"
          >
            <Download className="w-4 h-4 text-[#00E4FF]" />
            <span>Export .TXT</span>
          </button>

          {/* Save to Library */}
          <button
            onClick={() => onSavePrompt(editedPrompt)}
            className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#156876]/30 hover:bg-[#156876]/60 text-[#F5F9FA] border border-[#156876]/60 hover:border-[#00E4FF]/60 transition-all"
            title="Save prompt to personal library"
          >
            <Bookmark className="w-4 h-4 text-[#00E4FF]" />
            <span>Save</span>
          </button>
        </div>

        {/* Clear Workspace */}
        <button
          onClick={onClearAll}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-[#8CA0A8] hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all"
          title="Reset all sections to start a new prompt"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Separate Negative Prompt Section */}
      {editedNegative && (
        <div className="mt-4 pt-3.5 border-t border-[#156876]/30 bg-[#040e15] p-3.5 rounded-[22px] border border-[#156876]/40">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Negative Exclusions Prompt</span>
            </div>
            <button
              onClick={handleCopyNegative}
              className={`flex items-center gap-1 px-3 py-1 text-[11px] rounded-full font-medium transition-colors ${
                copiedNegative
                  ? 'bg-emerald-500 text-[#000611] font-semibold'
                  : 'bg-[#156876]/30 text-[#8CA0A8] hover:text-[#F5F9FA] border border-[#156876]/50'
              }`}
            >
              {copiedNegative ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedNegative ? 'Copied' : 'Copy Negative'}</span>
            </button>
          </div>
          <p className="text-xs font-mono text-[#8CA0A8] leading-relaxed break-words bg-[#000611] p-3 rounded-[16px] border border-[#156876]/40 overflow-hidden">
            {editedNegative}
          </p>
        </div>
      )}
    </div>
  );
};
