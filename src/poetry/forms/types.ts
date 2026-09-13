import type { VerseAnalysis, Diagnostic } from '../meter/analyzeVerse';

export type FormId = 'libre' | 'silva';

export interface FormSummary {
  totalVerses: number
  heptasyllables: number   // 7
  endecasyllables: number  // 11
  outliers: number         // != 7 and != 11
  conformancePercentage: number
  description: string
}

export interface PoeticForm {
  id: FormId
  name: string
  description: string
  validateVerse(verse: VerseAnalysis): Diagnostic[]
  computeSummary(verses: VerseAnalysis[]): FormSummary
}
