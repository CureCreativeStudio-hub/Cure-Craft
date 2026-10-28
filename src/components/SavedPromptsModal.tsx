import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Bookmark, 
  Trash2, 
  Edit2, 
  Check, 
  Copy, 
  Download, 
  Upload, 
  Play,
  Clock,
  Sparkles
} from 'lucide-react';
import { SavedPrompt } from '../types/prompt';

interface SavedPromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: SavedPrompt[];
  onLoadPrompt: (prompt: SavedPrompt) => void;
  onDeletePrompt: (id: string) => void;
  onRenamePrompt: (id: string, newTitle: string) => void;
  onImportPrompts: (prompts: SavedPrompt[]) => void;
}

export const SavedPromptsModal: React.FC<SavedPromptsModalProps> = ({
  isOpen,
  onClose,
  prompts,
  onLoadPrompt,
  onDeletePrompt,
  onRenamePrompt,
  onImportPrompts,
}) => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredPrompts = prompts.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.promptText.toLowerCase().includes(q) ||
      p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // ignore
    }
  };

  const handleStartRename = (p: SavedPrompt) => {
    setEditingId(p.id);
    setEditTitle(p.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenamePrompt(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(prompts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cure-craft-library-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportPrompts(parsed);
          setStatusMessage({ text: `Successfully imported ${parsed.length} prompts to library.`, type: 'success' });
          setTimeout(() => setStatusMessage(null), 3500);
        } else {
          setStatusMessage({ text: 'Invalid JSON file: Expected an array of saved prompts.', type: 'error' });
          setTimeout(() => setStatusMessage(null), 4000);
        }
      } catch {
        setStatusMessage({ text: 'Invalid JSON file format. Could not parse file.', type: 'error' });
        setTimeout(() => setStatusMessage(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#040e15] border border-[#156876]/50 rounded-[28px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:px-6 border-b border-[#156876]/30 bg-[#081a24]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-[#156876]/40 text-[#00E4FF] border border-[#00E4FF]/40 shadow-sm">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F9FA]">Saved Prompts Library</h2>
              <p className="text-xs text-[#8CA0A8]">
                {prompts.length} saved prompts in local browser storage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-1.5 text-[#8CA0A8] hover:text-[#00E4FF] hover:bg-[#156876]/30 rounded-full transition-colors text-xs flex items-center gap-1.5 border border-[#156876]/50"
              title="Export all prompts as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <label
              className="px-3.5 py-1.5 text-[#8CA0A8] hover:text-[#00E4FF] hover:bg-[#156876]/30 rounded-full transition-colors text-xs flex items-center gap-1.5 border border-[#156876]/50 cursor-pointer"
              title="Import prompts from JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>

            <button
              onClick={onClose}
              className="p-2 text-[#8CA0A8] hover:text-[#F5F9FA] hover:bg-[#156876]/40 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Message Notification */}
        {statusMessage && (
          <div className={`px-5 py-2.5 text-xs font-medium border-b flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}>
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="text-current opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="p-4 border-b border-[#156876]/30 bg-[#000611]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#8CA0A8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, prompt text, or tag..."
              className="w-full pl-9 pr-4 py-2 bg-[#081a24] border border-[#156876]/60 rounded-full text-xs text-[#F5F9FA] placeholder-[#8CA0A8]/60 focus:outline-none focus:border-[#00E4FF] focus:ring-1 focus:ring-[#00E4FF]"
            />
          </div>
        </div>

        {/* List of Prompts */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-12 text-[#8CA0A8]">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50 text-[#00E4FF]" />
              <p className="text-sm font-medium">No saved prompts found.</p>
              <p className="text-xs text-[#8CA0A8]/70 mt-1">
                Save prompts from the workspace or choose from Curated Presets.
              </p>
            </div>
          ) : (
            filteredPrompts.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-[22px] bg-[#081a24] border border-[#156876]/40 hover:border-[#00E4FF]/50 transition-all group shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  {/* Title & Rename */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(item.id)}
                          className="px-3 py-1 bg-[#000611] border border-[#00E4FF] rounded-full text-xs text-[#F5F9FA] flex-1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(item.id)}
                          className="p-1.5 px-3 bg-[#00E4FF] text-[#000611] font-bold rounded-full text-xs"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold text-sm text-[#F5F9FA] truncate">
                          {item.title}
                        </h3>
                        <button
                          onClick={() => handleStartRename(item)}
                          className="p-1 text-[#8CA0A8] hover:text-[#00E4FF] opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                          title="Rename title"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Metadata and Format */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-[#8CA0A8] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#156876]/40 text-[#00E4FF] border border-[#438D96]/40">
                      {item.format || 'prose'}
                    </span>
                  </div>
                </div>

                {/* Prompt Preview Text */}
                <p className="text-xs text-[#8CA0A8] line-clamp-3 leading-relaxed mb-3.5 font-sans bg-[#000611] p-3 rounded-[16px] border border-[#156876]/30">
                  {item.promptText}
                </p>

                {/* Action Buttons - Fully Rounded */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[#156876]/30">
                  <div className="flex flex-wrap gap-1">
                    {item.tags?.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#156876]/30 text-[#8CA0A8] border border-[#156876]/50"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 justify-end w-full sm:w-auto">
                    <button
                      onClick={() => handleCopy(item.id, item.promptText)}
                      className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                        copiedId === item.id
                          ? 'bg-emerald-500 text-[#000611] font-bold'
                          : 'bg-[#156876]/30 text-[#8CA0A8] hover:text-[#F5F9FA] border border-[#156876]/50'
                      }`}
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => {
                        onLoadPrompt(item);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1 text-xs rounded-full font-bold bg-[#00E4FF] hover:bg-white text-[#000611] transition-all shadow-[0_0_10px_rgba(0,228,255,0.3)]"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Load into Workspace</span>
                    </button>

                    <button
                      onClick={() => onDeletePrompt(item.id)}
                      className="p-1.5 text-[#8CA0A8] hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
                      title="Delete prompt"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
