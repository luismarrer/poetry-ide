/**
 * Spanish phonology: vowel classifications and helpers according to RAE rules.
 */

export const OPEN_VOWELS = new Set(['a', 'e', 'o', 'á', 'é', 'ó', 'A', 'E', 'O', 'Á', 'É', 'Ó']);
export const CLOSED_UNACCENTED_VOWELS = new Set(['i', 'u', 'ü', 'I', 'U', 'Ü']);
export const CLOSED_ACCENTED_VOWELS = new Set(['í', 'ú', 'Í', 'Ú']);
export const ALL_VOWELS = new Set([
  'a', 'e', 'i', 'o', 'u', 'ü',
  'á', 'é', 'í', 'ó', 'ú',
  'A', 'E', 'I', 'O', 'U', 'Ü',
  'Á', 'É', 'Í', 'Ó', 'Ú'
]);

export const ACCENT_MAP: Record<string, string> = {
  'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
  'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ú': 'u',
  'ü': 'u', 'Ü': 'u'
};

export function isVowel(ch: string): boolean {
  return ALL_VOWELS.has(ch);
}

export function isOpenVowel(ch: string): boolean {
  return OPEN_VOWELS.has(ch);
}

export function isClosedUnaccentedVowel(ch: string): boolean {
  return CLOSED_UNACCENTED_VOWELS.has(ch);
}

export function isClosedAccentedVowel(ch: string): boolean {
  return CLOSED_ACCENTED_VOWELS.has(ch);
}

export function isAccentedVowel(ch: string): boolean {
  return ['á', 'é', 'í', 'ó', 'ú', 'Á', 'É', 'Í', 'Ó', 'Ú'].includes(ch);
}

export function stripAccent(ch: string): string {
  return ACCENT_MAP[ch] || ch.toLowerCase();
}

/**
 * Checks whether 'y' functions as a vocalic element /i/ in Spanish.
 * At the end of a word (e.g. 'rey', 'estoy', 'muy') or as an isolated conjunction ('y').
 */
export function isVocalicY(word: string, index: number): boolean {
  const ch = word[index]?.toLowerCase();
  if (ch !== 'y') return false;

  // Single letter word: "y"
  if (word.length === 1) return true;

  // At the end of word preceded by a vowel: "rey", "muy", "hoy", "buey"
  if (index === word.length - 1 && index > 0 && isVowel(word[index - 1])) {
    return true;
  }

  return false;
}
