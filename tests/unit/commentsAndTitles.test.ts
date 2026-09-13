import { describe, it, expect } from 'vitest';
import { analyzePoem, analyzeVerse } from '@/poetry/index';

describe('Poem Comments and Title Headings', () => {
  it('identifies full line comments with // and % as non-verses', () => {
    const v1 = analyzeVerse('// Esto es un comentario de borrador', 0);
    expect(v1.isComment).toBe(true);
    expect(v1.isEmpty).toBe(true);
    expect(v1.metricSyllables).toBe(0);
    expect(v1.rhymeEnding).toBeUndefined();

    const v2 = analyzeVerse('% Variante clásica con porcentaje', 1);
    expect(v2.isComment).toBe(true);
    expect(v2.isEmpty).toBe(true);
    expect(v2.metricSyllables).toBe(0);
  });

  it('strips inline comments without affecting verse metrics or rhyme', () => {
    const verse = analyzeVerse('Pasos de un peregrino son, errante, // nota sobre la rima', 0);
    expect(verse.isComment).toBeUndefined();
    expect(verse.isEmpty).toBe(false);
    expect(verse.inlineComment).toBe('// nota sobre la rima');
    expect(verse.metricSyllables).toBe(11);
    expect(verse.rhymeEnding?.raw).toBe('ante');
  });

  it('identifies in-text headings with # and ## as non-verses', () => {
    const h1 = analyzeVerse('# Soledad Primera', 0);
    expect(h1.isHeading).toBe(true);
    expect(h1.headingLevel).toBe(1);
    expect(h1.isEmpty).toBe(true);
    expect(h1.metricSyllables).toBe(0);

    const h2 = analyzeVerse('## Estrofa II', 1);
    expect(h2.isHeading).toBe(true);
    expect(h2.headingLevel).toBe(2);
    expect(h2.isEmpty).toBe(true);
    expect(h2.metricSyllables).toBe(0);
  });

  it('excludes comments and headings from poem summaries and rhyme scheme', () => {
    const poem = [
      '# Mi Silva',
      '// Comentario inicial de contexto',
      'Pasos de un peregrino son, errante,',
      '// Nota intermedia',
      'cuantos me dictó versos dulce musa,',
      'en soledad confusa, % comentario al final',
    ].join('\n');

    const result = analyzePoem(poem, 'silva');
    expect(result.summary.totalVerses).toBe(3); // only the 3 real poetic lines
    expect(result.summary.outliers).toBe(0);
    expect(result.summary.conformancePercentage).toBe(100);

    // Line 0 (#) and Line 1 (//) and Line 3 (//) should not have rhyme symbols
    expect(result.verses[0].isHeading).toBe(true);
    expect(result.verses[1].isComment).toBe(true);
    expect(result.verses[3].isComment).toBe(true);

    // Line 2 is unrhymed
    expect(result.verses[2].rhymeSymbol).toBe('—');

    // Line 4 and 5 rhyme (-usa) as first rhyming pair: 'A' and 'a'
    expect(result.verses[4].rhymeSymbol).toBe('A');
    expect(result.verses[5].rhymeSymbol).toBe('a');
  });
});
