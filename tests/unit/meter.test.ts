import { describe, it, expect } from 'vitest';
import { analyzeVerse } from '@/poetry/meter/analyzeVerse';

describe('Verse Meter Analysis and Overrides', () => {
  it('analyzes heptasyllabic verse (7 syllables)', () => {
    // E-scri-bo (3) ver-so (2) fe-o (2) = 7. fe-o is llana (+0).
    const verse = analyzeVerse('Escribo verso feo', 0);
    expect(verse.grammaticalSyllables).toBe(7);
    expect(verse.synalephas.length).toBe(0);
    expect(verse.finalStress).toBe('llana');
    expect(verse.finalStressAdjustment).toBe(0);
    expect(verse.metricSyllables).toBe(7);
    expect(verse.algorithmMetricSyllables).toBe(7);
  });

  it('analyzes verse with final aguda word (+1)', () => {
    // de con-fun-dir a-mor:
    // de (1), con-fun-dir (3), a-mor (2) = 6 grammatical.
    // synalepha: 'de confundir' -> no. 'confundir amor' -> no.
    // final word 'amor' is aguda -> +1!
    // metric = 6 + 1 = 7 syllables (heptasílabo!).
    const verse = analyzeVerse('de confundir amor', 0);
    expect(verse.grammaticalSyllables).toBe(6);
    expect(verse.finalStress).toBe('aguda');
    expect(verse.finalStressAdjustment).toBe(1);
    expect(verse.metricSyllables).toBe(7);
  });

  it('analyzes verse with synalepha reduction', () => {
    // que no es-toy muer-to
    // que (1), no (1), es-toy (2), muer-to (2) = 6 grammatical
    // synalepha: 'no estoy' (-1)
    // final word 'muerto' is llana (+0)
    // metric = 6 - 1 + 0 = 5.
    const verse = analyzeVerse('que no estoy muerto', 0);
    expect(verse.grammaticalSyllables).toBe(6);
    expect(verse.synalephas.length).toBe(1);
    expect(verse.metricSyllables).toBe(5);
  });

  it('applies manual overrides to synalephas without modifying text', () => {
    // Te supe onírica y empírica
    // Grammatical: Te (1) su-pe (2) o-ní-ri-ca (4) y (1) em-pí-ri-ca (4) = 12
    // Detected synalephas:
    // 1. syn-1-2: supe onírica (-1)
    // 2. syn-2-3: onírica y (-1)
    // 3. syn-3-4: y empírica (-1)
    // Total default synalephas = 3 (-3)
    // Final word: empírica (esdrújula, -1)
    // Algorithm metric = 12 - 3 - 1 = 8.
    const verseNoOverride = analyzeVerse('Te supe onírica y empírica', 0);
    expect(verseNoOverride.algorithmMetricSyllables).toBe(8);

    // If the poet turns 'onírica y' into hiatus (active: false),
    // and turns 'y empírica' into hiatus (active: false),
    // only 'supe onírica' remains as synalepha:
    // 12 grammatical - 1 synalepha - 1 (esdrújula) + 1 (override) = 10 or 11!
    const verseWithOverride = analyzeVerse('Te supe onírica y empírica', 0, {
      synalephas: {
        'syn-2-3': false,
        'syn-3-4': false,
      },
    });

    expect(verseWithOverride.algorithmMetricSyllables).toBe(8);
    // Grammatical (12) - 1 active synalepha ('supe onírica') - 1 (empírica esdrújula) = 10
    expect(verseWithOverride.metricSyllables).toBe(10);
    expect(verseWithOverride.synalephas.find(s => s.id === 'syn-2-3')?.active).toBe(false);
  });

  it('allows direct manual metric count override for exceptional cases', () => {
    const verse = analyzeVerse('Te supe onírica y empírica', 0, {
      manualMetricCount: 11,
    });
    expect(verse.algorithmMetricSyllables).toBe(8);
    expect(verse.metricSyllables).toBe(11);
  });
});
