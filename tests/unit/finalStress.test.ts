import { describe, it, expect } from 'vitest';
import { analyzeWord, getFinalStressAdjustment } from '@/poetry/meter/finalStress';

describe('Lexical Stress and Final Stress Adjustment (Ley del acento final)', () => {
  it('detects aguda words and sets +1 adjustment', () => {
    const amor = analyzeWord('amor', 'amor');
    expect(amor.stressType).toBe('aguda');
    expect(getFinalStressAdjustment(amor.stressType)).toBe(1);

    const cancion = analyzeWord('canción', 'canción');
    expect(cancion.stressType).toBe('aguda');
    expect(getFinalStressAdjustment(cancion.stressType)).toBe(1);

    const mi = analyzeWord('mí', 'mí');
    expect(mi.stressType).toBe('aguda');
    expect(getFinalStressAdjustment(mi.stressType)).toBe(1);
  });

  it('detects llana words and sets 0 adjustment', () => {
    const casa = analyzeWord('casa', 'casa');
    expect(casa.stressType).toBe('llana');
    expect(getFinalStressAdjustment(casa.stressType)).toBe(0);

    const arbol = analyzeWord('árbol', 'árbol');
    expect(arbol.stressType).toBe('llana');
    expect(getFinalStressAdjustment(arbol.stressType)).toBe(0);

    const muerto = analyzeWord('muerto', 'muerto');
    expect(muerto.stressType).toBe('llana');
    expect(getFinalStressAdjustment(muerto.stressType)).toBe(0);
  });

  it('detects esdrújula words and sets -1 adjustment', () => {
    const onirica = analyzeWord('onírica', 'onírica');
    expect(onirica.stressType).toBe('esdrujula');
    expect(getFinalStressAdjustment(onirica.stressType)).toBe(-1);

    const empirica = analyzeWord('empírica', 'empírica');
    expect(empirica.stressType).toBe('esdrujula');
    expect(getFinalStressAdjustment(empirica.stressType)).toBe(-1);

    const musica = analyzeWord('música', 'música');
    expect(musica.stressType).toBe('esdrujula');
    expect(getFinalStressAdjustment(musica.stressType)).toBe(-1);
  });
});
