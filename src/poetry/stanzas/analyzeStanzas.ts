import type { VerseAnalysis } from '../meter/analyzeVerse';
import type { StanzaAnalysis, VerseStanzaInfo } from './types';

/**
 * Returns the traditional Spanish metric name for a stanza based on
 * verse count, syllable lengths (arte mayor / menor), and rhyme scheme.
 */
export function getTraditionalStanzaName(
  verseCount: number,
  rhymeScheme: string = '',
  verses: VerseAnalysis[] = []
): string {
  const isArteMayor = verses.some(v => v.metricSyllables >= 9);
  const isArteMenor = verses.length > 0 && verses.every(v => v.metricSyllables <= 8);
  const cleanScheme = rhymeScheme.replace(/[^A-Za-z—]/g, '');

  switch (verseCount) {
    case 1:
      return 'Verso suelto';
    case 2:
      return 'Pareado';
    case 3:
      return 'Terceto';
    case 4:
      if (cleanScheme.toUpperCase() === 'ABBA') {
        return isArteMenor ? 'Redondilla' : 'Cuarteto';
      }
      if (cleanScheme.toUpperCase() === 'ABAB') {
        return isArteMenor ? 'Cuarteta' : 'Serventesio';
      }
      return isArteMenor ? 'Redondilla' : 'Cuarteto';
    case 5:
      // Check for traditional Garcilaso / Fray Luis Lira (7a 11B 7a 7b 11B)
      if (verses.length === 5 && verses.some(v => v.metricSyllables === 7) && verses.some(v => v.metricSyllables === 11)) {
        return 'Lira';
      }
      return isArteMenor ? 'Quintilla' : 'Quinteto';
    case 6:
      // Copla de pie quebrado (Manriqueña) check: alternates 8 with 4
      if (verses.some(v => v.metricSyllables <= 5) && verses.some(v => v.metricSyllables >= 8)) {
        return 'Copla de pie quebrado';
      }
      return isArteMenor ? 'Sextilla' : 'Sexteto';
    case 7:
      return isArteMenor ? 'Septilla' : 'Septeto';
    case 8:
      if (cleanScheme.toUpperCase() === 'ABABABCC' && !isArteMenor) {
        return 'Octava real';
      }
      return isArteMenor ? 'Octavilla' : 'Octava';
    case 9:
      return 'Novena';
    case 10:
      return 'Décima (Espinela)';
    case 14:
      return 'Soneto (14 versos)';
    default:
      return `Estrofa de ${verseCount} versos`;
  }
}

/**
 * Deterministically analyzes all verses in a poem and groups them into stanzas.
 * Attaches VerseStanzaInfo to each poetic verse.
 */
export function analyzeStanzas(verses: VerseAnalysis[]): StanzaAnalysis[] {
  const stanzas: StanzaAnalysis[] = [];
  let currentVerses: VerseAnalysis[] = [];
  let startLineIndex = -1;
  let endLineIndex = -1;

  const finalizeCurrentStanza = () => {
    if (currentVerses.length === 0) return;

    const stanzaIndex = stanzas.length + 1;
    const rhymeSymbols = currentVerses.map(v => v.rhymeSymbol || '—').join('');
    const traditionalName = getTraditionalStanzaName(currentVerses.length, rhymeSymbols, currentVerses);

    stanzas.push({
      index: stanzaIndex,
      startLineIndex,
      endLineIndex,
      verseCount: currentVerses.length,
      verses: [...currentVerses],
      rhymeScheme: rhymeSymbols,
      traditionalName,
    });

    currentVerses = [];
    startLineIndex = -1;
    endLineIndex = -1;
  };

  for (let i = 0; i < verses.length; i++) {
    const v = verses[i];

    // Comment lines do not count as poetic verses and do not break stanzas
    if (v.isComment) {
      continue;
    }

    // Blank lines or headings demarcate stanza boundaries
    if (v.isEmpty || v.isHeading) {
      finalizeCurrentStanza();
      continue;
    }

    // Valid poetic verse
    if (startLineIndex === -1) {
      startLineIndex = v.lineIndex;
    }
    endLineIndex = v.lineIndex;
    currentVerses.push(v);
  }

  // Finalize trailing stanza
  finalizeCurrentStanza();

  // Attach stanzaInfo to all constituent verses
  const totalStanzas = stanzas.length;
  for (const stanza of stanzas) {
    for (let pos = 0; pos < stanza.verses.length; pos++) {
      const verse = stanza.verses[pos];
      const stanzaInfo: VerseStanzaInfo = {
        stanzaIndex: stanza.index,
        totalStanzas,
        verseInStanza: pos + 1,
        stanzaVerseCount: stanza.verseCount,
        isStanzaStart: pos === 0,
        isStanzaEnd: pos === stanza.verses.length - 1,
        traditionalName: stanza.traditionalName,
        stanzaRhymeScheme: stanza.rhymeScheme,
      };
      verse.stanzaInfo = stanzaInfo;
    }
  }

  return stanzas;
}
