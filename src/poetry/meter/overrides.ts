export interface VerseOverride {
  synalephas?: Record<string, boolean>; // synalephaId or wordPair -> boolean (true = synalepha, false = hiatus)
  manualMetricCount?: number;           // exceptional direct override
}

export type PoemOverrides = Record<number, VerseOverride>;

/**
 * Applies overrides to a list of synalephas.
 * Supports both position-based ID ('syn-0-1') and word-pair key ('palabraA_palabraB')
 * so that metric decisions survive intra-verse word insertions or shifts.
 */
export function applySynalephaOverrides(
  synalephas: Array<{ id: string; active: boolean; wordA?: string; wordB?: string }>,
  overrides?: Record<string, boolean>
): void {
  if (!overrides) return;

  for (const syn of synalephas) {
    if (typeof overrides[syn.id] === 'boolean') {
      syn.active = overrides[syn.id];
    } else if (syn.wordA && syn.wordB) {
      const pairKey = `${syn.wordA.toLowerCase()}_${syn.wordB.toLowerCase()}`;
      if (typeof overrides[pairKey] === 'boolean') {
        syn.active = overrides[pairKey];
      }
    }
  }
}

/**
 * Calculates string similarity between two lines (0 to 1).
 */
function lineSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const trimA = a.trim().toLowerCase();
  const trimB = b.trim().toLowerCase();
  if (trimA === trimB) return 0.95;
  if (trimA.length === 0 || trimB.length === 0) return 0;

  // Word token overlap (Jaccard similarity)
  const wordsA = trimA.split(/\s+/);
  const wordsB = trimB.split(/\s+/);
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  const wordScore = union > 0 ? intersection / union : 0;

  // Length ratio bonus
  const lenRatio = Math.min(trimA.length, trimB.length) / Math.max(trimA.length, trimB.length);
  return wordScore * 0.7 + lenRatio * 0.3;
}

/**
 * Reconciles line overrides when poem text changes.
 *
 * Maps line indices from oldText to newText using sequence alignment
 * (common prefix + common suffix + local alignment of edited segments).
 *
 * This ensures that inserting verses above, deleting verses, or editing verses in place
 * does NOT displace metric decisions or transfer them to unintended verses.
 */
export function reconcileOverrides(
  oldText: string,
  newText: string,
  oldOverrides: PoemOverrides
): PoemOverrides {
  if (oldText === newText) return oldOverrides;

  const overrideIndices = Object.keys(oldOverrides)
    .map(Number)
    .filter(idx => !Number.isNaN(idx));

  if (overrideIndices.length === 0) return {};

  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const M = oldLines.length;
  const N = newLines.length;

  if (N === 0) return {};

  // 1. Compute common prefix length
  let prefix = 0;
  while (prefix < M && prefix < N && oldLines[prefix] === newLines[prefix]) {
    prefix++;
  }

  // 2. Compute common suffix length (not overlapping prefix)
  let suffix = 0;
  while (
    suffix < M - prefix &&
    suffix < N - prefix &&
    oldLines[M - 1 - suffix] === newLines[N - 1 - suffix]
  ) {
    suffix++;
  }

  const lineMap = new Map<number, number>();

  // Prefix lines map 1:1
  for (let i = 0; i < prefix; i++) {
    lineMap.set(i, i);
  }

  // Suffix lines shift by (N - M)
  for (let s = 0; s < suffix; s++) {
    const oldIdx = M - 1 - s;
    const newIdx = N - 1 - s;
    lineMap.set(oldIdx, newIdx);
  }

  // Middle region: oldLines[prefix ... M - 1 - suffix] to newLines[prefix ... N - 1 - suffix]
  const oldMidLen = M - prefix - suffix;
  const newMidLen = N - prefix - suffix;

  if (oldMidLen === 1 && newMidLen === 1) {
    // Single line modified in place
    lineMap.set(prefix, prefix);
  } else if (oldMidLen > 0 && newMidLen > 0) {
    // Dynamic alignment of middle section
    const usedNew = new Set<number>();

    // Pass 1: exact matches in middle
    for (let i = 0; i < oldMidLen; i++) {
      const oldIdx = prefix + i;
      for (let j = 0; j < newMidLen; j++) {
        const newIdx = prefix + j;
        if (!usedNew.has(newIdx) && oldLines[oldIdx] === newLines[newIdx]) {
          lineMap.set(oldIdx, newIdx);
          usedNew.add(newIdx);
          break;
        }
      }
    }

    // Pass 2: highest similarity match for remaining lines that have overrides
    for (let i = 0; i < oldMidLen; i++) {
      const oldIdx = prefix + i;
      if (lineMap.has(oldIdx) || !oldOverrides[oldIdx]) continue;

      let bestNew = -1;
      let bestSim = 0.35; // minimum similarity threshold

      for (let j = 0; j < newMidLen; j++) {
        const newIdx = prefix + j;
        if (usedNew.has(newIdx)) continue;

        const sim = lineSimilarity(oldLines[oldIdx], newLines[newIdx]);
        if (sim > bestSim) {
          bestSim = sim;
          bestNew = newIdx;
        }
      }

      if (bestNew !== -1) {
        lineMap.set(oldIdx, bestNew);
        usedNew.add(bestNew);
      }
    }
  }

  // 3. Construct new overrides based on mapped indices
  const result: PoemOverrides = {};

  for (const oldIdx of overrideIndices) {
    const targetIdx = lineMap.get(oldIdx);
    if (typeof targetIdx === 'number' && targetIdx >= 0 && targetIdx < N) {
      const prevOverride = oldOverrides[oldIdx];
      result[targetIdx] = {
        ...prevOverride,
        synalephas: prevOverride.synalephas ? { ...prevOverride.synalephas } : undefined,
      };
    }
  }

  return result;
}
