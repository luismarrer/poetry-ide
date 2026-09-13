import { isVowel, isVocalicY } from '../phonology/vowels';
import type { WordAnalysis } from '../syllabification/types';
import type { TokenizedWord } from '../phonology/cleaner';

export interface SynalephaJunction {
  id: string
  wordIndexA: number
  wordIndexB: number
  wordA: string
  wordB: string
  textSpan: string
  vowelEndA: string
  vowelStartB: string
  hasPunctuationBetween: boolean
  active: boolean // true = applied as synalepha (-1 syllable); false = treated as hiatus (0)
}

/**
 * Checks if a word ends with a vocalic sound in Spanish.
 */
export function wordEndsInVowel(clean: string): boolean {
  if (!clean || clean.length === 0) return false;
  const lastIndex = clean.length - 1;
  const lastChar = clean[lastIndex];

  if (isVowel(lastChar)) return true;
  if (isVocalicY(clean, lastIndex)) return true;

  // Words ending in silent 'h' preceded by vowel (e.g. '¡ah!', '¡oh!')
  if (lastChar.toLowerCase() === 'h' && lastIndex > 0 && isVowel(clean[lastIndex - 1])) {
    return true;
  }

  return false;
}

/**
 * Checks if a word starts with a vocalic sound in Spanish.
 */
export function wordStartsInVowel(clean: string): boolean {
  if (!clean || clean.length === 0) return false;
  const firstChar = clean[0];

  if (isVowel(firstChar)) return true;

  // Starts with 'h' followed by a vowel: 'habla', 'humano', 'hombre', 'hiedra'
  if (firstChar.toLowerCase() === 'h' && clean.length > 1 && isVowel(clean[1])) {
    return true;
  }

  // Isolated conjunction "y"
  if (clean.toLowerCase() === 'y') {
    return true;
  }

  return false;
}

/**
 * Extracts candidate synalephas between adjacent words in a verse line.
 */
export function detectSynalephas(
  tokens: TokenizedWord[],
  words: WordAnalysis[]
): SynalephaJunction[] {
  const synalephas: SynalephaJunction[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    const wordA = words[i].clean;
    const wordB = words[i + 1].clean;
    const tokenA = tokens[i];

    if (wordEndsInVowel(wordA) && wordStartsInVowel(wordB)) {
      const id = `syn-${i}-${i + 1}`;
      const hasPunct = Boolean(tokenA.trailingPunct && tokenA.trailingPunct.length > 0);

      synalephas.push({
        id,
        wordIndexA: i,
        wordIndexB: i + 1,
        wordA,
        wordB,
        textSpan: `${wordA} ${wordB}`,
        vowelEndA: wordA[wordA.length - 1] || '',
        vowelStartB: wordB[0] || '',
        hasPunctuationBetween: hasPunct,
        active: true, // Default: poetic synalepha is applied
      });
    }
  }

  return synalephas;
}
