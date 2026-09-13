import { stripAccent, isVowel, isVocalicY } from '../phonology/vowels';
import type { WordAnalysis } from '../syllabification/types';

export interface RhymeEnding {
  raw: string             // e.g. "usa", "ía", "erpo", "erto"
  normalized: string      // Phonetically normalized for consonant rhyme
  vowelsOnly: string      // Canonical traditional assonant rhyme (e.g. "e-a", "e-o", "u-a")
  assonantEnding: string  // Canonical traditional assonant rhyme key (e.g. "u-a", "a-o", "a")
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

  return s;
}

/**
 * Returns the nuclear vowel of an unstressed syllable for assonant rhyming.
 * In Spanish postonic diphthongs (e.g. -ia, -io, -ie, -ua, -ue, -uo),
 * the weak vowel (i, u) is semivocalic/semiconsonantal and does not form assonance;
 * the strong/open vowel (a, e, o) is the rhyming nucleus.
 */
export function getUnstressedSyllableNuclearVowel(syllableText: string): string {
  const vowels: string[] = [];
  for (let i = 0; i < syllableText.length; i++) {
    const ch = syllableText[i];
    if (isVowel(ch) || isVocalicY(syllableText, i)) {
      vowels.push(stripAccent(ch));
    }
  }
  if (vowels.length === 0) return '';
  if (vowels.length === 1) return vowels[0];

  // Look for strong/open vowel first
  const openVowel = vowels.find(v => ['a', 'e', 'o'].includes(v));
  if (openVowel) return openVowel;

  // If two weak vowels, second is the nucleus
  return vowels[vowels.length - 1];
}

/**
 * Extracts all vowels from a string, separated by hyphens (fallback).
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
  const tonicVowelClean = stripAccent(tonicVowel);
  const normalized = normalizeRhymePhonemes(rawEnding);

  // Compute canonical traditional assonant rhyme according to Spanish poetics (Navarro Tomás, Quilis)
  let assonantEnding = tonicVowelClean;

  if (word.stressType === 'aguda') {
    // Aguda: only the tonic vowel counts (e.g. mar -> "a", reloj -> "o")
    assonantEnding = tonicVowelClean;
  } else if (word.stressType === 'llana') {
    // Llana: tonic vowel + nuclear vowel of the final unstressed syllable (e.g. musa -> "u-a", gracia -> "a-a")
    const lastSyllable = word.syllables[word.syllables.length - 1]?.text || '';
    const finalVowel = getUnstressedSyllableNuclearVowel(lastSyllable);
    assonantEnding = finalVowel ? `${tonicVowelClean}-${finalVowel}` : tonicVowelClean;
  } else {
    // Esdrújula or Sobresdrújula:
    // Traditional Spanish rule: tonic vowel + final syllable vowel,
    // ignoring intermediate postonic syllable(s)
    // (e.g. cántaro -> "a-o", música -> "u-a", tímido -> "i-o")
    const lastSyllable = word.syllables[word.syllables.length - 1]?.text || '';
    const finalVowel = getUnstressedSyllableNuclearVowel(lastSyllable);
    assonantEnding = finalVowel ? `${tonicVowelClean}-${finalVowel}` : tonicVowelClean;
  }

  const vowelsOnly = assonantEnding;

  return {
    raw: rawEnding,
    normalized,
    vowelsOnly,
    assonantEnding,
    tonicVowel,
  };
}
