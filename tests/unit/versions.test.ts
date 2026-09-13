import { describe, it, expect } from 'vitest';
import { createNewVersion } from '../../src/poetry/versions/types';
import { analyzePoem } from '../../src/poetry/index';

describe('Poem Versions Unit Tests', () => {
  it('creates a new version with default and custom values', () => {
    const v1 = createNewVersion('Borrador Inicial');
    expect(v1.id).toMatch(/^ver_\d+_[a-z0-9]+$/);
    expect(v1.name).toBe('Borrador Inicial');
    expect(v1.text).toBe('');
    expect(v1.overrides).toEqual({});
    expect(v1.createdAt).toBeGreaterThan(0);
    expect(v1.updatedAt).toBeGreaterThan(0);

    const v2 = createNewVersion('Variante con texto', 'El dulce lamentar de dos pastores', {
      0: { manualMetricCount: 11 },
    });
    expect(v2.name).toBe('Variante con texto');
    expect(v2.text).toBe('El dulce lamentar de dos pastores');
    expect(v2.overrides[0]?.manualMetricCount).toBe(11);
  });

  it('guarantees deep copy of overrides when duplicating a version', () => {
    const source = createNewVersion('Original', 'Primer verso', {
      0: { manualMetricCount: 7, synalephas: { '0-w1-w2': false } },
    });

    const duplicate = createNewVersion(`${source.name} (Copia)`, source.text, source.overrides);
    expect(duplicate.id).not.toBe(source.id);
    expect(duplicate.name).toBe('Original (Copia)');

    // Mutating duplicate overrides should not affect source overrides
    duplicate.overrides[0] = { manualMetricCount: 11 };
    expect(source.overrides[0]?.manualMetricCount).toBe(7);
  });

  it('performs independent metric analyses for two distinct poem versions', () => {
    const v1Text = 'Cisne de plata hermosa,\nque canta dulcemente.';
    const v2Text = 'Cisne de plata pura y sonorosa,\nque canta dulcemente en la espesura.';

    const analysis1 = analyzePoem(v1Text, 'silva');
    const analysis2 = analyzePoem(v2Text, 'silva');

    expect(analysis1.verses).toHaveLength(2);
    expect(analysis2.verses).toHaveLength(2);

    // Verso 1 in v1 is 7 syllables (heptasílabo)
    expect(analysis1.verses[0].metricSyllables).toBe(7);

    // Verso 1 in v2 is 11 syllables (endecasílabo)
    expect(analysis2.verses[0].metricSyllables).toBe(11);

    // Summary counts differ
    expect(analysis1.summary.heptasyllables).toBe(2);
    expect(analysis2.summary.endecasyllables).toBe(2);
  });

  it('maintains independent overrides across versions', () => {
    const text = 'Y en el aire flotaba un perfume.';
    const v1Overrides = { 0: { manualMetricCount: 10 } };
    const v2Overrides = { 0: { manualMetricCount: 12 } };

    const analysis1 = analyzePoem(text, 'libre', v1Overrides);
    const analysis2 = analyzePoem(text, 'libre', v2Overrides);

    expect(analysis1.verses[0].metricSyllables).toBe(10);
    expect(analysis2.verses[0].metricSyllables).toBe(12);
  });
});
