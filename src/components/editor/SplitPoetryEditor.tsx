import React from 'react';
import type { PoemVersion } from '@/poetry/versions/types';
import type { VerseAnalysis } from '@/poetry/meter/analyzeVerse';
import type { FormId } from '@/poetry/forms/types';
import { PoetryEditor } from './PoetryEditor';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

interface SplitPoetryEditorProps {
  versions: PoemVersion[]
  primaryVersion: PoemVersion
  secondaryVersion: PoemVersion
  primaryVerses: VerseAnalysis[]
  secondaryVerses: VerseAnalysis[]
  formId: FormId
  showSynalephas: boolean
  showRhyme: boolean
  rhymeMode: 'consonant' | 'assonant'
  focusedPane: 'primary' | 'secondary'
  onFocusPane: (pane: 'primary' | 'secondary') => void
  onSelectPrimaryVersion: (id: string) => void
  onSelectSecondaryVersion: (id: string) => void
  onChangePrimaryText: (text: string) => void
  onChangeSecondaryText: (text: string) => void
  onActivePrimaryVerseChange: (index: number) => void
  onActiveSecondaryVerseChange: (index: number) => void
  onCloseSplitView: () => void
  onCopyPrimaryToSecondary: () => void
  onCopySecondaryToPrimary: () => void
}

export const SplitPoetryEditor: React.FC<SplitPoetryEditorProps> = ({
  versions,
  primaryVersion,
  secondaryVersion,
  primaryVerses,
  secondaryVerses,
  formId,
  showSynalephas,
  showRhyme,
  rhymeMode,
  focusedPane,
  onFocusPane,
  onSelectPrimaryVersion,
  onSelectSecondaryVersion,
  onChangePrimaryText,
  onChangeSecondaryText,
  onActivePrimaryVerseChange,
  onActiveSecondaryVerseChange,
  onCloseSplitView,
  onCopyPrimaryToSecondary,
  onCopySecondaryToPrimary,
}) => {
  return (
    <div
      className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-[var(--bg-primary)]"
      data-testid="split-poetry-editor"
    >
      {/* Primary Pane (Left) */}
      <div
        className={`flex-1 h-1/2 md:h-full flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-[var(--border-color)] transition-colors ${
          focusedPane === 'primary' ? 'ring-1 ring-inset ring-indigo-500/20' : ''
        }`}
        onClick={() => onFocusPane('primary')}
        data-testid="split-pane-primary"
      >
        {/* Pane Header */}
        <div className="h-9 px-3 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between gap-2 text-xs flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/50">
              Panel A
            </span>
            <select
              value={primaryVersion.id}
              onChange={e => onSelectPrimaryVersion(e.target.value)}
              className="bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] font-medium rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              data-testid="select-primary-version"
            >
              {versions.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={e => {
                e.stopPropagation();
                onCopyPrimaryToSecondary();
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded border border-transparent hover:border-[var(--border-color)] transition-colors"
              title="Copiar contenido de Panel A al Panel B"
              data-testid="copy-a-to-b-btn"
            >
              <span className="hidden sm:inline">Copiar a B</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 w-full overflow-hidden">
          <PoetryEditor
            key={`split-a-${primaryVersion.id}`}
            showTitleHeader={false}
            value={primaryVersion.text}
            onChange={onChangePrimaryText}
            verses={primaryVerses}
            formId={formId}
            showSynalephas={showSynalephas}
            showRhyme={showRhyme}
            rhymeMode={rhymeMode}
            onActiveVerseChange={onActivePrimaryVerseChange}
            onFocus={() => onFocusPane('primary')}
          />
        </div>
      </div>

      {/* Secondary Pane (Right) */}
      <div
        className={`flex-1 h-1/2 md:h-full flex flex-col overflow-hidden transition-colors ${
          focusedPane === 'secondary' ? 'ring-1 ring-inset ring-purple-500/20' : ''
        }`}
        onClick={() => onFocusPane('secondary')}
        data-testid="split-pane-secondary"
      >
        {/* Pane Header */}
        <div className="h-9 px-3 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between gap-2 text-xs flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[10px] uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/50">
              Panel B
            </span>
            <select
              value={secondaryVersion.id}
              onChange={e => onSelectSecondaryVersion(e.target.value)}
              className="bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] font-medium rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
              data-testid="select-secondary-version"
            >
              {versions.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={e => {
                e.stopPropagation();
                onCopySecondaryToPrimary();
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded border border-transparent hover:border-[var(--border-color)] transition-colors"
              title="Copiar contenido de Panel B al Panel A"
              data-testid="copy-b-to-a-btn"
            >
              <ArrowLeft className="w-3 h-3" />
              <span className="hidden sm:inline">Copiar a A</span>
            </button>

            <button
              onClick={e => {
                e.stopPropagation();
                onCloseSplitView();
              }}
              className="p-1 text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-primary)] rounded transition-colors ml-1"
              title="Cerrar vista dividida"
              data-testid="close-split-view-btn"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 w-full overflow-hidden">
          <PoetryEditor
            key={`split-b-${secondaryVersion.id}`}
            showTitleHeader={false}
            value={secondaryVersion.text}
            onChange={onChangeSecondaryText}
            verses={secondaryVerses}
            formId={formId}
            showSynalephas={showSynalephas}
            showRhyme={showRhyme}
            rhymeMode={rhymeMode}
            onActiveVerseChange={onActiveSecondaryVerseChange}
            onFocus={() => onFocusPane('secondary')}
          />
        </div>
      </div>
    </div>
  );
};
