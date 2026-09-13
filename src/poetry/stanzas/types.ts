import type { VerseAnalysis } from '../meter/analyzeVerse';

export interface StanzaAnalysis {
  index: number              // 1-based index (Estrofa 1, Estrofa 2, ...)
  startLineIndex: number     // 0-based document line index where stanza starts
  endLineIndex: number       // 0-based document line index where stanza ends
  verseCount: number         // Number of poetic verses the stanza measures
  verses: VerseAnalysis[]    // The poetic verses contained in this stanza
  rhymeScheme: string        // Concatenated rhyme symbols of the stanza (e.g. "ABBA")
  traditionalName: string    // Traditional Spanish poetic name (Pareado, Terceto, Cuarteto, etc.)
}

export interface VerseStanzaInfo {
  stanzaIndex: number        // 1-based index of the stanza this verse belongs to
  totalStanzas: number       // Total number of stanzas in the poem
  verseInStanza: number      // 1-based position of this verse within its stanza (e.g., 2 of 4)
  stanzaVerseCount: number   // Total verses that this stanza measures (e.g., 4)
  isStanzaStart: boolean     // True if this is the first verse of the stanza
  isStanzaEnd: boolean       // True if this is the last verse of the stanza
  traditionalName: string    // Traditional name (Pareado, Terceto, Cuarteto, etc.)
  stanzaRhymeScheme: string  // Rhyme scheme of this stanza
}
