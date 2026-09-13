import React from 'react';
import type { VerseAnalysis } from '@/poetry/meter/analyzeVerse';
import { formatRhythmicAccents } from '@/poetry/rhythm/accents';
import { Sparkles, Sliders, RotateCcw, Info } from 'lucide-react';

interface VerseInspectorProps {
  verse?: VerseAnalysis
  hasOverrides: boolean
  onToggleSynalepha: (lineIndex: number, synalephaId: string, currentActive: boolean) => void
  onSetManualCount: (lineIndex: number, count?: number) => void
  onResetVerseOverrides: (lineIndex: number) => void
}

function getVerseTypeName(syllables: number): string {
  switch (syllables) {
    case 1: return 'Monosílabo';
    case 2: return 'Bisílabo';
    case 3: return 'Trisílabo';
    case 4: return 'Tetrasílabo';
    case 5: return 'Pentasílabo';
    case 6: return 'Hexasílabo';
    case 7: return 'Heptasílabo';
    case 8: return 'Octosílabo';
    case 9: return 'Eneasílabo';
    case 10: return 'Decasílabo';
    case 11: return 'Endecasílabo';
    case 12: return 'Dodecasílabo';
    case 14: return 'Alejandrino';
    default:
      return syllables >= 9 ? `Arte mayor (${syllables})` : `Arte menor (${syllables})`;
  }
}

export const VerseInspector: React.FC<VerseInspectorProps> = ({
  verse,
  hasOverrides,
  onToggleSynalepha,
  onSetManualCount,
  onResetVerseOverrides,
}) => {
  if (!verse || verse.isEmpty) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)] border-l border-[var(--border-color)] bg-[var(--bg-surface)]">
        <Sparkles className="w-8 h-8 mb-3 opacity-40" />
        <p className="font-medium text-sm">Coloca el cursor en un verso para inspeccionar su análisis prosódico y métrico.</p>
      </div>
    );
  }

  // Format syllables: words separated by ' / ', internal syllables with '-'
  const formattedSeparation = verse.words.map(w =>
    w.syllables.map(s => (s.isStressed ? `[${s.text}]` : s.text)).join('-')
  ).join(' / ');

  const hasDifferences = verse.algorithmMetricSyllables !== verse.metricSyllables;

  return (
    <aside
      className="h-full overflow-y-auto border-l border-[var(--border-color)] bg-[var(--bg-surface)] p-6 flex flex-col gap-6 text-sm"
      data-testid="verse-inspector"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
            Verso {verse.lineIndex + 1}
          </span>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {getVerseTypeName(verse.metricSyllables)}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {hasOverrides && (
            <button
              onClick={() => onResetVerseOverrides(verse.lineIndex)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] transition-colors"
              title="Restablecer decisiones métricas a los valores algorítmicos"
            >
              <RotateCcw className="w-3 h-3" />
              Restablecer
            </button>
          )}
          <span className="text-xl font-mono font-bold px-3 py-1 rounded bg-[var(--bg-secondary)] text-[var(--text-primary)]">
            {verse.metricSyllables}
          </span>
        </div>
      </div>

      {/* Quote */}
      <blockquote className="font-poetry text-base italic text-[var(--text-primary)] bg-[var(--bg-primary)] p-3 rounded-md border border-[var(--border-color)]">
        “{verse.text}”
      </blockquote>

      {/* Metric comparison if overrides exist */}
      {hasDifferences && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 text-xs flex flex-col gap-1 text-[var(--text-primary)]">
          <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Decisiones poéticas aplicadas
          </div>
          <div className="text-[var(--text-secondary)]">
            Algoritmo: <span className="font-mono font-medium text-[var(--text-primary)]">{verse.algorithmMetricSyllables}</span> sílabas
          </div>
          <div className="font-medium">
            Con tus decisiones: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{verse.metricSyllables}</span> sílabas
          </div>
        </div>
      )}

      {/* Syllable Breakdown */}
      <section className="flex flex-col gap-2">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
          Separación silábica
        </h3>
        <div className="font-mono text-xs bg-[var(--bg-primary)] p-3 rounded border border-[var(--border-color)] leading-relaxed break-words">
          {formattedSeparation}
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          [ ] indica sílaba con acento léxico.
        </p>
      </section>

      {/* Synalephas section */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
            Sinalefas detectadas
          </h3>
          <span className="text-xs text-[var(--text-muted)]">
            {verse.synalephas.length} {verse.synalephas.length === 1 ? 'unión' : 'uniones'}
          </span>
        </div>

        {verse.synalephas.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] italic">
            No se detectaron vocales contiguas entre palabras.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {verse.synalephas.map(syn => (
              <div
                key={syn.id}
                className="flex items-center justify-between p-2.5 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs"
              >
                <div className="flex flex-col">
                  <span className="font-medium font-mono text-[var(--text-primary)]">
                    {syn.wordA}_{syn.wordB}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {syn.active ? 'Sinalefa aplicada (-1)' : 'Tratada como hiato (0)'}
                  </span>
                </div>
                <button
                  onClick={() => onToggleSynalepha(verse.lineIndex, syn.id, syn.active)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    syn.active
                      ? 'bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border border-indigo-600/30 hover:bg-indigo-600/20'
                      : 'bg-amber-600/10 text-amber-700 dark:text-amber-300 border border-amber-600/30 hover:bg-amber-600/20'
                  }`}
                  data-testid={`toggle-syn-${syn.id}`}
                >
                  {syn.active ? 'Tratar como hiato' : 'Usar sinalefa'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Prosodic Final Stress */}
      <section className="flex flex-col gap-2">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
          Ley del acento final
        </h3>
        <div className="p-2.5 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs flex items-center justify-between">
          <div>
            <span className="font-semibold capitalize text-[var(--text-primary)]">
              {verse.finalStress}
            </span>
            <span className="text-[var(--text-muted)] ml-1">
              ({verse.finalStressAdjustment >= 0 ? `+${verse.finalStressAdjustment}` : verse.finalStressAdjustment} sílaba)
            </span>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
            {verse.grammaticalSyllables} gramaticales → {verse.metricSyllables} métricas
          </span>
        </div>
      </section>

      {/* Rhythmic Accents */}
      <section className="flex flex-col gap-2">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
          Acentos métricos rítmicos
        </h3>
        <div className="font-mono text-sm font-semibold tracking-widest text-[var(--text-primary)] bg-[var(--bg-primary)] p-2.5 rounded border border-[var(--border-color)] text-center">
          {formatRhythmicAccents(verse.rhythmicAccents)}
        </div>
      </section>

      {/* Rhyme */}
      <section className="flex flex-col gap-2">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
          Rima
        </h3>
        <div className="p-2.5 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)]">Terminación:</span>
            <span className="font-mono font-semibold text-[var(--text-primary)]">
              {verse.rhymeEnding ? `-${verse.rhymeEnding.raw}` : '—'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)]">Esquema:</span>
            {verse.rhymeSymbol && verse.rhymeSymbol !== '—' ? (
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded border poetry-gutter-rhyme-${verse.rhymeSymbol.toUpperCase()} poetry-gutter-rhyme-c${((verse.rhymeSymbol.toUpperCase().charCodeAt(0) - 65) % 12 + 12) % 12}`}
              >
                {verse.rhymeSymbol}
              </span>
            ) : (
              <span className="font-mono font-bold px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                —
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Manual Count Adjustment */}
      <section className="flex flex-col gap-2 pt-2 border-t border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-secondary)]">Ajuste manual directo:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSetManualCount(verse.lineIndex, verse.metricSyllables - 1)}
              className="w-6 h-6 rounded bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-mono font-bold flex items-center justify-center transition-colors"
              title="Restar 1 sílaba manualmente"
            >
              -
            </button>
            <span className="font-mono font-bold w-8 text-center text-[var(--text-primary)]">
              {verse.metricSyllables}
            </span>
            <button
              onClick={() => onSetManualCount(verse.lineIndex, verse.metricSyllables + 1)}
              className="w-6 h-6 rounded bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-mono font-bold flex items-center justify-center transition-colors"
              title="Sumar 1 sílaba manualmente"
            >
              +
            </button>
          </div>
        </div>
      </section>

      {/* Diagnostics / Suggestions */}
      {verse.diagnostics.length > 0 && (
        <section className="flex flex-col gap-2 pt-2 border-t border-[var(--border-color)]">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Sugerencia de estructura
          </h3>
          {verse.diagnostics.map(d => (
            <div
              key={d.id}
              className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-[var(--text-primary)] leading-relaxed"
            >
              {d.message}
            </div>
          ))}
        </section>
      )}
    </aside>
  );
};
