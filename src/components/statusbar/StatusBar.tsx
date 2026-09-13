import React from 'react';
import type { VerseAnalysis } from '@/poetry/meter/analyzeVerse';
import type { FormId, FormSummary } from '@/poetry/forms/types';
import { formatRhythmicAccents } from '@/poetry/rhythm/accents';

interface StatusBarProps {
  formId: FormId
  activeVerse?: VerseAnalysis
  summary: FormSummary
}

export const StatusBar: React.FC<StatusBarProps> = ({
  formId,
  activeVerse,
  summary,
}) => {
  const formName = formId === 'silva' ? 'Silva' : 'Libre';

  return (
    <footer
      className="h-7 px-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] font-mono flex items-center justify-between select-none z-10"
      data-testid="status-bar"
    >
      <div className="flex items-center gap-4 overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="font-semibold text-[var(--text-primary)]">
          {formName}
        </span>

        <span className="text-[var(--border-color)]">|</span>

        {activeVerse && !activeVerse.isEmpty ? (
          <>
            <span>V. {activeVerse.lineIndex + 1}</span>
            <span className="text-[var(--border-color)]">|</span>
            <span className="font-medium text-[var(--text-primary)]">
              {activeVerse.metricSyllables} sílabas
            </span>
            <span className="text-[var(--border-color)]">|</span>
            <span>
              Rima:{' '}
              {activeVerse.rhymeSymbol && activeVerse.rhymeSymbol !== '—' ? (
                <strong
                  className={`font-mono px-1 py-0.5 rounded text-xs poetry-gutter-rhyme-${activeVerse.rhymeSymbol.toUpperCase()} poetry-gutter-rhyme-c${((activeVerse.rhymeSymbol.toUpperCase().charCodeAt(0) - 65) % 12 + 12) % 12}`}
                >
                  {activeVerse.rhymeSymbol}
                </strong>
              ) : (
                <strong className="text-[var(--text-muted)]">—</strong>
              )}
              {activeVerse.rhymeEnding ? ` (-${activeVerse.rhymeEnding.raw})` : ''}
            </span>
            <span className="text-[var(--border-color)]">|</span>
            <span>Acentos: {formatRhythmicAccents(activeVerse.rhythmicAccents)}</span>
          </>
        ) : (
          <span>Sin verso seleccionado</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {formId === 'silva' && (
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
            {summary.conformancePercentage}% en silva ({summary.heptasyllables + summary.endecasyllables}/{summary.totalVerses})
          </span>
        )}
        <span className="text-[var(--text-muted)]">
          {summary.totalVerses} {summary.totalVerses === 1 ? 'verso' : 'versos'}
        </span>
      </div>
    </footer>
  );
};
