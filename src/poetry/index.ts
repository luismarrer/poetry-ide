import { analyzeVerse, type VerseAnalysis, type Diagnostic } from './meter/analyzeVerse';
import type { PoemOverrides } from './meter/overrides';
import { computeRhymeScheme } from './rhyme/rhymeScheme';
import { getPoeticForm, type FormId, type FormSummary, type PoeticForm } from './forms';
import { lintPoem, STANDARD_RULES } from './lint/engine';

export * from './phonology/vowels';
export * from './phonology/consonants';
export * from './phonology/cleaner';
export * from './syllabification/types';
export * from './syllabification/syllabify';
export * from './meter/finalStress';
export * from './meter/synalepha';
export * from './meter/overrides';
export * from './meter/analyzeVerse';
export * from './rhythm/accents';
export * from './rhyme/extractRhyme';
export * from './rhyme/rhymeScheme';
export * from './forms';
export * from './lint/types';
export * from './lint/engine';

export interface PoemAnalysisResult {
  verses: VerseAnalysis[]
  form: PoeticForm
  summary: FormSummary
  rhymeScheme: string[]
  lineDiagnostics: Map<number, Diagnostic[]>
}

/**
 * Main deterministic entry point for analyzing a full poem.
 */
export function analyzePoem(
  text: string,
  formId: FormId = 'libre',
  overrides: PoemOverrides = {}
): PoemAnalysisResult {
  const lines = text.split('\n');
  const verses: VerseAnalysis[] = lines.map((line, idx) =>
    analyzeVerse(line, idx, overrides[idx])
  );

  // Compute rhyme scheme
  const rhymeInfo = verses.map(v => ({
    lineIndex: v.lineIndex,
    metricSyllables: v.metricSyllables,
    rhymeEnding: v.rhymeEnding,
  }));
  const rhymeScheme = computeRhymeScheme(rhymeInfo, 'consonant');

  // Attach rhyme symbols to verses
  for (let i = 0; i < verses.length; i++) {
    verses[i].rhymeSymbol = rhymeScheme[i];
  }

  // Get active poetic form and compute summary
  const form = getPoeticForm(formId);
  const summary = form.computeSummary(verses);

  // Run linter rules
  const lineDiagnostics = lintPoem({ verses, formId }, STANDARD_RULES);

  // Attach diagnostics to verses
  for (let i = 0; i < verses.length; i++) {
    const diags = lineDiagnostics.get(i);
    if (diags) {
      verses[i].diagnostics = diags;
    }
  }

  return {
    verses,
    form,
    summary,
    rhymeScheme,
    lineDiagnostics,
  };
}
