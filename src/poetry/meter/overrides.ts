export interface VerseOverride {
  synalephas?: Record<string, boolean>; // synalephaId -> boolean (true = synalepha, false = hiatus)
  manualMetricCount?: number;           // exceptional direct override
}

export type PoemOverrides = Record<number, VerseOverride>;

/**
 * Applies overrides to a list of synalephas.
 */
export function applySynalephaOverrides(
  synalephas: Array<{ id: string; active: boolean }>,
  overrides?: Record<string, boolean>
): void {
  if (!overrides) return;

  for (const syn of synalephas) {
    if (typeof overrides[syn.id] === 'boolean') {
      syn.active = overrides[syn.id];
    }
  }
}
