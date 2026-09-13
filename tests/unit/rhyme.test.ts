import { describe, it, expect } from 'vitest';
import { analyzePoem } from '@/poetry/index';
import { extractRhymeFromWord } from '@/poetry/rhyme/extractRhyme';
import { analyzeWord } from '@/poetry/meter/finalStress';

describe('Consonant and Assonant Rhyme Analysis', () => {
  it('extracts rhyme ending correctly from words', () => {
    const fea = analyzeWord('fea', 'fea');
    const rhymeFea = extractRhymeFromWord(fea);
    expect(rhymeFea?.raw).toBe('ea');

    const preciosa = analyzeWord('preciosa', 'preciosa');
    const rhymePreciosa = extractRhymeFromWord(preciosa);
    expect(rhymePreciosa?.raw).toBe('osa');

    const cuerpo = analyzeWord('cuerpo', 'cuerpo');
    const rhymeCuerpo = extractRhymeFromWord(cuerpo);
    expect(rhymeCuerpo?.raw).toBe('erpo');

    const muerto = analyzeWord('muerto', 'muerto');
    const rhymeMuerto = extractRhymeFromWord(muerto);
    expect(rhymeMuerto?.raw).toBe('erto');

    const mi = analyzeWord('mí', 'mí');
    const rhymeMi = extractRhymeFromWord(mi);
    expect(rhymeMi?.raw).toBe('í');
  });

  it('assigns rhyme scheme letters and suelto marks', () => {
    const poemText = [
      'Una hermosa mariposa', // -osa (arte mayor if 9+, arte menor if <=8)
      'vuela sobre la colina,', // -ina
      'con su danza primorosa', // -osa
      'y su gracia peregrina.', // -ina
    ].join('\n');

    const result = analyzePoem(poemText, 'libre');
    expect(result.rhymeScheme[0]).toBe(result.rhymeScheme[2]); // mariposa and primorosa share letter
    expect(result.rhymeScheme[1]).toBe(result.rhymeScheme[3]); // colina and peregrina share letter
  });

  it('marks unrhymed verses with em dash (—)', () => {
    const poemText = [
      'Escribo verso feo',
      'para gente preciosa.',
      'A veces con la mirada fría,',
    ].join('\n');

    const result = analyzePoem(poemText, 'libre');
    expect(result.rhymeScheme[0]).toBe('—');
    expect(result.rhymeScheme[1]).toBe('—');
    expect(result.rhymeScheme[2]).toBe('—');
  });

  it('assigns letters beyond G (H, I, J...) for poems with many rhyme pairs', () => {
    // 9 pairs of rhyming words: A, B, C, D, E, F, G, H, I
    const poemText = [
      'casa', 'pasa',       // A (-asa)
      'beso', 'queso',     // B (-eso)
      'pino', 'vino',       // C (-ino)
      'sol', 'farol',       // D (-ol)
      'luna', 'cuna',       // E (-una)
      'mar', 'cantar',      // F (-ar)
      'flor', 'amor',       // G (-or)
      'viento', 'aliento',  // H (-iento)
      'nieve', 'llueve',    // I (-ebe)
    ].join('\n');

    const result = analyzePoem(poemText, 'libre');
    expect(result.rhymeScheme[14].toUpperCase()).toBe('H');
    expect(result.rhymeScheme[15].toUpperCase()).toBe('H');
    expect(result.rhymeScheme[16].toUpperCase()).toBe('I');
    expect(result.rhymeScheme[17].toUpperCase()).toBe('I');
  });
});
