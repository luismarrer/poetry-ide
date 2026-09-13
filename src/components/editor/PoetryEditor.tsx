import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { createMetricGutter, setGutterDataEffect } from './extensions/metricGutter';
import { synalephaDecorationField, setSynalephaConfigEffect } from './extensions/synalephaDecorations';
import { createActiveVerseTracker } from './extensions/activeVerseTracker';
import type { VerseAnalysis } from '@/poetry/meter/analyzeVerse';
import type { FormId } from '@/poetry/forms/types';

interface PoetryEditorProps {
  value: string
  onChange: (value: string) => void
  verses: VerseAnalysis[]
  formId: FormId
  showSynalephas: boolean
  onActiveVerseChange: (lineIndex: number) => void
}

export const PoetryEditor: React.FC<PoetryEditorProps> = ({
  value,
  onChange,
  verses,
  formId,
  showSynalephas,
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
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        ...createMetricGutter(),
        synalephaDecorationField,
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

  // Dispatch updated gutter data whenever verses or formId changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: [
        setGutterDataEffect.of({ verses, formId }),
        setSynalephaConfigEffect.of({ show: showSynalephas, verses }),
      ],
    });
  }, [verses, formId, showSynalephas]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto bg-[var(--bg-primary)] text-[var(--text-primary)]"
      data-testid="poetry-editor-container"
    />
  );
};
