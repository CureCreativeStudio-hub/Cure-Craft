import React, { useState, useEffect } from 'react';
import { X, Bookmark } from 'lucide-react';

interface SavePromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle: string;
  onConfirmSave: (title: string, tags: string[]) => void;
}

export const SavePromptDialog: React.FC<SavePromptDialogProps> = ({
  isOpen,
  onClose,
  defaultTitle,
  onConfirmSave,
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Design', 'Studio']);

  useEffect(() => {
    setTitle(defaultTitle);
  }, [defaultTitle]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onConfirmSave(title.trim(), tags);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#040e15] border border-[#156876]/50 rounded-[28px] shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#156876]/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-[#156876]/40 text-[#00E4FF]">
              <Bookmark className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#F5F9FA]">Save Prompt to Library</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-[#8CA0A8] hover:text-[#F5F9FA] hover:bg-[#156876]/30">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title Input - Fully Rounded */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#8CA0A8] uppercase tracking-wider">
            Prompt Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Neon Cyberpunk Hero Shot"
            className="w-full px-4 py-2 bg-[#000611] border border-[#156876]/60 rounded-full text-sm text-[#F5F9FA] focus:outline-none focus:border-[#00E4FF] focus:ring-1 focus:ring-[#00E4FF]"
            autoFocus
          />
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#8CA0A8] uppercase tracking-wider">
            Tags (Optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Add tag and press Enter"
              className="flex-1 px-4 py-1.5 bg-[#000611] border border-[#156876]/60 rounded-full text-xs text-[#F5F9FA] focus:outline-none focus:border-[#00E4FF]"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-1.5 bg-[#156876]/40 hover:bg-[#156876]/70 text-xs font-bold text-[#00E4FF] rounded-full border border-[#156876]/60 transition-colors"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#156876]/30 text-[#00E4FF] border border-[#156876]/50"
              >
                <span>{t}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-rose-400 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Footer - Pill Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#156876]/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#8CA0A8] hover:text-[#F5F9FA] rounded-full"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-5 py-2 text-xs font-bold bg-[#00E4FF] hover:bg-white text-[#000611] rounded-full transition-all shadow-[0_0_10px_rgba(0,228,255,0.3)] disabled:opacity-50"
          >
            Save Prompt
          </button>
        </div>
      </div>
    </div>
  );
};
