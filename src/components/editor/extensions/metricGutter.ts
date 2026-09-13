import { GutterMarker, gutter } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import type { VerseAnalysis } from '@/poetry/meter/analyzeVerse';
import type { FormId } from '@/poetry/forms/types';

export interface GutterData {
  verses: VerseAnalysis[]
  formId: FormId
  showRhyme: boolean
}

export const setGutterDataEffect = StateEffect.define<GutterData>();

export const gutterDataField = StateField.define<GutterData>({
  create() {
    return { verses: [], formId: 'silva', showRhyme: true };
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
  showRhyme: boolean;
  isSpacer: boolean;

  constructor(
    lineNumber: number,
    verse: VerseAnalysis | undefined,
    formId: FormId,
    showRhyme: boolean,
    isSpacer = false
  ) {
    super();
    this.lineNumber = lineNumber;
    this.verse = verse;
    this.formId = formId;
    this.showRhyme = showRhyme;
    this.isSpacer = isSpacer;
  }

  toDOM() {
    const container = document.createElement('div');
    container.className = this.isSpacer
      ? 'poetry-gutter-item poetry-gutter-spacer opacity-0'
      : 'poetry-gutter-item';

    // 1. Line number
    const numSpan = document.createElement('span');
    numSpan.className = 'poetry-gutter-line-num';
    numSpan.textContent = String(this.lineNumber);
    container.appendChild(numSpan);

    // 2. Syllable count badge
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
    } else if (this.isSpacer) {
      sylBadge.textContent = '11 ✓';
    } else {
      sylBadge.textContent = '';
    }

    container.appendChild(sylBadge);

    // 3. Rhyme symbol badge (when showRhyme is enabled)
    if (this.showRhyme) {
      const rhymeBadge = document.createElement('span');
      rhymeBadge.className = 'poetry-gutter-rhyme';

      if (!this.isSpacer && this.verse && !this.verse.isEmpty) {
        const rhymeSymbol = this.verse.rhymeSymbol || '—';
        const ending = this.verse.rhymeEnding;

        if (rhymeSymbol !== '—') {
          const baseLetter = rhymeSymbol.toUpperCase();
          const charCode = baseLetter.charCodeAt(0);
          const colorIndex = charCode >= 65 && charCode <= 90 ? (charCode - 65) % 12 : 0;
          rhymeBadge.className += ` poetry-gutter-rhyme-matched poetry-gutter-rhyme-${baseLetter} poetry-gutter-rhyme-c${colorIndex}`;
          rhymeBadge.textContent = rhymeSymbol;
          rhymeBadge.dataset.rhymeGroup = baseLetter;

          const endingText = ending ? ` (-${ending.raw})` : '';
          rhymeBadge.title = `Rima ${rhymeSymbol}${endingText}`;

          rhymeBadge.addEventListener('mouseenter', () => {
            document.querySelectorAll(`.poetry-gutter-rhyme[data-rhyme-group="${baseLetter}"]`).forEach(el => {
              el.classList.add('poetry-rhyme-active');
            });
          });
          rhymeBadge.addEventListener('mouseleave', () => {
            document.querySelectorAll(`.poetry-gutter-rhyme[data-rhyme-group="${baseLetter}"]`).forEach(el => {
              el.classList.remove('poetry-rhyme-active');
            });
          });
        } else {
          rhymeBadge.className += ' poetry-gutter-rhyme-suelto';
          rhymeBadge.textContent = '—';
          const endingText = ending ? ` (-${ending.raw})` : '';
          rhymeBadge.title = `Verso suelto / libre${endingText}`;
        }
      } else if (this.isSpacer) {
        rhymeBadge.textContent = 'A';
      } else {
        rhymeBadge.textContent = '';
      }

      container.appendChild(rhymeBadge);
    }

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
        return new MetricGutterMarker(lineIndex + 1, verse, data.formId, data.showRhyme, false);
      },
      lineMarkerChange(update) {
        return update.transactions.some(tr =>
          tr.effects.some(e => e.is(setGutterDataEffect))
        );
      },
      initialSpacer() {
        return new MetricGutterMarker(99, undefined, 'silva', true, true);
      },
    }),
  ];
}
