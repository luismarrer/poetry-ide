import type { RhymeEnding } from './extractRhyme';

export interface VerseRhymeInfo {
  lineIndex: number
  metricSyllables: number
  rhymeEnding?: RhymeEnding
}

/**
 * Computes rhyme scheme symbols (e.g. 'A', 'b', '—') for a set of verses.
 * Arte menor (<= 8 syllables) -> lowercase letters (a, b, c...)
 * Arte mayor (>= 9 syllables) -> uppercase letters (A, B, C...)
 * Unrhymed verses -> "—"
 */
export function computeRhymeScheme(
  verses: VerseRhymeInfo[],
  mode: 'consonant' | 'assonant' = 'consonant'
): string[] {
  const n = verses.length;
  const result: string[] = new Array(n).fill('—');

  // Count occurrences of each rhyme termination
  const rhymeCounts = new Map<string, number>();
  const rhymeFirstIndex = new Map<string, number>();

  for (let i = 0; i < n; i++) {
    const ending = verses[i].rhymeEnding;
    if (!ending) continue;

    const key = mode === 'consonant' ? ending.normalized : ending.vowelsOnly;
    rhymeCounts.set(key, (rhymeCounts.get(key) || 0) + 1);

    if (!rhymeFirstIndex.has(key)) {
      rhymeFirstIndex.set(key, i);
    }
  }

  // Assign letters only to rhymes that appear at least twice (paired or grouped)
  const keyToLetter = new Map<string, string>();
  let nextLetterCode = 65; // 'A'

  for (let i = 0; i < n; i++) {
    const ending = verses[i].rhymeEnding;
    if (!ending) continue;

    const key = mode === 'consonant' ? ending.normalized : ending.vowelsOnly;
    const count = rhymeCounts.get(key) || 0;

    if (count > 1) {
      if (!keyToLetter.has(key)) {
        const letter = String.fromCharCode(nextLetterCode);
        keyToLetter.set(key, letter);
        nextLetterCode++;
        if (nextLetterCode > 90) nextLetterCode = 65; // wrap if >26 rhymes
      }

      const baseLetter = keyToLetter.get(key)!;
      const isArteMayor = verses[i].metricSyllables >= 9;
      result[i] = isArteMayor ? baseLetter.toUpperCase() : baseLetter.toLowerCase();
    } else {
      result[i] = '—';
    }
  }

  return result;
}
