import { describe, it, expect } from 'vitest';
import { analyzePoem } from '@/poetry/index';

describe('Real User Corpus Analysis', () => {
  const corpus = `Escribo poesía fea
para gente preciosa.

A veces con la mirada fría,
pero con un calor en el cuerpo
que me dice siempre
que no estoy muerto.

Vivo, humano,
y cada día más vivo
y cada día más humano.

En el encierro
de tus tentaciones

te supe onírica y empírica.

Quiero la condena
de confundir amor
y que el tiempo se olvide de mí.`;

  it('analyzes the real user poem deterministically without errors', () => {
    const result = analyzePoem(corpus, 'silva');

    expect(result.verses.length).toBeGreaterThan(15);
    expect(result.summary.totalVerses).toBe(15); // 15 non-empty verses

    // Verse 1: "Escribo poesía fea"
    // E-scri-bo (3) po-e-sí-a (4) fe-a (2) = 9. Final llana (0) -> 9.
    const v0 = result.verses[0];
    expect(v0.text).toBe('Escribo poesía fea');
    expect(v0.metricSyllables).toBe(9);

    // Verse 2: "para gente preciosa."
    // pa-ra (2) gen-te (2) pre-cio-sa (3) = 7. Heptasílabo!
    const v1 = result.verses[1];
    expect(v1.text).toBe('para gente preciosa.');
    expect(v1.metricSyllables).toBe(7);

    // Verse: "de tus tentaciones"
    // de (1) tus (1) ten-ta-cio-nes (4) = 6. Llana (0) -> 6.
    const vTentaciones = result.verses.find(v => v.text.includes('tentaciones'));
    expect(vTentaciones?.metricSyllables).toBe(6);

    // Verse: "te supe onírica y empírica."
    const vOnirica = result.verses.find(v => v.text.includes('onírica'));
    expect(vOnirica).toBeDefined();
    expect(vOnirica?.synalephas.length).toBe(3);

    // Verse: "y que el tiempo se olvide de mí."
    // y (1) que (1) el (1) tiem-po (2) se (1) ol-vi-de (3) de (1) mí (1)
    // Grammatical: 11
    // Synalephas: que el (-1), se olvide (-1), olvide de (no), de mí (no)
    // Final: mí is aguda (+1)!
    const vFinal = result.verses.find(v => v.text.includes('olvide de mí'));
    expect(vFinal?.finalStress).toBe('aguda');
    expect(vFinal?.finalStressAdjustment).toBe(1);
  });
});
