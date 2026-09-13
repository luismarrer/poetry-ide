import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { analyzePoem, type PoemAnalysisResult, reconcileOverrides } from '@/poetry/index';
import type { FormId } from '@/poetry/forms/types';
import type { PoemVersion } from '@/poetry/versions/types';
import { createNewVersion } from '@/poetry/versions/types';
import {
  saveProjectState,
  STORAGE_KEY,
  SESSION_BACKUP_KEY,
  type SaveStatus,
  type PoetryProjectBackup,
} from '@/poetry/storage/projectStorage';
import { PoetryEditor } from './editor/PoetryEditor';
import { SplitPoetryEditor } from './editor/SplitPoetryEditor';
import { VersionTabsBar } from './editor/VersionTabsBar';
import { VerseInspector } from './inspector/VerseInspector';
import { TopBar } from './topbar/TopBar';
import { StatusBar } from './statusbar/StatusBar';
import { PoemStatsModal } from './stats/PoemStatsModal';
import { ExportModal } from './export/ExportModal';
import { ImportModal } from './export/ImportModal';
import { SAMPLE_POEMS, SAMPLE_TITLES } from '@/data/samplePoems';

export const PoetryApp: React.FC = () => {
  // 1. Core State — Starts with classic 100% Silva and demonstrates metric decisions cleanly
  const [title, setTitle] = useState<string>(SAMPLE_TITLES.silvaGongora);
  const [versions, setVersions] = useState<PoemVersion[]>([
    {
      id: 'v1',
      name: 'Versión 1',
      text: SAMPLE_POEMS.silvaGongora,
      overrides: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]);
  const [activeVersionId, setActiveVersionId] = useState<string>('v1');
  const [secondaryVersionId, setSecondaryVersionId] = useState<string>('v1');
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [focusedPane, setFocusedPane] = useState<'primary' | 'secondary'>('primary');
  const [activeLineIndexPrimary, setActiveLineIndexPrimary] = useState<number>(0);
  const [activeLineIndexSecondary, setActiveLineIndexSecondary] = useState<number>(0);

  const [formId, setFormId] = useState<FormId>('silva');
  const [showSynalephas, setShowSynalephas] = useState<boolean>(true);
  const [showRhyme, setShowRhyme] = useState<boolean>(true);
  const [rhymeMode, setRhymeMode] = useState<'consonant' | 'assonant'>('consonant');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | undefined>();
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // 2. Load from localStorage or sessionStorage backup on client mount
  useEffect(() => {
    try {
      let saved = localStorage.getItem(STORAGE_KEY);
      if (!saved && typeof window !== 'undefined' && window.sessionStorage) {
        saved = window.sessionStorage.getItem(SESSION_BACKUP_KEY);
      }

      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.title === 'string') setTitle(parsed.title);
        if (parsed.formId === 'libre' || parsed.formId === 'silva') setFormId(parsed.formId);
        if (typeof parsed.showSynalephas === 'boolean') setShowSynalephas(parsed.showSynalephas);
        if (typeof parsed.showRhyme === 'boolean') setShowRhyme(parsed.showRhyme);
        if (parsed.rhymeMode === 'consonant' || parsed.rhymeMode === 'assonant') setRhymeMode(parsed.rhymeMode);
        if (parsed.theme === 'light' || parsed.theme === 'dark') setTheme(parsed.theme);

        // Load or migrate versions
        if (Array.isArray(parsed.versions) && parsed.versions.length > 0) {
          setVersions(parsed.versions);
          if (parsed.activeVersionId && parsed.versions.some((v: PoemVersion) => v.id === parsed.activeVersionId)) {
            setActiveVersionId(parsed.activeVersionId);
          } else {
            setActiveVersionId(parsed.versions[0].id);
          }
          if (parsed.secondaryVersionId && parsed.versions.some((v: PoemVersion) => v.id === parsed.secondaryVersionId)) {
            setSecondaryVersionId(parsed.secondaryVersionId);
          } else if (parsed.versions.length > 1) {
            setSecondaryVersionId(parsed.versions[1].id);
          }
          if (typeof parsed.isSplitView === 'boolean') {
            setIsSplitView(parsed.isSplitView);
          }
        } else if (typeof parsed.text === 'string') {
          // Migrate legacy single text
          const initialVer: PoemVersion = {
            id: 'v1',
            name: 'Versión 1',
            text: parsed.text,
            overrides: parsed.overrides || {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setVersions([initialVer]);
          setActiveVersionId('v1');
          setSecondaryVersionId('v1');
        }
      } else {
        // Default to dark theme if system prefers dark
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setTheme('dark');
        }
      }
    } catch {
      // ignore initial parsing errors
    }
    setIsLoaded(true);
  }, []);

  // Primary and secondary versions
  const primaryVersion = useMemo(() => {
    return versions.find(v => v.id === activeVersionId) || versions[0] || createNewVersion('Versión 1');
  }, [versions, activeVersionId]);

  const secondaryVersion = useMemo(() => {
    const found = versions.find(v => v.id === secondaryVersionId);
    if (found && found.id !== primaryVersion.id) return found;
    const alternative = versions.find(v => v.id !== primaryVersion.id);
    return alternative || primaryVersion;
  }, [versions, secondaryVersionId, primaryVersion]);

  // 3. Save state when state changes (never silent: reports error and keeps session backup)
  useEffect(() => {
    if (!isLoaded) return;
    setSaveStatus('saving');

    const timeout = setTimeout(() => {
      const res = saveProjectState({
        title,
        formId,
        showSynalephas,
        showRhyme,
        rhymeMode,
        theme,
        versions,
        activeVersionId,
        secondaryVersionId,
        isSplitView,
      });

      if (res.success) {
        setSaveStatus('saved');
        setSaveErrorMessage(undefined);
        setLastSavedTime(new Date());
      } else {
        setSaveStatus('error');
        setSaveErrorMessage(res.error);
      }
    }, 150);

    return () => clearTimeout(timeout);
  }, [
    title,
    formId,
    showSynalephas,
    showRhyme,
    rhymeMode,
    theme,
    versions,
    activeVersionId,
    secondaryVersionId,
    isSplitView,
    isLoaded,
  ]);

  // 4. Sync theme class on HTML document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // 5. Deterministic real-time analysis for both panes
  const primaryAnalysis: PoemAnalysisResult = useMemo(() => {
    return analyzePoem(primaryVersion.text, formId, primaryVersion.overrides, rhymeMode);
  }, [primaryVersion.text, formId, primaryVersion.overrides, rhymeMode]);

  const secondaryAnalysis: PoemAnalysisResult = useMemo(() => {
    if (!isSplitView) return primaryAnalysis;
    return analyzePoem(secondaryVersion.text, formId, secondaryVersion.overrides, rhymeMode);
  }, [isSplitView, secondaryVersion.text, formId, secondaryVersion.overrides, rhymeMode, primaryAnalysis]);

  // Focused analysis for Inspector and StatusBar
  const activeAnalysis = focusedPane === 'primary' ? primaryAnalysis : secondaryAnalysis;
  const activeVersion = focusedPane === 'primary' ? primaryVersion : secondaryVersion;
  const activeLineIndex = focusedPane === 'primary' ? activeLineIndexPrimary : activeLineIndexSecondary;
  const activeVerse = activeAnalysis.verses[activeLineIndex] || activeAnalysis.verses[0];
  const hasOverridesOnActiveVerse = Boolean(
    activeVersion.overrides[activeLineIndex] &&
    ((activeVersion.overrides[activeLineIndex].synalephas && Object.keys(activeVersion.overrides[activeLineIndex].synalephas!).length > 0) ||
      typeof activeVersion.overrides[activeLineIndex].manualMetricCount === 'number')
  );

  // 6. Action Handlers for Version Text & Overrides (Protected from line shifts)
  const handleUpdateText = useCallback((versionId: string, newText: string) => {
    setVersions(prev =>
      prev.map(v => {
        if (v.id !== versionId) return v;
        if (v.text === newText) return v;
        const nextOverrides = reconcileOverrides(v.text, newText, v.overrides);
        return {
          ...v,
          text: newText,
          overrides: nextOverrides,
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  const handleToggleSynalepha = useCallback(
    (lineIndex: number, synId: string, currentActive: boolean, pairKey?: string) => {
      setVersions(prev => {
        return prev.map(v => {
          if (v.id !== activeVersion.id) return v;
          const existingVerse = v.overrides[lineIndex] || {};
          const existingSyns = existingVerse.synalephas || {};
          const nextSyns = {
            ...existingSyns,
            [synId]: !currentActive,
          };
          if (pairKey) {
            nextSyns[pairKey] = !currentActive;
          }

          return {
            ...v,
            updatedAt: Date.now(),
            overrides: {
              ...v.overrides,
              [lineIndex]: {
                ...existingVerse,
                synalephas: nextSyns,
              },
            },
          };
        });
      });
    },
    [activeVersion.id]
  );

  const handleSetManualCount = useCallback(
    (lineIndex: number, count?: number) => {
      setVersions(prev => {
        return prev.map(v => {
          if (v.id !== activeVersion.id) return v;
          const existingVerse = v.overrides[lineIndex] || {};
          return {
            ...v,
            updatedAt: Date.now(),
            overrides: {
              ...v.overrides,
              [lineIndex]: {
                ...existingVerse,
                manualMetricCount: count,
              },
            },
          };
        });
      });
    },
    [activeVersion.id]
  );

  const handleResetVerseOverrides = useCallback(
    (lineIndex: number) => {
      setVersions(prev => {
        return prev.map(v => {
          if (v.id !== activeVersion.id) return v;
          const nextOverrides = { ...v.overrides };
          delete nextOverrides[lineIndex];
          return {
            ...v,
            updatedAt: Date.now(),
            overrides: nextOverrides,
          };
        });
      });
    },
    [activeVersion.id]
  );

  const handleInsertWord = useCallback(
    (word: string) => {
      setVersions(prev => {
        return prev.map(v => {
          if (v.id !== activeVersion.id) return v;
          const lines = v.text.split('\n');
          if (activeLineIndex >= 0 && activeLineIndex < lines.length) {
            const line = lines[activeLineIndex];
            lines[activeLineIndex] = line.trim().length > 0 ? `${line.trimEnd()} ${word}` : word;
            const newText = lines.join('\n');
            const nextOverrides = reconcileOverrides(v.text, newText, v.overrides);
            return { ...v, text: newText, overrides: nextOverrides, updatedAt: Date.now() };
          }
          return v;
        });
      });
    },
    [activeVersion.id, activeLineIndex]
  );

  const handleRestoreProject = useCallback((backup: PoetryProjectBackup) => {
    if (backup.title) setTitle(backup.title);
    if (backup.formId) setFormId(backup.formId);
    if (typeof backup.showSynalephas === 'boolean') setShowSynalephas(backup.showSynalephas);
    if (typeof backup.showRhyme === 'boolean') setShowRhyme(backup.showRhyme);
    if (backup.rhymeMode) setRhymeMode(backup.rhymeMode);
    if (backup.theme) setTheme(backup.theme);
    if (Array.isArray(backup.versions) && backup.versions.length > 0) {
      setVersions(backup.versions);
      setActiveVersionId(backup.activeVersionId || backup.versions[0].id);
      if (backup.secondaryVersionId) {
        setSecondaryVersionId(backup.secondaryVersionId);
      } else if (backup.versions.length > 1) {
        setSecondaryVersionId(backup.versions[1].id);
      }
      if (typeof backup.isSplitView === 'boolean') setIsSplitView(backup.isSplitView);
    }
    setActiveLineIndexPrimary(0);
  }, []);

  const handleImportTextAsVersion = useCallback((filename: string, text: string) => {
    const cleanName = filename.replace(/\.[^/.]+$/, '').trim() || 'Poema importado';
    const newVer = createNewVersion(cleanName, text);
    setVersions(prev => [...prev, newVer]);
    setActiveVersionId(newVer.id);
    setActiveLineIndexPrimary(0);
  }, []);

  // 7. Version Management Handlers
  const handleCreateVersion = useCallback(() => {
    const newVersion = createNewVersion(`Versión ${versions.length + 1}`, '');
    setVersions(prev => [...prev, newVersion]);
    setActiveVersionId(newVersion.id);
  }, [versions.length]);

  const handleDuplicateVersion = useCallback(
    (id: string) => {
      const source = versions.find(v => v.id === id);
      if (!source) return;
      const dup = createNewVersion(`${source.name} (Copia)`, source.text, source.overrides);
      setVersions(prev => [...prev, dup]);
      setActiveVersionId(dup.id);
      if (isSplitView) {
        setSecondaryVersionId(dup.id);
      }
    },
    [versions, isSplitView]
  );

  const handleDeleteVersion = useCallback(
    (id: string) => {
      if (versions.length <= 1) return;
      setVersions(prev => prev.filter(v => v.id !== id));
      if (activeVersionId === id) {
        const remaining = versions.filter(v => v.id !== id);
        if (remaining.length > 0) setActiveVersionId(remaining[0].id);
      }
      if (secondaryVersionId === id) {
        const remaining = versions.filter(v => v.id !== id);
        if (remaining.length > 0) setSecondaryVersionId(remaining[0].id);
      }
    },
    [versions, activeVersionId, secondaryVersionId]
  );

  const handleRenameVersion = useCallback((id: string, newName: string) => {
    setVersions(prev =>
      prev.map(v => (v.id === id ? { ...v, name: newName, updatedAt: Date.now() } : v))
    );
  }, []);

  const handleToggleSplitView = useCallback(() => {
    setIsSplitView(current => {
      const next = !current;
      if (next && versions.length === 1) {
        // Automatically duplicate the version if only 1 exists
        const dup = createNewVersion('Versión 2 (Variante)', versions[0].text, versions[0].overrides);
        setVersions(prev => [...prev, dup]);
        setSecondaryVersionId(dup.id);
      }
      return next;
    });
  }, [versions]);

  const handleCopyPrimaryToSecondary = useCallback(() => {
    setVersions(prev =>
      prev.map(v =>
        v.id === secondaryVersion.id
          ? { ...v, text: primaryVersion.text, overrides: { ...primaryVersion.overrides }, updatedAt: Date.now() }
          : v
      )
    );
  }, [primaryVersion.text, primaryVersion.overrides, secondaryVersion.id]);

  const handleCopySecondaryToPrimary = useCallback(() => {
    setVersions(prev =>
      prev.map(v =>
        v.id === primaryVersion.id
          ? { ...v, text: secondaryVersion.text, overrides: { ...secondaryVersion.overrides }, updatedAt: Date.now() }
          : v
      )
    );
  }, [secondaryVersion.text, secondaryVersion.overrides, primaryVersion.id]);

  const handleLoadSample = useCallback((key: string) => {
    const sample = SAMPLE_POEMS[key];
    if (typeof sample === 'string') {
      setTitle(SAMPLE_TITLES[key] ?? '');
      setVersions(prev =>
        prev.map(v => (v.id === activeVersionId ? { ...v, text: sample, overrides: {}, updatedAt: Date.now() } : v))
      );
      setActiveLineIndexPrimary(0);
    }
  }, [activeVersionId]);

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] select-text">
      {/* Top Bar */}
      <TopBar
        title={title}
        formId={formId}
        onFormChange={setFormId}
        showSynalephas={showSynalephas}
        onToggleShowSynalephas={() => setShowSynalephas(s => !s)}
        showRhyme={showRhyme}
        onToggleShowRhyme={() => setShowRhyme(r => !r)}
        rhymeMode={rhymeMode}
        onRhymeModeChange={setRhymeMode}
        isSplitView={isSplitView}
        onToggleSplitView={handleToggleSplitView}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenStats={() => setIsStatsOpen(true)}
        onLoadSample={handleLoadSample}
        saveStatus={saveStatus}
        saveErrorMessage={saveErrorMessage}
        lastSavedTime={lastSavedTime}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
      />

      {/* Version Tabs Bar */}
      <VersionTabsBar
        versions={versions}
        activeVersionId={activeVersionId}
        onSelectVersion={setActiveVersionId}
        onCreateVersion={handleCreateVersion}
        onDuplicateVersion={handleDuplicateVersion}
        onDeleteVersion={handleDeleteVersion}
        onRenameVersion={handleRenameVersion}
        isSplitView={isSplitView}
        onToggleSplitView={handleToggleSplitView}
      />

      {/* Main Workspace (Single Editor or Split Editors + Inspector) */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Editor Area */}
        <main className="flex-1 h-full min-w-0 overflow-hidden relative">
          {isSplitView ? (
            <SplitPoetryEditor
              versions={versions}
              primaryVersion={primaryVersion}
              secondaryVersion={secondaryVersion}
              primaryVerses={primaryAnalysis.verses}
              secondaryVerses={secondaryAnalysis.verses}
              formId={formId}
              showSynalephas={showSynalephas}
              showRhyme={showRhyme}
              rhymeMode={rhymeMode}
              focusedPane={focusedPane}
              onFocusPane={setFocusedPane}
              onSelectPrimaryVersion={setActiveVersionId}
              onSelectSecondaryVersion={setSecondaryVersionId}
              onChangePrimaryText={newText => handleUpdateText(primaryVersion.id, newText)}
              onChangeSecondaryText={newText => handleUpdateText(secondaryVersion.id, newText)}
              onActivePrimaryVerseChange={setActiveLineIndexPrimary}
              onActiveSecondaryVerseChange={setActiveLineIndexSecondary}
              onCloseSplitView={() => setIsSplitView(false)}
              onCopyPrimaryToSecondary={handleCopyPrimaryToSecondary}
              onCopySecondaryToPrimary={handleCopySecondaryToPrimary}
            />
          ) : (
            <PoetryEditor
              key={`single-${primaryVersion.id}`}
              title={title}
              onTitleChange={setTitle}
              value={primaryVersion.text}
              onChange={newText => handleUpdateText(primaryVersion.id, newText)}
              verses={primaryAnalysis.verses}
              formId={formId}
              showSynalephas={showSynalephas}
              showRhyme={showRhyme}
              rhymeMode={rhymeMode}
              onActiveVerseChange={setActiveLineIndexPrimary}
            />
          )}
        </main>

        {/* Inspector Panel */}
        <div className="w-full md:w-80 lg:w-96 h-72 md:h-full flex-shrink-0">
          <VerseInspector
            verse={activeVerse}
            hasOverrides={hasOverridesOnActiveVerse}
            versionName={
              isSplitView
                ? focusedPane === 'primary'
                  ? `Panel A: ${primaryVersion.name}`
                  : `Panel B: ${secondaryVersion.name}`
                : primaryVersion.name
            }
            rhymeMode={rhymeMode}
            onRhymeModeChange={setRhymeMode}
            onInsertWord={handleInsertWord}
            onToggleSynalepha={handleToggleSynalepha}
            onSetManualCount={handleSetManualCount}
            onResetVerseOverrides={handleResetVerseOverrides}
          />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar formId={formId} activeVerse={activeVerse} summary={activeAnalysis.summary} />

      {/* Stats Modal */}
      <PoemStatsModal
        title={title}
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        formId={formId}
        rhymeMode={rhymeMode}
        analysis={activeAnalysis}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title={title}
        formId={formId}
        analysis={activeAnalysis}
        projectState={{
          title,
          formId,
          showSynalephas,
          showRhyme,
          rhymeMode,
          theme,
          versions,
          activeVersionId,
          secondaryVersionId,
          isSplitView,
        }}
        activeVersion={activeVersion}
      />

      {/* Import / Recovery Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onRestoreProject={handleRestoreProject}
        onImportTextAsVersion={handleImportTextAsVersion}
      />
    </div>
  );
};
