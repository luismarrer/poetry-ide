import { stripAccent, isVowel, isVocalicY } from '../phonology/vowels';
import type { WordAnalysis } from '../syllabification/types';

export interface RhymeEnding {
  raw: string             // e.g. "osa", "ía", "erpo", "erto"
  normalized: string      // Phonetically normalized for consonant rhyme
  vowelsOnly: string      // For assonant rhyme (e.g. "e-a", "e-o")
  tonicVowel: string      // e.g. "o", "í", "e"
}

/**
 * Normalizes consonant sounds that are phonetically equivalent in Spanish poetry:
 * - b / v -> b
 * - c (before e/i) and z -> s (seseo-friendly standard rhyme)
 * - g (before e/i) and j -> j
 * - y (consonantal) and ll -> y (yeísmo)
 * - silent h -> removed
 */
export function normalizeRhymePhonemes(str: string): string {
  let s = str.toLowerCase();

  // Remove silent h
  s = s.replace(/h/g, '');

  // b and v are phonetically identical in Spanish
  s = s.replace(/v/g, 'b');

  // c before e/i -> s
  s = s.replace(/c([eiéí])/g, 's$1');
  // z -> s
  s = s.replace(/z/g, 's');

  // g before e/i -> j
  s = s.replace(/g([eiéí])/g, 'j$1');

  // ll -> y (yeísmo)
  s = s.replace(/ll/g, 'y');

  // Normalize accented vowels for phonetic comparison if needed,
  // but keep track of the tonic position.
  return s;
}

/**
 * Extracts all vowels from a string, separated by hyphens (for assonant rhyme).
 */
export function extractVowelsOnly(str: string): string {
  const vowels: string[] = [];
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (isVowel(ch) || isVocalicY(str, i)) {
      vowels.push(stripAccent(ch));
    }
  }
  return vowels.join('-');
}

/**
 * Extracts the rhyme termination starting from the tonic vowel of the final word.
 */
export function extractRhymeFromWord(word: WordAnalysis): RhymeEnding | undefined {
  if (!word || word.syllables.length === 0) return undefined;

  const stressedSyllableIndex = word.stressIndex;
  const stressedSyllable = word.syllables[stressedSyllableIndex]?.text || '';

  // Find the tonic vowel inside the stressed syllable
  // In Spanish, if syllable has a tilde, that vowel is tonic.
  // Otherwise, if diphthong (strong + weak), the strong vowel is tonic.
  // If two weak (iu, ui), the second is generally tonic.
  let tonicCharIndex = -1;

  for (let i = 0; i < stressedSyllable.length; i++) {
    const ch = stressedSyllable[i];
    if (['á', 'é', 'í', 'ó', 'ú', 'Á', 'É', 'Í', 'Ó', 'Ú'].includes(ch)) {
      tonicCharIndex = i;
      break;
    }
  }

  if (tonicCharIndex === -1) {
    // Look for strong vowel in stressed syllable
    for (let i = 0; i < stressedSyllable.length; i++) {
      const ch = stressedSyllable[i].toLowerCase();
      if (['a', 'e', 'o'].includes(ch)) {
        tonicCharIndex = i;
        break;
      }
    }
  }

  if (tonicCharIndex === -1) {
    // Look for any vowel
    for (let i = stressedSyllable.length - 1; i >= 0; i--) {
      const ch = stressedSyllable[i].toLowerCase();
      if (isVowel(ch) || ch === 'y') {
        tonicCharIndex = i;
        break;
      }
    }
  }

  if (tonicCharIndex === -1) {
    return undefined;
  }

  // The rhyme part starts from tonicCharIndex of the stressed syllable,
  // plus all subsequent syllables of the word.
  const endingFromStressedSyllable = stressedSyllable.slice(tonicCharIndex);
  const remainingSyllables = word.syllables.slice(stressedSyllableIndex + 1).map(s => s.text).join('');
  const rawEnding = endingFromStressedSyllable + remainingSyllables;

  const tonicVowel = stressedSyllable[tonicCharIndex];
  const normalized = normalizeRhymePhonemes(rawEnding);
  const vowelsOnly = extractVowelsOnly(rawEnding);

  return {
    raw: rawEnding,
    normalized,
    vowelsOnly,
    tonicVowel,
  };
}
