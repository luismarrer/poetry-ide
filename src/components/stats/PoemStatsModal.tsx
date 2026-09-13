import React from 'react';
import type { PoemAnalysisResult } from '@/poetry/index';
import type { FormId } from '@/poetry/forms/types';
import { X, BarChart3 } from 'lucide-react';

interface PoemStatsModalProps {
  isOpen: boolean
  onClose: () => void
  formId: FormId
  analysis: PoemAnalysisResult
}

export const PoemStatsModal: React.FC<PoemStatsModalProps> = ({
  isOpen,
  onClose,
  formId,
  analysis,
}) => {
  if (!isOpen) return null;

  const { verses, summary, rhymeScheme } = analysis;
  const nonEmpties = verses.filter(v => !v.isEmpty);

  // Compute stanzas
  let stanzas = 0;
  let inStanza = false;
  for (const v of verses) {
    if (!v.isEmpty && !inStanza) {
      stanzas++;
      inStanza = true;
    } else if (v.isEmpty) {
      inStanza = false;
    }
  }

  // Total words
  let totalWords = 0;
  for (const v of nonEmpties) {
    totalWords += v.words.length;
  }

  // Syllable length distribution
  const lengthDistribution = new Map<number, number>();
  for (const v of nonEmpties) {
    const len = v.metricSyllables;
    lengthDistribution.set(len, (lengthDistribution.get(len) || 0) + 1);
  }
  const sortedLengths = Array.from(lengthDistribution.entries()).sort((a, b) => a[0] - b[0]);

  // Consolidate non-empty rhymes
  const condensedRhymes = nonEmpties.map(v => v.rhymeSymbol || '—').join(' ');

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
      data-testid="stats-modal-backdrop"
    >
      <div
        className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-6 text-[var(--text-primary)]"
        onClick={e => e.stopPropagation()}
        data-testid="stats-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold">Estadísticas Poéticas</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-center">
            <span className="text-2xl font-mono font-bold text-[var(--text-primary)]">
              {summary.totalVerses}
            </span>
            <span className="block text-[11px] uppercase tracking-wider text-[var(--text-muted)] mt-1 font-medium">
              Versos
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-center">
            <span className="text-2xl font-mono font-bold text-[var(--text-primary)]">
              {stanzas}
            </span>
            <span className="block text-[11px] uppercase tracking-wider text-[var(--text-muted)] mt-1 font-medium">
              Estrofas
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-center">
            <span className="text-2xl font-mono font-bold text-[var(--text-primary)]">
              {totalWords}
            </span>
            <span className="block text-[11px] uppercase tracking-wider text-[var(--text-muted)] mt-1 font-medium">
              Palabras
            </span>
          </div>
        </div>

        {/* Structure Breakdown */}
        <div className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            <span>Estructura Activa: {formId === 'silva' ? 'Silva' : 'Libre'}</span>
            {formId === 'silva' && (
              <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                {summary.conformancePercentage}% en silva
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
            <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <span className="text-[var(--text-muted)] block text-[10px]">Heptasílabos (7)</span>
              <span className="text-base font-mono font-bold text-sky-600 dark:text-sky-400">
                {summary.heptasyllables}
              </span>
            </div>
            <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <span className="text-[var(--text-muted)] block text-[10px]">Endecasílabos (11)</span>
              <span className="text-base font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {summary.endecasyllables}
              </span>
            </div>
            <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <span className="text-[var(--text-muted)] block text-[10px]">Otras longitudes</span>
              <span className="text-base font-mono font-bold text-[var(--text-secondary)]">
                {summary.outliers}
              </span>
            </div>
          </div>
        </div>

        {/* Syllable Length Distribution */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
            Distribución de longitud métrica
          </h3>
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
            {sortedLengths.map(([length, count]) => {
              const pct = Math.round((count / nonEmpties.length) * 100);
              const isSilvaTarget = formId === 'silva' && (length === 7 || length === 11);
              return (
                <div key={length} className="flex items-center gap-3 text-xs">
                  <span className={`w-8 font-mono font-semibold ${isSilvaTarget ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text-secondary)]'}`}>
                    {length} s
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isSilvaTarget
                          ? 'bg-indigo-600 dark:bg-indigo-500'
                          : 'bg-[var(--text-muted)] opacity-50'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-mono text-[var(--text-muted)] text-[11px] w-12 text-right">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rhyme Scheme */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-color)]">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
            Esquema de rima (versos no vacíos)
          </h3>
          <div className="p-3 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] font-mono text-sm tracking-widest text-indigo-600 dark:text-indigo-400 break-all">
            {condensedRhymes || '—'}
          </div>
        </div>
      </div>
    </div>
  );
};
