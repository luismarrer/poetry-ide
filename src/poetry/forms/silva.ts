import type { PoeticForm, FormSummary } from './types';
import type { VerseAnalysis, Diagnostic } from '../meter/analyzeVerse';

export const silvaForm: PoeticForm = {
  id: 'silva',
  name: 'Silva',
  description: 'Composición de versos heptasílabos (7) y endecasílabos (11) combinados libremente.',
  validateVerse(verse: VerseAnalysis): Diagnostic[] {
    if (verse.isEmpty) return [];

    const m = verse.metricSyllables;
    if (m !== 7 && m !== 11) {
      return [
        {
          id: `silva-len-${verse.lineIndex}`,
          ruleId: 'form.silva.length',
          level: 'suggestion',
          message: `Verso de ${m} sílabas. La silva activa espera normalmente 7 u 11.`,
        },
      ];
    }

    return [];
  },
  computeSummary(verses: VerseAnalysis[]): FormSummary {
    const activeVerses = verses.filter(v => !v.isEmpty);
    const totalVerses = activeVerses.length;

    if (totalVerses === 0) {
      return {
        totalVerses: 0,
        heptasyllables: 0,
        endecasyllables: 0,
        outliers: 0,
        conformancePercentage: 100,
        description: '0 versos',
      };
    }

    let heptasyllables = 0;
    let endecasyllables = 0;
    let outliers = 0;

    for (const v of activeVerses) {
      if (v.metricSyllables === 7) {
        heptasyllables++;
      } else if (v.metricSyllables === 11) {
        endecasyllables++;
      } else {
        outliers++;
      }
    }

    const matching = heptasyllables + endecasyllables;
    const conformancePercentage = Math.round((matching / totalVerses) * 100);

    const description = `${totalVerses} versos | ${heptasyllables} heptasílabos | ${endecasyllables} endecasílabos | ${outliers} fuera de 7/11 | ${conformancePercentage}% dentro del patrón`;

    return {
      totalVerses,
      heptasyllables,
      endecasyllables,
      outliers,
      conformancePercentage,
      description,
    };
  },
};

export const libreForm: PoeticForm = {
  id: 'libre',
  name: 'Verso Libre',
  description: 'Sin restricciones fijas de métrica ni rima.',
  validateVerse(): Diagnostic[] {
    return [];
  },
  computeSummary(verses: VerseAnalysis[]): FormSummary {
    const activeVerses = verses.filter(v => !v.isEmpty);
    const totalVerses = activeVerses.length;
    let heptasyllables = 0;
    let endecasyllables = 0;
    let outliers = 0;

    for (const v of activeVerses) {
      if (v.metricSyllables === 7) heptasyllables++;
      else if (v.metricSyllables === 11) endecasyllables++;
      else outliers++;
    }

    return {
      totalVerses,
      heptasyllables,
      endecasyllables,
      outliers,
      conformancePercentage: 100,
      description: `${totalVerses} versos`,
    };
  },
};
