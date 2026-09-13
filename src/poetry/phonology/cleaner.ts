/**
 * Utilities for cleaning and tokenizing verse lines into words.
 */

export interface TokenizedWord {
  raw: string
  clean: string
  leadingPunct: string
  trailingPunct: string
  startIndex: number
  endIndex: number
}

// Characters considered punctuation or delimiters in Spanish poetry
const PUNCTUATION_REGEX = /^[.,;:…!¡?¿"'«»—–_()\[\]{}]+|[.,;:…!¡?¿"'«»—–_()\[\]{}]+$/g;

export function cleanWord(raw: string): string {
  return raw.replace(PUNCTUATION_REGEX, '').trim();
}

/**
 * Tokenizes a verse line into words preserving offsets and punctuation.
 */
export function tokenizeVerse(line: string): TokenizedWord[] {
  const words: TokenizedWord[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    const raw = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + raw.length;

    // Extract leading punctuation
    const leadingMatch = raw.match(/^[.,;:…!¡?¿"'«»—–_()\[\]{}]+/);
    const leadingPunct = leadingMatch ? leadingMatch[0] : '';

    // Extract trailing punctuation
    const trailingMatch = raw.match(/[.,;:…!¡?¿"'«»—–_()\[\]{}]+$/);
    const trailingPunct = trailingMatch ? trailingMatch[0] : '';

    const clean = raw.slice(
      leadingPunct.length,
      raw.length - trailingPunct.length
    );

    if (clean.length > 0) {
      words.push({
        raw,
        clean,
        leadingPunct,
        trailingPunct,
        startIndex,
        endIndex,
      });
    }
  }

  return words;
}
