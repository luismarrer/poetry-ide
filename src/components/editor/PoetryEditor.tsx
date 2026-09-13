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
  title: string
  onTitleChange: (title: string) => void
  value: string
  onChange: (value: string) => void
  verses: VerseAnalysis[]
  formId: FormId
  showSynalephas: boolean
  showRhyme: boolean
  onActiveVerseChange: (lineIndex: number) => void
}

export const PoetryEditor: React.FC<PoetryEditorProps> = ({
  title,
  onTitleChange,
  value,
  onChange,
  verses,
  formId,
  showSynalephas,
  showRhyme,
  onActiveVerseChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

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
        createActiveVerseTracker(onActiveVerseChange),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            const docString = update.state.doc.toString();
            onChange(docString);
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

  // Update doc if changed externally (e.g. load sample poem)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
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
        setGutterDataEffect.of({ verses, formId, showRhyme }),
        setSynalephaConfigEffect.of({ show: showSynalephas, verses }),
      ],
    });
  }, [verses, formId, showSynalephas, showRhyme]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      {/* Title Header Input */}
      <div className="px-6 pt-5 pb-2 border-b border-[var(--border-color)]/40 bg-[var(--bg-primary)] flex-shrink-0">
        <input
          type="text"
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Título del poema..."
          className="w-full font-serif text-2xl sm:text-3xl font-bold bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:italic focus:outline-none transition-colors border-b border-transparent focus:border-indigo-500/50 pb-1"
          data-testid="poem-title-input"
        />
      </div>

      {/* CodeMirror container */}
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-y-auto"
        data-testid="poetry-editor-container"
      />
    </div>
  );
};
