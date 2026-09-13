import { RangeSetBuilder, StateEffect, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view';
import type { VerseAnalysis } from '@/poetry/meter/analyzeVerse';

export interface SynalephaConfig {
  show: boolean
  verses: VerseAnalysis[]
}

export const setSynalephaConfigEffect = StateEffect.define<SynalephaConfig>();

const synalephaMark = Decoration.mark({
  class: 'synalepha-decoration',
  attributes: { title: 'Sinalefa métrica poética' },
});

export const synalephaDecorationField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setSynalephaConfigEffect)) {
        const { show, verses } = effect.value;
        if (!show || verses.length === 0) {
          return Decoration.none;
        }

        const builder = new RangeSetBuilder<Decoration>();
        const doc = tr.state.doc;

        for (const verse of verses) {
          if (verse.isEmpty || verse.synalephas.length === 0) continue;
          if (verse.lineIndex >= doc.lines) continue;

          const docLine = doc.line(verse.lineIndex + 1);
          const lineText = docLine.text;

          for (const syn of verse.synalephas) {
            if (!syn.active) continue; // only decorate active synalephas

            // Locate the words in the line
            // e.g. textSpan "supe onírica"
            const span = syn.textSpan;
            const searchIndex = lineText.indexOf(span);
            if (searchIndex !== -1) {
              // Decorate the junction between word A and word B
              const wordAEnd = searchIndex + syn.wordA.length;
              const wordBStart = lineText.indexOf(syn.wordB, wordAEnd);
              if (wordBStart !== -1) {
                const from = docLine.from + wordAEnd - 1;
                const to = docLine.from + wordBStart + 1;
                if (from >= docLine.from && to <= docLine.to && from < to) {
                  builder.add(from, to, synalephaMark);
                }
              }
            }
          }
        }

        return builder.finish();
      }
    }
    return decorations.map(tr.changes);
  },
  provide: f => EditorView.decorations.from(f),
});
