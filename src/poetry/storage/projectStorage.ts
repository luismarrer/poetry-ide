import type { PoemVersion } from '../versions/types';
import type { FormId } from '../forms/types';
import type { PoemAnalysisResult } from '../index';

export const STORAGE_KEY = 'poetry_ide_state_v1';
export const SESSION_BACKUP_KEY = 'poetry_ide_session_backup_v1';

export type SaveStatus = 'saved' | 'saving' | 'error';

export interface PoetryProjectBackup {
  schemaVersion: 1;
  app: 'poetry-ide';
  exportedAt: string;
  title: string;
  formId: FormId;
  showSynalephas: boolean;
  showRhyme: boolean;
  rhymeMode: 'consonant' | 'assonant';
  theme: 'light' | 'dark';
  versions: PoemVersion[];
  activeVersionId: string;
  secondaryVersionId?: string;
  isSplitView?: boolean;
}

export interface StorableProjectState {
  title: string;
  formId: FormId;
  showSynalephas: boolean;
  showRhyme: boolean;
  rhymeMode: 'consonant' | 'assonant';
  theme: 'light' | 'dark';
  versions: PoemVersion[];
  activeVersionId: string;
  secondaryVersionId: string;
  isSplitView: boolean;
}

/**
 * Formats a poem into clean plain text (.txt).
 */
export function exportPoemAsPlainText(title: string, text: string): string {
  const cleanTitle = title.trim();
  if (cleanTitle.length > 0) {
    return `${cleanTitle}\n\n${text.trim()}\n`;
  }
  return `${text.trim()}\n`;
}

/**
 * Formats a poem and its metric analysis into an annotated Markdown manuscript (.md).
 */
export function exportPoemAsManuscript(
  title: string,
  formId: FormId,
  analysis: PoemAnalysisResult
): string {
  const lines: string[] = [];
  const poemTitle = title.trim().length > 0 ? title.trim() : 'Poema sin título';

  lines.push(`# ${poemTitle}`);
  lines.push('');
  lines.push(`**Forma poética:** ${formId === 'silva' ? 'Silva' : 'Verso libre'}`);
  lines.push(`**Total de versos:** ${analysis.summary.totalVerses}`);

  if (formId === 'silva') {
    lines.push(`**Conformidad con la forma:** ${analysis.summary.conformancePercentage}%`);
    lines.push(
      `**Detalle métrico:** ${analysis.summary.heptasyllables} heptasílabos (7), ${analysis.summary.endecasyllables} endecasílabos (11), ${analysis.summary.outliers} fuera de norma`
    );
  }

  lines.push(`**Modalidad de rima:** ${analysis.rhymeMode === 'assonant' ? 'Asonante' : 'Consonante'}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Manuscrito anotado');
  lines.push('');
  lines.push('| N.º | Sílabas | Rima | Acentos rítmicos | Verso |');
  lines.push('|:---:|:-------:|:----:|:----------------:|:------|');

  let verseNumber = 1;
  for (const v of analysis.verses) {
    if (v.isEmpty) {
      lines.push('| | | | | *(espacio entre estrofas)* |');
      continue;
    }

    if (v.isComment) {
      lines.push(`| | | | | *${v.text.replace(/\|/g, '\\|')}* |`);
      continue;
    }

    if (v.isHeading) {
      lines.push(`| | | | | **${v.text.replace(/\|/g, '\\|')}** |`);
      continue;
    }

    const syllablesStr = `${v.metricSyllables}${v.finalStressAdjustment !== 0 ? ` (${v.finalStress})` : ''}`;
    const rhymeStr = v.rhymeSymbol || '—';
    const accentsStr = v.rhythmicAccents.length > 0 ? v.rhythmicAccents.join(', ') : '—';
    const safeText = v.text.replace(/\|/g, '\\|');

    lines.push(`| ${verseNumber} | ${syllablesStr} | ${rhymeStr} | ${accentsStr} | ${safeText} |`);
    verseNumber++;
  }

  lines.push('');
  lines.push('---');
  lines.push('*Generado con Poetry IDE — Métrica prosódica en tiempo real.*');
  lines.push('');

  return lines.join('\n');
}

/**
 * Exports complete project state as a serialized JSON backup.
 */
export function exportProjectAsJson(state: StorableProjectState): string {
  const backup: PoetryProjectBackup = {
    schemaVersion: 1,
    app: 'poetry-ide',
    exportedAt: new Date().toISOString(),
    title: state.title,
    formId: state.formId,
    showSynalephas: state.showSynalephas,
    showRhyme: state.showRhyme,
    rhymeMode: state.rhymeMode,
    theme: state.theme,
    versions: state.versions,
    activeVersionId: state.activeVersionId,
    secondaryVersionId: state.secondaryVersionId,
    isSplitView: state.isSplitView,
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Validates whether an unknown object is a valid PoetryProjectBackup.
 */
export function validateProjectBackup(data: unknown): data is PoetryProjectBackup {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  if (obj.app !== 'poetry-ide' && typeof obj.versions === 'undefined' && typeof obj.text === 'undefined') {
    return false;
  }

  // Check versions array
  if (Array.isArray(obj.versions) && obj.versions.length > 0) {
    for (const v of obj.versions) {
      if (!v || typeof v !== 'object') return false;
      const ver = v as Record<string, unknown>;
      if (typeof ver.id !== 'string' || typeof ver.text !== 'string') return false;
    }
    return true;
  }

  // Legacy format support (single text)
  if (typeof obj.text === 'string') {
    return true;
  }

  return false;
}

/**
 * Safely parses and validates a JSON string as a project backup.
 */
export function parseProjectBackup(
  jsonString: string
): { success: true; backup: PoetryProjectBackup } | { success: false; error: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!validateProjectBackup(parsed)) {
      return {
        success: false,
        error: 'El archivo no tiene el formato de copia de seguridad de Poetry IDE.',
      };
    }

    // Normalize legacy backup if needed
    const raw = parsed as Record<string, any>;
    if (!Array.isArray(raw.versions) && typeof raw.text === 'string') {
      const legacyVersion: PoemVersion = {
        id: 'v1',
        name: 'Versión 1',
        text: raw.text,
        overrides: raw.overrides || {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const normalized: PoetryProjectBackup = {
        schemaVersion: 1,
        app: 'poetry-ide',
        exportedAt: new Date().toISOString(),
        title: typeof parsed.title === 'string' ? parsed.title : 'Poema recuperado',
        formId: parsed.formId === 'silva' ? 'silva' : 'libre',
        showSynalephas: typeof parsed.showSynalephas === 'boolean' ? parsed.showSynalephas : true,
        showRhyme: typeof parsed.showRhyme === 'boolean' ? parsed.showRhyme : true,
        rhymeMode: parsed.rhymeMode === 'assonant' ? 'assonant' : 'consonant',
        theme: parsed.theme === 'dark' ? 'dark' : 'light',
        versions: [legacyVersion],
        activeVersionId: 'v1',
      };

      return { success: true, backup: normalized };
    }

    return { success: true, backup: parsed as PoetryProjectBackup };
  } catch (err) {
    return {
      success: false,
      error: `Error al leer el archivo JSON: ${err instanceof Error ? err.message : 'formato inválido'}`,
    };
  }
}

/**
 * Triggers a browser download of text content with the given filename and MIME type.
 */
export function triggerFileDownload(filename: string, content: string, mimeType: string): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Saves project state to localStorage and keeps a backup copy in sessionStorage.
 * Never silences errors: returns success flag and descriptive error message if quota or security prevents saving.
 */
export function saveProjectState(
  state: StorableProjectState,
  customStorage?: { setItem: (key: string, value: string) => void; getItem?: (key: string) => string | null }
): { success: boolean; error?: string } {
  const primaryVersion = state.versions.find(v => v.id === state.activeVersionId) || state.versions[0];
  const payload = {
    title: state.title,
    text: primaryVersion ? primaryVersion.text : '',
    formId: state.formId,
    overrides: primaryVersion ? primaryVersion.overrides : {},
    showSynalephas: state.showSynalephas,
    showRhyme: state.showRhyme,
    rhymeMode: state.rhymeMode,
    theme: state.theme,
    versions: state.versions,
    activeVersionId: state.activeVersionId,
    secondaryVersionId: state.secondaryVersionId,
    isSplitView: state.isSplitView,
    savedAt: Date.now(),
  };

  const serialized = JSON.stringify(payload);

  if (customStorage) {
    try {
      customStorage.setItem(STORAGE_KEY, serialized);
      return { success: true };
    } catch (err: unknown) {
      const errorName = (err as { name?: string })?.name || '';
      if (errorName === 'QuotaExceededError' || errorName === 'NS_ERROR_DOM_QUOTA_REACHED') {
        return {
          success: false,
          error: 'El almacenamiento local del navegador está lleno. Por favor, exporta tu obra en archivo para no perder cambios.',
        };
      }
      return {
        success: false,
        error: 'No se pudo guardar en el navegador (posible modo privado o permisos restringidos). Usa la opción de Exportar.',
      };
    }
  }

  if (typeof window === 'undefined' || !window.localStorage) {
    return { success: false, error: 'Almacenamiento no disponible en este entorno.' };
  }

  // Always attempt sessionStorage backup first
  try {
    if (window.sessionStorage) {
      window.sessionStorage.setItem(SESSION_BACKUP_KEY, serialized);
    }
  } catch {
    // sessionStorage is best-effort fallback
  }

  // Attempt localStorage save
  try {
    window.localStorage.setItem(STORAGE_KEY, serialized);
    return { success: true };
  } catch (err: unknown) {
    const errorName = (err as { name?: string })?.name || '';
    if (errorName === 'QuotaExceededError' || errorName === 'NS_ERROR_DOM_QUOTA_REACHED') {
      return {
        success: false,
        error: 'El almacenamiento local del navegador está lleno. Por favor, exporta tu obra en archivo para no perder cambios.',
      };
    }
    return {
      success: false,
      error: 'No se pudo guardar en el navegador (posible modo privado o permisos restringidos). Usa la opción de Exportar.',
    };
  }
}
