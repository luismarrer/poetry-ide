import { describe, it, expect } from 'vitest';
import { analyzeVerse, analyzePoem } from '@/poetry/index';
import { extractRhymeFromWord } from '@/poetry/rhyme/extractRhyme';
import { analyzeWord } from '@/poetry/meter/finalStress';
import { poeticDictionary } from '@/poetry/rhyme/poeticDictionary';

describe('Assonant Rhyme & Spanish Poetic Tradition', () => {
  it('correctly extracts assonant rhyme for llana words', () => {
    const musa = analyzeWord('musa', 'musa');
    const rhymeMusa = extractRhymeFromWord(musa);
    expect(rhymeMusa?.assonantEnding).toBe('u-a');

    const noche = analyzeWord('noche', 'noche');
    const rhymeNoche = extractRhymeFromWord(noche);
    expect(rhymeNoche?.assonantEnding).toBe('o-e');

    const viento = analyzeWord('viento', 'viento');
    const rhymeViento = extractRhymeFromWord(viento);
    expect(rhymeViento?.assonantEnding).toBe('e-o');
  });

  it('correctly extracts assonant rhyme for aguda words', () => {
    const mar = analyzeWord('mar', 'mar');
    const rhymeMar = extractRhymeFromWord(mar);
    expect(rhymeMar?.assonantEnding).toBe('a');

    const reloj = analyzeWord('reloj', 'reloj');
    const rhymeReloj = extractRhymeFromWord(reloj);
    expect(rhymeReloj?.assonantEnding).toBe('o');

    const cancion = analyzeWord('canción', 'canción');
    const rhymeCancion = extractRhymeFromWord(cancion);
    expect(rhymeCancion?.assonantEnding).toBe('o');
  });

  it('applies traditional metric rule for esdrújula words (tonic + final vowel, ignoring intermediate)', () => {
    // cántaro -> tonic 'a', intermediate 'ta' ignored, final 'ro' -> 'a-o'
    const cantaro = analyzeWord('cántaro', 'cántaro');
    const rhymeCantaro = extractRhymeFromWord(cantaro);
    expect(rhymeCantaro?.assonantEnding).toBe('a-o');

    // música -> tonic 'u', intermediate 'si' ignored, final 'ca' -> 'u-a'
    const musica = analyzeWord('música', 'música');
    const rhymeMusica = extractRhymeFromWord(musica);
    expect(rhymeMusica?.assonantEnding).toBe('u-a');

    // tímido -> tonic 'i', intermediate 'mi' ignored, final 'do' -> 'i-o'
    const timido = analyzeWord('tímido', 'tímido');
    const rhymeTimido = extractRhymeFromWord(timido);
    expect(rhymeTimido?.assonantEnding).toBe('i-o');
  });

  it('neutralizes unstressed postonic diphthongs according to metric tradition', () => {
    // gracia (-cia) -> unstressed weak 'i' does not break assonance, nucleus is 'a' -> 'a-a'
    const gracia = analyzeWord('gracia', 'gracia');
    const rhymeGracia = extractRhymeFromWord(gracia);
    expect(rhymeGracia?.assonantEnding).toBe('a-a');

    // limpio (-pio) -> nucleus 'o' -> 'i-o'
    const limpio = analyzeWord('limpio', 'limpio');
    const rhymeLimpio = extractRhymeFromWord(limpio);
    expect(rhymeLimpio?.assonantEnding).toBe('i-o');
  });

  it('switches between consonant and assonant rhyme schemes in analyzePoem', () => {
    const poem = [
      'Era del año la estación florida,', // -ida (11 syl, arte mayor)
      'en que el mentido robador de Europa,', // -opa (11 syl, arte mayor)
      'media luna las armas de su frente,', // -ente (11 syl, arte mayor)
      'y el Sol todos los rayos de su pelo,', // -elo (11 syl, arte mayor)
      'luciente honor del cielo,', // -elo (7 syl, arte menor) -> rhymes consonant with line 3
      'en campos de zafiro pace estrellas.', // -ellas (11 syl, arte mayor)
    ].join('\n');

    // Consonant mode: lines 3 and 4 rhyme in -elo ('A' and 'a')
    const consonantResult = analyzePoem(poem, 'silva', {}, 'consonant');
    expect(consonantResult.verses[3].rhymeSymbol).toBe('A');
    expect(consonantResult.verses[4].rhymeSymbol).toBe('a');
    expect(consonantResult.verses[0].rhymeSymbol).toBe('—');

    // Assonant test poem:
    // "musa" (-usa, assonant u-a)
    // "luna" (-una, assonant u-a) -> does NOT rhyme consonant, but DOES rhyme assonant!
    const assonantPoem = [
      'cuantos me dictó versos dulce musa,', // 11 syl, u-a
      'en soledad confusa,',                // 7 syl, u-a (consonant and assonant)
      'bajo la clara sombra de la luna,',   // 11 syl, u-a (assonant with musa!)
    ].join('\n');

    const rCons = analyzePoem(assonantPoem, 'silva', {}, 'consonant');
    expect(rCons.verses[0].rhymeSymbol).toBe('A');
    expect(rCons.verses[1].rhymeSymbol).toBe('a');
    expect(rCons.verses[2].rhymeSymbol).toBe('—'); // luna does not match consonant -usa

    const rAson = analyzePoem(assonantPoem, 'silva', {}, 'assonant');
    expect(rAson.verses[0].rhymeSymbol).toBe('A');
    expect(rAson.verses[1].rhymeSymbol).toBe('a');
    expect(rAson.verses[2].rhymeSymbol).toBe('A'); // luna matches assonant u-a!
  });

  it('searches and suggests rhymes in poeticDictionary for consonant and assonant modes', () => {
    // Search consonant for "musa"
    const consSearch = poeticDictionary.search('musa', 'consonant');
    expect(consSearch.results.length).toBeGreaterThan(0);
    const consWords = consSearch.results.map(r => r.word);
    expect(consWords).toContain('medusa');
    expect(consWords).toContain('confusa');

    // Search assonant for "musa" (u-a)
    const asonSearch = poeticDictionary.search('musa', 'assonant');
    expect(asonSearch.results.length).toBeGreaterThan(0);
    const asonWords = asonSearch.results.map(r => r.word);
    expect(asonWords).toContain('luna');
    expect(asonWords).toContain('espuma');
    expect(asonWords).toContain('pluma');

    // Filter by syllables (e.g. 2 syllables)
    const heptasylSearch = poeticDictionary.search('noche', 'assonant', { syllables: 2 });
    for (const w of heptasylSearch.results) {
      expect(w.syllables).toBe(2);
      expect(w.assonant).toBe('o-e');
    }
  });
});
