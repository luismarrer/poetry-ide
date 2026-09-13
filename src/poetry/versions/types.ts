import type { PoemOverrides } from '../meter/overrides';

export interface PoemVersion {
  id: string
  name: string
  text: string
  overrides: PoemOverrides
  createdAt: number
  updatedAt: number
}

export function createNewVersion(
  name: string,
  text: string = '',
  overrides: PoemOverrides = {}
): PoemVersion {
  return {
    id: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    text,
    overrides: { ...overrides },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
