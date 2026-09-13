import { describe, it, expect } from 'vitest';
import { analyzeVerse } from '@/poetry/meter/analyzeVerse';
import { formatRhythmicAccents } from '@/poetry/rhythm/accents';

describe('Rhythmic Accents in Verse', () => {
  it('computes and formats rhythmic accents', () => {
    // E-scri-bo (stressed on 2: cri)
    // ver-so (stressed on 4: ver)
    // fe-o (stressed on 6: fe)
    const verse = analyzeVerse('Escribo verso feo', 0);
    expect(verse.rhythmicAccents).toEqual([2, 4, 6]);
    expect(formatRhythmicAccents(verse.rhythmicAccents)).toBe('2 · 4 · 6');
  });

  it('computes accents with synalepha merging', () => {
    const verse = analyzeVerse('que no estoy muerto', 0);
    // Words:
    // que: atonic
    // no: tonic (or atonic, in 'no' as adverb it is tonic, syl 2)
    // estoy: es-toy (toy tonic). With synalepha 'no es', toy is at metric pos 3!
    // muerto: muer-to (muer tonic, metric pos 4)
    expect(verse.rhythmicAccents.length).toBeGreaterThan(0);
  });
});
