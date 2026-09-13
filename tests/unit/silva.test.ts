import { describe, it, expect } from 'vitest';
import { analyzePoem } from '@/poetry/index';

describe('Silva Mode and Linter', () => {
  it('identifies 7 and 11 syllables as conforming to Silva', () => {
    const poemText = [
      'Escribo verso feo',      // 7
      'para gente preciosa.',   // 7
    ].join('\n');

    const result = analyzePoem(poemText, 'silva');
    expect(result.summary.heptasyllables).toBe(2);
    expect(result.summary.endecasyllables).toBe(0);
    expect(result.summary.outliers).toBe(0);
    expect(result.summary.conformancePercentage).toBe(100);
    expect(result.verses[0].diagnostics.length).toBe(0);
  });

  it('marks non-7/11 verses with discrete suggestion diagnostics in Silva mode', () => {
    const poemText = [
      'Escribo verso feo',       // 7
      'para gente preciosa.',    // 7
      'verso de ocho con esmero', // ver-so (2) de (1) o-cho (2) con (1) es-me-ro (3) = 9 - 1 (de ocho) = 8
    ].join('\n');

    const result = analyzePoem(poemText, 'silva');
    expect(result.summary.heptasyllables).toBe(2);
    expect(result.summary.outliers).toBe(1);

    const verse3Diags = result.verses[2].diagnostics;
    expect(verse3Diags.length).toBe(1);
    expect(verse3Diags[0].level).toBe('suggestion');
    expect(verse3Diags[0].message).toContain('La silva activa espera normalmente 7 u 11');
  });
});
