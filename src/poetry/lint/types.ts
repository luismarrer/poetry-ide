import type { VerseAnalysis, Diagnostic } from '../meter/analyzeVerse';
import type { FormId } from '../forms/types';

export interface PoetryContext {
  verses: VerseAnalysis[]
  formId: FormId
}

export interface PoetryRule {
  id: string
  name: string
  description: string
  analyze(context: PoetryContext): Diagnostic[]
}
