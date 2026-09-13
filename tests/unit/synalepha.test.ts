import { describe, it, expect } from 'vitest';
import { tokenizeVerse } from '@/poetry/phonology/cleaner';
import { analyzeWord } from '@/poetry/meter/finalStress';
import { detectSynalephas } from '@/poetry/meter/synalepha';

describe('Synalepha Detection', () => {
  it('detects simple synalepha between vowel-ending and vowel-starting words', () => {
    const text = 'poesía fea';
    const tokens = tokenizeVerse(text);
    const words = tokens.map(t => analyzeWord(t.raw, t.clean));
    const synalephas = detectSynalephas(tokens, words);

    // 'poesía' ends in 'a', 'fea' starts with 'f' -> NO synalepha
    expect(synalephas.length).toBe(0);

    const text2 = 'que no estoy muerto';
    const tokens2 = tokenizeVerse(text2);
    const words2 = tokens2.map(t => analyzeWord(t.raw, t.clean));
    const synalephas2 = detectSynalephas(tokens2, words2);

    // 'no' ends in 'o', 'estoy' starts with 'e' -> synalepha between 'no' and 'estoy'!
    expect(synalephas2.length).toBe(1);
    expect(synalephas2[0].textSpan).toBe('no estoy');
    expect(synalephas2[0].active).toBe(true);
  });

  it('detects synalepha with vocalic y and silent h', () => {
    const text = 'vida y esperanza';
    const tokens = tokenizeVerse(text);
    const words = tokens.map(t => analyzeWord(t.raw, t.clean));
    const synalephas = detectSynalephas(tokens, words);

    // 'vida' ends in 'a', 'y' is vocalic -> synalepha!
    // 'y' is vocalic, 'esperanza' starts with 'e' -> synalepha!
    expect(synalephas.length).toBe(2);
    expect(synalephas[0].textSpan).toBe('vida y');
    expect(synalephas[1].textSpan).toBe('y esperanza');
  });

  it('detects multiple synalephas in complex poetic lines', () => {
    const text = 'Te supe onírica y empírica';
    const tokens = tokenizeVerse(text);
    const words = tokens.map(t => analyzeWord(t.raw, t.clean));
    const synalephas = detectSynalephas(tokens, words);

    // supe (e) + onírica (o) -> synalepha
    // onírica (a) + y (vocalic) -> synalepha
    // y (vocalic) + empírica (e) -> synalepha
    expect(synalephas.length).toBe(3);
    expect(synalephas[0].textSpan).toBe('supe onírica');
    expect(synalephas[1].textSpan).toBe('onírica y');
    expect(synalephas[2].textSpan).toBe('y empírica');
  });
});
