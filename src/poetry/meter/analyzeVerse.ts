import { tokenizeVerse } from '../phonology/cleaner';
import { analyzeWord, getFinalStressAdjustment } from './finalStress';
import { detectSynalephas, type SynalephaJunction } from './synalepha';
import { applySynalephaOverrides, type VerseOverride } from './overrides';
import { computeRhythmicAccents } from '../rhythm/accents';
import { extractRhymeFromWord, type RhymeEnding } from '../rhyme/extractRhyme';
import type { WordAnalysis, StressType } from '../syllabification/types';

export interface Diagnostic {
  id: string
  ruleId: string
  level: 'info' | 'suggestion' | 'warning'
  message: string
}

export interface VerseAnalysis {
  lineIndex: number
  text: string
  isEmpty: boolean
  grammaticalSyllables: number
  words: WordAnalysis[]
  synalephas: SynalephaJunction[]
  finalStress: StressType
  finalStressAdjustment: -1 | 0 | 1 | -2
  metricSyllables: number
  algorithmMetricSyllables: number
  rhythmicAccents: number[]
  rhymeEnding?: RhymeEnding
  rhymeSymbol?: string
  diagnostics: Diagnostic[]
}

/**
 * Analyzes a single verse line deterministically.
 */
export function analyzeVerse(
  text: string,
  lineIndex: number,
  overrides?: VerseOverride
): VerseAnalysis {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return {
      lineIndex,
      text,
      isEmpty: true,
      grammaticalSyllables: 0,
      words: [],
      synalephas: [],
      finalStress: 'llana',
      finalStressAdjustment: 0,
      metricSyllables: 0,
      algorithmMetricSyllables: 0,
      rhythmicAccents: [],
      diagnostics: [],
    };
  }

  // 1. Tokenize line into words
  const tokens = tokenizeVerse(text);
  if (tokens.length === 0) {
    return {
      lineIndex,
      text,
      isEmpty: true,
      grammaticalSyllables: 0,
      words: [],
      synalephas: [],
      finalStress: 'llana',
      finalStressAdjustment: 0,
      metricSyllables: 0,
      algorithmMetricSyllables: 0,
      rhythmicAccents: [],
      diagnostics: [],
    };
  }

  // 2. Analyze each word
  const words: WordAnalysis[] = tokens.map(t => analyzeWord(t.raw, t.clean));

  // 3. Count grammatical syllables
  let grammaticalSyllables = 0;
  for (const w of words) {
    grammaticalSyllables += w.syllables.length;
  }

  // 4. Detect synalephas
  const synalephas = detectSynalephas(tokens, words);
  const defaultActiveSynCount = synalephas.length;

  // 5. Final stress determination and adjustment
  const lastWord = words[words.length - 1];
  const finalStress = lastWord.stressType;
  const finalStressAdjustment = getFinalStressAdjustment(finalStress);

  // 6. Compute algorithmic metric syllables (without user overrides)
  const algorithmMetricSyllables = Math.max(
    0,
    grammaticalSyllables - defaultActiveSynCount + finalStressAdjustment
  );

  // 7. Apply user overrides to synalephas
  if (overrides?.synalephas) {
    applySynalephaOverrides(synalephas, overrides.synalephas);
  }

  const activeSynCount = synalephas.filter(s => s.active).length;

  // 8. Metric count with overrides
  let metricSyllables = Math.max(
    0,
    grammaticalSyllables - activeSynCount + finalStressAdjustment
  );

  if (typeof overrides?.manualMetricCount === 'number') {
    metricSyllables = overrides.manualMetricCount;
  }

  // 9. Rhythmic accents
  const rhythmicAccents = computeRhythmicAccents(words, synalephas);

  // 10. Rhyme ending
  const rhymeEnding = extractRhymeFromWord(lastWord);

  return {
    lineIndex,
    text,
    isEmpty: false,
    grammaticalSyllables,
    words,
    synalephas,
    finalStress,
    finalStressAdjustment,
    metricSyllables,
    algorithmMetricSyllables,
    rhythmicAccents,
    rhymeEnding,
    diagnostics: [],
  };
}
