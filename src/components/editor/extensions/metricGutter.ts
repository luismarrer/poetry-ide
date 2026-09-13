import { GutterMarker, gutter } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import type { VerseAnalysis } from '@/poetry/meter/analyzeVerse';
import type { FormId } from '@/poetry/forms/types';

export interface GutterData {
  verses: VerseAnalysis[]
  formId: FormId
}

export const setGutterDataEffect = StateEffect.define<GutterData>();

export const gutterDataField = StateField.define<GutterData>({
  create() {
    return { verses: [], formId: 'silva' };
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setGutterDataEffect)) {
        return effect.value;
      }
    }
    return value;
  },
});

class MetricGutterMarker extends GutterMarker {
  lineNumber: number;
  verse?: VerseAnalysis;
  formId: FormId;
  isSpacer: boolean;

  constructor(lineNumber: number, verse: VerseAnalysis | undefined, formId: FormId, isSpacer = false) {
    super();
    this.lineNumber = lineNumber;
    this.verse = verse;
    this.formId = formId;
    this.isSpacer = isSpacer;
  }

  toDOM() {
    const container = document.createElement('div');
    container.className = this.isSpacer
      ? 'poetry-gutter-item poetry-gutter-spacer opacity-0'
      : 'poetry-gutter-item';

    const numSpan = document.createElement('span');
    numSpan.className = 'poetry-gutter-line-num';
    numSpan.textContent = String(this.lineNumber);
    container.appendChild(numSpan);

    const sylBadge = document.createElement('span');
    sylBadge.className = 'poetry-gutter-syllables';

    if (!this.isSpacer && this.verse && !this.verse.isEmpty) {
      const count = this.verse.metricSyllables;
      const isSilva = this.formId === 'silva';

      if (isSilva && count === 7) {
        sylBadge.className += ' poetry-gutter-silva-7';
        sylBadge.textContent = '7 ✓';
        sylBadge.title = 'Heptasílabo (7 sílabas métricas)';
      } else if (isSilva && count === 11) {
        sylBadge.className += ' poetry-gutter-silva-11';
        sylBadge.textContent = '11 ✓';
        sylBadge.title = 'Endecasílabo (11 sílabas métricas)';
      } else if (isSilva) {
        sylBadge.className += ' poetry-gutter-silva-outlier';
        sylBadge.textContent = String(count);
        sylBadge.title = `${count} sílabas (fuera del patrón 7/11 de silva)`;
      } else {
        sylBadge.className += ' poetry-gutter-outlier';
        sylBadge.textContent = String(count);
        sylBadge.title = `${count} sílabas métricas`;
      }
    } else {
      sylBadge.textContent = '';
    }

    container.appendChild(sylBadge);
    return container;
  }
}

export function createMetricGutter() {
  return [
    gutterDataField,
    gutter({
      class: 'cm-poetry-gutter',
      lineMarker(view, line) {
        const data = view.state.field(gutterDataField);
        const lineIndex = view.state.doc.lineAt(line.from).number - 1;
        const verse = data.verses[lineIndex];
        return new MetricGutterMarker(lineIndex + 1, verse, data.formId, false);
      },
      lineMarkerChange(update) {
        return update.transactions.some(tr =>
          tr.effects.some(e => e.is(setGutterDataEffect))
        );
      },
      initialSpacer() {
        return new MetricGutterMarker(99, undefined, 'silva', true);
      },
    }),
  ];
}
