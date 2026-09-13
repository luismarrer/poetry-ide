import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { analyzePoem, type PoemAnalysisResult } from '@/poetry/index';
import type { FormId } from '@/poetry/forms/types';
import type { PoemOverrides } from '@/poetry/meter/overrides';
import { PoetryEditor } from './editor/PoetryEditor';
import { VerseInspector } from './inspector/VerseInspector';
import { TopBar } from './topbar/TopBar';
import { StatusBar } from './statusbar/StatusBar';
import { PoemStatsModal } from './stats/PoemStatsModal';
import { SAMPLE_POEMS } from '@/data/samplePoems';

const STORAGE_KEY = 'poetry_ide_state_v1';

export const PoetryApp: React.FC = () => {
  // 1. Core State
  const [text, setText] = useState<string>(SAMPLE_POEMS.userCorpus);
  const [formId, setFormId] = useState<FormId>('silva');
  const [overrides, setOverrides] = useState<PoemOverrides>({});
  const [showSynalephas, setShowSynalephas] = useState<boolean>(true);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // 2. Load from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.text === 'string') setText(parsed.text);
        if (parsed.formId === 'libre' || parsed.formId === 'silva') setFormId(parsed.formId);
        if (parsed.overrides) setOverrides(parsed.overrides);
        if (typeof parsed.showSynalephas === 'boolean') setShowSynalephas(parsed.showSynalephas);
        if (parsed.theme === 'light' || parsed.theme === 'dark') setTheme(parsed.theme);
      } else {
        // Default to dark theme if system prefers dark
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setTheme('dark');
        }
      }
    } catch {
      // ignore parsing errors
    }
    setIsLoaded(true);
  }, []);

  // 3. Save to localStorage when state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const payload = {
        text,
        formId,
        overrides,
        showSynalephas,
        theme,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [text, formId, overrides, showSynalephas, theme, isLoaded]);

  // 4. Sync theme class on HTML document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // 5. Deterministic real-time analysis
  const analysis: PoemAnalysisResult = useMemo(() => {
    return analyzePoem(text, formId, overrides);
  }, [text, formId, overrides]);

  const activeVerse = analysis.verses[activeLineIndex] || analysis.verses[0];
  const hasOverridesOnActiveVerse = Boolean(
    overrides[activeLineIndex] &&
    ((overrides[activeLineIndex].synalephas && Object.keys(overrides[activeLineIndex].synalephas!).length > 0) ||
      typeof overrides[activeLineIndex].manualMetricCount === 'number')
  );

  // 6. Action Handlers
  const handleToggleSynalepha = useCallback(
    (lineIndex: number, synId: string, currentActive: boolean) => {
      setOverrides(prev => {
        const existingVerse = prev[lineIndex] || {};
        const existingSyns = existingVerse.synalephas || {};
        return {
          ...prev,
          [lineIndex]: {
            ...existingVerse,
            synalephas: {
              ...existingSyns,
              [synId]: !currentActive,
            },
          },
        };
      });
    },
    []
  );

  const handleSetManualCount = useCallback(
    (lineIndex: number, count?: number) => {
      setOverrides(prev => {
        const existingVerse = prev[lineIndex] || {};
        return {
          ...prev,
          [lineIndex]: {
            ...existingVerse,
            manualMetricCount: count,
          },
        };
      });
    },
    []
  );

  const handleResetVerseOverrides = useCallback((lineIndex: number) => {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[lineIndex];
      return next;
    });
  }, []);

  const handleLoadSample = useCallback((key: string) => {
    const sample = SAMPLE_POEMS[key];
    if (typeof sample === 'string') {
      setText(sample);
      setOverrides({});
      setActiveLineIndex(0);
    }
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] select-text">
      {/* Top Bar */}
      <TopBar
        formId={formId}
        onFormChange={setFormId}
        showSynalephas={showSynalephas}
        onToggleShowSynalephas={() => setShowSynalephas(s => !s)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenStats={() => setIsStatsOpen(true)}
        onLoadSample={handleLoadSample}
      />

      {/* Main Workspace (Editor + Inspector) */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Editor Area */}
        <main className="flex-1 h-full min-w-0 overflow-hidden relative">
          <PoetryEditor
            value={text}
            onChange={setText}
            verses={analysis.verses}
            formId={formId}
            showSynalephas={showSynalephas}
            onActiveVerseChange={setActiveLineIndex}
          />
        </main>

        {/* Inspector Panel */}
        <div className="w-full md:w-80 lg:w-96 h-72 md:h-full flex-shrink-0">
          <VerseInspector
            verse={activeVerse}
            hasOverrides={hasOverridesOnActiveVerse}
            onToggleSynalepha={handleToggleSynalepha}
            onSetManualCount={handleSetManualCount}
            onResetVerseOverrides={handleResetVerseOverrides}
          />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        formId={formId}
        activeVerse={activeVerse}
        summary={analysis.summary}
      />

      {/* Stats Modal */}
      <PoemStatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        formId={formId}
        analysis={analysis}
      />
    </div>
  );
};
