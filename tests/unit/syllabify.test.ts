import { describe, it, expect } from 'vitest';
import { syllabifyWord } from '@/poetry/syllabification/syllabify';

describe('Syllabification (Silabeo determinista)', () => {
  it('handles basic open/closed syllables', () => {
    expect(syllabifyWord('casa')).toEqual(['ca', 'sa']);
    expect(syllabifyWord('gente')).toEqual(['gen', 'te']);
    expect(syllabifyWord('tiempo')).toEqual(['tiem', 'po']);
    expect(syllabifyWord('humano')).toEqual(['hu', 'ma', 'no']);
  });

  it('handles diphthongs', () => {
    expect(syllabifyWord('cielo')).toEqual(['cie', 'lo']);
    expect(syllabifyWord('causa')).toEqual(['cau', 'sa']);
    expect(syllabifyWord('peine')).toEqual(['pei', 'ne']);
    expect(syllabifyWord('ciudad')).toEqual(['ciu', 'dad']);
    expect(syllabifyWord('cuidado')).toEqual(['cui', 'da', 'do']);
    expect(syllabifyWord('preciosa')).toEqual(['pre', 'cio', 'sa']);
    expect(syllabifyWord('rey')).toEqual(['rey']);
    expect(syllabifyWord('muy')).toEqual(['muy']);
    expect(syllabifyWord('estoy')).toEqual(['es', 'toy']);
  });

  it('handles triphthongs', () => {
    expect(syllabifyWord('buey')).toEqual(['buey']);
    expect(syllabifyWord('Paraguay')).toEqual(['Pa', 'ra', 'guay']);
    expect(syllabifyWord('averigüéis')).toEqual(['a', 've', 'ri', 'güéis']);
    expect(syllabifyWord('limpiáis')).toEqual(['lim', 'piáis']);
  });

  it('handles grammatical hiatuses (two strong or strong + accented weak)', () => {
    expect(syllabifyWord('poeta')).toEqual(['po', 'e', 'ta']);
    expect(syllabifyWord('poesía')).toEqual(['po', 'e', 'sí', 'a']);
    expect(syllabifyWord('caos')).toEqual(['ca', 'os']);
    expect(syllabifyWord('teatro')).toEqual(['te', 'a', 'tro']);
    expect(syllabifyWord('día')).toEqual(['dí', 'a']);
    expect(syllabifyWord('fría')).toEqual(['frí', 'a']);
    expect(syllabifyWord('país')).toEqual(['pa', 'ís']);
    expect(syllabifyWord('oído')).toEqual(['o', 'í', 'do']);
    expect(syllabifyWord('baúl')).toEqual(['ba', 'úl']);
    expect(syllabifyWord('leer')).toEqual(['le', 'er']);
  });

  it('handles silent h between vowels', () => {
    expect(syllabifyWord('prohibir')).toEqual(['prohi', 'bir']); // unstressed i -> diphthong
    expect(syllabifyWord('búho')).toEqual(['bú', 'ho']);       // accented u -> hiatus
    expect(syllabifyWord('alcohol')).toEqual(['al', 'co', 'hol']); // two strong vowels -> hiatus
    expect(syllabifyWord('anhelo')).toEqual(['an', 'he', 'lo']);
  });

  it('handles consonant clusters and digraphs', () => {
    expect(syllabifyWord('hablar')).toEqual(['ha', 'blar']);
    expect(syllabifyWord('libro')).toEqual(['li', 'bro']);
    expect(syllabifyWord('teatro')).toEqual(['te', 'a', 'tro']);
    expect(syllabifyWord('coche')).toEqual(['co', 'che']);
    expect(syllabifyWord('calle')).toEqual(['ca', 'lle']);
    expect(syllabifyWord('perro')).toEqual(['pe', 'rro']);
    expect(syllabifyWord('comprar')).toEqual(['com', 'prar']);
    expect(syllabifyWord('instituto')).toEqual(['ins', 'ti', 'tu', 'to']);
    expect(syllabifyWord('construir')).toEqual(['cons', 'truir']);
  });

  it('handles silent u in que/qui and gue/gui', () => {
    expect(syllabifyWord('que')).toEqual(['que']);
    expect(syllabifyWord('guitarra')).toEqual(['gui', 'ta', 'rra']);
    expect(syllabifyWord('conseguir')).toEqual(['con', 'se', 'guir']);
    expect(syllabifyWord('cigüeña')).toEqual(['ci', 'güe', 'ña']); // with diaeresis -> pronounced!
  });
});
