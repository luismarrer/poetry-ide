import { isAccentedVowel } from '../phonology/vowels';
import type { StressType, Syllable, WordAnalysis } from '../syllabification/types';
import { syllabifyWord } from '../syllabification/syllabify';

// Common atonic functional words in Spanish (clitics, prepositions, conjunctions, unstressed possessives/articles)
export const ATONIC_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'al', 'a', 'en', 'con', 'por', 'para', 'sin', 'sobre', 'tras', 'hasta', 'hacia', 'bajo', 'contra',
  'y', 'e', 'ni', 'o', 'u', 'que', 'pero', 'mas', 'sino', 'si',
  'me', 'te', 'se', 'nos', 'os', 'le', 'les', 'lo',
  'mi', 'tu', 'su', 'mis', 'tus', 'sus',
  'tan', 'como'
]);

export function isWordAtonic(clean: string): boolean {
  return ATONIC_WORDS.has(clean.toLowerCase());
}

/**
 * Checks if a syllable contains an explicit graphic accent (tilde).
 */
export function syllableHasTilde(syllable: string): boolean {
  for (const ch of syllable) {
    if (isAccentedVowel(ch)) return true;
  }
  return false;
}

/**
 * Analyzes a single clean word: syllabification, lexical stress, and tonic syllable index.
 */
export function analyzeWord(raw: string, clean: string): WordAnalysis {
  const syllablesRaw = syllabifyWord(clean);
  const numSyllables = syllablesRaw.length;

  if (numSyllables === 0) {
    return {
      raw,
      clean,
      syllables: [],
      stressIndex: 0,
      stressType: 'llana',
      isAtonic: false,
    };
  }

  // 1. Check for graphic tilde
  let tildeIndex = -1;
  for (let i = 0; i < numSyllables; i++) {
    if (syllableHasTilde(syllablesRaw[i])) {
      tildeIndex = i;
      break;
    }
  }

  let stressIndex = 0;
  let stressType: StressType = 'llana';

  if (tildeIndex !== -1) {
    stressIndex = tildeIndex;
    const fromEnd = numSyllables - 1 - tildeIndex;
    if (fromEnd === 0) {
      stressType = 'aguda';
    } else if (fromEnd === 1) {
      stressType = 'llana';
    } else if (fromEnd === 2) {
      stressType = 'esdrujula';
    } else {
      stressType = 'sobresdrujula';
    }
  } else {
    // No tilde
    if (numSyllables === 1) {
      stressIndex = 0;
      stressType = 'aguda';
    } else {
      const lastChar = clean[clean.length - 1]?.toLowerCase() || '';
      // Ends in vowel, n, or s -> penultimate (llana)
      if (['a', 'e', 'i', 'o', 'u', 'n', 's'].includes(lastChar)) {
        stressIndex = numSyllables - 2;
        stressType = 'llana';
      } else {
        // Ends in any other consonant or y -> ultimate (aguda)
        stressIndex = numSyllables - 1;
        stressType = 'aguda';
      }
    }
  }

  const isAtonic = isWordAtonic(clean);

  const syllables: Syllable[] = syllablesRaw.map((syl, idx) => ({
    text: syl,
    isStressed: idx === stressIndex && !isAtonic,
    hasTilde: syllableHasTilde(syl),
  }));

  return {
    raw,
    clean,
    syllables,
    stressIndex,
    stressType,
    isAtonic,
  };
}

/**
 * Returns the final metric adjustment for the verse ending according to Spanish metrics:
 * Aguda / monosyllable: +1
 * Llana: 0
 * Esdrújula: -1
 * Sobresdrújula: -2
 */
export function getFinalStressAdjustment(stressType: StressType): -1 | 0 | 1 | -2 {
  switch (stressType) {
    case 'aguda':
      return 1;
    case 'llana':
      return 0;
    case 'esdrujula':
      return -1;
    case 'sobresdrujula':
      return -2;
    default:
      return 0;
  }
}
