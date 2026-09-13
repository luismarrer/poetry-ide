import {
  isOpenVowel,
  isClosedUnaccentedVowel,
  isClosedAccentedVowel,
  isVowel,
  isVocalicY,
} from '../phonology/vowels';
import { isInseparableCluster } from '../phonology/consonants';

interface VowelNucleus {
  start: number;
  end: number; // exclusive
  text: string;
}

/**
 * Checks if a character at index is a vowel or acts as one in this word.
 */
function isVowelAt(word: string, i: number): boolean {
  if (isVowel(word[i])) return true;
  if (isVocalicY(word, i)) return true;
  return false;
}

/**
 * Checks if 'u' in 'qu' or 'gu' followed by e/i is a silent diacritic.
 * If word contains 'gue', 'gui', 'que', 'qui', the 'u' is silent unless it has 'ü'.
 */
function isSilentU(word: string, i: number): boolean {
  const ch = word[i]?.toLowerCase();
  if (ch !== 'u') return false;
  if (i === 0) return false;

  const prev = word[i - 1]?.toLowerCase();
  const next = word[i + 1]?.toLowerCase();

  if (prev === 'q' && (next === 'e' || next === 'i' || next === 'é' || next === 'í')) {
    return true;
  }
  if (prev === 'g' && (next === 'e' || next === 'i' || next === 'é' || next === 'í')) {
    return true;
  }

  return false;
}

/**
 * Identifies vocalic nuclei (monophthongs, diphthongs, triphthongs) in a clean word.
 */
function findNuclei(word: string): VowelNucleus[] {
  const nuclei: VowelNucleus[] = [];
  const len = word.length;
  let i = 0;

  while (i < len) {
    // If silent 'u' after q/g, skip as consonant diacritic
    if (isSilentU(word, i)) {
      i++;
      continue;
    }

    if (!isVowelAt(word, i)) {
      i++;
      continue;
    }

    // Found start of a potential nucleus
    let nucleusStart = i;
    let nucleusEnd = i + 1;

    // Check for diphthong or triphthong
    // Look ahead to see if subsequent characters form a diphthong or triphthong
    while (nucleusEnd < len) {
      let nextVowelIndex = nucleusEnd;
      // Handle silent 'h' between vowels, e.g. pro-hi-bir
      if (word[nextVowelIndex]?.toLowerCase() === 'h') {
        nextVowelIndex++;
      }

      if (nextVowelIndex >= len || !isVowelAt(word, nextVowelIndex)) {
        break;
      }

      const v1 = word[nucleusEnd - 1]?.toLowerCase();
      const v2 = word[nextVowelIndex]?.toLowerCase();

      // Determine if v1 and v2 can form a diphthong:
      let canMerge = false;

      const isV1Open = isOpenVowel(v1);
      const isV2Open = isOpenVowel(v2);
      const isV1ClosedUnaccented = isClosedUnaccentedVowel(v1) || (v1 === 'y' && isVocalicY(word, nucleusEnd - 1));
      const isV2ClosedUnaccented = isClosedUnaccentedVowel(v2) || (v2 === 'y' && isVocalicY(word, nextVowelIndex));
      const isV1ClosedAccented = isClosedAccentedVowel(v1);
      const isV2ClosedAccented = isClosedAccentedVowel(v2);

      // Hiatus cases:
      // 1. Two open vowels: a-e, a-o, e-a, e-o, o-a, o-e, a-a, e-e, o-o
      if (isV1Open && isV2Open) {
        canMerge = false;
      }
      // 2. Open + Accented Closed or Accented Closed + Open: pa-ís, o-í-do, d-í-a, r-a-úl
      else if ((isV1Open && isV2ClosedAccented) || (isV1ClosedAccented && isV2Open)) {
        canMerge = false;
      }
      // 3. Two identical closed vowels: ti-i-to, du-un-vi-ro
      else if (v1 === v2 && !isV1ClosedAccented) {
        canMerge = false;
      }
      // Diphthong cases:
      // 1. Open + Closed Unaccented (ai, au, ei, eu, oi, ou, ay, ey, oy)
      else if (isV1Open && isV2ClosedUnaccented) {
        canMerge = true;
      }
      // 2. Closed Unaccented + Open (ia, ie, io, ua, ue, uo)
      else if (isV1ClosedUnaccented && isV2Open) {
        canMerge = true;
      }
      // 3. Two distinct Closed Unaccented (iu, ui, uy)
      else if (isV1ClosedUnaccented && isV2ClosedUnaccented && v1 !== v2) {
        canMerge = true;
      }

      // If there's a triphthong: Closed Unaccented + Open (can be accented) + Closed Unaccented
      // e.g. a-ve-ri-güéis, buey, Guay
      if (nucleusEnd - nucleusStart >= 2) {
        // Already merged 2 vowels. Can we merge a 3rd?
        const v0 = word[nucleusStart]?.toLowerCase();
        const isV0ClosedUnaccented = isClosedUnaccentedVowel(v0);
        if (isV0ClosedUnaccented && isV1Open && isV2ClosedUnaccented) {
          canMerge = true;
        } else {
          canMerge = false;
        }
      }

      if (canMerge) {
        nucleusEnd = nextVowelIndex + 1;
      } else {
        break;
      }
    }

    nuclei.push({
      start: nucleusStart,
      end: nucleusEnd,
      text: word.slice(nucleusStart, nucleusEnd),
    });

    i = nucleusEnd;
  }

  return nuclei;
}

/**
 * Splits a clean word into its grammatical syllables.
 */
export function syllabifyWord(cleanWord: string): string[] {
  if (!cleanWord || cleanWord.length === 0) return [];

  const nuclei = findNuclei(cleanWord);

  // If no vowel nucleus (e.g. abbreviations, acronyms), return word as single syllable
  if (nuclei.length <= 1) {
    return [cleanWord];
  }

  const syllables: string[] = [];
  let prevSplit = 0;

  for (let i = 0; i < nuclei.length - 1; i++) {
    const currentNucleus = nuclei[i];
    const nextNucleus = nuclei[i + 1];

    // Consonants between current nucleus and next nucleus
    const consonantSpanStart = currentNucleus.end;
    const consonantSpanEnd = nextNucleus.start;
    const consonants = cleanWord.slice(consonantSpanStart, consonantSpanEnd);
    const numConsonants = consonants.length;

    let splitIndex = consonantSpanStart;

    function isOnsetCluster(pair: string): boolean {
      const lower = pair.toLowerCase();
      return (
        lower === 'ch' ||
        lower === 'll' ||
        lower === 'rr' ||
        lower === 'qu' ||
        lower === 'gu' ||
        isInseparableCluster(lower)
      );
    }

    if (numConsonants === 0) {
      // Direct hiatus between vowels: e.g. po-e-ma, ca-os
      splitIndex = consonantSpanStart;
    } else if (numConsonants === 1) {
      // Single consonant goes with next syllable: ca-sa, pe-ro
      // Exception: silent 'h' between vowels is attached to next nucleus
      splitIndex = consonantSpanStart;
    } else if (numConsonants === 2) {
      if (isOnsetCluster(consonants)) {
        // Digraph or inseparable cluster (bl, br, qu, gu, ch, etc.): goes to next syllable
        splitIndex = consonantSpanStart;
      } else {
        // Normal two consonants: split between them: al-to, can-tar, gim-nasio
        splitIndex = consonantSpanStart + 1;
      }
    } else if (numConsonants === 3) {
      const lastTwo = consonants.slice(1).toLowerCase();
      if (isOnsetCluster(lastTwo)) {
        // C1 stays with current, C2C3 go to next: en-tra-da, es-qui-na, al-guien
        splitIndex = consonantSpanStart + 1;
      } else {
        // C1C2 stay with current, C3 goes to next: ins-ti-tu-to, cons-tan-te, pers-pi-caz
        splitIndex = consonantSpanStart + 2;
      }
    } else if (numConsonants >= 4) {
      const lastTwo = consonants.slice(-2).toLowerCase();
      if (isOnsetCluster(lastTwo)) {
        splitIndex = consonantSpanStart + (numConsonants - 2);
      } else {
        splitIndex = consonantSpanStart + 2;
      }
    }

    syllables.push(cleanWord.slice(prevSplit, splitIndex));
    prevSplit = splitIndex;
  }

  // Last syllable includes the remaining part of the word
  syllables.push(cleanWord.slice(prevSplit));

  return syllables;
}
