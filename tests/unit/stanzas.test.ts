import { describe, it, expect } from 'vitest';
import { analyzePoem } from '../../src/poetry/index';
import { getTraditionalStanzaName } from '../../src/poetry/stanzas/analyzeStanzas';

describe('Stanza Analysis and Metric Sizing', () => {
  it('correctly calculates verse counts for multiple stanzas separated by blank lines', () => {
    const poem = [
      'Verso uno de la primera,',
      'verso dos de la primera,',
      'verso tres de la primera,',
      'verso cuatro de la primera.',
      '',
      'Verso uno de la segunda,',
      'verso dos de la segunda,',
      'verso tres de la segunda.',
    ].join('\n');

    const result = analyzePoem(poem);
    expect(result.stanzas).toHaveLength(2);

    // Stanza 1 measures 4 verses
    const stanza1 = result.stanzas[0];
    expect(stanza1.index).toBe(1);
    expect(stanza1.verseCount).toBe(4);
    expect(stanza1.verses).toHaveLength(4);
    expect(stanza1.traditionalName).toContain('Cuarteto');

    // Stanza 2 measures 3 verses
    const stanza2 = result.stanzas[1];
    expect(stanza2.index).toBe(2);
    expect(stanza2.verseCount).toBe(3);
    expect(stanza2.verses).toHaveLength(3);
    expect(stanza2.traditionalName).toContain('Terceto');

    // Verify verseStanzaInfo on verse 1
    const v1 = result.verses[0];
    expect(v1.stanzaInfo).toBeDefined();
    expect(v1.stanzaInfo?.stanzaIndex).toBe(1);
    expect(v1.stanzaInfo?.totalStanzas).toBe(2);
    expect(v1.stanzaInfo?.verseInStanza).toBe(1);
    expect(v1.stanzaInfo?.stanzaVerseCount).toBe(4);
    expect(v1.stanzaInfo?.isStanzaStart).toBe(true);
    expect(v1.stanzaInfo?.isStanzaEnd).toBe(false);

    // Verify verseStanzaInfo on verse 4 (last of stanza 1)
    const v4 = result.verses[3];
    expect(v4.stanzaInfo?.stanzaIndex).toBe(1);
    expect(v4.stanzaInfo?.verseInStanza).toBe(4);
    expect(v4.stanzaInfo?.stanzaVerseCount).toBe(4);
    expect(v4.stanzaInfo?.isStanzaStart).toBe(false);
    expect(v4.stanzaInfo?.isStanzaEnd).toBe(true);

    // Verify verseStanzaInfo on verse 5 (first of stanza 2, lineIndex 5)
    const v5 = result.verses[5];
    expect(v5.stanzaInfo?.stanzaIndex).toBe(2);
    expect(v5.stanzaInfo?.verseInStanza).toBe(1);
    expect(v5.stanzaInfo?.stanzaVerseCount).toBe(3);
    expect(v5.stanzaInfo?.isStanzaStart).toBe(true);
    expect(v5.stanzaInfo?.isStanzaEnd).toBe(false);
  });

  it('handles stanzas separated by in-text headings', () => {
    const poem = [
      '# Canto Primero',
      'Era del año la estación florida',
      'en que el mentido robador de Europa',
      '',
      '# Canto Segundo',
      'media luna las armas de su frente,',
      'y el Sol todos los rayos de su pelo.',
    ].join('\n');

    const result = analyzePoem(poem);
    expect(result.stanzas).toHaveLength(2);
    expect(result.stanzas[0].verseCount).toBe(2);
    expect(result.stanzas[1].verseCount).toBe(2);
  });

  it('does not count comments as verses nor break the stanza', () => {
    const poem = [
      'Primer verso poético',
      '// Nota intermedia de autor',
      'Segundo verso poético',
      'Tercer verso poético',
    ].join('\n');

    const result = analyzePoem(poem);
    expect(result.stanzas).toHaveLength(1);
    expect(result.stanzas[0].verseCount).toBe(3);
    expect(result.verses[0].stanzaInfo?.stanzaVerseCount).toBe(3);
    expect(result.verses[2].stanzaInfo?.stanzaVerseCount).toBe(3);
    expect(result.verses[2].stanzaInfo?.verseInStanza).toBe(2);
  });

  it('determines traditional names appropriately', () => {
    expect(getTraditionalStanzaName(2)).toBe('Pareado');
    expect(getTraditionalStanzaName(3)).toBe('Terceto');
    expect(getTraditionalStanzaName(4, 'ABBA')).toBe('Cuarteto');
    expect(getTraditionalStanzaName(4, 'ABAB')).toBe('Serventesio');
    expect(getTraditionalStanzaName(5)).toBe('Quinteto');
    expect(getTraditionalStanzaName(6)).toBe('Sexteto');
    expect(getTraditionalStanzaName(8, 'ABABABCC')).toBe('Octava real');
    expect(getTraditionalStanzaName(10)).toBe('Décima (Espinela)');
    expect(getTraditionalStanzaName(14)).toBe('Soneto (14 versos)');
    expect(getTraditionalStanzaName(7)).toBe('Septeto');
    expect(getTraditionalStanzaName(11)).toBe('Estrofa de 11 versos');
  });
});
