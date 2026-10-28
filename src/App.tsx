import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { 
  PromptConfig, 
  OutputFormat, 
  SavedPrompt, 
  CompletenessScore 
} from './types/prompt';
import { 
  INITIAL_PROMPT_CONFIG, 
  EMPTY_PROMPT_CONFIG 
} from './data/sectionsData';
import { calculateCompletenessScore } from './services/completenessScorer';
import { generatePrompt } from './services/promptEngine';
import { 
  getSavedPrompts, 
  savePrompt, 
  deletePrompt, 
  saveAllPrompts 
} from './services/storage';

import { Header } from './components/Header';
import { PromptSections } from './components/PromptSections';
import { GeneratedPromptPanel } from './components/GeneratedPromptPanel';
import { LiveSummaryPanel } from './components/LiveSummaryPanel';
import { SavedPromptsModal } from './components/SavedPromptsModal';
import { PresetsModal } from './components/PresetsModal';
import { CompletenessModal } from './components/CompletenessModal';
import { SavePromptDialog } from './components/SavePromptDialog';
import { ConfirmModal } from './components/ConfirmModal';
import { AdminBranding } from './pages/AdminBranding';
import { Shield } from 'lucide-react';

function WorkspaceView() {
  const [config, setConfig] = useState<PromptConfig>(INITIAL_PROMPT_CONFIG);
  const [format, setFormat] = useState<OutputFormat>('prose');
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  
  // Section collapse states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'sec-01': true,
    'sec-02': true,
    'sec-03': false,
    'sec-04': false,
    'sec-05': true,
    'sec-06': false,
    'sec-07': false,
    'sec-08': false,
    'sec-09': true,
    'sec-10': true,
    'sec-11': true,
    'sec-12': false,
    'sec-13': false,
    'sec-14': false,
  });

  // Modals
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [customPromptForSave, setCustomPromptForSave] = useState<string>('');

  // Mobile layout tab switcher ('config' | 'output' | 'summary')
  const [mobileTab, setMobileTab] = useState<'config' | 'output' | 'summary'>('config');

  // Load saved prompts on mount
  useEffect(() => {
    getSavedPrompts().then((list) => {
      setSavedPrompts(list);
    });
  }, []);

  // Compute completeness score
  const completenessScore: CompletenessScore = useMemo(() => {
    return calculateCompletenessScore(config);
  }, [config]);

  // Compute generated master prompt
  const generatedOutput = useMemo(() => {
    return generatePrompt(config, format);
  }, [config, format]);

  // Toggle single section
  const handleToggleSection = useCallback((secId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  }, []);

  // Expand / Collapse all
  const handleExpandAll = useCallback(() => {
    const allOpen: Record<string, boolean> = {};
    for (let i = 1; i <= 14; i++) {
      allOpen[`sec-${i.toString().padStart(2, '0')}`] = true;
    }
    setOpenSections(allOpen);
  }, []);

  const handleCollapseAll = useCallback(() => {
    const allClosed: Record<string, boolean> = {};
    for (let i = 1; i <= 14; i++) {
      allClosed[`sec-${i.toString().padStart(2, '0')}`] = false;
    }
    setOpenSections(allClosed);
  }, []);

  // Jump to section with smooth scroll and open it
  const handleJumpToSection = useCallback((sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: true }));
    setMobileTab('config');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }, []);

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  // Reset workspace
  const handleResetWorkspace = useCallback(() => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Builder Sections?',
      message: 'This will reset all 14 builder sections to clean defaults. Your saved prompts in the library will not be lost.',
      confirmLabel: 'Reset All',
      variant: 'warning',
      onConfirm: () => {
        setConfig(EMPTY_PROMPT_CONFIG);
        setConfirmDialog(null);
      },
    });
  }, []);

  // Load preset or saved prompt
  const handleLoadPrompt = useCallback((promptItem: SavedPrompt) => {
    if (promptItem.config) {
      setConfig(promptItem.config);
    }
    if (promptItem.format) {
      setFormat(promptItem.format);
    }
    setMobileTab('config');
  }, []);

  // Trigger Save Dialog
  const handleOpenSaveDialog = useCallback((customText?: string) => {
    setCustomPromptForSave(customText || generatedOutput.promptText);
    setIsSaveDialogOpen(true);
  }, [generatedOutput.promptText]);

  // Confirm Save to Library
  const handleConfirmSave = useCallback(async (title: string, tags: string[]) => {
    const newPrompt: SavedPrompt = {
      id: `saved-${Date.now()}`,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      promptText: customPromptForSave || generatedOutput.promptText,
      negativeText: generatedOutput.negativeText,
      format,
      config,
      tags,
    };

    await savePrompt(newPrompt);
    const updated = await getSavedPrompts();
    setSavedPrompts(updated);
  }, [config, format, customPromptForSave, generatedOutput]);

  // Delete from Library
  const handleDeletePrompt = useCallback(async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Saved Prompt?',
      message: 'Are you sure you want to delete this prompt from your personal library? This action cannot be undone.',
      confirmLabel: 'Delete Prompt',
      variant: 'danger',
      onConfirm: async () => {
        await deletePrompt(id);
        const updated = await getSavedPrompts();
        setSavedPrompts(updated);
        setConfirmDialog(null);
      },
    });
  }, []);

  // Rename prompt in Library
  const handleRenamePrompt = useCallback(async (id: string, newTitle: string) => {
    const existing = savedPrompts.find((p) => p.id === id);
    if (!existing) return;
    const updatedItem = { ...existing, title: newTitle, updatedAt: Date.now() };
    await savePrompt(updatedItem);
    const updated = await getSavedPrompts();
    setSavedPrompts(updated);
  }, [savedPrompts]);

  // Import JSON prompts
  const handleImportPrompts = useCallback(async (imported: SavedPrompt[]) => {
    const combined = [...imported, ...savedPrompts];
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
    await saveAllPrompts(unique);
    setSavedPrompts(unique);
  }, [savedPrompts]);

  return (
    <div className="min-h-screen bg-[#000611] text-[#F5F9FA] flex flex-col font-sans selection:bg-[#00E4FF] selection:text-[#000611]">
      {/* 1. Shared Public Header (Read-only for visitors) */}
      <Header
        score={completenessScore.total}
        savedCount={savedPrompts.length}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenScoreBreakdown={() => setIsScoreOpen(true)}
        onResetWorkspace={handleResetWorkspace}
      />

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#000611]/95 backdrop-blur-md border-b border-[#156876]/40 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-[#081a24] p-1 rounded-full border border-[#156876]/60 w-full shadow-lg">
          <button
            onClick={() => setMobileTab('config')}
            className={`flex-1 py-1.5 px-1 text-[11px] sm:text-xs font-bold rounded-full transition-all truncate text-center ${
              mobileTab === 'config'
                ? 'bg-[#00E4FF] text-[#000611] shadow-[0_0_10px_rgba(0,228,255,0.35)]'
                : 'text-[#8CA0A8]'
            }`}
          >
            Builder (14)
          </button>
          <button
            onClick={() => setMobileTab('output')}
            className={`flex-1 py-1.5 px-1 text-[11px] sm:text-xs font-bold rounded-full transition-all truncate text-center ${
              mobileTab === 'output'
                ? 'bg-[#00E4FF] text-[#000611] shadow-[0_0_10px_rgba(0,228,255,0.35)]'
                : 'text-[#8CA0A8]'
            }`}
          >
            Prompt Output
          </button>
          <button
            onClick={() => setMobileTab('summary')}
            className={`flex-1 py-1.5 px-1 text-[11px] sm:text-xs font-bold rounded-full transition-all truncate text-center ${
              mobileTab === 'summary'
                ? 'bg-[#00E4FF] text-[#000611] shadow-[0_0_10px_rgba(0,228,255,0.35)]'
                : 'text-[#8CA0A8]'
            }`}
          >
            Summary ({completenessScore.total}%)
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Area 1: Left Workspace Column (14 Numbered Sections) */}
          <section 
            className={`lg:col-span-7 xl:col-span-8 space-y-4 min-w-0 w-full ${
              mobileTab === 'config' ? 'block' : 'hidden lg:block'
            }`}
          >
            <PromptSections
              config={config}
              onChange={setConfig}
              openSections={openSections}
              onToggleSection={handleToggleSection}
              onExpandAll={handleExpandAll}
              onCollapseAll={handleCollapseAll}
            />
          </section>

          {/* Right Column: Area 2 (Generated Output) & Area 3 (Live Summary) */}
          <aside 
            className={`lg:col-span-5 xl:col-span-4 space-y-6 min-w-0 w-full ${
              mobileTab !== 'config' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className={`min-w-0 w-full ${mobileTab === 'output' || mobileTab === 'config' ? 'block' : 'hidden lg:block'}`}>
              <GeneratedPromptPanel
                promptText={generatedOutput.promptText}
                negativeText={generatedOutput.negativeText}
                wordCount={generatedOutput.wordCount}
                charCount={generatedOutput.charCount}
                format={format}
                onChangeFormat={setFormat}
                onSavePrompt={handleOpenSaveDialog}
                onClearAll={handleResetWorkspace}
                onRebuild={() => {
                  setConfig({ ...config });
                }}
              />
            </div>

            <div className={`min-w-0 w-full ${mobileTab === 'summary' || mobileTab === 'config' ? 'block' : 'hidden lg:block'}`}>
              <LiveSummaryPanel
                config={config}
                onJumpToSection={handleJumpToSection}
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Modals & Dialogs */}
      <SavedPromptsModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        prompts={savedPrompts}
        onLoadPrompt={handleLoadPrompt}
        onDeletePrompt={handleDeletePrompt}
        onRenamePrompt={handleRenamePrompt}
        onImportPrompts={handleImportPrompts}
      />

      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleLoadPrompt}
      />

      <CompletenessModal
        isOpen={isScoreOpen}
        onClose={() => setIsScoreOpen(false)}
        score={completenessScore}
        onJumpToCategory={handleJumpToSection}
      />

      <SavePromptDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        defaultTitle={`Cure Craft — ${config.renderStyle.selected || 'Concept'} ${config.purpose.selected || 'Visual'}`}
        onConfirmSave={handleConfirmSave}
      />

      {confirmDialog && (
        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Studio Footer */}
      <footer className="border-t border-[#156876]/40 bg-[#000611] py-6 px-4 sm:px-6 lg:px-8 mt-12 text-center text-xs text-[#8CA0A8]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F5F9FA]">Cure Craft</span>
            <span>•</span>
            <span>Crafted by Cure Creative Studio</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <span>Shared Server Persistence</span>
            <span>•</span>
            <button
              onClick={() => setIsPresetsOpen(true)}
              className="text-[#00E4FF] hover:underline px-2 py-0.5 rounded-full"
            >
              Curated Presets
            </button>
            <span>•</span>
            <button
              onClick={() => setIsLibraryOpen(true)}
              className="text-[#438D96] hover:text-[#00E4FF] hover:underline px-2 py-0.5 rounded-full"
            >
              Library ({savedPrompts.length})
            </button>
            <span>•</span>
            <Link
              to="/admin/branding"
              className="text-[#8CA0A8] hover:text-[#00E4FF] transition-colors flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#156876]/20 border border-[#156876]/40 hover:border-[#00E4FF]/40"
              title="Protected Owner Branding Portal"
            >
              <Shield className="w-3 h-3 text-[#00E4FF]" />
              <span>Owner Portal</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkspaceView />} />
        <Route path="/admin/branding" element={<AdminBranding />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
