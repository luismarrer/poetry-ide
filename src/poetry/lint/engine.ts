import type { PoetryRule, PoetryContext } from './types';
import type { Diagnostic } from '../meter/analyzeVerse';
import { silvaForm } from '../forms/silva';

export const silvaRule: PoetryRule = {
  id: 'form.silva',
  name: 'Estructura de Silva',
  description: 'Verifica versos heptasílabos (7) y endecasílabos (11) en composiciones tipo silva.',
  analyze(context: PoetryContext): Diagnostic[] {
    if (context.formId !== 'silva') return [];
    const diagnostics: Diagnostic[] = [];

    for (const verse of context.verses) {
      if (verse.isEmpty) continue;
      const diags = silvaForm.validateVerse(verse);
      diagnostics.push(...diags);
    }

    return diagnostics;
  },
};

export const endecasyllableStressRule: PoetryRule = {
  id: 'rhythm.endecasyllable-stress',
  name: 'Acento en décima sílaba',
  description: 'Comprueba si los endecasílabos llevan acento rítmico en la décima sílaba (verso llano clásico).',
  analyze(context: PoetryContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    for (const verse of context.verses) {
      if (verse.isEmpty) continue;
      if (verse.metricSyllables === 11 && verse.finalStress === 'llana') {
        if (!verse.rhythmicAccents.includes(10)) {
          diagnostics.push({
            id: `endecasyllable-stress-${verse.lineIndex}`,
            ruleId: 'rhythm.endecasyllable-stress',
            level: 'info',
            message: `Endecasílabo llano sin acento prosódico detectado en la 10.ª sílaba.`,
          });
        }
      }
    }

    return diagnostics;
  },
};

export const STANDARD_RULES: PoetryRule[] = [
  silvaRule,
  endecasyllableStressRule,
];

export function lintPoem(context: PoetryContext, rules: PoetryRule[] = STANDARD_RULES): Map<number, Diagnostic[]> {
  const lineDiagnostics = new Map<number, Diagnostic[]>();

  for (const rule of rules) {
    const diags = rule.analyze(context);
    for (const diag of diags) {
      // Find matching line index from diag id or parse it
      const match = diag.id.match(/-(\d+)$/);
      if (match) {
        const line = parseInt(match[1], 10);
        const existing = lineDiagnostics.get(line) || [];
        existing.push(diag);
        lineDiagnostics.set(line, existing);
      }
    }
  }

  return lineDiagnostics;
}
