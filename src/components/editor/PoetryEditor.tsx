import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { createMetricGutter, setGutterDataEffect } from './extensions/metricGutter';
import { synalephaDecorationField, setSynalephaConfigEffect } from './extensions/synalephaDecorations';
import { createActiveVerseTracker } from './extensions/activeVerseTracker';
import { poetrySyntaxPlugin, togglePoetryComment } from './extensions/poetrySyntaxHighlight';
import type { VerseAnalysis } from '@/poetry/meter/analyzeVerse';
import type { FormId } from '@/poetry/forms/types';

interface PoetryEditorProps {
  title?: string
  onTitleChange?: (title: string) => void
  showTitleHeader?: boolean
  value: string
  onChange: (value: string) => void
  verses: VerseAnalysis[]
  formId: FormId
  showSynalephas: boolean
  showRhyme: boolean
  rhymeMode?: 'consonant' | 'assonant'
  onActiveVerseChange: (lineIndex: number) => void
  onFocus?: () => void
}

export const PoetryEditor: React.FC<PoetryEditorProps> = ({
  title,
  onTitleChange,
  showTitleHeader = true,
  value,
  onChange,
  verses,
  formId,
  showSynalephas,
  showRhyme,
  rhymeMode = 'consonant',
  onActiveVerseChange,
  onFocus,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const onActiveVerseChangeRef = useRef(onActiveVerseChange);
  onActiveVerseChangeRef.current = onActiveVerseChange;

  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;

  // Initialize CodeMirror 6
  useEffect(() => {
    if (!containerRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        history(),
        keymap.of([
          { key: 'Mod-/', run: togglePoetryComment },
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        EditorView.lineWrapping,
        ...createMetricGutter(),
        synalephaDecorationField,
        poetrySyntaxPlugin,
        createActiveVerseTracker(idx => onActiveVerseChangeRef.current(idx)),
        EditorView.domEventHandlers({
          focus() {
            onFocusRef.current?.();
            return false;
          },
        }),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            const docString = update.state.doc.toString();
            onChangeRef.current(docString);
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Sync external text value when changed outside
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (value !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
    }
  }, [value]);

  // Dispatch updated gutter data whenever verses, formId, or showRhyme changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: [
        setGutterDataEffect.of({ verses, formId, showRhyme, rhymeMode }),
        setSynalephaConfigEffect.of({ show: showSynalephas, verses }),
      ],
    });
  }, [verses, formId, showSynalephas, showRhyme, rhymeMode]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      {/* Title Header Input */}
      {showTitleHeader && onTitleChange && (
        <div className="px-6 pt-5 pb-2 border-b border-[var(--border-color)]/40 bg-[var(--bg-primary)] flex-shrink-0">
          <input
            type="text"
            value={title ?? ''}
            onChange={e => onTitleChange(e.target.value)}
            placeholder="Título del poema..."
            className="w-full font-serif text-2xl sm:text-3xl font-bold bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:italic focus:outline-none transition-colors border-b border-transparent focus:border-indigo-500/50 pb-1"
            data-testid="poem-title-input"
          />
        </div>
      )}

      {/* CodeMirror container */}
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-y-auto"
        data-testid="poetry-editor-container"
      />
    </div>
  );
};
