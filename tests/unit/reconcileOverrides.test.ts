import { describe, it, expect } from 'vitest';
import { reconcileOverrides, applySynalephaOverrides, type PoemOverrides } from '@/poetry/meter/overrides';

describe('reconcileOverrides - Protecting metric decisions during edits', () => {
  const poemOriginal = [
    'Pasos de un peregrino son, errante,',     // line 0
    'cuantos me dictó versos dulce musa,',     // line 1
    'en soledad confusa,',                     // line 2
    'perdidos unos, otros inspirados.',        // line 3
    '¡Oh tú, que de la excelsa cumbre miras',  // line 4
  ].join('\n');

  it('returns identical overrides when text has not changed', () => {
    const overrides: PoemOverrides = {
      2: { manualMetricCount: 7 },
      4: { synalephas: { 'syn-0-1': false } },
    };

    const result = reconcileOverrides(poemOriginal, poemOriginal, overrides);
    expect(result).toEqual(overrides);
  });

  it('shifts overrides down when a new verse is inserted at the top', () => {
    const overrides: PoemOverrides = {
      2: { manualMetricCount: 7 },
      4: { manualMetricCount: 11 },
    };

    // Insert a new verse at the beginning
    const poemWithInsertedTop = [
      '// Dedicatoria al duque de Béjar',
      'Pasos de un peregrino son, errante,',
      'cuantos me dictó versos dulce musa,',
      'en soledad confusa,',
      'perdidos unos, otros inspirados.',
      '¡Oh tú, que de la excelsa cumbre miras',
    ].join('\n');

    const result = reconcileOverrides(poemOriginal, poemWithInsertedTop, overrides);

    // Old line 2 should now be at line 3
    expect(result[3]).toEqual({ manualMetricCount: 7 });
    // Old line 4 should now be at line 5
    expect(result[5]).toEqual({ manualMetricCount: 11 });
    // Line 2 should have no override
    expect(result[2]).toBeUndefined();
  });

  it('shifts overrides correctly when a verse is inserted in the middle', () => {
    const overrides: PoemOverrides = {
      1: { manualMetricCount: 11 },
      3: { manualMetricCount: 11 },
    };

    // Insert between line 1 and line 2
    const poemWithMiddleInsert = [
      'Pasos de un peregrino son, errante,',     // 0
      'cuantos me dictó versos dulce musa,',     // 1 (stays at 1)
      'verso nuevo intercalado aquí,',           // 2 (new)
      'en soledad confusa,',                     // 3 (was 2)
      'perdidos unos, otros inspirados.',        // 4 (was 3)
      '¡Oh tú, que de la excelsa cumbre miras',  // 5 (was 4)
    ].join('\n');

    const result = reconcileOverrides(poemOriginal, poemWithMiddleInsert, overrides);

    // Line 1 is above insertion: stays at 1
    expect(result[1]).toEqual({ manualMetricCount: 11 });
    // Line 3 is below insertion: shifts from 3 to 4
    expect(result[4]).toEqual({ manualMetricCount: 11 });
    expect(result[3]).toBeUndefined();
  });

  it('shifts overrides up when a verse above is deleted', () => {
    const overrides: PoemOverrides = {
      3: { manualMetricCount: 11 },
    };

    // Delete line 0
    const poemWithDeletedTop = [
      'cuantos me dictó versos dulce musa,',     // 0 (was 1)
      'en soledad confusa,',                     // 1 (was 2)
      'perdidos unos, otros inspirados.',        // 2 (was 3)
      '¡Oh tú, que de la excelsa cumbre miras',  // 3 (was 4)
    ].join('\n');

    const result = reconcileOverrides(poemOriginal, poemWithDeletedTop, overrides);

    // Old line 3 should now be at line 2
    expect(result[2]).toEqual({ manualMetricCount: 11 });
    expect(result[3]).toBeUndefined();
  });

  it('cleanly drops an override if that specific verse is deleted', () => {
    const overrides: PoemOverrides = {
      2: { manualMetricCount: 7 }, // on "en soledad confusa,"
      4: { manualMetricCount: 11 }, // on "¡Oh tú, que de la excelsa..."
    };

    // Delete line 2 specifically
    const poemWithoutLine2 = [
      'Pasos de un peregrino son, errante,',     // 0
      'cuantos me dictó versos dulce musa,',     // 1
      'perdidos unos, otros inspirados.',        // 2 (was 3)
      '¡Oh tú, que de la excelsa cumbre miras',  // 3 (was 4)
    ].join('\n');

    const result = reconcileOverrides(poemOriginal, poemWithoutLine2, overrides);

    // Line 2's override on "en soledad confusa" was deleted
    expect(result[2]).toBeUndefined();
    // Line 4's override moved to line 3
    expect(result[3]).toEqual({ manualMetricCount: 11 });
  });

  it('preserves overrides when a verse is edited in place', () => {
    const overrides: PoemOverrides = {
      2: { manualMetricCount: 7 },
    };

    // Fix a typo / edit text of line 2: "en soledad confusa," -> "en soledad difusa,"
    const poemWithEditInPlace = [
      'Pasos de un peregrino son, errante,',
      'cuantos me dictó versos dulce musa,',
      'en soledad difusa,',                     // edited line 2
      'perdidos unos, otros inspirados.',
      '¡Oh tú, que de la excelsa cumbre miras',
    ].join('\n');

    const result = reconcileOverrides(poemOriginal, poemWithEditInPlace, overrides);
    expect(result[2]).toEqual({ manualMetricCount: 7 });
  });

  it('applies word-pair synalepha overrides when intra-verse words are inserted', () => {
    // A verse with a synalepha between "de" and "un"
    const synalephas = [
      { id: 'syn-1-2', active: true, wordA: 'de', wordB: 'un' },
    ];

    // Override specifies word-pair key rather than only numeric id
    const overrides = {
      'de_un': false, // treated as hiatus
    };

    applySynalephaOverrides(synalephas, overrides);
    expect(synalephas[0].active).toBe(false);
  });
});
