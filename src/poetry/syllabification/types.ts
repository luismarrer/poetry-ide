export type StressType = 'aguda' | 'llana' | 'esdrujula' | 'sobresdrujula';

export interface Syllable {
  text: string
  isStressed: boolean
  hasTilde: boolean
}

export interface WordAnalysis {
  raw: string
  clean: string
  syllables: Syllable[]
  stressIndex: number // 0-based index of stressed syllable
  stressType: StressType
  isAtonic: boolean
}
