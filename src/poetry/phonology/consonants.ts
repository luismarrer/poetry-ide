/**
 * Spanish consonant clusters, digraphs, and onset boundary rules.
 */

// Inseparable consonant onset clusters (ataque complejo)
export const INSEPARABLE_CLUSTERS = new Set([
  'bl', 'cl', 'fl', 'gl', 'pl',
  'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr',
  'ch', 'll', 'rr',
]);

export function isInseparableCluster(pair: string): boolean {
  return INSEPARABLE_CLUSTERS.has(pair.toLowerCase());
}

/**
 * Checks if a 2-character group can begin a syllable in Spanish.
 */
export function canBeginSyllable(pair: string): boolean {
  const lower = pair.toLowerCase();
  return INSEPARABLE_CLUSTERS.has(lower);
}
