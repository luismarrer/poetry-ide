import type { WordAnalysis } from '../syllabification/types';
import type { SynalephaJunction } from '../meter/synalepha';

/**
 * Calculates 1-based metric syllable positions that carry prosodic/metric stress.
 * Takes active synalephas into account when mapping word syllables to metric syllables.
 */
export function computeRhythmicAccents(
  words: WordAnalysis[],
  synalephas: SynalephaJunction[]
): number[] {
  if (words.length === 0) return [];

  // Build a lookup of active synalephas between words
  // Map: wordIndexA -> boolean (is merged with wordIndexA + 1)
  const activeSynMap = new Map<number, boolean>();
  for (const syn of synalephas) {
    if (syn.active) {
      activeSynMap.set(syn.wordIndexA, true);
    }
  }

  const stressedMetricPositions: number[] = [];
  let currentMetricSyllable = 1;

  for (let wIdx = 0; wIdx < words.length; wIdx++) {
    const word = words[wIdx];
    const numSyllables = word.syllables.length;
    const isMergedAtStart = wIdx > 0 && activeSynMap.get(wIdx - 1) === true;

    for (let sIdx = 0; sIdx < numSyllables; sIdx++) {
      let metricIndex: number;

      if (sIdx === 0 && isMergedAtStart) {
        // This syllable is merged with the last syllable of the previous word
        metricIndex = currentMetricSyllable - 1;
      } else {
        metricIndex = currentMetricSyllable;
        currentMetricSyllable++;
      }

      if (word.syllables[sIdx].isStressed) {
        if (!stressedMetricPositions.includes(metricIndex)) {
          stressedMetricPositions.push(metricIndex);
        }
      }
    }
  }

  return stressedMetricPositions.sort((a, b) => a - b);
}

/**
 * Formats rhythmic accents as e.g. "2 · 6 · 10"
 */
export function formatRhythmicAccents(accents: number[]): string {
  if (accents.length === 0) return '—';
  return accents.join(' · ');
}
