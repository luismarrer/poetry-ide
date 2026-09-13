import { describe, it, expect, vi } from 'vitest';
import {
  exportPoemAsPlainText,
  exportPoemAsManuscript,
  exportProjectAsJson,
  parseProjectBackup,
  validateProjectBackup,
  saveProjectState,
  type StorableProjectState,
} from '@/poetry/storage/projectStorage';
import { analyzePoem } from '@/poetry/index';

describe('Project Storage & Export / Recovery System', () => {
  const sampleState: StorableProjectState = {
    title: 'Soledad primera',
    formId: 'silva',
    showSynalephas: true,
    showRhyme: true,
    rhymeMode: 'consonant',
    theme: 'light',
    versions: [
      {
        id: 'v1',
        name: 'Versión 1',
        text: 'Pasos de un peregrino son, errante,\nen soledad confusa,',
        overrides: { 1: { manualMetricCount: 7 } },
        createdAt: 1000,
        updatedAt: 2000,
      },
    ],
    activeVersionId: 'v1',
    secondaryVersionId: 'v1',
    isSplitView: false,
  };

  it('exports plain text with clean formatting', () => {
    const txt = exportPoemAsPlainText('Mi Poema', 'Verso uno\nVerso dos');
    expect(txt).toBe('Mi Poema\n\nVerso uno\nVerso dos\n');
  });

  it('exports plain text without title when title is blank', () => {
    const txt = exportPoemAsPlainText('', 'Verso uno\nVerso dos');
    expect(txt).toBe('Verso uno\nVerso dos\n');
  });

  it('exports an annotated manuscript in Markdown with metrics and rhyme table', () => {
    const analysis = analyzePoem('Pasos de un peregrino son, errante,\nen soledad confusa,', 'silva');
    const md = exportPoemAsManuscript('Soledad primera', 'silva', analysis);

    expect(md).toContain('# Soledad primera');
    expect(md).toContain('**Forma poética:** Silva');
    expect(md).toContain('| N.º | Sílabas | Rima | Acentos rítmicos | Verso |');
    expect(md).toContain('Pasos de un peregrino son, errante,');
    expect(md).toContain('en soledad confusa,');
    expect(md).toContain('Generado con Poetry IDE');
  });

  it('exports full project JSON and validates it successfully', () => {
    const jsonStr = exportProjectAsJson(sampleState);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.app).toBe('poetry-ide');
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.versions.length).toBe(1);
    expect(parsed.versions[0].overrides['1']).toEqual({ manualMetricCount: 7 });

    const isValid = validateProjectBackup(parsed);
    expect(isValid).toBe(true);

    const parseResult = parseProjectBackup(jsonStr);
    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.backup.title).toBe('Soledad primera');
    }
  });

  it('handles corrupted or invalid backup JSON with clear error messages', () => {
    const invalidJson = '{ not valid json ';
    const res1 = parseProjectBackup(invalidJson);
    expect(res1.success).toBe(false);
    if (!res1.success) {
      expect(res1.error).toContain('Error al leer el archivo JSON');
    }

    const wrongSchema = JSON.stringify({ app: 'other-app', something: 123 });
    const res2 = parseProjectBackup(wrongSchema);
    expect(res2.success).toBe(false);
    if (!res2.success) {
      expect(res2.error).toContain('El archivo no tiene el formato de copia de seguridad');
    }
  });

  it('migrates legacy single-text backups into versions array', () => {
    const legacyJson = JSON.stringify({
      title: 'Antiguo poema',
      text: 'Verso suelto aquí',
      overrides: {},
    });

    const res = parseProjectBackup(legacyJson);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.backup.versions.length).toBe(1);
      expect(res.backup.versions[0].text).toBe('Verso suelto aquí');
    }
  });

  it('reports errors when localStorage quota is exceeded instead of silencing', () => {
    const mockLocalStorage = {
      setItem: vi.fn(() => {
        const err = new Error('Quota exceeded');
        err.name = 'QuotaExceededError';
        throw err;
      }),
    };

    const saveRes = saveProjectState(sampleState, mockLocalStorage);
    expect(saveRes.success).toBe(false);
    expect(saveRes.error).toContain('almacenamiento local del navegador está lleno');
  });
});
